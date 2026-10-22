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
    for (let sIdx = 0; sIdx < document.styleSheets.length; sIdx++) {
      const sheet = document.styleSheets[sIdx];
      try {
        for (let rIdx = 0; rIdx < sheet.cssRules.length; rIdx++) {
          const rule = sheet.cssRules[rIdx];
          if (rule.selectorText && tile.matches(rule.selectorText)) {
            const bg = rule.style.getPropertyValue('background');
            const bgColor = rule.style.getPropertyValue('background-color');
            if (bg || bgColor) {
              matched.push({
                sIdx,
                rIdx,
                selector: rule.selectorText,
                bg,
                bgColor,
                bgPrio: rule.style.getPropertyPriority('background'),
                bgColorPrio: rule.style.getPropertyPriority('background-color')
              });
            }
          }
        }
      } catch (e) {}
    }
    return matched;
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
