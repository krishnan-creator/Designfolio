const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testIdCard() {
  console.log('Testing ID Card Front and Back rendering & rotation in 3D...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // Scroll to THE CORE
  await page.evaluate(() => {
    const core = document.querySelector('.lanyard-glass-panel-wrapper');
    if (core) core.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const visualBox = await page.evaluate(() => {
    const el = document.querySelector('.lanyard-profile-section__visual canvas');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height };
  });

  console.log('Canvas location:', visualBox);

  // Take screenshot of FRONT
  const frontScreenshot = path.join(__dirname, 'id_card_front.png');
  const canvasEl = await page.$('.lanyard-profile-section__visual canvas');
  if (canvasEl) {
    await canvasEl.screenshot({ path: frontScreenshot });
    console.log('Saved front screenshot:', frontScreenshot);
  }

  // Drag horizontally to spin the card around 180 degrees
  console.log('Dragging card horizontally across canvas to spin to back face...');
  await page.mouse.move(visualBox.x, visualBox.y);
  await page.mouse.down();
  // Drag right and slightly up to spin
  for (let i = 0; i <= 25; i++) {
    await page.mouse.move(visualBox.x + i * 14, visualBox.y - i * 2);
    await new Promise(r => setTimeout(r, 20));
  }
  await page.mouse.up();

  // Wait for card physics to turn and settle
  await new Promise(r => setTimeout(r, 800));

  const backScreenshot = path.join(__dirname, 'id_card_back.png');
  if (canvasEl) {
    await canvasEl.screenshot({ path: backScreenshot });
    console.log('Saved back screenshot:', backScreenshot);
  }

  await browser.close();
  console.log('ID Card rotation test finished!');
}

testIdCard().catch(console.error);
