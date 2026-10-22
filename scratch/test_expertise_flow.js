const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

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
  
  await page.type('#auth-password', 'cbk2026');
  await page.click('#auth-submit-btn');
  
  await page.waitForFunction(() => {
    const overlay = document.getElementById('auth-overlay');
    return overlay && overlay.style.display === 'none';
  }, { timeout: 5000 });
  
  await new Promise(r => setTimeout(r, 500));

  // Select sec-expertise
  await page.evaluate(() => selectSection('sec-expertise'));
  await new Promise(r => setTimeout(r, 400));

  // Find pick buttons in sec-expertise
  const pickButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#props-container .media-btn-pick')).map(b => b.getAttribute('onclick'));
  });
  console.log('Pick buttons in sec-expertise:', pickButtons);

  // Click the first pick button (DNEG Spotlight 1)
  await page.evaluate(() => {
    const btn = document.querySelector('#props-container .media-btn-pick');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Select an asset: 'portrait-04.jpg'
  await page.evaluate(() => {
    selectMediaAsset('portrait-04.jpg');
  });
  await new Promise(r => setTimeout(r, 300));

  // Check draft
  const draftVal = await page.evaluate(() => {
    const sec = findSectionOrChild('sec-expertise');
    return sec?.content?.companies?.[0]?.mediaSlots?.[0]?.image;
  });
  console.log('Draft value in My Expertise after pick:', draftVal);

  // Click Save
  await page.evaluate(() => handleSaveClick());
  await new Promise(r => setTimeout(r, 2000));

  const savedContent = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
  const savedExp = savedContent.sections.find(s => s.id === 'sec-expertise');
  console.log('Disk value in My Expertise:', savedExp.content.companies[0].mediaSlots[0].image);

  // Check public site
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const publicImages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#exp-dneg .expertise-media-row img')).map(img => img.getAttribute('src'));
  });
  console.log('Public site rendered images for DNEG in My Expertise:', publicImages);

  await browser.close();
})();
