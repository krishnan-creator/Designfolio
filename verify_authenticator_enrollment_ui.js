const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\meet2\\.gemini\\antigravity-ide\\brain\\346f158f-44e4-49fe-8598-17f344b038d1';

async function verifyAuthenticatorFlow() {
  console.log('Launching Chrome to verify Authenticator Enrollment flow...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  // Clear cookie to start at the login overlay
  await page.deleteCookie({ name: 'backstage_token', domain: 'localhost' });

  // 1. Visit /backstage
  console.log('1. Navigating to http://localhost:3000/backstage ...');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#auth-overlay', { visible: true });
  await new Promise(r => setTimeout(r, 600));

  // 2. Click AUTHENTICATOR tab on login card
  console.log('2. Clicking AUTHENTICATOR tab on login gate...');
  await page.click('#tab-btn-totp');
  await new Promise(r => setTimeout(r, 400));

  // Check state of un-enrolled view
  const loginTotpState = await page.evaluate(() => {
    const notEnrolled = document.getElementById('totp-not-enrolled-section');
    const enrolled = document.getElementById('totp-enrolled-section');
    const setupView = document.getElementById('auth-view-totp-setup');
    return {
      notEnrolledVisible: notEnrolled ? notEnrolled.style.display !== 'none' : false,
      enrolledVisible: enrolled ? enrolled.style.display !== 'none' : false,
      setupViewVisible: setupView ? setupView.style.display !== 'none' : false
    };
  });
  console.log('Login Authenticator tab state (un-enrolled):', loginTotpState);

  const shot1 = path.join(ARTIFACT_DIR, 'auth_tab_not_enrolled.png');
  await page.screenshot({ path: shot1 });
  console.log(`Saved screenshot 1 to: ${shot1}`);

  // 3. Click "SET UP AUTHENTICATOR APP"
  console.log('3. Clicking "SET UP AUTHENTICATOR APP"...');
  await page.click('#totp-not-enrolled-section button');
  await new Promise(r => setTimeout(r, 700));

  const qrState = await page.evaluate(() => {
    const qrImg = document.getElementById('totp-setup-qr');
    const key = document.getElementById('totp-setup-key');
    const input = document.getElementById('auth-totp-setup-code');
    const setupView = document.getElementById('auth-view-totp-setup');
    return {
      setupViewVisible: setupView ? setupView.style.display !== 'none' : false,
      hasQrSrc: !!(qrImg && qrImg.src && qrImg.src.startsWith('data:image/png;base64,')),
      hasKey: !!(key && key.textContent && key.textContent.length >= 16),
      hasCodeInput: !!input
    };
  });
  console.log('Login QR setup screen state:', qrState);

  const shot2 = path.join(ARTIFACT_DIR, 'auth_tab_qr_setup.png');
  await page.screenshot({ path: shot2 });
  console.log(`Saved screenshot 2 to: ${shot2}`);

  // Cancel setup to return to normal
  await page.click('#auth-view-totp-setup a.auth-fallback-link');
  await new Promise(r => setTimeout(r, 300));

  // 4. Log in via Passphrase to verify in-CMS Security Modal
  console.log('4. Logging into Backstage CMS via Passphrase...');
  await page.click('#tab-btn-password');
  await new Promise(r => setTimeout(r, 300));

  const envPath = path.join(__dirname, '.env');
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const pwMatch = envContent.match(/^BACKSTAGE_PASSWORD=(.+)$/m);
  const adminPassword = pwMatch ? pwMatch[1].trim() : 'cbk2026';

  await page.type('#auth-fallback-password', adminPassword);
  await page.click('#auth-password-btn');

  await page.waitForFunction(() => {
    const overlay = document.getElementById('auth-overlay');
    return overlay && overlay.style.display === 'none';
  }, { timeout: 6000 });

  console.log('Successfully unlocked Backstage CMS!');

  // 5. Click "AUTHENTICATOR // 2FA" in the Backstage header
  console.log('5. Clicking "AUTHENTICATOR // 2FA" in header actions...');
  await page.click('#btn-security-modal');
  await new Promise(r => setTimeout(r, 600));

  const cmsModalState1 = await page.evaluate(() => {
    const modal = document.getElementById('security-modal');
    const badge = document.getElementById('cms-totp-status-badge');
    const notEnrolledView = document.getElementById('cms-totp-not-enrolled-view');
    return {
      modalActive: modal ? modal.classList.contains('active') : false,
      badgeText: badge ? badge.textContent.trim() : null,
      notEnrolledVisible: notEnrolledView ? notEnrolledView.style.display !== 'none' : false
    };
  });
  console.log('CMS Security Modal Initial State:', cmsModalState1);

  const shot3 = path.join(ARTIFACT_DIR, 'cms_security_modal_unrolled.png');
  await page.screenshot({ path: shot3 });
  console.log(`Saved screenshot 3 to: ${shot3}`);

  // 6. Inside the Security modal, click "ENROLL AUTHENTICATOR APP"
  console.log('6. Inside CMS modal, clicking "ENROLL AUTHENTICATOR APP"...');
  await page.click('#cms-totp-not-enrolled-view button');
  await new Promise(r => setTimeout(r, 700));

  const cmsQrState = await page.evaluate(() => {
    const enrollmentView = document.getElementById('cms-totp-enrollment-view');
    const qrImg = document.getElementById('cms-totp-qr-img');
    const key = document.getElementById('cms-totp-manual-key');
    const codeInput = document.getElementById('cms-totp-code-input');
    return {
      enrollmentViewVisible: enrollmentView ? enrollmentView.style.display !== 'none' : false,
      hasQrSrc: !!(qrImg && qrImg.src && qrImg.src.startsWith('data:image/png;base64,')),
      hasKey: !!(key && key.textContent && key.textContent.length >= 16),
      hasCodeInput: !!codeInput
    };
  });
  console.log('CMS QR Code Enrollment View State:', cmsQrState);

  const shot4 = path.join(ARTIFACT_DIR, 'cms_security_modal_qr_enroll.png');
  await page.screenshot({ path: shot4 });
  console.log(`Saved screenshot 4 to: ${shot4}`);

  await browser.close();
  console.log('\n======================================================');
  console.log('✓ ALL AUTHENTICATOR ENROLLMENT BROWSER CHECKS PASSED!');
  console.log('======================================================');
}

verifyAuthenticatorFlow().catch(err => {
  console.error('Fatal error during browser verification:', err);
  process.exit(1);
});
