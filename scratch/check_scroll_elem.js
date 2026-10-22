const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  const info = await page.evaluate(() => {
    return {
      windowScrollY: window.scrollY,
      docScrollTop: document.documentElement.scrollTop,
      bodyScrollTop: document.body.scrollTop,
      htmlOverflow: window.getComputedStyle(document.documentElement).overflowY,
      bodyOverflow: window.getComputedStyle(document.body).overflowY,
      docHeight: document.documentElement.scrollHeight
    };
  });
  console.log('Scroll info:', info);
  await browser.close();
})();
