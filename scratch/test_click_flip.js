const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testFlip() {
  console.log('Testing card click-to-flip...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to THE CORE
  await page.evaluate(() => {
    const core = document.querySelector('.lanyard-glass-panel-wrapper');
    if (core) core.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1200));

  const canvasEl = await page.$('.lanyard-profile-section__visual canvas');
  const visualBox = await page.evaluate(() => {
    const el = document.querySelector('.lanyard-profile-section__visual canvas');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  console.log('Clicking on canvas at:', visualBox);
  // Quick click to trigger flip
  await page.mouse.click(visualBox.x, visualBox.y, { delay: 50 });

  // Wait for the card to spin 180 degrees
  console.log('Waiting for flip animation...');
  await new Promise(r => setTimeout(r, 1500));

  const backScreenshot = path.join(__dirname, 'id_card_flipped_back.png');
  await canvasEl.screenshot({ path: backScreenshot });
  console.log('Saved back face screenshot:', backScreenshot);

  await browser.close();
}

testFlip().catch(console.error);
