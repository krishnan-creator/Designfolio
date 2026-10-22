const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\meet2\\.gemini\\antigravity-ide\\brain\\346f158f-44e4-49fe-8598-17f344b038d1';

async function runLiveBrowserTest() {
  console.log('Launching Chrome for live Backstage Gmail OTP verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  // Clear any existing session cookie so we see the live login overlay
  await page.deleteCookie({ name: 'backstage_token', domain: 'localhost' });

  // 1. Navigate to Backstage
  console.log('Navigating to http://localhost:3000/backstage ...');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });

  // Wait for auth overlay to be visible
  await page.waitForSelector('#auth-overlay', { visible: true });

  // Wait 1 second for any initial status checks and auto-challenge
  await new Promise(r => setTimeout(r, 1200));

  // 2. Inspect UI state of the Gmail OTP view
  const uiState = await page.evaluate(() => {
    const noticeEl = document.getElementById('auth-gateway-notice');
    const statusEl = document.getElementById('auth-dest-status');
    const challengeForm = document.getElementById('auth-otp-challenge-form-wrapper');
    const requestTrigger = document.getElementById('auth-otp-request-wrapper');
    const countdownEl = document.getElementById('auth-otp-countdown');
    const activeTab = document.querySelector('.auth-tab-btn.active');
    const otpInput = document.getElementById('auth-otp');

    return {
      activeTab: activeTab ? activeTab.textContent.trim() : null,
      noticeVisible: noticeEl ? (noticeEl.style.display !== 'none' && noticeEl.offsetParent !== null) : false,
      noticeText: noticeEl ? noticeEl.innerText.trim() : null,
      gatewayStatus: statusEl ? statusEl.textContent.trim() : null,
      challengeFormVisible: challengeForm ? (challengeForm.style.display !== 'none') : false,
      countdownText: countdownEl ? countdownEl.textContent.trim() : null,
      otpInputPresent: !!otpInput
    };
  });

  console.log('\n--- LIVE UI STATE EVALUATION ---');
  console.log('Active Tab:', uiState.activeTab);
  console.log('Gateway Warning Notice Visible:', uiState.noticeVisible);
  console.log('Gateway Status Text:', uiState.gatewayStatus);
  console.log('OTP Challenge Form Visible:', uiState.challengeFormVisible);
  console.log('Countdown Display:', uiState.countdownText);
  console.log('--------------------------------\n');

  // Screenshot 1: Live Backstage Gmail OTP Form with Gateway Ready / Active Challenge
  const shot1 = path.join(ARTIFACT_DIR, 'backstage_live_gmail_otp_active.png');
  await page.screenshot({ path: shot1 });
  console.log(`Saved screenshot 1 to: ${shot1}`);

  // 3. Test Switching Tabs to verify Authenticator and Passphrase methods remain intact
  console.log('Testing Authenticator Tab...');
  await page.click('#tab-btn-totp');
  await new Promise(r => setTimeout(r, 400));
  const shot2 = path.join(ARTIFACT_DIR, 'backstage_live_authenticator_intact.png');
  await page.screenshot({ path: shot2 });
  console.log(`Saved screenshot 2 to: ${shot2}`);

  console.log('Testing Passphrase Tab...');
  await page.click('#tab-btn-password');
  await new Promise(r => setTimeout(r, 400));
  const shot3 = path.join(ARTIFACT_DIR, 'backstage_live_passphrase_intact.png');
  await page.screenshot({ path: shot3 });
  console.log(`Saved screenshot 3 to: ${shot3}`);

  // Switch back to Gmail OTP tab
  await page.click('#tab-btn-otp');
  await new Promise(r => setTimeout(r, 400));

  await browser.close();
  console.log('Live browser verification finished successfully.');
}

runLiveBrowserTest().catch(err => {
  console.error('Browser test failed:', err);
  process.exit(1);
});
