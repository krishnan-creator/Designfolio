const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE_PATH, headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  const authNeeded = await page.$eval('#auth-overlay', el => window.getComputedStyle(el).display !== 'none');
  if (authNeeded) {
    const isSetup = await page.$eval('#auth-title', el => el.textContent.includes('SETUP'));
    if (isSetup) {
      await page.type('#auth-password', 'CbkMasterAdmin2026!');
      await page.type('#auth-confirm', 'CbkMasterAdmin2026!');
    } else {
      await page.type('#auth-password', 'CbkMasterAdmin2026!');
    }
    await page.click('#auth-submit-btn');
    await new Promise(r => setTimeout(r, 800));
  }

  await page.click('.tree-item[onclick*="sec-visual-orbit"]');
  await new Promise(r => setTimeout(r, 500));

  const debugInfo = await page.evaluate(() => {
    const sec = findSectionOrChild('sec-visual-orbit');
    const pubSec = publishedData?.sections?.find(s => s.id === 'sec-visual-orbit');
    
    const beforeStatus = getOrbitSlotStatus(sec, 0);
    // Call updateOrbitImageAlt
    updateOrbitImageAlt('sec-visual-orbit', 0, 'new test alt');
    const afterStatus = getOrbitSlotStatus(sec, 0);
    const tagText = document.querySelector('#props-container .orbit-slot-card[data-slot="0"] .orbit-status-tag')?.textContent;

    return {
      beforeStatus,
      afterStatus,
      tagText,
      secImg0: sec?.content?.images?.[0],
      pubImg0: pubSec?.content?.images?.[0]
    };
  });
  console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
  await browser.close();
})();
