const puppeteer = require('puppeteer-core');
const fs = require('fs');

function getBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

(async () => {
  console.log('Testing Responsive Viewports on Visual Orbit...');
  const exePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: exePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const viewports = [
    { name: 'Desktop (1600x1000)', width: 1600, height: 1000 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Mobile (375x812)', width: 375, height: 812 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const check = await page.evaluate(() => {
      const root = document.querySelector('.sphere-root');
      const stage = document.querySelector('.stage');
      const container = document.querySelector('.visual-orbit-container');
      const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
      const radius = root ? root.style.getPropertyValue('--radius') : '';
      return {
        hasRoot: !!root,
        hasStage: !!stage,
        hasContainer: !!container,
        hasHorizontalOverflow,
        radius,
        width: root ? root.offsetWidth : 0,
        height: root ? root.offsetHeight : 0
      };
    });

    console.log(`[${vp.name}]:`, check);
    if (check.hasHorizontalOverflow) {
      console.error(`❌ Overflow detected on ${vp.name}!`);
    } else {
      console.log(`✅ ${vp.name} passed: No horizontal page overflow, radius: ${check.radius}, dimensions: ${check.width}x${check.height}`);
    }
  }

  await browser.close();
  console.log('Responsive testing complete!');
})();
