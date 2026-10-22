const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\meet2\\.gemini\\antigravity-ide\\brain\\346f158f-44e4-49fe-8598-17f344b038d1';

async function testBrowserAuth() {
  console.log('Launching Chrome for Backstage UI verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  // Clear any existing session cookie to test fresh login view
  await page.deleteCookie({ name: 'backstage_token', domain: 'localhost' });

  // 1. Navigate to Backstage
  console.log('Navigating to http://localhost:3000/backstage ...');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });

  // Wait for auth overlay to be visible
  await page.waitForSelector('#auth-overlay', { visible: true });

  // Capture screenshot of initial login screen
  const screenshotPath1 = path.join(ARTIFACT_DIR, 'backstage_three_method_login.png');
  await page.screenshot({ path: screenshotPath1 });
  console.log(`Saved screenshot 1 to: ${screenshotPath1}`);

  // Check which tab is active and visible
  const activeTab = await page.evaluate(() => {
    const activeBtn = document.querySelector('.auth-tab-btn.active');
    const pwVisible = document.getElementById('auth-view-password').style.display !== 'none';
    const otpVisible = document.getElementById('auth-view-otp').style.display !== 'none';
    const totpVisible = document.getElementById('auth-view-totp').style.display !== 'none';
    return {
      activeTabLabel: activeBtn ? activeBtn.textContent : null,
      pwVisible,
      otpVisible,
      totpVisible
    };
  });
  console.log('Initial UI state:', activeTab);

  // 2. Switch to GMAIL OTP tab to verify honest unconfigured notice
  console.log('Clicking GMAIL OTP tab...');
  await page.click('#tab-btn-otp');
  await new Promise(r => setTimeout(r, 300));

  const otpNotice = await page.evaluate(() => {
    const notice = document.getElementById('auth-gateway-notice');
    const challengeForm = document.getElementById('auth-otp-challenge-form-wrapper');
    return {
      noticeText: notice ? notice.textContent.trim() : null,
      noticeVisible: notice ? notice.style.display !== 'none' : false,
      challengeFormVisible: challengeForm ? challengeForm.style.display !== 'none' : false
    };
  });
  console.log('Gmail OTP tab state:', otpNotice);

  const screenshotPath2 = path.join(ARTIFACT_DIR, 'backstage_gmail_unconfigured_tab.png');
  await page.screenshot({ path: screenshotPath2 });
  console.log(`Saved screenshot 2 to: ${screenshotPath2}`);

  // 3. Switch to AUTHENTICATOR tab
  console.log('Clicking AUTHENTICATOR tab...');
  await page.click('#tab-btn-totp');
  await new Promise(r => setTimeout(r, 300));

  const totpState = await page.evaluate(() => {
    const enrolledBox = document.getElementById('totp-enrolled-section');
    const notEnrolledBox = document.getElementById('totp-not-enrolled-section');
    return {
      enrolledVisible: enrolledBox ? enrolledBox.style.display !== 'none' : false,
      notEnrolledVisible: notEnrolledBox ? notEnrolledBox.style.display !== 'none' : false
    };
  });
  console.log('Authenticator tab state:', totpState);

  const screenshotPath3 = path.join(ARTIFACT_DIR, 'backstage_authenticator_tab.png');
  await page.screenshot({ path: screenshotPath3 });
  console.log(`Saved screenshot 3 to: ${screenshotPath3}`);

  // 4. Switch to PASSPHRASE tab and test actual login
  console.log('Clicking PASSPHRASE tab...');
  await page.click('#tab-btn-password');
  await new Promise(r => setTimeout(r, 300));

  const envPath = path.join(__dirname, '.env');
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const pwMatch = envContent.match(/^BACKSTAGE_PASSWORD=(.+)$/m);
  const adminPassword = pwMatch ? pwMatch[1].trim() : 'cbk2026';

  await page.type('#auth-fallback-password', adminPassword);
  await page.click('#auth-password-btn');

  // Wait for overlay to hide
  await page.waitForFunction(() => {
    const overlay = document.getElementById('auth-overlay');
    return overlay && overlay.style.display === 'none';
  }, { timeout: 5000 });

  console.log('Authentication successful! Backstage CMS unlocked.');
  const screenshotPath4 = path.join(ARTIFACT_DIR, 'backstage_cms_unlocked.png');
  await page.screenshot({ path: screenshotPath4 });
  console.log(`Saved screenshot 4 to: ${screenshotPath4}`);

  await browser.close();
  console.log('Browser tests completed successfully!');
}

testBrowserAuth().catch(err => {
  console.error('Browser test failed:', err);
  process.exit(1);
});
