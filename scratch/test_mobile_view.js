const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Hero name on mobile
  await page.screenshot({ path: 'scratch/verify_mobile_hero.png' });
  console.log('Saved: scratch/verify_mobile_hero.png');

  // Scroll to Beyond The Frame on mobile
  await page.evaluate(() => {
    const el = document.getElementById('beyond-the-frame-zone');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: 'scratch/verify_mobile_beyond_frame.png' });
  console.log('Saved: scratch/verify_mobile_beyond_frame.png');

  // Scroll into the stack
  await page.evaluate(() => window.scrollBy(0, 260));
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: 'scratch/verify_mobile_beyond_frame_scrolled.png' });
  console.log('Saved: scratch/verify_mobile_beyond_frame_scrolled.png');

  await browser.close();
  console.log('Mobile verification complete!');
})();
