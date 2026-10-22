/**
 * REAL GMAIL SMTP AUTHENTICATION & DELIVERY VERIFIER
 * Checks live credentials in .env and performs real Gmail SMTP handshake
 * Never exposes secrets or OTP values.
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const ROOT_DIR = __dirname;
const ENV_PATH = path.join(ROOT_DIR, '.env');
const CONFIGURED_EMAIL = 'project2krishnan@gmail.com';

function loadEnv() {
  const env = {};
  if (fs.existsSync(ENV_PATH)) {
    const lines = fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
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
        env[key] = val;
      }
    }
  }
  return env;
}

async function verifyRealGmail() {
  console.log('======================================================');
  console.log('CBK DESIGNFOLIO — REAL GMAIL SMTP GATEWAY VERIFIER');
  console.log('======================================================\n');

  const env = loadEnv();
  const gmailUser = env.GMAIL_USER ? env.GMAIL_USER.trim() : null;
  const rawAppPassword = env.GMAIL_APP_PASSWORD ? env.GMAIL_APP_PASSWORD.trim() : null;

  console.log(`1. Checking Environment File: ${ENV_PATH}`);
  console.log(`   - GMAIL_USER: ${gmailUser || '(not configured)'}`);
  console.log(`   - GMAIL_APP_PASSWORD: ${rawAppPassword ? '[CONFIGURED - ' + rawAppPassword.length + ' chars]' : '(EMPTY / NOT ENTERED YET)'}`);

  if (!gmailUser || !rawAppPassword) {
    console.log('\n[STATUS: AWAITING USER CREDENTIALS]');
    console.log('------------------------------------------------------');
    console.log('GMAIL_APP_PASSWORD is not entered yet in .env.');
    console.log('To complete real configuration:');
    console.log(`1. Open: ${ENV_PATH}`);
    console.log('2. Set your 16-character Google App Password:');
    console.log('   GMAIL_USER=project2krishnan@gmail.com');
    console.log('   GMAIL_APP_PASSWORD=your_16_character_code');
    console.log('3. Save the file and run this verifier again:');
    console.log('   node verify_real_smtp.js');
    console.log('------------------------------------------------------\n');
    return { configured: false, delivered: false };
  }

  const cleanAppPassword = rawAppPassword.replace(/\s+/g, '');
  const portsToTry = env.SMTP_PORT ? [parseInt(env.SMTP_PORT, 10)] : [587, 465];

  console.log(`\n2. Performing Real SMTP Handshake with smtp.gmail.com...`);
  let lastError = null;
  let successPort = null;
  let successInfo = null;

  for (const port of portsToTry) {
    const isPort465 = (port === 465);
    console.log(`   Attempting connection to smtp.gmail.com:${port} (${isPort465 ? 'SSL' : 'STARTTLS'})...`);

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: isPort465,
      requireTLS: !isPort465,
      auth: {
        user: gmailUser,
        pass: cleanAppPassword
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 12000,
      greetingTimeout: 8000,
      socketTimeout: 12000
    });

    try {
      // Step A: Verify credentials with Google SMTP server
      await transporter.verify();
      console.log(`   ✓ SMTP credentials authenticated successfully on port ${port}!`);

      // Step B: Send live test delivery to authorized admin
      console.log(`   Sending live verification test to ${CONFIGURED_EMAIL}...`);
      const testCode = String(Math.floor(100000 + Math.random() * 900000));
      const info = await transporter.sendMail({
        from: env.GMAIL_FROM || `CBK Security <${gmailUser}>`,
        to: CONFIGURED_EMAIL,
        subject: `[VERIFIED] CBK DESIGNFOLIO Gateway Test — ${testCode}`,
        text: `Your Gmail OTP gateway is successfully connected to smtp.gmail.com:${port}. Test code: ${testCode}`,
        html: `
          <div style="font-family:sans-serif; background:#070709; color:#fff; padding:24px; border-radius:8px;">
            <h2 style="color:#FF3038;">CBK DESIGNFOLIO // Gateway Live Verification</h2>
            <p>Your Gmail OTP delivery gateway is officially verified and operational.</p>
            <p><strong>Test Code:</strong> <span style="font-family:monospace; font-size:24px; color:#FF3038;">${testCode}</span></p>
            <p style="color:#888; font-size:12px;">Destination: ${CONFIGURED_EMAIL} | Port: ${port} | TLS 1.2+</p>
          </div>
        `
      });

      console.log(`   ✓ Real email successfully delivered! MessageId: ${info.messageId}`);
      successPort = port;
      successInfo = info;
      break;
    } catch (err) {
      lastError = err;
      console.warn(`   ✗ Connection on port ${port} failed: ${err.message}`);
      if (err.code === 'EAUTH' || (err.response && err.response.includes('535'))) {
        console.warn('   -> Google rejected the credentials (535 Authentication Failed).');
        break; // Do not retry other ports on bad credentials
      }
    }
  }

  if (successPort && successInfo) {
    console.log('\n======================================================');
    console.log('✓ REAL GMAIL OTP GATEWAY VERIFIED & OPERATIONAL!');
    console.log(`  Connected: smtp.gmail.com:${successPort}`);
    console.log(`  Sender: ${gmailUser}`);
    console.log(`  Recipient: ${CONFIGURED_EMAIL}`);
    console.log(`  MessageId: ${successInfo.messageId}`);
    console.log('======================================================\n');
    return { configured: true, delivered: true, port: successPort, messageId: successInfo.messageId };
  } else {
    console.log('\n[SMTP ERROR INSPECTION & CORRECTIVE ACTIONS]');
    console.log('------------------------------------------------------');
    if (lastError.code === 'EAUTH' || (lastError.response && lastError.response.includes('535'))) {
      console.log('CAUSE: Google rejected the username or Google App Password.');
      console.log('CORRECTIVE ACTIONS:');
      console.log('1. Confirm that 2-Step Verification is turned ON for ' + gmailUser);
      console.log('2. In your Google Account, visit: myaccount.google.com/apppasswords');
      console.log('3. Create a NEW App Password specifically for "CBK Backstage"');
      console.log('4. Ensure the full 16-character code is pasted into GMAIL_APP_PASSWORD in .env');
    } else if (lastError.code === 'ESOCKET' || lastError.code === 'ETIMEDOUT' || lastError.code === 'ECONNREFUSED') {
      console.log(`CAUSE: Network connection error (${lastError.code}).`);
      console.log('CORRECTIVE ACTIONS:');
      console.log('1. Check server internet connectivity.');
      console.log('2. Ensure outbound TCP ports 587 and 465 are not blocked by a local firewall or ISP.');
    } else {
      console.log('CAUSE: ' + lastError.message);
    }
    console.log('------------------------------------------------------\n');
    return { configured: true, delivered: false, error: lastError.message };
  }
}

verifyRealGmail().catch(err => {
  console.error('Fatal error during verification:', err.message);
  process.exit(1);
});
