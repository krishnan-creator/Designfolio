const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--window-size=1600,1000', '--no-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  const state = await page.evaluate(() => {
    return {
      hasMount: !!document.getElementById('dome-gallery-mount'),
      hasMountFunc: typeof window.mountDomeGallery,
      hasInstance: !!window.domeGalleryInstance,
      customImages: window.__visualOrbitCustomImages ? window.__visualOrbitCustomImages.length : 0,
      mountHTMLSnippet: document.getElementById('dome-gallery-mount')?.innerHTML?.slice(0, 300),
      itemsCount: document.querySelectorAll('#dome-gallery-mount .item').length
    };
  });

  console.log('Page State:', JSON.stringify(state, null, 2));

  await browser.close();
})();
