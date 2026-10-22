const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ROOT_DIR = path.resolve(__dirname, '..');

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const screenshotPath = path.join(ROOT_DIR, 'scratch', 'backstage_setup_screen.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Setup screen screenshot saved to:', screenshotPath);

  const title = await page.$eval('#auth-title', el => el.textContent);
  const button = await page.$eval('#auth-submit-btn', el => el.textContent);
  const isConfirmVisible = await page.$eval('#group-confirm', el => window.getComputedStyle(el).display !== 'none');
  console.log('UI Verification: title =', title, ', button =', button, ', confirm input visible =', isConfirmVisible);

  await browser.close();
}

capture().catch(console.error);
