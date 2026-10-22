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

  const before = await page.evaluate(() => {
    const tile = document.querySelector('.number-tile');
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      bg: window.getComputedStyle(tile).backgroundColor
    };
  });
  console.log('Before applyTheme:', before);

  await page.evaluate(() => window.applyTheme('light'));

  const after = await page.evaluate(() => {
    const tile = document.querySelector('.number-tile');
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      bg: window.getComputedStyle(tile).backgroundColor,
      cssBackground: tile.style.background,
      matchesLight: tile.matches('[data-theme="light"] .number-tile')
    };
  });
  console.log('After applyTheme("light"):', after);

  await browser.close();
})();
