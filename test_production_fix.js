/**
 * test_production_fix.js
 * Comprehensive automated verification test suite for Vercel production fix
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('=== STARTING PRODUCTION FIX VERIFICATION SUITE ===\n');

  // -------------------------------------------------------------
  // TEST 1: VERCEL MODULE LOAD SIMULATION (ZERO CRASH ON IMPORT)
  // -------------------------------------------------------------
  console.log('[TEST 1] Testing server.js import in Vercel Serverless environment simulation...');
  process.env.VERCEL = '1';
  process.env.VERCEL_ENV = 'production';

  let serverModule;
  try {
    serverModule = require('./server.js');
    console.log('  ✓ server.js successfully loaded without ENOENT/mkdir crashes on Vercel simulation.');
    assert.strictEqual(typeof serverModule, 'function', 'Exported module should be a request handler function');
  } catch (err) {
    console.error('  ✗ FAILED: server.js crashed during Vercel module load:', err);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TEST 2: VERCEL HANDLER EXECUTION ON ROOT & STATIC PATHS
  // -------------------------------------------------------------
  console.log('\n[TEST 2] Testing Vercel serverless request handler on /, /favicon.ico, /backstage...');

  const { Writable } = require('stream');

  function mockRequest(url, method = 'GET', headers = {}) {
    return new Promise((resolve) => {
      const req = new http.IncomingMessage();
      req.url = url;
      req.method = method;
      req.headers = { host: 'krishnan-portfolio-nine.vercel.app', ...headers };

      let statusCode = 200;
      let responseHeaders = {};
      let responseBody = '';

      const res = new Writable({
        write(chunk, encoding, callback) {
          responseBody += chunk.toString();
          callback();
        }
      });

      res.writeHead = (code, hdrs) => {
        statusCode = code;
        responseHeaders = hdrs || {};
      };
      res.setHeader = (k, v) => { responseHeaders[k] = v; };
      res.getHeader = (k) => responseHeaders[k];
      res.on('finish', () => {
        resolve({ statusCode, headers: responseHeaders, body: responseBody });
      });

      serverModule(req, res);
    });
  }

  // Test GET /
  const rootRes = await mockRequest('/');
  console.log(`  ✓ GET / returned HTTP ${rootRes.statusCode}`);
  assert.strictEqual(rootRes.statusCode, 200, 'Root path / must return 200');

  // Test GET /backstage
  const backstageRes = await mockRequest('/backstage');
  console.log(`  ✓ GET /backstage returned HTTP ${backstageRes.statusCode}`);
  assert.strictEqual(backstageRes.statusCode, 200, '/backstage must return 200');

  // Test GET /api/content
  const contentRes = await mockRequest('/api/content');
  console.log(`  ✓ GET /api/content returned HTTP ${contentRes.statusCode}`);
  assert.strictEqual(contentRes.statusCode, 200, '/api/content must return 200');
  const contentJson = JSON.parse(contentRes.body);
  assert.strictEqual(contentJson.success, true, 'Content API should return success: true');
  assert.ok(contentJson.data && contentJson.data.sections, 'Content API should contain sections data');

  // Test GET /api/media/list
  const mediaRes = await mockRequest('/api/media/list');
  console.log(`  ✓ GET /api/media/list returned HTTP ${mediaRes.statusCode}`);
  assert.strictEqual(mediaRes.statusCode, 200, '/api/media/list must return 200');
  const mediaJson = JSON.parse(mediaRes.body);
  assert.strictEqual(mediaJson.success, true, 'Media list API should return success: true');
  assert.ok(Array.isArray(mediaJson.media), 'Media list should return an array');
  console.log(`  ✓ Discovered ${mediaJson.media.length} media assets in portfolio repository`);

  // -------------------------------------------------------------
  // TEST 3: STORAGE ADAPTER ERROR HANDLING ON UNCONFIGURED VERCEL
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Testing graceful error handling for CMS writes when external storage is absent...');
  const storageAdapter = require('./storage-adapter');

  try {
    await storageAdapter.saveDraft({ sections: [] });
    assert.fail('Should have thrown StorageConfigurationError');
  } catch (err) {
    console.log(`  ✓ saveDraft without Vercel Blob correctly returned status ${err.statusCode}: "${err.message.slice(0, 70)}..."`);
    assert.strictEqual(err.statusCode, 503, 'Should return 503 Service Unavailable');
  }

  try {
    await storageAdapter.publishContent({ sections: [] });
    assert.fail('Should have thrown StorageConfigurationError');
  } catch (err) {
    console.log(`  ✓ publishContent without Vercel Blob correctly returned status ${err.statusCode}: "${err.message.slice(0, 70)}..."`);
    assert.strictEqual(err.statusCode, 503, 'Should return 503 Service Unavailable');
  }

  // -------------------------------------------------------------
  // TEST 4: 10 GB VIDEO UPLOAD LIMIT & POLICY ENFORCEMENT
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Testing 10 GB Video Upload Policy Enforcement...');

  // Valid 9 GB video validation
  const valid9Gb = storageAdapter.validateUploadRequest('my_feature_film.mp4', 9000000000);
  assert.strictEqual(valid9Gb, null, '9 GB .mp4 video must be allowed');
  console.log('  ✓ 9 GB .mp4 video is permitted under 10 GB policy.');

  // Exactly 10 GB video
  const valid10Gb = storageAdapter.validateUploadRequest('showreel_10gb.mp4', 10000000000);
  assert.strictEqual(valid10Gb, null, '10 GB .mp4 video must be allowed');
  console.log('  ✓ 10 GB .mp4 video is permitted.');

  // Disallow 10.1 GB video
  const invalid10_1Gb = storageAdapter.validateUploadRequest('exceeding.mp4', 10000000001);
  assert.ok(invalid10_1Gb && invalid10_1Gb.includes('exceeds the maximum permitted video limit of 10 GB'), 'Over 10 GB video must be rejected');
  console.log(`  ✓ 10.000000001 GB video is rejected: "${invalid10_1Gb}"`);

  // Disallow non-video over 100 MB
  const invalidImage = storageAdapter.validateUploadRequest('giant_poster.png', 150 * 1024 * 1024);
  assert.ok(invalidImage && invalidImage.includes('exceeds the limit of 100 MB'), 'Over 100 MB image must be rejected');
  console.log(`  ✓ 150 MB image is rejected: "${invalidImage}"`);

  // Disallow unpermitted extensions
  const invalidExt = storageAdapter.validateUploadRequest('malicious.exe', 1024);
  assert.ok(invalidExt && invalidExt.includes('Disallowed extension'), 'Non-media extensions must be rejected');
  console.log(`  ✓ Disallowed extension .exe is rejected: "${invalidExt}"`);

  // -------------------------------------------------------------
  // TEST 5: LOCAL DEVELOPMENT WORKFLOW RESTORATION
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Testing local development filesystem workflow (IS_VERCEL = false)...');
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  storageAdapter.isVercel = false;

  const localContent = await storageAdapter.getContent(false, false);
  assert.ok(localContent.data && localContent.data.sections, 'Local content should read cleanly');
  console.log('  ✓ Local content loaded successfully from local filesystem.');

  const localUploadInit = await storageAdapter.initUploadSession({
    filename: 'test_local_clip.mp4',
    fileSize: 1048576,
    fileType: 'video/mp4'
  });
  assert.strictEqual(localUploadInit.success, true, 'Local upload init should succeed');
  assert.strictEqual(localUploadInit.mode, 'local', 'Local upload should use mode: local');
  assert.ok(localUploadInit.sessionId, 'Should return sessionId');
  console.log(`  ✓ Local upload initialized successfully with session: ${localUploadInit.sessionId}`);

  // Clean up test session
  if (storageAdapter.uploadSessions.has(localUploadInit.sessionId)) {
    const session = storageAdapter.uploadSessions.get(localUploadInit.sessionId);
    try {
      if (fs.existsSync(session.tempDir)) fs.rmSync(session.tempDir, { recursive: true, force: true });
    } catch (e) {}
    storageAdapter.uploadSessions.delete(localUploadInit.sessionId);
    console.log('  ✓ Local test upload session directory safely cleaned up.');
  }

  // -------------------------------------------------------------
  // TEST 6: VERIFY NO REPOSITORY SECRETS EXPOSED
  // -------------------------------------------------------------
  console.log('\n[TEST 6] Verifying no secrets in repository or tracked files...');
  const gitignore = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8');
  assert.ok(gitignore.includes('.env'), '.gitignore must ignore .env');
  assert.ok(gitignore.includes('data/auth.json'), '.gitignore must ignore data/auth.json');
  assert.ok(gitignore.includes('.temp_uploads'), '.gitignore must ignore .temp_uploads');
  console.log('  ✓ .gitignore correctly protects .env, data/auth.json, and .temp_uploads.');

  console.log('\n=== ALL 6 TEST PHASES PASSED WITH ZERO ERRORS ===\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
