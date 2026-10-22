const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  page.on('pageerror', err => consoleLogs.push('PAGE_ERR: ' + err.message));

  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
  
  // Fill passphrase
  await page.type('#auth-password', 'cbk2026');
  await page.click('#auth-submit-btn');
  
  // Wait for auth overlay to hide
  await page.waitForFunction(() => {
    const overlay = document.getElementById('auth-overlay');
    return overlay && overlay.style.display === 'none';
  }, { timeout: 5000 });
  
  await new Promise(r => setTimeout(r, 1000));

  // Check state
  const state = await page.evaluate(() => {
    return {
      selectedId: window.selectedSectionId,
      hasDraft: !!window.currentDraft,
      sectionsCount: window.currentDraft?.sections?.length,
      sections: window.currentDraft?.sections?.map(s => ({ id: s.id, type: s.type, name: s.name }))
    };
  });
  console.log('State after login:', JSON.stringify(state, null, 2));

  // Switch to sec-beyond-frame
  await page.evaluate(() => selectSection('sec-beyond-frame'));
  await new Promise(r => setTimeout(r, 400));
  const btfData = await page.evaluate(() => {
    const container = document.getElementById('props-container');
    const pickButtons = Array.from(container.querySelectorAll('.media-btn-pick')).map(b => b.getAttribute('onclick'));
    return { pickButtons };
  });
  console.log('BTF Pick Buttons:', btfData);

  // Switch to sec-selected-works
  await page.evaluate(() => selectSection('sec-selected-works'));
  await new Promise(r => setTimeout(r, 400));
  const swData = await page.evaluate(() => {
    const container = document.getElementById('props-container');
    const pickButtons = Array.from(container.querySelectorAll('.media-btn-pick')).map(b => b.getAttribute('onclick'));
    return { pickButtons };
  });
  console.log('Selected Works Pick Buttons:', swData);

  // Switch to sec-expertise
  await page.evaluate(() => selectSection('sec-expertise'));
  await new Promise(r => setTimeout(r, 400));
  const expData = await page.evaluate(() => {
    const container = document.getElementById('props-container');
    const pickButtons = Array.from(container.querySelectorAll('.media-btn-pick')).map(b => b.getAttribute('onclick'));
    return { pickButtons };
  });
  console.log('My Expertise Pick Buttons:', expData);

  await browser.close();
})();
