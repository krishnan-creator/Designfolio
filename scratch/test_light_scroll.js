const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    window.applyTheme('light');
  });
  await new Promise(r => setTimeout(r, 1000));

  // Scroll to By The Numbers
  await page.evaluate(() => {
    const el = document.getElementById('by-the-numbers');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 1000));

  const scrollState = await page.evaluate(() => {
    const bgMount = document.getElementById('post-hero-bg-mount');
    const hero = document.getElementById('hero-section');
    const heroBottomVar = document.documentElement.style.getPropertyValue('--hero-bottom-px');
    const canvas = bgMount ? bgMount.querySelector('canvas') : null;
    return {
      scrollY: window.scrollY,
      heroRect: hero ? hero.getBoundingClientRect() : null,
      heroBottomVar,
      clipPath: bgMount ? window.getComputedStyle(bgMount).clipPath : null,
      canvasWidth: canvas ? canvas.width : 0,
      canvasHeight: canvas ? canvas.height : 0,
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      sectionBg: window.getComputedStyle(document.getElementById('by-the-numbers')).backgroundColor
    };
  });
  console.log('Scroll State:', JSON.stringify(scrollState, null, 2));

  // Capture screenshot of light waves
  await page.screenshot({ path: 'scratch/test_light_waves_scroll.png' });
  console.log('Screenshot saved to scratch/test_light_waves_scroll.png');

  await browser.close();
})();
