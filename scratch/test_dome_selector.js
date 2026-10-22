const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--window-size=1600,1000', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  const count = await page.evaluate(() => {
    return {
      allSphereItems: document.querySelectorAll('#dome-gallery-mount .sphere .item').length,
      emptyItems: document.querySelectorAll('#dome-gallery-mount .sphere .item.item--empty').length,
      populatedItems: document.querySelectorAll('#dome-gallery-mount .sphere .item:not(.item--empty)').length,
      slotsPopulatedImages: Array.from(document.querySelectorAll('#dome-gallery-mount .sphere .item:not(.item--empty)')).map(it => {
        return {
          slotId: it.getAttribute('data-slot-id'),
          slotNum: it.getAttribute('data-slot-number'),
          imgSrc: it.querySelector('img')?.getAttribute('src')
        };
      })
    };
  });

  console.log('Dome selector result:', JSON.stringify(count, null, 2));

  await browser.close();
})();
