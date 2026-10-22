const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--window-size=1600,1000', '--no-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  const initialOverlay = await page.$eval('#auth-overlay', el => el.style.display);
  console.log('Initial auth overlay display:', initialOverlay);

  await page.type('#auth-password', 'cbk2026');
  console.log('Typed password');

  await page.evaluate(() => {
    document.getElementById('auth-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });

  await new Promise(r => setTimeout(r, 2000));

  const afterOverlay = await page.$eval('#auth-overlay', el => el.style.display);
  console.log('After submit auth overlay display:', afterOverlay);

  const treeItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.tree-item')).map(el => el.textContent.trim());
  });
  console.log('Tree items in backstage:', treeItems);

  await browser.close();
})();
