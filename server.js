const http = require('http');
const https = require('https');
const net = require('net');
const tls = require('tls');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');
const { generateSecret, generateURI, verifySync } = require('otplib');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

const storageAdapter = require('./storage-adapter');

const ROOT_DIR = process.cwd();
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = path.join(ROOT_DIR, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const DRAFT_FILE = path.join(DATA_DIR, 'content-draft.json');
const BACKUP_FILE = path.join(DATA_DIR, 'content.backup.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const TEMP_UPLOADS_DIR = storageAdapter.getTempDir();

// Initialize storage safely without writing to /var/task in production
storageAdapter.init();

// -------------------------------------------------------------
// LARGE MEDIA UPLOAD ARCHITECTURE (10 GB VIDEO POLICY)
// -------------------------------------------------------------
const MAX_VIDEO_BYTES = 10000000000; // Exactly 10 GB (10,000,000,000 bytes)
const MAX_IMAGE_BYTES = 100 * 1024 * 1024; // 100 MB for images
const MAX_AUDIO_BYTES = 100 * 1024 * 1024; // 100 MB for audio
const ALLOWED_VIDEO_EXTS = new Set(['.mp4', '.webm']);
const ALLOWED_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf']);
const ALLOWED_AUDIO_EXTS = new Set(['.mp3', '.mpeg', '.wav', '.ogg', '.m4a']);

const uploadSessions = storageAdapter.uploadSessions;

// -------------------------------------------------------------
// ENVIRONMENT VARIABLES LOADER (.env)
const MANAGED_ENV_KEYS = new Set([
  'PORT',
  'BACKSTAGE_PASSWORD',
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'GMAIL_PASS',
  'GMAIL_FROM',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'EMAIL_FROM',
  'RESEND_API_KEY'
]);

let lastEnvHash = '';
function loadEnvFile() {
  if (IS_VERCEL) return;
  const envFiles = [
    path.join(ROOT_DIR, '.env'),
    path.join(ROOT_DIR, '.env.local')
  ];

  let combinedContent = '';
  const newVals = {};

  for (const envPath of envFiles) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        combinedContent += content + '\n';
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (key) {
              if (val) {
                newVals[key] = val;
              } else {
                delete newVals[key];
              }
            }
          }
        }
      } catch (e) {
        console.warn('[Auth] Failed to parse env file:', envPath, e.message);
      }
    }
  }

  // Clear previous managed keys
  for (const k of MANAGED_ENV_KEYS) {
    if (!newVals[k]) {
      delete process.env[k];
    }
  }
  // Apply new keys
  for (const [k, v] of Object.entries(newVals)) {
    process.env[k] = v;
  }

  const currentHash = crypto.createHash('md5').update(combinedContent).digest('hex');
  if (currentHash !== lastEnvHash) {
    lastEnvHash = currentHash;
    console.log('[Auth] Loaded and synchronized environment variables from .env');
  }
}
loadEnvFile();

const PORT = process.env.PORT || 3000;

// -------------------------------------------------------------
// AUTHENTICATION & THREE-METHOD ARCHITECTURE
// 1. Gmail OTP (Default)
// 2. Authenticator App (TOTP - RFC 6238)
// 3. Administrative Passphrase (Fallback)
// -------------------------------------------------------------
const activeSessions = new Map();         // token -> { createdAt, expiresAt, lastActive, leftAt }
const otpChallenges = new Map();          // challengeId -> { otpHash, issuedAt, expiresAt, resendAvailableAt, attempts, ip, used, devOtp }
const pendingTotpEnrollments = new Map(); // setupId -> { secret, otpauth, qrDataUrl, expiresAt, ip }
const ipRateLimits = new Map();           // ip -> { otpRequests: [], failedPasswords: [], failedTotp: [], lockedUntil: 0, lockedUntilTotp: 0 }

const CONFIGURED_EMAIL = 'project2krishnan@gmail.com';
const MASKED_EMAIL = 'pr*******@gmail.com';

const OTP_VALIDITY_MS = 180 * 1000;         // Exactly 3 minutes (180 seconds) from server issuance
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;   // 30 seconds cooldown between challenge requests
const OTP_RATE_LIMIT_MAX = 5;               // Max 5 successful challenge requests per 15-minute window
const OTP_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;                 // Maximum 5 verification attempts per challenge
const RE_ENTRY_GRACE_MS = 180 * 1000;       // Exactly 180 seconds grace period when leaving Backstage

let lastUsedTotpStep = null;                // Replay prevention for TOTP timeStep
let lastUsedTotpCode = null;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress : '127.0.0.1';
}

// Rate Limiter: OTP Request Dispatching (Only increments on successful provider acceptance)
function checkOtpRateLimit(ip) {
  const now = Date.now();
  let record = ipRateLimits.get(ip);
  if (!record) {
    record = { otpRequests: [], failedPasswords: [], failedTotp: [], lockedUntil: 0, lockedUntilTotp: 0 };
    ipRateLimits.set(ip, record);
  }
  record.otpRequests = record.otpRequests.filter(t => now - t < OTP_RATE_LIMIT_WINDOW_MS);
  if (record.otpRequests.length >= OTP_RATE_LIMIT_MAX) {
    const oldest = record.otpRequests[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + OTP_RATE_LIMIT_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      error: `Too many OTP requests from this IP. Please wait ${retryAfterSeconds} seconds before requesting another code.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds
    };
  }
  return { allowed: true };
}

function recordOtpSuccess(ip) {
  const now = Date.now();
  let record = ipRateLimits.get(ip);
  if (!record) {
    record = { otpRequests: [], failedPasswords: [], failedTotp: [], lockedUntil: 0, lockedUntilTotp: 0 };
    ipRateLimits.set(ip, record);
  }
  record.otpRequests.push(now);
}

// Rate Limiter: Password Fallback
function checkPasswordRateLimit(ip) {
  const now = Date.now();
  let record = ipRateLimits.get(ip);
  if (!record) {
    record = { otpRequests: [], failedPasswords: [], failedTotp: [], lockedUntil: 0, lockedUntilTotp: 0 };
    ipRateLimits.set(ip, record);
  }
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSec = Math.max(1, Math.ceil((record.lockedUntil - now) / 1000));
    return {
      allowed: false,
      error: `Too many failed password attempts. Account locked for ${remainingSec} seconds.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: remainingSec
    };
  }
  record.failedPasswords = record.failedPasswords.filter(t => now - t < 15 * 60 * 1000);
  if (record.failedPasswords.length >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
    const remainingSec = 15 * 60;
    return {
      allowed: false,
      error: 'Too many failed password attempts. Temporarily locked for 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: remainingSec
    };
  }
  return { allowed: true };
}

function recordPasswordFailure(ip) {
  let record = ipRateLimits.get(ip);
  if (!record) {
    record = { otpRequests: [], failedPasswords: [], failedTotp: [], lockedUntil: 0, lockedUntilTotp: 0 };
    ipRateLimits.set(ip, record);
  }
  record.failedPasswords.push(Date.now());
}

function resetPasswordFailures(ip) {
  let record = ipRateLimits.get(ip);
  if (record) {
    record.failedPasswords = [];
    record.lockedUntil = 0;
  }
}

// Rate Limiter: Authenticator App (TOTP)
function checkTotpRateLimit(ip) {
  const now = Date.now();
  let record = ipRateLimits.get(ip);
  if (!record) {
    record = { otpRequests: [], failedPasswords: [], failedTotp: [], lockedUntil: 0, lockedUntilTotp: 0 };
    ipRateLimits.set(ip, record);
  }
  if (!record.failedTotp) record.failedTotp = [];
  if (record.lockedUntilTotp && now < record.lockedUntilTotp) {
    const remainingSec = Math.max(1, Math.ceil((record.lockedUntilTotp - now) / 1000));
    return {
      allowed: false,
      error: `Too many failed authenticator attempts. Locked for ${remainingSec} seconds.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: remainingSec
    };
  }
  record.failedTotp = record.failedTotp.filter(t => now - t < 15 * 60 * 1000);
  if (record.failedTotp.length >= 5) {
    record.lockedUntilTotp = now + 15 * 60 * 1000;
    const remainingSec = 15 * 60;
    return {
      allowed: false,
      error: 'Too many failed authenticator attempts. Temporarily locked for 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: remainingSec
    };
  }
  return { allowed: true };
}

function recordTotpFailure(ip) {
  let record = ipRateLimits.get(ip);
  if (!record) {
    record = { otpRequests: [], failedPasswords: [], failedTotp: [], lockedUntil: 0, lockedUntilTotp: 0 };
    ipRateLimits.set(ip, record);
  }
  if (!record.failedTotp) record.failedTotp = [];
  record.failedTotp.push(Date.now());
}

function resetTotpFailures(ip) {
  let record = ipRateLimits.get(ip);
  if (record) {
    record.failedTotp = [];
    record.lockedUntilTotp = 0;
  }
}

function cleanupStaleOtpChallenges() {
  const now = Date.now();
  for (const [id, challenge] of otpChallenges.entries()) {
    if (now - challenge.issuedAt > 10 * 60 * 1000) {
      otpChallenges.delete(id);
    }
  }
  for (const [id, setup] of pendingTotpEnrollments.entries()) {
    if (now > setup.expiresAt) {
      pendingTotpEnrollments.delete(id);
    }
  }
}
if (!IS_VERCEL) {
  const otpCleanupTimer = setInterval(cleanupStaleOtpChallenges, 60 * 1000);
  if (otpCleanupTimer && otpCleanupTimer.unref) otpCleanupTimer.unref();
}

// -------------------------------------------------------------
// TOTP (AUTHENTICATOR APP) PERSISTENCE & HELPERS
// -------------------------------------------------------------
let inMemoryAuthData = null;
function getAuthRecord() {
  if (inMemoryAuthData) return inMemoryAuthData;
  if (fs.existsSync(AUTH_FILE)) {
    try {
      inMemoryAuthData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
      return inMemoryAuthData;
    } catch (e) {}
  }
  return null;
}

function isTotpEnrolled() {
  const data = getAuthRecord();
  return !!(data && data.totp && data.totp.enrolled && data.totp.secret);
}

function getTotpSecret() {
  const data = getAuthRecord();
  return (data && data.totp && data.totp.enrolled) ? data.totp.secret : null;
}

async function saveTotpEnrollment(secret) {
  let data = getAuthRecord() || {};
  data.totp = {
    enrolled: true,
    secret,
    enrolledAt: new Date().toISOString()
  };
  inMemoryAuthData = data;
  if (!IS_VERCEL) {
    try { fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch (e) {}
  } else {
    try { await storageAdapter.saveAuthData(data); } catch (e) {}
  }
}

async function resetTotpEnrollment() {
  let data = getAuthRecord() || {};
  if (data.totp) {
    delete data.totp;
    inMemoryAuthData = data;
    if (!IS_VERCEL) {
      try { fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch (e) {}
    } else {
      try { await storageAdapter.saveAuthData(data); } catch (e) {}
    }
  }
}

// -------------------------------------------------------------
// GMAIL OTP DELIVERY DISPATCHER VIA NODEMAILER (MAINTAINED LIBRARY)
// -------------------------------------------------------------
function isGmailConfigured() {
  loadEnvFile();
  const gmailUser = process.env.GMAIL_USER && process.env.GMAIL_USER.trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim();
  if (gmailUser && gmailPass) {
    return true;
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return true;
  }
  if (process.env.RESEND_API_KEY) {
    return true;
  }
  return false;
}

// Dispatches Gmail verification email using Nodemailer over TLS/STARTTLS
async function sendGmailNotification(otpCode) {
  loadEnvFile();

  const bodyHtml = `
    <div style="font-family:'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#070709; color:#F2F2F5; padding:32px; border-radius:12px; max-width:500px; margin:0 auto; border:1px solid rgba(255,255,255,0.12);">
      <div style="font-family:monospace; font-size:11px; letter-spacing:0.2em; color:#FF3038; margin-bottom:12px;">⚡ CBK DESIGNFOLIO // BACKSTAGE CONTROL ROOM</div>
      <h2 style="font-size:22px; font-weight:800; letter-spacing:0.04em; margin-bottom:12px; color:#FFFFFF;">Backstage Security Verification</h2>
      <p style="color:#9E9EA8; font-size:13px; line-height:1.5; margin-bottom:24px;">An administrative sign-in attempt was initiated for Backstage CMS. Please enter the following single-use verification code to authenticate:</p>
      <div style="background:#111116; border:1px solid rgba(255,48,56,0.3); border-radius:8px; padding:16px; text-align:center; margin-bottom:24px;">
        <span style="font-family:monospace; font-size:32px; font-weight:800; letter-spacing:0.35em; color:#FF3038;">${otpCode}</span>
      </div>
      <div style="font-family:monospace; font-size:11px; color:#9E9EA8; border-top:1px solid rgba(255,255,255,0.08); padding-top:16px; line-height:1.6;">
        <p>• <strong>Validity:</strong> Exactly 3 minutes (180 seconds) from server issuance.</p>
        <p>• <strong>Notice:</strong> This is a single-use administrative code. Never share this code with anyone.</p>
        <p>• If you did not initiate this request, your account credentials may be compromised.</p>
      </div>
    </div>
  `;

  const bodyText = `CBK DESIGNFOLIO // Backstage Security Verification\n\nYour single-use verification code is: ${otpCode}\nValid for exactly 3 minutes (180 seconds).\nDestination: ${CONFIGURED_EMAIL}`;

  // 1. Direct Gmail SMTP via GMAIL_USER & GMAIL_APP_PASSWORD
  const gmailUser = process.env.GMAIL_USER && process.env.GMAIL_USER.trim();
  const rawGmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim();

  if (gmailUser && rawGmailPass) {
    // Sanitize Google App Password: strip internal spaces (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
    const cleanAppPassword = rawGmailPass.replace(/\s+/g, '');
    const userConfiguredPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : null;
    const portsToTry = userConfiguredPort ? [userConfiguredPort] : [587, 465];
    let lastError = null;

    for (const port of portsToTry) {
      const isPort465 = (port === 465);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: isPort465, // true for 465 (SSL), false for 587 (STARTTLS)
        requireTLS: !isPort465, // Enforce STARTTLS on port 587
        auth: {
          user: gmailUser,
          pass: cleanAppPassword
        },
        tls: {
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });

      try {
        const info = await transporter.sendMail({
          from: process.env.GMAIL_FROM || `CBK Security <${gmailUser}>`,
          to: CONFIGURED_EMAIL,
          subject: `CBK DESIGNFOLIO Backstage Verification Code: ${otpCode}`,
          text: bodyText,
          html: bodyHtml
        });

        console.log(`[Auth-OTP] Gmail OTP successfully delivered via smtp.gmail.com:${port} to ${CONFIGURED_EMAIL}. MessageId: ${info.messageId}`);
        return { configured: true, delivered: true, messageId: info.messageId, port };
      } catch (err) {
        lastError = err;
        // If authentication failed (EAUTH / 535), credentials are invalid; do not retry other ports
        if (err.code === 'EAUTH' || (err.response && err.response.includes('535'))) {
          break;
        }
        console.warn(`[Auth-OTP] Port ${port} delivery attempt encountered: ${err.code || err.message}. Trying alternate port...`);
      }
    }

    // Build non-sensitive, helpful error feedback for the administrator
    let safeError = 'Gmail SMTP delivery failed. ';
    if (lastError.code === 'EAUTH' || (lastError.response && lastError.response.includes('535'))) {
      safeError += 'Google authentication rejected. Please verify that your GMAIL_USER is correct, your 16-character Google App Password has no typos, and 2-Step Verification is active on the Google account.';
    } else if (lastError.code === 'ESOCKET' || lastError.code === 'ETIMEDOUT' || lastError.code === 'ECONNREFUSED') {
      safeError += `Network connection to smtp.gmail.com timed out or was refused (${lastError.code}). Please verify internet connectivity and firewall permissions.`;
    } else {
      safeError += (lastError.message || 'SMTP communication error.');
    }

    console.warn('[Auth-OTP] Gmail delivery error:', safeError);
    return { configured: true, delivered: false, error: safeError };
  }

  // 2. Generic SMTP via SMTP_*
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    const isPort465 = (port === 465);
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: isPort465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 15000
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || `CBK Security <${process.env.SMTP_USER}>`,
        to: CONFIGURED_EMAIL,
        subject: `CBK DESIGNFOLIO Backstage Verification Code: ${otpCode}`,
        text: bodyText,
        html: bodyHtml
      });

      console.log(`[Auth-OTP] Generic SMTP OTP delivered to ${CONFIGURED_EMAIL}. MessageId: ${info.messageId}`);
      return { configured: true, delivered: true, messageId: info.messageId };
    } catch (err) {
      console.warn('[Auth-OTP] Generic SMTP error:', err.message);
      return { configured: true, delivered: false, error: `Generic SMTP delivery failed: ${err.message}` };
    }
  }

  // 3. Resend API (tertiary fallback)
  if (process.env.RESEND_API_KEY) {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        from: process.env.EMAIL_FROM || 'CBK Security <onboarding@resend.dev>',
        to: [CONFIGURED_EMAIL],
        subject: `CBK DESIGNFOLIO Backstage Verification Code: ${otpCode}`,
        html: bodyHtml,
        text: bodyText
      });
      const req = https.request({
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ configured: true, delivered: res.statusCode < 300, error: res.statusCode >= 300 ? data : null });
        });
      });
      req.on('error', err => resolve({ configured: true, delivered: false, error: err.message }));
      req.write(postData);
      req.end();
    });
  }

  return {
    configured: false,
    delivered: false,
    error: 'Gmail delivery credentials (GMAIL_USER & GMAIL_APP_PASSWORD) are not configured in .env. Please authenticate using your Authenticator app or administrative passphrase.'
  };
}

// -------------------------------------------------------------
// SECURE PASSWORD VERIFICATION (TIMING-SAFE)
// -------------------------------------------------------------
function isAuthConfigured() {
  loadEnvFile();
  if (process.env.BACKSTAGE_PASSWORD && process.env.BACKSTAGE_PASSWORD.trim() !== '') {
    return true;
  }
  const data = getAuthRecord();
  return !!(data && data.salt && data.hash);
}

async function setAdminCredentials(password) {
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Passphrase must be at least 6 characters long.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  let authData = getAuthRecord() || {};
  authData.salt = salt;
  authData.hash = hash;
  authData.createdAt = authData.createdAt || new Date().toISOString();
  authData.updatedAt = new Date().toISOString();
  inMemoryAuthData = authData;

  if (!IS_VERCEL) {
    try {
      fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2), 'utf8');
      console.log('[Auth] Administrator credentials saved to data/auth.json');
    } catch (e) {}
  } else {
    try {
      await storageAdapter.saveAuthData(authData);
      console.log('[Auth] Administrator credentials saved to persistent storage');
    } catch (e) {
      console.warn('[Auth] Note: on Vercel, set BACKSTAGE_PASSWORD in Project Environment Variables for permanent passphrase authentication.');
    }
  }
}

function verifyAdminPassword(password) {
  if (!password || typeof password !== 'string') return false;
  loadEnvFile();

  // 1. Environment variable (top priority) - constant time SHA-256 compare
  if (process.env.BACKSTAGE_PASSWORD && process.env.BACKSTAGE_PASSWORD.trim() !== '') {
    const expectedHash = crypto.createHash('sha256').update(process.env.BACKSTAGE_PASSWORD).digest();
    const providedHash = crypto.createHash('sha256').update(password).digest();
    return crypto.timingSafeEqual(expectedHash, providedHash);
  }

  // 2. data/auth.json scrypt hash
  const authData = getAuthRecord();
  if (authData && authData.salt && authData.hash) {
    try {
      const computedHash = crypto.scryptSync(password, authData.salt, 64).toString('hex');
      const expectedBuf = Buffer.from(authData.hash);
      const computedBuf = Buffer.from(computedHash);
      if (expectedBuf.length !== computedBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, computedBuf);
    } catch (e) {
      return false;
    }
  }

  return false;
}

// -------------------------------------------------------------
// SESSION MANAGEMENT (RE-ENTRY GRACE PERIOD SUPPORT)
// -------------------------------------------------------------
function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours total session lifespan
  activeSessions.set(token, {
    createdAt: now,
    expiresAt,
    lastActive: now,
    leftAt: null
  });
  return { token, expiresAt };
}

function isValidSession(token) {
  if (!token) return false;
  const session = activeSessions.get(token);
  if (!session) return false;
  const now = Date.now();
  if (now > session.expiresAt) {
    activeSessions.delete(token);
    return false;
  }
  // If user left Backstage, check whether re-entry grace period (180s) has expired
  if (session.leftAt && (now - session.leftAt > RE_ENTRY_GRACE_MS)) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

function touchSession(token) {
  if (!token) return;
  const session = activeSessions.get(token);
  if (session) {
    session.lastActive = Date.now();
    // Return inside Backstage clears leave status
    session.leftAt = null;
  }
}

function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers['cookie'];
  if (cookieHeader) {
    const match = cookieHeader.match(/backstage_token=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }
  return null;
}

function checkAuth(req) {
  const token = extractToken(req);
  return isValidSession(token);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function parseMultipartOrBinary(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;
    req.on('data', chunk => {
      chunks.push(chunk);
      totalLength += chunk.length;
      if (totalLength > 100 * 1024 * 1024) { // 100MB media limit
        reject(new Error('File exceeds 100MB limit'));
      }
    });
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  });
  res.end(json);
}

function validateContentModel(data) {
  if (!data || typeof data !== 'object') {
    return 'Content must be a valid JSON object';
  }
  if (!Array.isArray(data.sections)) {
    return 'Content must contain a "sections" array';
  }
  for (let i = 0; i < data.sections.length; i++) {
    const sec = data.sections[i];
    if (!sec.id || typeof sec.id !== 'string') {
      return `Section at index ${i} missing required stable "id"`;
    }
    if (!sec.type || typeof sec.type !== 'string') {
      return `Section "${sec.id}" missing required "type"`;
    }
    if (!sec.name || typeof sec.name !== 'string') {
      return `Section "${sec.id}" missing required "name"`;
    }
  }
  return null;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.mpeg': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4'
};

async function requestHandler(req, res) {
  try {
    // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  let pathname = decodeURI(parsedUrl.pathname);
  if (pathname === '/server.js') {
    pathname = '/';
  }

  // -------------------------------------------------------------
  // API ROUTING
  // -------------------------------------------------------------

  // 1. AUTH: Status & Check Session
  if ((pathname === '/api/auth/status' || pathname === '/api/auth/check') && req.method === 'GET') {
    const configured = isAuthConfigured();
    const token = extractToken(req);
    const authenticated = isValidSession(token);
    const session = token ? activeSessions.get(token) : null;
    if (session && authenticated) {
      touchSession(token);
    }
    const gmailConfigured = isGmailConfigured();
    const totpEnrolled = isTotpEnrolled();
    const reEntryGraceSeconds = (session && session.leftAt)
      ? Math.max(0, Math.ceil((RE_ENTRY_GRACE_MS - (Date.now() - session.leftAt)) / 1000))
      : 180;

    return sendJson(res, 200, {
      configured,
      authenticated,
      sessionExpiresAt: session ? session.expiresAt : null,
      reEntryGraceSeconds,
      destinations: {
        email: MASKED_EMAIL
      },
      methods: {
        gmail: {
          configured: gmailConfigured,
          destination: MASKED_EMAIL
        },
        totp: {
          enrolled: totpEnrolled
        },
        password: {
          configured
        }
      },
      authMode: process.env.BACKSTAGE_PASSWORD ? 'env' : (fs.existsSync(AUTH_FILE) ? 'file' : 'unconfigured')
    });
  }

  // 1b. AUTH: Heartbeat (keeps visit active while inside Backstage)
  if (pathname === '/api/auth/heartbeat' && req.method === 'POST') {
    const token = extractToken(req);
    if (!token || !isValidSession(token)) {
      return sendJson(res, 401, { success: false, error: 'Session expired or unauthenticated', authenticated: false });
    }
    touchSession(token);
    return sendJson(res, 200, { success: true, active: true });
  }

  // 1c. AUTH: Leave Backstage (triggers 180s re-entry grace period)
  if (pathname === '/api/auth/leave' && req.method === 'POST') {
    const token = extractToken(req);
    if (token) {
      const session = activeSessions.get(token);
      if (session) {
        session.leftAt = Date.now();
        return sendJson(res, 200, { success: true, leftAt: session.leftAt, graceSeconds: 180 });
      }
    }
    return sendJson(res, 200, { success: true });
  }

  // 2. AUTH: Issue Fresh Gmail OTP Challenge (180s Expiry, Server Authoritative)
  if (pathname === '/api/auth/otp/request' && req.method === 'POST') {
    const clientIp = getClientIp(req);
    const gmailReady = isGmailConfigured();

    // 2.1 Detect provider configuration upfront
    if (!gmailReady) {
      return sendJson(res, 200, {
        success: false,
        code: 'GMAIL_UNCONFIGURED',
        error: 'Gmail delivery credentials (GMAIL_USER & GMAIL_APP_PASSWORD) are not configured in .env. Please authenticate using your Authenticator app or administrative passphrase.',
        fallbackAvailable: true,
        destinations: {
          email: MASKED_EMAIL
        },
        providers: {
          gmail: false
        }
      });
    }

    // 2.2 Rate limit check for live OTP dispatches
    const rateCheck = checkOtpRateLimit(clientIp);
    if (!rateCheck.allowed) {
      res.writeHead(429, {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': String(rateCheck.retryAfterSeconds || 60),
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({
        success: false,
        error: rateCheck.error,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        fallbackAvailable: true
      }));
    }

    // 2.3 Check resend cooldown for this IP (30 seconds)
    const now = Date.now();
    for (const [id, ch] of otpChallenges.entries()) {
      if (ch.ip === clientIp && !ch.used && now < ch.resendAvailableAt) {
        const remaining = Math.max(1, Math.ceil((ch.resendAvailableAt - now) / 1000));
        res.writeHead(429, {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': String(remaining),
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify({
          success: false,
          error: `Resend cooldown active. Please wait ${remaining} seconds before requesting a fresh code.`,
          code: 'RESEND_COOLDOWN',
          cooldownRemaining: remaining,
          fallbackAvailable: true
        }));
      }
    }

    // 2.4 Generate 6-digit unpredictable numeric OTP
    const otp = String(crypto.randomInt(100000, 1000000));
    const challengeId = 'otp_' + now + '_' + crypto.randomBytes(8).toString('hex');
    const otpHash = crypto.createHash('sha256').update(challengeId + ':' + otp).digest('hex');
    const expiresAt = now + OTP_VALIDITY_MS; // Exactly 180,000 ms (3 minutes)
    const resendAvailableAt = now + OTP_RESEND_COOLDOWN_MS;

    // 2.5 Dispatch to configured Gmail destination
    const emailRes = await sendGmailNotification(otp);

    // If delivery failed:
    if (!emailRes.delivered) {
      console.warn(`[Auth-OTP] Gmail delivery failed for challenge ${challengeId}: ${emailRes.error}`);
      return sendJson(res, 502, {
        success: false,
        code: 'DELIVERY_FAILED',
        error: 'Failed to deliver verification code through Gmail. Please verify server GMAIL_* credentials or use password fallback.',
        delivery: { email: emailRes },
        fallbackAvailable: true
      });
    }

    // 2.6 Delivery succeeded: Store challenge securely (salted hash only, single-use, 180s expiry)
    otpChallenges.set(challengeId, {
      otpHash,
      issuedAt: now,
      expiresAt,
      resendAvailableAt,
      attempts: 0,
      ip: clientIp,
      used: false,
      devOtp: (process.env.NODE_ENV !== 'production' ? otp : undefined)
    });

    // Record legitimate successful OTP dispatch toward IP rate limit
    recordOtpSuccess(clientIp);

    console.log(`[Auth-OTP] Fresh Gmail challenge created: ${challengeId} at ${new Date(now).toISOString()}. Expires at ${new Date(expiresAt).toISOString()} (180s).`);

    return sendJson(res, 200, {
      success: true,
      challengeId,
      expiresIn: 180,
      serverExpiresAt: expiresAt,
      resendCooldown: 30,
      destinations: {
        email: MASKED_EMAIL
      },
      message: 'Security verification code accepted for delivery to project2krishnan@gmail.com.'
    });
  }

  // 3. AUTH: Verify OTP Challenge (Constant-time, Rate-limited, Replay-prevented)
  if (pathname === '/api/auth/otp/verify' && req.method === 'POST') {
    try {
      const { challengeId, otp } = await parseJsonBody(req);
      if (!challengeId || !otp) {
        return sendJson(res, 400, {
          success: false,
          error: 'Challenge ID and 6-digit verification code are required.',
          code: 'MISSING_FIELDS'
        });
      }

      const challenge = otpChallenges.get(challengeId);
      if (!challenge || challenge.used) {
        return sendJson(res, 400, {
          success: false,
          error: 'Verification challenge not found, already verified, or invalidated. Please request a new code.',
          code: 'INVALID_CHALLENGE'
        });
      }

      // Authoritative Server-side Expiry Enforcement (180s)
      if (Date.now() > challenge.expiresAt) {
        otpChallenges.delete(challengeId);
        return sendJson(res, 400, {
          success: false,
          error: 'Verification code has expired. The 3-minute validity period has elapsed. Please request a new code.',
          code: 'OTP_EXPIRED'
        });
      }

      // Rate limit verification attempts (Max 5 attempts)
      challenge.attempts++;
      if (challenge.attempts > MAX_OTP_ATTEMPTS) {
        otpChallenges.delete(challengeId);
        return sendJson(res, 429, {
          success: false,
          error: 'Maximum verification attempts exceeded (5 failed attempts). Challenge has been permanently invalidated.',
          code: 'MAX_ATTEMPTS_EXCEEDED'
        });
      }

      // Constant-time hash verification
      const cleanOtp = String(otp).trim();
      const candidateHash = crypto.createHash('sha256').update(challengeId + ':' + cleanOtp).digest('hex');
      const candidateBuf = Buffer.from(candidateHash);
      const expectedBuf = Buffer.from(challenge.otpHash);
      const isMatch = candidateBuf.length === expectedBuf.length && crypto.timingSafeEqual(candidateBuf, expectedBuf);

      if (!isMatch) {
        const remaining = Math.max(0, MAX_OTP_ATTEMPTS - challenge.attempts);
        return sendJson(res, 401, {
          success: false,
          error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
          code: 'INVALID_OTP',
          attemptsRemaining: remaining
        });
      }

      // Success: Invalidate challenge immediately (Zero Replay)
      challenge.used = true;
      otpChallenges.delete(challengeId);

      // Issue authorized Backstage session
      const { token, expiresAt: sessionExpiresAt } = createSession();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': `backstage_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({
        success: true,
        token,
        sessionExpiresAt,
        message: 'Security verification successful. Welcome to Backstage.'
      }));
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 3b. AUTH: TOTP Enrollment Init (Generate Base32 Secret, otpauth URI, and QR Code)
  if (pathname === '/api/auth/totp/setup-init' && req.method === 'POST') {
    const clientIp = getClientIp(req);
    try {
      const secret = generateSecret();
      const otpauth = generateURI({
        secret,
        label: CONFIGURED_EMAIL,
        issuer: 'CBK DESIGNFOLIO'
      });
      const qrDataUrl = await QRCode.toDataURL(otpauth, {
        errorCorrectionLevel: 'M',
        margin: 2,
        color: { dark: '#070709', light: '#FFFFFF' }
      });

      const setupId = 'totp_setup_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
      pendingTotpEnrollments.set(setupId, {
        secret,
        otpauth,
        qrDataUrl,
        expiresAt: Date.now() + 10 * 60 * 1000,
        ip: clientIp
      });

      return sendJson(res, 200, {
        success: true,
        setupId,
        secret,
        otpauth,
        qrDataUrl,
        issuer: 'CBK DESIGNFOLIO',
        account: CONFIGURED_EMAIL,
        message: 'Scan the QR code with Google Authenticator, Microsoft Authenticator, or another standard TOTP app.'
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: 'Failed to initialize authenticator setup: ' + err.message });
    }
  }

  // 3c. AUTH: TOTP Enrollment Verify & Activation
  if (pathname === '/api/auth/totp/setup-verify' && req.method === 'POST') {
    try {
      const { setupId, token } = await parseJsonBody(req);
      if (!setupId || !token) {
        return sendJson(res, 400, { success: false, error: 'Setup ID and 6-digit authenticator code are required.' });
      }

      const pending = pendingTotpEnrollments.get(setupId);
      if (!pending || Date.now() > pending.expiresAt) {
        if (pending) pendingTotpEnrollments.delete(setupId);
        return sendJson(res, 400, { success: false, error: 'Setup session expired. Please restart authenticator setup.' });
      }

      const cleanToken = String(token).trim();
      const check = verifySync({ token: cleanToken, secret: pending.secret });
      if (!check || !check.valid) {
        return sendJson(res, 400, {
          success: false,
          error: 'Invalid authenticator code. Check that the current 6-digit code matches your app and try again.'
        });
      }

      // Persist enrollment securely
      await saveTotpEnrollment(pending.secret);
      pendingTotpEnrollments.delete(setupId);

      // Create session upon successful enrollment verification
      const { token: sessionToken, expiresAt: sessionExpiresAt } = createSession();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': `backstage_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({
        success: true,
        token: sessionToken,
        sessionExpiresAt,
        message: 'Authenticator app successfully enrolled and activated.'
      }));
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 3d. AUTH: TOTP Login Verification
  if (pathname === '/api/auth/totp/verify' && req.method === 'POST') {
    const clientIp = getClientIp(req);
    const totpCheck = checkTotpRateLimit(clientIp);
    if (!totpCheck.allowed) {
      res.writeHead(429, {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': String(totpCheck.retryAfterSeconds || 60),
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({
        success: false,
        error: totpCheck.error,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: totpCheck.retryAfterSeconds
      }));
    }

    if (!isTotpEnrolled()) {
      return sendJson(res, 400, {
        success: false,
        code: 'TOTP_NOT_ENROLLED',
        error: 'Authenticator app is not yet enrolled. Please use password fallback or enroll an app.'
      });
    }

    try {
      const { token } = await parseJsonBody(req);
      if (!token) {
        return sendJson(res, 400, { success: false, error: 'Please enter the 6-digit code from your authenticator app.' });
      }

      const secret = getTotpSecret();
      const cleanToken = String(token).trim();
      const check = verifySync({ token: cleanToken, secret });

      if (!check || !check.valid) {
        recordTotpFailure(clientIp);
        return sendJson(res, 401, {
          success: false,
          code: 'INVALID_TOTP',
          error: 'Incorrect authenticator code. Check your app and try the current rotating code.'
        });
      }

      // Replay prevention within the same 30s window
      if (lastUsedTotpStep === check.timeStep && lastUsedTotpCode === cleanToken) {
        return sendJson(res, 400, {
          success: false,
          code: 'TOTP_REPLAY',
          error: 'This code was already used. Please wait for the next rotating 30-second code from your app.'
        });
      }

      lastUsedTotpStep = check.timeStep;
      lastUsedTotpCode = cleanToken;
      resetTotpFailures(clientIp);

      const { token: sessionToken, expiresAt: sessionExpiresAt } = createSession();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': `backstage_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({
        success: true,
        token: sessionToken,
        sessionExpiresAt,
        message: 'Authenticated via Authenticator app.'
      }));
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 3e. AUTH: TOTP Reset (Requires authenticated admin session)
  if (pathname === '/api/auth/totp/reset' && req.method === 'POST') {
    if (!checkAuth(req)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized: Admin session required to reset authenticator.' });
    }
    await resetTotpEnrollment();
    return sendJson(res, 200, { success: true, message: 'Authenticator app enrollment cleared. You can now enroll a new device.' });
  }

  // 4. AUTH: Password Fallback ("Use password instead")
  if ((pathname === '/api/auth/password' || pathname === '/api/auth/login') && req.method === 'POST') {
    const clientIp = getClientIp(req);
    const pwCheck = checkPasswordRateLimit(clientIp);
    if (!pwCheck.allowed) {
      res.writeHead(429, {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': String(pwCheck.retryAfterSeconds || 900),
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({
        success: false,
        error: pwCheck.error,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: pwCheck.retryAfterSeconds
      }));
    }

    if (!isAuthConfigured()) {
      return sendJson(res, 400, {
        success: false,
        setupRequired: true,
        error: 'Administrator passphrase has not been configured yet. Please complete initial setup.'
      });
    }

    try {
      const { password } = await parseJsonBody(req);
      if (!password || typeof password !== 'string') {
        return sendJson(res, 400, { success: false, error: 'Please enter your administrative passphrase.' });
      }

      if (verifyAdminPassword(password)) {
        resetPasswordFailures(clientIp);
        const { token, expiresAt: sessionExpiresAt } = createSession();
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Set-Cookie': `backstage_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify({
          success: true,
          token,
          sessionExpiresAt,
          message: 'Authenticated via administrative passphrase.'
        }));
      } else {
        recordPasswordFailure(clientIp);
        return sendJson(res, 401, {
          success: false,
          error: 'Incorrect administrative passphrase. Please check your credentials or reset via .env.'
        });
      }
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 5. AUTH: Initial Setup (when unconfigured)
  if (pathname === '/api/auth/setup' && req.method === 'POST') {
    if (isAuthConfigured()) {
      return sendJson(res, 403, {
        success: false,
        error: 'Administrator credentials are already configured. To change them, update BACKSTAGE_PASSWORD in your .env file or delete data/auth.json.'
      });
    }
    try {
      const { password, confirmPassword } = await parseJsonBody(req);
      if (!password || typeof password !== 'string' || password.length < 6) {
        return sendJson(res, 400, { success: false, error: 'Passphrase must be at least 6 characters long.' });
      }
      if (password !== confirmPassword) {
        return sendJson(res, 400, { success: false, error: 'Passphrases do not match. Please re-enter.' });
      }
      await setAdminCredentials(password);
      const { token, expiresAt } = createSession();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': `backstage_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({
        success: true,
        token,
        expiresAt,
        message: 'Administrator credentials established successfully.'
      }));
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 6. AUTH: Logout (Scenario E: Re-entry after explicit logout requires fresh authentication)
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = extractToken(req);
    if (token) activeSessions.delete(token);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': 'backstage_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({ success: true, message: 'Logged out successfully. Authenticated session cleared.' }));
  }

  // 7. AUTH TEST HARNESS (Localhost testing: inspect & expire without weakening production 180s)
  if (pathname === '/api/auth/test/challenge-info' && req.method === 'POST') {
    const host = req.headers.host || '';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      return sendJson(res, 403, { success: false, error: 'Test harness restricted to localhost' });
    }
    const { challengeId } = await parseJsonBody(req);
    const challenge = otpChallenges.get(challengeId);
    if (!challenge) return sendJson(res, 404, { success: false, error: 'Challenge not found' });
    return sendJson(res, 200, {
      success: true,
      challengeId,
      expiresAt: challenge.expiresAt,
      expiresIn: Math.max(0, Math.ceil((challenge.expiresAt - Date.now()) / 1000)),
      devOtp: challenge.devOtp || null,
      attempts: challenge.attempts,
      used: challenge.used
    });
  }

  if (pathname === '/api/auth/test/expire-challenge' && req.method === 'POST') {
    const host = req.headers.host || '';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      return sendJson(res, 403, { success: false, error: 'Test harness restricted to localhost' });
    }
    const { challengeId } = await parseJsonBody(req);
    const challenge = otpChallenges.get(challengeId);
    if (!challenge) return sendJson(res, 404, { success: false, error: 'Challenge not found' });
    challenge.expiresAt = Date.now() - 2000; // Expire challenge for testing
    return sendJson(res, 200, { success: true, message: 'Challenge expired for test verification' });
  }

  if (pathname === '/api/auth/test/simulate-leave' && req.method === 'POST') {
    const host = req.headers.host || '';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      return sendJson(res, 403, { success: false, error: 'Test harness restricted to localhost' });
    }
    const { token, secondsAgo } = await parseJsonBody(req);
    const session = activeSessions.get(token);
    if (!session) return sendJson(res, 404, { success: false, error: 'Session not found' });
    session.leftAt = Date.now() - (secondsAgo || 181) * 1000;
    return sendJson(res, 200, { success: true, leftAt: session.leftAt, message: `Simulated leaving ${secondsAgo}s ago` });
  }

  if (pathname === '/api/auth/test/clear-rate-limits' && req.method === 'POST') {
    const host = req.headers.host || '';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      return sendJson(res, 403, { success: false, error: 'Test harness restricted to localhost' });
    }
    ipRateLimits.clear();
    return sendJson(res, 200, { success: true, message: 'Rate limits cleared for testing' });
  }

  // 4. CONTENT: Get Content (Public or Draft)
  if (pathname === '/api/content' && req.method === 'GET') {
    const isDraftRequested = parsedUrl.searchParams.get('draft') === 'true';
    const isAuthed = checkAuth(req);

    try {
      const contentResult = await storageAdapter.getContent(isDraftRequested, isAuthed);
      return sendJson(res, 200, {
        success: true,
        data: contentResult.data,
        isDraft: contentResult.isDraft,
        hasUnsavedChanges: contentResult.hasUnsavedChanges,
        authenticated: isAuthed
      });
    } catch (err) {
      const status = err.statusCode || 500;
      return sendJson(res, status, { success: false, error: 'Failed to read content model: ' + err.message });
    }
  }

  // 5. CONTENT: Save Working Draft (Protected)
  if (pathname === '/api/content/draft' && req.method === 'POST') {
    if (!checkAuth(req)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized: Admin session required' });
    }

    try {
      const rawBody = await parseJsonBody(req);
      const payload = (rawBody && rawBody.data && Array.isArray(rawBody.data.sections)) ? rawBody.data : rawBody;
      const validationError = validateContentModel(payload);
      if (validationError) {
        return sendJson(res, 400, { success: false, error: validationError });
      }

      const result = await storageAdapter.saveDraft(payload);
      return sendJson(res, 200, result);
    } catch (err) {
      const status = err.statusCode || 500;
      return sendJson(res, status, { success: false, error: err.message });
    }
  }

  // 6. CONTENT: Save & Publish (Protected, Atomic, Backup)
  if ((pathname === '/api/content/save' || pathname === '/api/content/publish') && req.method === 'POST') {
    if (!checkAuth(req)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized: Admin session required' });
    }

    try {
      const rawBody = await parseJsonBody(req);
      const payload = (rawBody && rawBody.data && Array.isArray(rawBody.data.sections)) ? rawBody.data : rawBody;
      const validationError = validateContentModel(payload);
      if (validationError) {
        return sendJson(res, 400, { success: false, error: validationError });
      }

      const result = await storageAdapter.publishContent(payload);
      return sendJson(res, 200, result);
    } catch (err) {
      const status = err.statusCode || 500;
      return sendJson(res, status, { success: false, error: 'Save failed: ' + err.message });
    }
  }

  // 7. CONTENT: Discard Working Draft (Protected)
  if (pathname === '/api/content/discard' && req.method === 'POST') {
    if (!checkAuth(req)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized: Admin session required' });
    }

    try {
      const result = await storageAdapter.discardDraft();
      return sendJson(res, 200, result);
    } catch (err) {
      const status = err.statusCode || 500;
      return sendJson(res, status, { success: false, error: err.message });
    }
  }

  // 8. MEDIA: List Project Assets
  if (pathname === '/api/media/list' && req.method === 'GET') {
    try {
      const mediaList = await storageAdapter.listMedia();
      return sendJson(res, 200, { success: true, media: mediaList });
    } catch (err) {
      const status = err.statusCode || 500;
      return sendJson(res, status, { success: false, error: err.message });
    }
  }

  // 9a. MEDIA: Chunked Upload Init (Protected)
  if (pathname === '/api/media/upload/init' && req.method === 'POST') {
    if (!checkAuth(req)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized: Admin session required' });
    }

    try {
      const body = await parseJsonBody(req);
      const result = await storageAdapter.initUploadSession(body);
      const status = result.statusCode || (result.success ? 200 : 400);
      return sendJson(res, status, result);
    } catch (err) {
      const status = err.statusCode || 500;
      return sendJson(res, status, { success: false, error: 'Upload initialization failed: ' + err.message });
    }
  }

  // 9b. MEDIA: Vercel Blob Direct Client Upload Token (Protected)
  if (pathname === '/api/media/upload/blob' && req.method === 'POST') {
    return await storageAdapter.handleBlobClientUpload(req, res, parseJsonBody, checkAuth);
  }

  // 9b. MEDIA: Chunked Upload Chunk (Protected)
  if (pathname === '/api/media/upload/chunk' && req.method === 'POST') {
    if (!checkAuth(req)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized: Admin session required' });
    }

    const sessionId = req.headers['x-session-id'] || parsedUrl.searchParams.get('sessionId');
    if (!sessionId || !uploadSessions.has(sessionId)) {
      return sendJson(res, 404, { success: false, error: 'Upload session not found or expired' });
    }

    const session = uploadSessions.get(sessionId);
    const chunkIndex = parseInt(req.headers['x-chunk-index'] || '0', 10);
    const chunkOffset = parseInt(req.headers['x-chunk-offset'] || '0', 10);
    const chunkSize = parseInt(req.headers['x-chunk-size'] || '0', 10);

    if (isNaN(chunkOffset) || chunkOffset < 0 || isNaN(chunkSize) || chunkSize < 0) {
      return sendJson(res, 400, { success: false, error: 'Invalid chunk offset or size headers' });
    }

    if (chunkOffset + chunkSize > session.fileSize || chunkOffset + chunkSize > MAX_VIDEO_BYTES) {
      return sendJson(res, 400, { success: false, error: 'Chunk bounds exceed declared file size or 10 GB limit' });
    }

    try {
      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(session.partPath, { flags: 'r+', start: chunkOffset });
        let written = 0;
        let limitExceeded = false;

        req.on('data', chunk => {
          written += chunk.length;
          if (chunkOffset + written > session.fileSize || chunkOffset + written > MAX_VIDEO_BYTES) {
            limitExceeded = true;
            req.destroy();
            writeStream.destroy();
          }
        });

        req.pipe(writeStream);

        writeStream.on('finish', () => {
          if (limitExceeded) {
            sendJson(res, 400, { success: false, error: 'Chunk exceeded declared file size or 10 GB limit' });
            return resolve();
          }
          session.chunks.add(chunkIndex);
          session.receivedBytes = Math.max(session.receivedBytes, chunkOffset + written);
          sendJson(res, 200, {
            success: true,
            chunkIndex,
            bytesReceived: written,
            totalReceived: session.receivedBytes
          });
          resolve();
        });

        writeStream.on('error', err => {
          sendJson(res, 500, { success: false, error: 'Failed to write chunk: ' + err.message });
          resolve();
        });

        req.on('error', err => {
          sendJson(res, 500, { success: false, error: 'Incoming chunk read error: ' + err.message });
          resolve();
        });
      });
      return;
    } catch (err) {
      return sendJson(res, 500, { success: false, error: 'Chunk processing error: ' + err.message });
    }
  }

  // 9c. MEDIA: Chunked Upload Complete (Protected)
  if (pathname === '/api/media/upload/complete' && req.method === 'POST') {
    if (!checkAuth(req)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized: Admin session required' });
    }

    try {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId;
      if (!sessionId || !uploadSessions.has(sessionId)) {
        return sendJson(res, 404, { success: false, error: 'Upload session not found or expired' });
      }

      const session = uploadSessions.get(sessionId);
      if (!fs.existsSync(session.partPath)) {
        return sendJson(res, 400, { success: false, error: 'Partial upload file missing' });
      }

      const stats = fs.statSync(session.partPath);
      if (stats.size !== session.fileSize) {
        return sendJson(res, 400, {
          success: false,
          error: `File size verification failed. Expected ${session.fileSize} bytes, got ${stats.size} bytes.`
        });
      }

      // Atomically move to ROOT_DIR
      fs.copyFileSync(session.partPath, session.finalPath);
      try {
        fs.unlinkSync(session.partPath);
        fs.rmSync(session.tempDir, { recursive: true, force: true });
      } catch (e) { }

      uploadSessions.delete(sessionId);

      return sendJson(res, 200, {
        success: true,
        url: '/' + encodeURI(session.filename),
        filename: session.filename,
        size: stats.size,
        mimeType: session.fileType
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: 'Failed to complete upload: ' + err.message });
    }
  }

  // 9d. MEDIA: Chunked Upload Abort / Cancel (Protected)
  if (pathname === '/api/media/upload/abort' && req.method === 'POST') {
    if (!checkAuth(req)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized: Admin session required' });
    }

    try {
      const body = await parseJsonBody(req).catch(() => ({}));
      const sessionId = body.sessionId || req.headers['x-session-id'];
      if (sessionId && uploadSessions.has(sessionId)) {
        const session = uploadSessions.get(sessionId);
        try {
          if (fs.existsSync(session.tempDir)) {
            fs.rmSync(session.tempDir, { recursive: true, force: true });
          }
        } catch (e) { }
        uploadSessions.delete(sessionId);
      }
      return sendJson(res, 200, { success: true, aborted: true });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: 'Failed to abort upload: ' + err.message });
    }
  }

  // 9e. MEDIA: Direct Upload Asset (Protected, Legacy Fallback)
  if (pathname === '/api/media/upload' && req.method === 'POST') {
    if (!checkAuth(req)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized: Admin session required' });
    }

    try {
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        const body = await parseJsonBody(req);
        const filename = body.filename || body.fileName || body.name;
        const base64Data = body.base64Data || body.data || body.file;
        if (!filename || !base64Data) {
          return sendJson(res, 400, { success: false, error: 'Missing filename or base64Data' });
        }

        const ext = path.extname(filename).toLowerCase();
        const allowedExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.webm', '.pdf', '.mp3', '.mpeg', '.wav', '.ogg', '.m4a']);
        if (!allowedExts.has(ext)) {
          return sendJson(res, 400, { success: false, error: `Disallowed extension "${ext}". Allowed: png, jpg, jpeg, webp, svg, mp4, webm, pdf, mp3, mpeg, wav, ogg` });
        }

        const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
        const destPath = path.join(ROOT_DIR, safeName);
        const fileBuffer = Buffer.from(base64Data.replace(/^data:[^;]+;base64,/, ''), 'base64');

        if (fileBuffer.length === 0) {
          return sendJson(res, 400, { success: false, error: 'Invalid file: Buffer is empty (0 bytes)' });
        }

        const isVideo = ALLOWED_VIDEO_EXTS.has(ext);
        if (isVideo && fileBuffer.length > MAX_VIDEO_BYTES) {
          return sendJson(res, 400, { success: false, error: `File size (${fileBuffer.length} bytes) exceeds the maximum permitted video limit of 10 GB (${MAX_VIDEO_BYTES} bytes).` });
        }

        fs.writeFileSync(destPath, fileBuffer);
        return sendJson(res, 200, {
          success: true,
          url: '/' + encodeURI(safeName),
          filename: safeName,
          size: fileBuffer.length
        });
      } else {
        return sendJson(res, 400, { success: false, error: 'Use JSON payload with { filename, base64Data } or chunked upload at /api/media/upload/init' });
      }
    } catch (err) {
      return sendJson(res, 500, { success: false, error: 'Upload failed: ' + err.message });
    }
  }

  // -------------------------------------------------------------
  // STATIC ROUTING
  // -------------------------------------------------------------
  let reqPath = pathname;

  // Route /backstage -> serve backstage.html
  if (reqPath === '/backstage' || reqPath === '/backstage/') {
    reqPath = '/backstage.html';
  } else if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.normalize(path.join(ROOT_DIR, reqPath));

  // Security check: ensure path is within ROOT_DIR and blocks hidden/internal folders
  if (!filePath.startsWith(ROOT_DIR) || reqPath.startsWith('/.temp_uploads') || reqPath.startsWith('/.env') || reqPath.startsWith('/.git') || reqPath === '/server.js') {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Handle HTTP Range requests for video media
    const range = req.headers.range;
    if (range && (ext === '.mp4' || ext === '.webm')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      return file.pipe(res);
    }

    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Access-Control-Allow-Origin': '*'
    };

    if (ext === '.jpg' || ext === '.jpeg' || ext === '.webp' || ext === '.png' || ext === '.svg') {
      headers['Cache-Control'] = 'no-cache, must-revalidate';
    } else if (ext === '.html' || ext === '.json' || ext === '.js' || ext === '.css') {
      headers['Cache-Control'] = 'no-cache';
    }

    res.writeHead(200, headers);
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => {
      console.error('[File Stream Error]', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Read Error');
      }
    });
    stream.pipe(res);
  });
  } catch (fatalErr) {
    console.error('[SERVER FATAL ERROR]', fatalErr);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Internal server error: ' + fatalErr.message }));
    }
  }
}

const server = http.createServer(requestHandler);

if (require.main === module && !IS_VERCEL) {
  server.listen(PORT, () => {
    console.log(`CBK DESIGNFOLIO Server running at http://localhost:${PORT}`);
    console.log(`BACKSTAGE CMS available at http://localhost:${PORT}/backstage`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(PORT) + 1;
      console.log(`Port ${PORT} in use, trying port ${nextPort}...`);
      server.listen(nextPort);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Export handler for Vercel Serverless Functions and Node server
module.exports = requestHandler;
module.exports.server = server;
module.exports.default = requestHandler;
