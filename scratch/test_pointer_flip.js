const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/');
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const core = document.querySelector('.lanyard-glass-panel-wrapper');
    if (core) core.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 800));

  // Let's inspect the cardGroup and Three.js scene from inside window if possible or dispatch pointer events
  const flipStatus = await page.evaluate(async () => {
    const canvas = document.querySelector('.lanyard-profile-section__visual canvas');
    if (!canvas) return { error: 'no canvas' };
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    // The card hangs around y = rect.top + rect.height * 0.55
    const cy = rect.top + rect.height * 0.55;

    canvas.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: cx,
      clientY: cy,
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
      bubbles: true,
      cancelable: true
    }));

    await new Promise(r => setTimeout(r, 80));

    canvas.dispatchEvent(new PointerEvent('pointerup', {
      clientX: cx,
      clientY: cy,
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
      bubbles: true,
      cancelable: true
    }));

    return { success: true, cx, cy };
  });

  console.log('Dispatched flip click:', flipStatus);
  await new Promise(r => setTimeout(r, 1400));

  const canvasEl = await page.$('.lanyard-profile-section__visual canvas');
  const outPath = path.join(__dirname, 'test_pointer_flip.png');
  await canvasEl.screenshot({ path: outPath });
  console.log('Saved:', outPath);

  await browser.close();
}

run().catch(console.error);
