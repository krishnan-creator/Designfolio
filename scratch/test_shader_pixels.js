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

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.applyTheme('light'));
  await new Promise(r => setTimeout(r, 600));

  const result = await page.evaluate(() => {
    const bgMount = document.getElementById('post-hero-bg-mount');
    const canvas = bgMount ? bgMount.querySelector('canvas') : null;
    if (!canvas) return 'No canvas found';

    // Check if raf loop is running and what uniforms are set
    // Let's hook a requestAnimationFrame and readPixels right after render
    return new Promise(resolve => {
      let frames = 0;
      function checkFrame() {
        frames++;
        if (frames > 5) {
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          const pixels = new Uint8Array(4);
          // Let's sample a few points
          const samples = [];
          for (let y = 100; y < canvas.height; y += 200) {
            for (let x = 100; x < canvas.width; x += 400) {
              gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
              samples.push({ x, y, rgba: Array.from(pixels) });
            }
          }
          resolve({
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            samples
          });
        } else {
          requestAnimationFrame(checkFrame);
        }
      }
      requestAnimationFrame(checkFrame);
    });
  });

  console.log('Shader render output test:', JSON.stringify(result, null, 2));
  await browser.close();
}

test();
