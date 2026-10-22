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

  const result = await page.evaluate(() => {
    const tile = document.querySelector('.number-tile');
    const matched = [];
    const sheet = document.styleSheets[2];
    for (let rIdx = 0; rIdx < sheet.cssRules.length; rIdx++) {
      const rule = sheet.cssRules[rIdx];
      if (rule.selectorText && tile.matches(rule.selectorText)) {
        matched.push({
          rIdx,
          selector: rule.selectorText,
          cssText: rule.cssText
        });
      }
    }
    return matched;
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
