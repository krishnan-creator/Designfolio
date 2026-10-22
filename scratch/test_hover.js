const puppeteer = require('puppeteer-core');
(async() => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    window.updateVisualOrbitImages([{ id: 'orbit-04', slotNumber: '04', src: 'portrait-01.png', alt: 'Test' }]);
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const el = document.querySelector('.sphere-root .item[data-slot-id="orbit-04"] .item__image');
    if (el) el.focus();
  });
  await new Promise(r => setTimeout(r, 300));

  const focusRes = await page.evaluate(() => {
    const el = document.querySelector('.sphere-root .item[data-slot-id="orbit-04"] .item__image');
    const s = window.getComputedStyle(el);
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      border: s.border,
      borderColor: s.borderColor,
      borderWidth: s.borderWidth,
      boxShadow: s.boxShadow,
      transform: s.transform
    };
  });
  console.log('Light theme focus result orbit-04:', focusRes);

  await browser.close();
})();
