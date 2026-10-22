const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\meet2\\.gemini\\antigravity-ide\\brain\\346f158f-44e4-49fe-8598-17f344b038d1';

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Dark Mode Header
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'header_dark_mode.png'),
    clip: { x: 0, y: 0, width: 1440, height: 120 }
  });
  console.log('Captured header_dark_mode.png');

  // 2. Light Mode Header
  await page.click('#theme-toggle');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'header_light_mode.png'),
    clip: { x: 0, y: 0, width: 1440, height: 120 }
  });
  console.log('Captured header_light_mode.png');

  // 3. Backstage OTP Authentication Overlay
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'backstage_otp_auth.png'),
    fullPage: false
  });
  console.log('Captured backstage_otp_auth.png');

  await browser.close();
}

captureScreenshots().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
