const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT_DIR, '.env');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch(e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body, json });
      });
    });
    req.on('error', reject);
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

async function testEnv() {
  console.log('[ENV TEST] Testing .env credentials configuration...');

  // Set .env with a specific custom passphrase
  const CUSTOM_ENV_PASS = 'CustomPassphraseFromEnv2026!';
  fs.writeFileSync(ENV_FILE, `PORT=3000\nBACKSTAGE_PASSWORD="${CUSTOM_ENV_PASS}"\n`, 'utf8');

  // Verify server status
  const res = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/status',
    method: 'GET'
  });
  console.log('  Status response:', res.body);

  // Attempt login with the password that was in data/auth.json (should fail if env overrides or succeed if matching)
  // Now attempt login with CUSTOM_ENV_PASS
  // Note: loadEnvFile in server.js runs on server startup, so let's verify if server restarts with .env
  console.log('  Testing login endpoint...');
}

testEnv();
