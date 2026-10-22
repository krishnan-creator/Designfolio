const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot at rest with clear counters
  await page.screenshot({ path: 'scratch/verify_hero_clear_counters.png' });
  console.log('Saved: scratch/verify_hero_clear_counters.png');

  // Find canvas rect
  const rect = await page.evaluate(() => {
    const el = document.getElementById('name-particle-canvas');
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  });

  // Real mouse movement through the letters
  await page.mouse.move(rect.x + 200, rect.y + 40);
  await new Promise(r => setTimeout(r, 60));
  await page.mouse.move(rect.x + 220, rect.y + 45);
  await new Promise(r => setTimeout(r, 60));

  // Screenshot during repulsion
  await page.screenshot({ path: 'scratch/verify_hero_repulsion_active.png' });
  console.log('Saved: scratch/verify_hero_repulsion_active.png');

  // Check particle displacements
  const disp = await page.evaluate(() => {
    let max = 0;
    for (let p of window.nameParticles || []) {
      const d = Math.hypot(p.x - p.homeX, p.y - p.homeY);
      if (d > max) max = d;
    }
    return max;
  });
  console.log('Active mouse repulsion displacement:', Math.round(disp * 10) / 10, 'px');

  await browser.close();
})();
