const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE_PATH, headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));
  const ctaBtnText = await page.$eval('.build-btn-primary', el => el.textContent.trim());
  const ctaBtnHref = await page.$eval('.build-btn-primary', el => el.getAttribute('href'));
  console.log('CTA Button text:', ctaBtnText);
  console.log('CTA Button href:', ctaBtnHref);
  await browser.close();
})();
