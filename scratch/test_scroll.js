const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  const res = await page.evaluate(() => {
    const before = window.scrollY;
    window.scrollTo(0, 2000);
    const after = window.scrollY;
    return { before, after };
  });
  console.log('Scroll test:', res);
  await browser.close();
})();
