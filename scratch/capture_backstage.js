const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Check auth overlay
  const hasOverlay = await page.evaluate(() => {
    const el = document.getElementById('auth-overlay');
    return el && window.getComputedStyle(el).display !== 'none';
  });

  if (hasOverlay) {
    await page.type('#auth-password', 'cbk2026');
    await page.click('#auth-submit-btn');
    await new Promise(r => setTimeout(r, 1500));
  }

  // Select Visual Orbit
  await page.evaluate(() => window.selectSection('sec-visual-orbit'));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/backstage_visual_orbit.png' });
  console.log('Captured scratch/backstage_visual_orbit.png');

  // Select Hobbies
  await page.evaluate(() => window.selectSection('sub-hobbies'));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/backstage_hobbies.png' });
  console.log('Captured scratch/backstage_hobbies.png');

  await browser.close();
})();
