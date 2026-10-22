const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  // Switch to light theme
  await page.evaluate(() => window.applyTheme('light'));
  await new Promise(r => setTimeout(r, 1000));

  // Scroll to post-hero
  await page.evaluate(() => window.scrollTo(0, 1200));
  await new Promise(r => setTimeout(r, 600));

  const info = await page.evaluate(() => {
    const bgMount = document.getElementById('post-hero-bg-mount');
    const canvas = bgMount ? bgMount.querySelector('canvas') : null;
    const rect = bgMount ? bgMount.getBoundingClientRect() : null;
    const canvasRect = canvas ? canvas.getBoundingClientRect() : null;
    const clipPath = bgMount ? window.getComputedStyle(bgMount).clipPath : null;
    const heroBottom = getComputedStyle(document.documentElement).getPropertyValue('--hero-bottom-px');

    let pixelSample = null;
    if (canvas) {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const pixels = new Uint8Array(4);
        gl.readPixels(canvas.width / 2, canvas.height / 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        pixelSample = Array.from(pixels);
      }
    }

    return {
      bgMountRect: rect ? { width: rect.width, height: rect.height, top: rect.top } : null,
      canvasRect: canvasRect ? { width: canvasRect.width, height: canvasRect.height, top: canvasRect.top } : null,
      canvasBuf: canvas ? { width: canvas.width, height: canvas.height } : null,
      clipPath,
      heroBottom,
      pixelSample
    };
  });

  console.log('Light theme background inspection:', info);
  await browser.close();
}

test();
