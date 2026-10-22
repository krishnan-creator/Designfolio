const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });

  const isOverlayVisible = await page.evaluate(() => {
    const el = document.getElementById('auth-overlay');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  console.log('auth overlay visible initially:', isOverlayVisible);

  if (isOverlayVisible) {
    await page.type('#auth-password', 'cbk2026');
    await page.click('#auth-submit-btn');
    await new Promise(r => setTimeout(r, 1500));
  }
  const isOverlayVisibleAfter = await page.evaluate(() => {
    const el = document.getElementById('auth-overlay');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  console.log('auth overlay visible after login:', isOverlayVisibleAfter);

  // Select Visual Orbit
  await page.evaluate(() => window.selectSection('sec-visual-orbit'));
  await new Promise(r => setTimeout(r, 600));
  const orbitCount = await page.evaluate(() => document.querySelectorAll('#props-container .orbit-slot-card').length);
  console.log('Orbit cards found in #props-container:', orbitCount);

  // Select Hobbies
  await page.evaluate(() => window.selectSection('sub-hobbies'));
  await new Promise(r => setTimeout(r, 600));
  const hobbyCount = await page.evaluate(() => document.querySelectorAll('#props-container .orbit-slot-card[data-hobby-slot]').length);
  console.log('Hobby cards found in #props-container:', hobbyCount);

  await browser.close();
})();
