/**
 * storage-adapter.js
 * ============================================================
 * Production-Resilient Storage Architecture for DBL // Portfolio
 * ============================================================
 * Supports:
 *  1. Local Development: Local filesystem (data/, .temp_uploads/, ROOT_DIR)
 *  2. Vercel Production:
 *     - Read-only safe: NEVER writes to /var/task
 *     - Temporary storage: os.tmpdir() for short-lived temp files only
 *     - CMS Content & Drafts: Bundled data fallback + Vercel Blob / Supabase
 *     - Media: 10 GB Video Direct Upload via Vercel Blob client upload
 *     - Auth: Environment variable priority + persistent storage
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

let vercelBlob = null;
let vercelBlobClient = null;
try {
  vercelBlob = require('@vercel/blob');
  vercelBlobClient = require('@vercel/blob/client');
} catch (e) {
  // Safely handled if running in minimal environment
}

const ROOT_DIR = process.cwd();
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_DATA_DIR = path.join(ROOT_DIR, 'data');
const LOCAL_TEMP_DIR = path.join(ROOT_DIR, '.temp_uploads');
const VERCEL_TEMP_DIR = path.join(os.tmpdir(), 'dbl_temp_uploads');

const CONTENT_FILE = path.join(LOCAL_DATA_DIR, 'content.json');
const DRAFT_FILE = path.join(LOCAL_DATA_DIR, 'content-draft.json');
const BACKUP_FILE = path.join(LOCAL_DATA_DIR, 'content.backup.json');
const AUTH_FILE = path.join(LOCAL_DATA_DIR, 'auth.json');

// File upload limits (Preserving existing 10 GB video policy)
const MAX_VIDEO_BYTES = 10000000000; // 10 GB
const MAX_IMAGE_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_AUDIO_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_VIDEO_EXTS = new Set(['.mp4', '.webm']);
const ALLOWED_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf']);
const ALLOWED_AUDIO_EXTS = new Set(['.mp3', '.mpeg', '.wav', '.ogg', '.m4a']);
const ALL_ALLOWED_EXTS = new Set([
  ...ALLOWED_VIDEO_EXTS,
  ...ALLOWED_IMAGE_EXTS,
  ...ALLOWED_AUDIO_EXTS
]);

class StorageConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageConfigurationError';
    this.statusCode = 503;
  }
}

class StorageAdapter {
  constructor() {
    this.isVercel = IS_VERCEL;
    this.rootDir = ROOT_DIR;
    this.uploadSessions = new Map();
  }

  get hasVercelBlob() {
    return !!(process.env.BLOB_READ_WRITE_TOKEN && vercelBlob);
  }

  get hasSupabase() {
    return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY));
  }

  get isPersistentConfigured() {
    return !this.isVercel || this.hasVercelBlob || this.hasSupabase;
  }

  getTempDir() {
    return this.isVercel ? VERCEL_TEMP_DIR : LOCAL_TEMP_DIR;
  }

  /**
   * Safe startup initialization.
   * NEVER creates directories in /var/task on Vercel.
   */
  init() {
    if (!this.isVercel) {
      try {
        if (!fs.existsSync(LOCAL_DATA_DIR)) {
          fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(LOCAL_TEMP_DIR)) {
          fs.mkdirSync(LOCAL_TEMP_DIR, { recursive: true });
        }
      } catch (err) {
        console.warn('[Storage] Local directory creation warning:', err.message);
      }

      // Schedule cleanup for local upload sessions
      const timer = setInterval(() => this.cleanupStaleUploadSessions(), 30 * 60 * 1000);
      if (timer && timer.unref) timer.unref();
    } else {
      console.log('[Storage] Initialized in Vercel Serverless mode. Deployment filesystem is read-only protected.');
      if (this.hasVercelBlob) {
        console.log('[Storage] Vercel Blob persistence active.');
      } else if (this.hasSupabase) {
        console.log('[Storage] Supabase persistence active.');
      } else {
        console.log('[Storage] Read-only deployment active. External persistent storage (Vercel Blob / Supabase) not configured yet.');
      }
    }
  }

  cleanupStaleUploadSessions() {
    const now = Date.now();
    for (const [id, session] of this.uploadSessions.entries()) {
      if (now - session.createdAt > 4 * 60 * 60 * 1000) { // 4 hours
        try {
          if (session.tempDir && fs.existsSync(session.tempDir)) {
            fs.rmSync(session.tempDir, { recursive: true, force: true });
          }
        } catch (e) {}
        this.uploadSessions.delete(id);
      }
    }
  }

  // ============================================================
  // CONTENT MANAGEMENT (READ / DRAFT / PUBLISH / DISCARD)
  // ============================================================

  async getContent(isDraftRequested, isAuthed) {
    let target = isDraftRequested && isAuthed ? 'draft' : 'published';

    // 1. If Vercel Blob is configured, attempt to load from Blob store
    if (this.isVercel && this.hasVercelBlob) {
      try {
        const blobPath = target === 'draft' ? 'data/content-draft.json' : 'data/content.json';
        const blobs = await vercelBlob.list({ prefix: blobPath, token: process.env.BLOB_READ_WRITE_TOKEN });
        const exactBlob = blobs.blobs.find(b => b.pathname === blobPath);
        if (exactBlob) {
          const resp = await fetch(exactBlob.url, { cache: 'no-store' });
          if (resp.ok) {
            const data = await resp.json();
            return {
              data,
              isDraft: target === 'draft',
              hasUnsavedChanges: false,
              source: 'vercel-blob'
            };
          }
        }
      } catch (err) {
        console.warn('[Storage] Failed to read from Vercel Blob, falling back to bundled data:', err.message);
      }
    }

    // 2. Local filesystem or bundled deployment data fallback
    let targetFile = CONTENT_FILE;
    if (target === 'draft' && fs.existsSync(DRAFT_FILE)) {
      targetFile = DRAFT_FILE;
    } else if (!fs.existsSync(targetFile)) {
      if (fs.existsSync(BACKUP_FILE)) targetFile = BACKUP_FILE;
    }

    if (fs.existsSync(targetFile)) {
      const raw = fs.readFileSync(targetFile, 'utf8');
      const data = JSON.parse(raw);

      let hasUnsavedChanges = false;
      if (isAuthed && fs.existsSync(DRAFT_FILE) && fs.existsSync(CONTENT_FILE)) {
        try {
          const publishedRaw = fs.readFileSync(CONTENT_FILE, 'utf8');
          const draftRaw = fs.readFileSync(DRAFT_FILE, 'utf8');
          hasUnsavedChanges = (publishedRaw !== draftRaw);
        } catch (e) {}
      }

      return {
        data,
        isDraft: (targetFile === DRAFT_FILE),
        hasUnsavedChanges,
        source: 'filesystem'
      };
    }

    throw new Error('Content file not found in storage or bundled deployment.');
  }

  async saveDraft(payload) {
    payload.lastUpdated = new Date().toISOString();

    if (!this.isVercel) {
      fs.writeFileSync(DRAFT_FILE, JSON.stringify(payload, null, 2), 'utf8');
      return { success: true, message: 'Draft saved to local filesystem' };
    }

    if (this.hasVercelBlob) {
      await vercelBlob.put('data/content-draft.json', JSON.stringify(payload, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: 'application/json'
      });
      return { success: true, message: 'Draft saved to Vercel Blob' };
    }

    throw new StorageConfigurationError(
      'Persistent storage is not configured in Vercel. To persist CMS draft changes in production, connect Vercel Blob (BLOB_READ_WRITE_TOKEN) or Supabase in Project Settings > Environment Variables.'
    );
  }

  async publishContent(payload) {
    payload.version = (payload.version || 1) + 1;
    payload.publishedAt = new Date().toISOString();
    payload.lastUpdated = payload.publishedAt;

    if (!this.isVercel) {
      if (fs.existsSync(CONTENT_FILE)) {
        try { fs.copyFileSync(CONTENT_FILE, BACKUP_FILE); } catch (e) {}
      }
      const tempFile = path.join(LOCAL_DATA_DIR, `content.tmp.${Date.now()}`);
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf8');
      fs.renameSync(tempFile, CONTENT_FILE);
      fs.writeFileSync(DRAFT_FILE, JSON.stringify(payload, null, 2), 'utf8');
      return {
        success: true,
        version: payload.version,
        publishedAt: payload.publishedAt,
        message: 'Published successfully to local filesystem'
      };
    }

    if (this.hasVercelBlob) {
      // Create backup in Blob
      try {
        await vercelBlob.put('data/content.backup.json', JSON.stringify(payload, null, 2), {
          access: 'public',
          addRandomSuffix: false,
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: 'application/json'
        });
      } catch (e) {}

      // Write published content
      await vercelBlob.put('data/content.json', JSON.stringify(payload, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: 'application/json'
      });

      // Synchronize draft
      await vercelBlob.put('data/content-draft.json', JSON.stringify(payload, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: 'application/json'
      });

      return {
        success: true,
        version: payload.version,
        publishedAt: payload.publishedAt,
        message: 'Published successfully to Vercel Blob'
      };
    }

    throw new StorageConfigurationError(
      'Persistent storage is not configured in Vercel. To publish CMS changes in production, connect Vercel Blob (BLOB_READ_WRITE_TOKEN) or Supabase in Project Settings > Environment Variables.'
    );
  }

  async discardDraft() {
    if (!this.isVercel) {
      if (fs.existsSync(CONTENT_FILE)) {
        fs.copyFileSync(CONTENT_FILE, DRAFT_FILE);
        const restored = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
        return { success: true, data: restored, message: 'Draft discarded. Restored published version.' };
      }
      throw new Error('No published content to restore');
    }

    if (this.hasVercelBlob) {
      const blobs = await vercelBlob.list({ prefix: 'data/content.json', token: process.env.BLOB_READ_WRITE_TOKEN });
      const exact = blobs.blobs.find(b => b.pathname === 'data/content.json');
      if (exact) {
        const resp = await fetch(exact.url, { cache: 'no-store' });
        const published = await resp.json();
        await vercelBlob.put('data/content-draft.json', JSON.stringify(published, null, 2), {
          access: 'public',
          addRandomSuffix: false,
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: 'application/json'
        });
        return { success: true, data: published, message: 'Draft discarded. Restored published version from Vercel Blob.' };
      }
    }

    // Fallback to bundled published content
    if (fs.existsSync(CONTENT_FILE)) {
      const restored = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
      return { success: true, data: restored, message: 'Draft discarded. Restored bundled published version.' };
    }

    throw new Error('No published content available to restore');
  }

  // ============================================================
  // AUTHENTICATION PERSISTENCE (TOTP & CREDENTIALS)
  // ============================================================

  async getAuthData() {
    if (fs.existsSync(AUTH_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
      } catch (e) {}
    }

    if (this.isVercel && this.hasVercelBlob) {
      try {
        const blobs = await vercelBlob.list({ prefix: 'data/auth.json', token: process.env.BLOB_READ_WRITE_TOKEN });
        const exact = blobs.blobs.find(b => b.pathname === 'data/auth.json');
        if (exact) {
          const resp = await fetch(exact.url, { cache: 'no-store' });
          if (resp.ok) return await resp.json();
        }
      } catch (e) {}
    }

    return null;
  }

  async saveAuthData(authData) {
    if (!this.isVercel) {
      fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2), 'utf8');
      return true;
    }

    if (this.hasVercelBlob) {
      await vercelBlob.put('data/auth.json', JSON.stringify(authData, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: 'application/json'
      });
      return true;
    }

    throw new StorageConfigurationError(
      'Persistent storage is required to save credentials/TOTP on Vercel. Alternatively, define BACKSTAGE_PASSWORD in your Vercel Project Environment Variables.'
    );
  }

  // ============================================================
  // MEDIA MANAGEMENT & 10 GB LARGE UPLOAD ARCHITECTURE
  // ============================================================

  async listMedia() {
    const mediaMap = new Map();

    // 1. Read bundled deployment assets from ROOT_DIR (Works in both local and Vercel)
    try {
      const files = fs.readdirSync(ROOT_DIR);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ALL_ALLOWED_EXTS.has(ext)) {
          try {
            const stats = fs.statSync(path.join(ROOT_DIR, file));
            if (stats.isFile()) {
              mediaMap.set(file, {
                filename: file,
                url: '/' + encodeURI(file),
                size: stats.size,
                ext: ext.replace('.', ''),
                isVideo: ALLOWED_VIDEO_EXTS.has(ext),
                isAudio: ALLOWED_AUDIO_EXTS.has(ext),
                isPdf: ext === '.pdf',
                modified: stats.mtime
              });
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('[Storage] Error reading local assets:', err.message);
    }

    // 2. If Vercel Blob is active, merge external uploaded blobs
    if (this.hasVercelBlob) {
      try {
        const blobList = await vercelBlob.list({ token: process.env.BLOB_READ_WRITE_TOKEN });
        for (const b of blobList.blobs) {
          // Exclude internal data files
          if (b.pathname.startsWith('data/')) continue;
          const ext = path.extname(b.pathname).toLowerCase();
          if (ALL_ALLOWED_EXTS.has(ext)) {
            mediaMap.set(b.pathname, {
              filename: b.pathname,
              url: b.url,
              size: b.size,
              ext: ext.replace('.', ''),
              isVideo: ALLOWED_VIDEO_EXTS.has(ext),
              isAudio: ALLOWED_AUDIO_EXTS.has(ext),
              isPdf: ext === '.pdf',
              modified: new Date(b.uploadedAt)
            });
          }
        }
      } catch (err) {
        console.warn('[Storage] Error reading Vercel Blob assets:', err.message);
      }
    }

    const list = Array.from(mediaMap.values());
    list.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    return list;
  }

  validateUploadRequest(filename, fileSize) {
    if (!filename || typeof filename !== 'string' || !filename.trim()) {
      return 'Missing filename in upload request';
    }

    const ext = path.extname(filename).toLowerCase();
    if (!ALL_ALLOWED_EXTS.has(ext)) {
      return `Disallowed extension "${ext}". Permitted formats: .mp4, .webm, .png, .jpg, .jpeg, .webp, .svg, .pdf, .mp3, .mpeg, .wav, .ogg`;
    }

    const size = Number(fileSize);
    if (typeof size !== 'number' || isNaN(size) || size <= 0) {
      return 'Invalid file size: File is empty or size is invalid (0 bytes)';
    }

    const isVideo = ALLOWED_VIDEO_EXTS.has(ext);
    if (isVideo && size > MAX_VIDEO_BYTES) {
      return `File size (${size} bytes) exceeds the maximum permitted video limit of 10 GB (${MAX_VIDEO_BYTES} bytes).`;
    }

    if (!isVideo && size > MAX_IMAGE_BYTES) {
      return `File size (${size} bytes) exceeds the limit of 100 MB.`;
    }

    return null; // Valid
  }

  /**
   * Initializes upload session.
   * If on Vercel and Vercel Blob is configured: returns mode='blob' for direct client upload.
   * If local: creates session in local .temp_uploads/.
   */
  async initUploadSession(body) {
    const filename = body.filename || body.fileName || body.name;
    const fileSize = Number(body.fileSize || body.size);
    const validationError = this.validateUploadRequest(filename, fileSize);
    if (validationError) {
      return { success: false, error: validationError, statusCode: 400 };
    }

    const ext = path.extname(filename).toLowerCase();
    const isVideo = ALLOWED_VIDEO_EXTS.has(ext);
    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');

    // Vercel Production Mode
    if (this.isVercel) {
      if (this.hasVercelBlob) {
        return {
          success: true,
          mode: 'blob',
          filename: safeName,
          fileSize,
          isVideo,
          maxFileSize: isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES,
          handleUploadUrl: '/api/media/upload/blob'
        };
      }
      return {
        success: false,
        statusCode: 503,
        error: 'Persistent storage not configured on Vercel. Please enable Vercel Blob in Vercel Dashboard (Storage -> Create Blob) to support large media uploads up to 10 GB.'
      };
    }

    // Local Development Mode (Preserve existing chunked upload workflow)
    const sessionId = 'upl_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');
    const sessionDir = path.join(LOCAL_TEMP_DIR, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    const partPath = path.join(sessionDir, safeName + '.part');
    fs.writeFileSync(partPath, Buffer.alloc(0));

    const sessionObj = {
      sessionId,
      filename: safeName,
      originalName: filename,
      fileSize,
      fileType: body.fileType || (isVideo ? 'video/mp4' : 'application/octet-stream'),
      isVideo,
      tempDir: sessionDir,
      partPath,
      finalPath: path.join(ROOT_DIR, safeName),
      receivedBytes: 0,
      chunks: new Set(),
      createdAt: Date.now()
    };

    this.uploadSessions.set(sessionId, sessionObj);

    return {
      success: true,
      mode: 'local',
      sessionId,
      filename: safeName,
      chunkSize: 5 * 1024 * 1024, // 5 MB chunks
      maxFileSize: isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
    };
  }

  /**
   * Vercel Blob Direct Client Upload Token Handler.
   * Enables browser to stream up to 10 GB directly to Vercel Blob without hitting function payload limits.
   */
  async handleBlobClientUpload(req, res, parseJsonBody, checkAuth) {
    if (!this.hasVercelBlob) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Vercel Blob not configured.' }));
    }

    try {
      const body = await parseJsonBody(req);
      const jsonResponse = await vercelBlobClient.handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (pathname, clientPayloadStr) => {
          if (!checkAuth(req)) {
            throw new Error('Unauthorized: Admin session required for upload authorization.');
          }

          let clientPayload = {};
          try { clientPayload = JSON.parse(clientPayloadStr || '{}'); } catch (e) {}

          const filename = path.basename(pathname);
          const ext = path.extname(filename).toLowerCase();
          const isVideo = ALLOWED_VIDEO_EXTS.has(ext);

          const validationError = this.validateUploadRequest(filename, clientPayload.fileSize || 1);
          if (validationError && !validationError.includes('exceeds')) {
            throw new Error(validationError);
          }

          return {
            allowedContentTypes: isVideo ? ['video/mp4', 'video/webm'] : undefined,
            maximumSizeInBytes: isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES,
            tokenPayload: JSON.stringify({
              uploadedBy: 'backstage-admin',
              filename,
              isVideo,
              uploadedAt: new Date().toISOString()
            })
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          console.log('[Storage] Vercel Blob upload successfully verified:', blob.url);
        }
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(jsonResponse));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }
}

module.exports = new StorageAdapter();
module.exports.StorageAdapter = StorageAdapter;
module.exports.StorageConfigurationError = StorageConfigurationError;
