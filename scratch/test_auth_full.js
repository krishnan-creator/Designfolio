const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ROOT_DIR = path.resolve(__dirname, '..');
const AUTH_FILE = path.join(ROOT_DIR, 'data', 'auth.json');
const ENV_FILE = path.join(ROOT_DIR, '.env');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch(e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('BACKSTAGE AUTHENTICATION VERIFICATION SUITE');
  console.log('====================================================\n');

  // Ensure clean unconfigured state first
  if (fs.existsSync(AUTH_FILE)) {
    fs.unlinkSync(AUTH_FILE);
    console.log('[Setup] Cleared pre-existing data/auth.json for clean test run');
  }
  if (fs.existsSync(ENV_FILE)) {
    // Keep backup if needed
    fs.unlinkSync(ENV_FILE);
  }

  // 1. Check initial status
  console.log('[TEST 1] GET /api/auth/status when unconfigured...');
  const res1 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/status',
    method: 'GET'
  });
  console.log('  Status code:', res1.statusCode);
  console.log('  Response:', res1.body);
  if (res1.json?.configured !== false || res1.json?.authenticated !== false) {
    throw new Error('Test 1 Failed: Expected configured: false, authenticated: false');
  }
  console.log('  ✓ TEST 1 PASSED: Correctly reports unconfigured state.\n');

  // 2. Attempt login when unconfigured
  console.log('[TEST 2] POST /api/auth/login when unconfigured...');
  const res2 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { password: 'AttemptPassword123' });
  console.log('  Status code:', res2.statusCode);
  console.log('  Response:', res2.body);
  if (res2.statusCode !== 400 || !res2.json?.setupRequired) {
    throw new Error('Test 2 Failed: Expected 400 with setupRequired: true');
  }
  console.log('  ✓ TEST 2 PASSED: Useful error indicating setup required, NOT generic wrong password.\n');

  // 3. Setup validation errors
  console.log('[TEST 3] POST /api/auth/setup validation (short password & mismatch)...');
  const res3a = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/setup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { password: '123', confirmPassword: '123' });
  console.log('  Short password response:', res3a.body);
  if (res3a.statusCode !== 400) throw new Error('Test 3a Failed');

  const res3b = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/setup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { password: 'ValidPassword123!', confirmPassword: 'DifferentPassword456!' });
  console.log('  Mismatch response:', res3b.body);
  if (res3b.statusCode !== 400) throw new Error('Test 3b Failed');
  console.log('  ✓ TEST 3 PASSED: Validation prevents weak passwords and typos.\n');

  // 4. Successful setup
  const TEST_PASSPHRASE = 'AdminPassphrase2026!';
  console.log(`[TEST 4] POST /api/auth/setup establishing administrator passphrase...`);
  const res4 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/setup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { password: TEST_PASSPHRASE, confirmPassword: TEST_PASSPHRASE });
  console.log('  Status code:', res4.statusCode);
  console.log('  Response:', res4.body);
  console.log('  Cookie set:', res4.headers['set-cookie']);
  if (res4.statusCode !== 200 || !res4.json?.success || !res4.json?.token) {
    throw new Error('Test 4 Failed: Could not setup administrator');
  }
  const sessionToken = res4.json.token;
  const cookieHeader = res4.headers['set-cookie'] ? res4.headers['set-cookie'][0] : '';
  console.log('  ✓ TEST 4 PASSED: Setup created session token and auth record.\n');

  // Verify auth.json on disk
  if (!fs.existsSync(AUTH_FILE)) {
    throw new Error('auth.json was not created on disk');
  }
  const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  console.log('  auth.json verification: salt length =', authData.salt.length, ', hash length =', authData.hash.length);
  if (!authData.salt || !authData.hash) {
    throw new Error('auth.json is missing salt or scrypt hash');
  }

  // 5. Subsequent setup attempt should be rejected (cannot overwrite without server access)
  console.log('[TEST 5] POST /api/auth/setup when already configured (should be forbidden)...');
  const res5 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/setup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { password: 'NewHijackPassword!', confirmPassword: 'NewHijackPassword!' });
  console.log('  Status code:', res5.statusCode);
  console.log('  Response:', res5.body);
  if (res5.statusCode !== 403) throw new Error('Test 5 Failed: Expected 403 Forbidden');
  console.log('  ✓ TEST 5 PASSED: Setup locked once configured.\n');

  // 6. Test login with WRONG password
  console.log('[TEST 6] POST /api/auth/login with wrong password...');
  const res6 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { password: 'WrongPassphrase!' });
  console.log('  Status code:', res6.statusCode);
  console.log('  Response:', res6.body);
  if (res6.statusCode !== 401) throw new Error('Test 6 Failed: Expected 401 Unauthorized');
  console.log('  ✓ TEST 6 PASSED: Rejects invalid password with informative error.\n');

  // 7. Test login with CORRECT password
  console.log('[TEST 7] POST /api/auth/login with correct password...');
  const res7 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { password: TEST_PASSPHRASE });
  console.log('  Status code:', res7.statusCode);
  console.log('  Response:', res7.body);
  if (res7.statusCode !== 200 || !res7.json?.success) throw new Error('Test 7 Failed: Login failed');
  console.log('  ✓ TEST 7 PASSED: Correct passphrase authenticates and issues new session.\n');

  // 8. Test Route Protection on Protected APIs
  console.log('[TEST 8] Route Protection on /api/content/draft...');
  // 8a. Without auth
  const res8a = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/content/draft',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { sections: [] });
  console.log('  Unauthenticated POST /api/content/draft status:', res8a.statusCode);
  if (res8a.statusCode !== 401) throw new Error('Test 8a Failed: Endpoint not protected');

  // 8b. With Bearer token
  const res8b = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/content/draft',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${res7.json.token}`
    }
  }, {
    version: 1,
    siteTitle: 'Test Title',
    sections: [
      { id: 'sec-hero', type: 'hero', name: 'Hero Section', visible: true, props: {} }
    ]
  });
  console.log('  Authenticated POST /api/content/draft status:', res8b.statusCode);
  if (res8b.statusCode !== 200) throw new Error('Test 8b Failed: Protected request rejected');
  console.log('  ✓ TEST 8 PASSED: Protected routes reject unauthenticated access and permit authorized sessions.\n');

  // 9. BROWSER END-TO-END TEST
  console.log('[TEST 9] Launching headless browser for Visual & UI flow verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('  [Browser Log]:', msg.text()));
  page.on('pageerror', err => console.log('  [Browser Error]:', err.message));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log('  [Browser API Response]:', res.status(), res.url());
    }
  });

  // 9a. Direct navigation to /backstage (unauthenticated)
  console.log('  Navigating to http://localhost:3000/backstage ...');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle0' });

  // Check auth overlay visible
  const isOverlayVisible = await page.$eval('#auth-overlay', el => window.getComputedStyle(el).display !== 'none');
  console.log('  Auth overlay is visible:', isOverlayVisible);
  if (!isOverlayVisible) throw new Error('Auth overlay should be visible on fresh navigation');

  const delay = ms => new Promise(r => setTimeout(r, ms));

  // Try wrong password in UI
  console.log('  Testing wrong password submission in UI...');
  await page.type('#auth-password', 'completely_wrong_pass');
  await page.click('#auth-submit-btn');
  await delay(600);

  const errorText = await page.$eval('#auth-error-msg', el => el.textContent);
  const isErrorVisible = await page.$eval('#auth-error-msg', el => window.getComputedStyle(el).display !== 'none');
  console.log('  Error displayed:', errorText, '(visible:', isErrorVisible, ')');
  if (!isErrorVisible || !errorText.includes('Incorrect administrative passphrase')) {
    throw new Error('Error message did not appear properly');
  }

  // Clear and enter correct password
  console.log('  Entering correct passphrase in UI...');
  await page.$eval('#auth-password', el => el.value = '');
  await page.type('#auth-password', TEST_PASSPHRASE);
  const typedVal = await page.$eval('#auth-password', el => el.value);
  console.log('  Passphrase typed in UI:', typedVal === TEST_PASSPHRASE ? 'EXACT MATCH' : `MISMATCH (${typedVal})`);
  await page.click('#auth-submit-btn');

  // Wait for overlay to disappear
  await page.waitForFunction(() => {
    const el = document.getElementById('auth-overlay');
    return !el || window.getComputedStyle(el).display === 'none';
  }, { timeout: 5000 });

  console.log('  ✓ Auth overlay successfully hidden after valid credentials!');

  // Verify the actual BACKSTAGE editor UI is present and loaded
  await page.waitForSelector('.backstage-header', { timeout: 5000 });
  await page.waitForSelector('#section-tree', { timeout: 5000 });
  
  const sectionCount = await page.$$eval('#section-tree .tree-item', items => items.length);
  console.log('  Loaded sections in tree:', sectionCount);
  if (sectionCount === 0) throw new Error('Section tree did not populate in editor');

  const editorTitle = await page.$eval('.backstage-logo', el => el.textContent.trim());
  console.log('  Editor branding:', editorTitle);

  // Take screenshot of unlocked editor
  const screenshotPath = path.join(ROOT_DIR, 'scratch', 'backstage_unlocked.png');
  await page.screenshot({ path: screenshotPath });
  console.log('  Screenshot saved to:', screenshotPath);

  // 9b. Verify 5-click entry mechanism on public site
  console.log('\n[TEST 10] Testing public site 5-click entry mechanism at http://localhost:3000/ ...');
  const publicPage = await browser.newPage();
  await publicPage.setViewport({ width: 1440, height: 900 });
  await publicPage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Locate trigger button
  const trigger = await publicPage.$('#backstage-trigger');
  if (!trigger) throw new Error('Backstage 5-click trigger button not found on public page');
  console.log('  Found backstage trigger pill: #backstage-trigger');

  // Click 5 times
  for (let i = 1; i <= 5; i++) {
    await trigger.click();
    console.log(`  Click ${i}/5 performed`);
    await delay(120);
  }

  // Wait for navigation to /backstage
  await publicPage.waitForFunction(() => window.location.pathname.includes('/backstage'), { timeout: 6000 });
  const currentUrl = publicPage.url();
  console.log('  Navigated to:', currentUrl);
  if (!currentUrl.includes('/backstage')) {
    throw new Error('5-click trigger did not navigate to /backstage');
  }
  console.log('  ✓ TEST 10 PASSED: 5-click entry on "DBL // V3 ARCHIVE" navigates to BACKSTAGE!\n');

  await browser.close();

  console.log('====================================================');
  console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
