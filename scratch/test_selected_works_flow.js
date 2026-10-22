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
  
  // Fill passphrase
  await page.type('#auth-password', 'cbk2026');
  await page.click('#auth-submit-btn');
  
  await page.waitForFunction(() => {
    const overlay = document.getElementById('auth-overlay');
    return overlay && overlay.style.display === 'none';
  }, { timeout: 5000 });
  
  await new Promise(r => setTimeout(r, 500));

  // Select sec-selected-works
  await page.evaluate(() => selectSection('sec-selected-works'));
  await new Promise(r => setTimeout(r, 300));

  // Click CHOOSE ASSET on first project
  await page.evaluate(() => {
    const btn = document.querySelector('.media-btn-pick');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Check if media modal opened and select 'landscape-01.jpg'
  const modalActive = await page.evaluate(() => {
    return document.getElementById('media-modal')?.classList.contains('active');
  });
  console.log('Media modal active:', modalActive);

  // Select asset 'landscape-01.jpg'
  await page.evaluate(() => {
    selectMediaAsset('landscape-01.jpg');
  });
  await new Promise(r => setTimeout(r, 300));

  // Check draft in Backstage
  const draftImage = await page.evaluate(() => {
    const sec = findSectionOrChild('sec-selected-works');
    return sec?.content?.landscapeProjects?.[0]?.image;
  });
  console.log('Draft updated image in Backstage:', draftImage);

  // Click SAVE in Backstage
  await page.evaluate(() => handleSaveClick());
  await new Promise(r => setTimeout(r, 2000));

  // Now check data/content.json on disk!
  const savedContent = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
  const savedSw = savedContent.sections.find(s => s.id === 'sec-selected-works');
  console.log('Saved image on disk:', savedSw.content.landscapeProjects[0].image);

  // Now open public site
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const publicImage = await page.evaluate(() => {
    const img = document.querySelector('#works-row-1 .works-media-wrap img');
    return img ? img.getAttribute('src') : null;
  });
  console.log('Public site rendered image:', publicImage);

  await browser.close();
})();
