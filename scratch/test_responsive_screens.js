const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'tablet_1024', width: 1024, height: 800 },
    { name: 'mobile_480', width: 480, height: 850 }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#dome-gallery-mount .item', { timeout: 8000 });

    await page.evaluate(() => {
      document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 1000));

    const metrics = await page.evaluate(() => {
      const root = document.querySelector('#dome-gallery-mount .sphere-root');
      const container = document.querySelector('.visual-orbit-container');
      const items = Array.from(document.querySelectorAll('#dome-gallery-mount .item'));

      const cRect = container.getBoundingClientRect();
      let minTop = Infinity, maxBottom = -Infinity;
      items.forEach(it => {
        const wrap = it.querySelector('.item__image') || it;
        const b = wrap.getBoundingClientRect();
        if (b.top < minTop) minTop = b.top;
        if (b.bottom > maxBottom) maxBottom = b.bottom;
      });

      return {
        containerHeight: cRect.height,
        minTop: minTop - cRect.top,
        maxBottom: cRect.bottom - maxBottom,
        radius: root.style.getPropertyValue('--radius'),
        itemWidth: root.style.getPropertyValue('--item-width'),
        itemHeight: root.style.getPropertyValue('--item-height')
      };
    });

    console.log(`Viewport ${vp.name} (${vp.width}x${vp.height}):`);
    console.log(`  Radius: ${metrics.radius}, Item: ${metrics.itemWidth} x ${metrics.itemHeight}`);
    console.log(`  Top clearance: ${metrics.minTop.toFixed(1)}px, Bottom clearance: ${metrics.maxBottom.toFixed(1)}px`);
    console.log(`  Zero clipping: ${metrics.minTop >= 0 && metrics.maxBottom >= 0}`);

    const sec = await page.$('#visual-orbit');
    await sec.screenshot({ path: path.join(__dirname, `orbit_${vp.name}.png`) });
    await page.close();
  }

  await browser.close();
})();
