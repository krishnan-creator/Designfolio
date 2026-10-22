const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  console.log('Page loaded');

  const trigger = await page.$('#backstage-trigger');
  console.log('Found trigger:', !!trigger);

  for (let i = 0; i < 5; i++) {
    await trigger.click();
    await new Promise(r => setTimeout(r, 120));
  }

  await new Promise(r => setTimeout(r, 600));
  console.log('Current URL after 5 clicks:', page.url());
  await browser.close();
})();
