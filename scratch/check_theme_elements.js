const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  await page.evaluate(() => window.applyTheme('light'));

  const info = await page.evaluate(() => {
    const darkElements = Array.from(document.querySelectorAll('[data-theme="dark"]')).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className
    }));
    const lightElements = Array.from(document.querySelectorAll('[data-theme="light"]')).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className
    }));
    const tile = document.querySelector('.number-tile');
    return {
      darkElements,
      lightElements,
      tileMatchedDark: tile.matches('[data-theme="dark"] .number-tile'),
      tileMatchedLight: tile.matches('[data-theme="light"] .number-tile'),
      tileBg: window.getComputedStyle(tile).backgroundColor
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
