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

  // Select sec-selected-works
  await page.evaluate(() => selectSection('sec-selected-works'));
  await new Promise(r => setTimeout(r, 300));

  // Click CHOOSE ASSET on first project
  await page.evaluate(() => {
    const btn = document.querySelector('.media-btn-pick');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Create a dummy test image to upload
  const testImagePath = path.join(__dirname, 'test_upload_art.png');
  // Copy an existing 1x1 or test png
  fs.copyFileSync('card-front.png', testImagePath);

  // Upload file via file input in modal
  const fileInput = await page.$('#media-file-input');
  await fileInput.uploadFile(testImagePath);

  // Wait for upload to process
  await new Promise(r => setTimeout(r, 1500));

  // Check what happened to draft
  const draftVal = await page.evaluate(() => {
    const sec = findSectionOrChild('sec-selected-works');
    return sec?.content?.landscapeProjects?.[0]?.image;
  });
  console.log('Draft value after upload in Selected Works:', draftVal);

  // Check if save button works
  await page.evaluate(() => handleSaveClick());
  await new Promise(r => setTimeout(r, 2000));

  const savedContent = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
  const savedSw = savedContent.sections.find(s => s.id === 'sec-selected-works');
  console.log('Disk value after save in Selected Works:', savedSw.content.landscapeProjects[0].image);

  // Now check public site
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const publicImage = await page.evaluate(() => {
    const img = document.querySelector('#works-row-1 .works-media-wrap img');
    return img ? img.getAttribute('src') : null;
  });
  console.log('Public site rendered image after upload:', publicImage);

  // Clean up test file
  if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);

  await browser.close();
})();
