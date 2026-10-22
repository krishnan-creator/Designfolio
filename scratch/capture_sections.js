const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Screenshot Visual Orbit
  const orbitEl = await page.$('#visual-orbit');
  if (orbitEl) {
    await orbitEl.screenshot({ path: 'scratch/public_visual_orbit.png' });
    console.log('Captured scratch/public_visual_orbit.png');
  }

  // Screenshot Hobbies
  const hobbiesEl = await page.$('#hobbies-archive');
  if (hobbiesEl) {
    await hobbiesEl.screenshot({ path: 'scratch/public_hobbies.png' });
    console.log('Captured scratch/public_hobbies.png');
  }

  // Screenshot CTA
  const ctaEl = await page.$('#lets-build');
  if (ctaEl) {
    await ctaEl.screenshot({ path: 'scratch/public_cta.png' });
    console.log('Captured scratch/public_cta.png');
  }

  await browser.close();
})();
