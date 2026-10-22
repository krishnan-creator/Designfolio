const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Handle auth
  const isAuth = await page.evaluate(() => {
    const el = document.getElementById('auth-overlay');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  if (isAuth) {
    console.log('Authenticating...');
    await page.type('#auth-password', 'cbk2026');
    await page.click('#auth-submit-btn');
    await new Promise(r => setTimeout(r, 1500));
  }

  // Select Visual Orbit
  await page.evaluate(() => window.selectSection('sec-visual-orbit'));
  await new Promise(r => setTimeout(r, 800));

  // Verify all 48 cards in Backstage
  const cardCount = await page.evaluate(() => {
    return document.querySelectorAll('#props-container .orbit-slot-card').length;
  });
  console.log(`Backstage total slot cards: ${cardCount} (Expected: 48)`);

  // Verify Slot 48 (index 47) exists and is editable
  const slot48Info = await page.evaluate(() => {
    const card48 = document.querySelector('.orbit-slot-card[data-slot="47"]');
    if (!card48) return null;
    const num = card48.querySelector('.orbit-slot-number')?.textContent.trim();
    const isPopulated = card48.classList.contains('populated');
    const isEmpty = card48.classList.contains('empty');
    return { num, isPopulated, isEmpty };
  });
  console.log('Backstage Slot 48 info:', slot48Info);

  // Test modifying Slot 48 alt text in currentDraft and saving
  const testAlt = 'Test Alt Slot 48 Verified CMS Flow';
  const saveResult = await page.evaluate(async (alt) => {
    const sec = window.findSectionOrChild ? window.findSectionOrChild('sec-visual-orbit') : null;
    if (!sec || !sec.content || !sec.content.slots) return { success: false, error: 'slots missing' };
    sec.content.slots[47].alt = alt;
    sec.content.slots[47].title = 'Slot 48 Custom Title';
    const resp = await fetch('/api/content/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {})
      },
      body: JSON.stringify(window.currentDraft)
    });
    return await resp.json();
  }, testAlt);
  console.log('Backstage Save Result:', saveResult);

  // Reload page to verify persistence from server
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const isAuthAfter = await page.evaluate(() => {
    const el = document.getElementById('auth-overlay');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  if (isAuthAfter) {
    await page.type('#auth-password', 'cbk2026');
    await page.click('#auth-submit-btn');
    await new Promise(r => setTimeout(r, 1500));
  }

  await page.evaluate(() => window.selectSection('sec-visual-orbit'));
  await new Promise(r => setTimeout(r, 800));

  const persistedSlot48 = await page.evaluate(() => {
    const sec = window.findSectionOrChild ? window.findSectionOrChild('sec-visual-orbit') : null;
    return sec ? sec.content.slots[47] : null;
  });
  console.log('Persisted Slot 48 on reload:', persistedSlot48?.alt === testAlt ? 'PASS' : 'FAIL', persistedSlot48);

  // Reset Slot 48 alt back to clean state
  await page.evaluate(async () => {
    const sec = window.findSectionOrChild ? window.findSectionOrChild('sec-visual-orbit') : null;
    if (sec && sec.content && sec.content.slots) {
      sec.content.slots[47].alt = '';
      sec.content.slots[47].title = 'Slot 48';
      await fetch('/api/content/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {})
        },
        body: JSON.stringify(window.currentDraft)
      });
    }
  });

  await browser.close();
  console.log('=== BACKSTAGE CMS 48-SLOT TEST COMPLETE ===');
})();
