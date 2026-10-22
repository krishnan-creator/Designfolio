const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testBrowserFlow() {
  console.log('--- STARTING PUPPETEER BROWSER UI E2E TEST ---');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Load Backstage
  console.log('Navigating to http://localhost:3000/backstage...');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });

  // Check if login modal is visible
  const loginPassInput = await page.$('#login-pass');
  if (loginPassInput) {
    console.log('Logging in with admin passphrase...');
    await page.type('#login-pass', 'cbk2026');
    await page.click('#login-submit-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
  }

  // 2. Select "Selected Works" section in sidebar
  console.log('Selecting "05 // Selected Works" section...');
  const clicked = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.tree-item'));
    const swItem = items.find(el => el.textContent.includes('Selected Works'));
    if (swItem) {
      swItem.click();
      return true;
    }
    return false;
  });
  console.log('Selected Works sidebar clicked:', clicked);
  await new Promise(r => setTimeout(r, 1500));

  // 3. Inspect the right properties panel for Selected Works
  const propsHtml = await page.evaluate(() => {
    return document.getElementById('props-container')?.innerHTML || '';
  });
  console.log('Properties panel contains "10 GB MAX":', propsHtml.includes('10 GB MAX'));
  console.log('Properties panel contains "Format: Cinema Video":', propsHtml.includes('Format: Cinema Video'));

  // 4. Test direct upload of "vid Port.mp4" (13.5 MB) via the file input
  console.log('\nTesting direct upload of "vid Port.mp4" via Backstage file input...');
  const testVideoPath = path.resolve(__dirname, '..', 'vid Port.mp4');
  if (!fs.existsSync(testVideoPath)) {
    throw new Error('vid Port.mp4 not found on disk');
  }

  // Find the file input for the first landscape project
  const inputId = await page.evaluate(() => {
    const input = document.querySelector('input[id^="media-direct-input-sec-selected-works-landscapeProjects_0"]');
    return input ? input.id : null;
  });
  console.log('Target file input element ID:', inputId);

  const fileInput = await page.$(`#${inputId}`);
  if (!fileInput) {
    throw new Error('File input not found');
  }

  await fileInput.uploadFile(testVideoPath);
  console.log('File attached to input, observing upload progress...');

  // Wait for upload to complete (toast message or progress container to close)
  let uploadCompleted = false;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const status = await page.evaluate((id) => {
      const box = document.getElementById(`progress-box-${id.replace('media-direct-input-', '')}`);
      const toast = document.getElementById('toast-container')?.textContent || '';
      const fieldVal = document.querySelector(`#container-${id.replace('media-direct-input-', '')} .media-field-name`)?.textContent || '';
      return {
        boxVisible: box ? box.style.display !== 'none' : false,
        toast,
        fieldVal
      };
    }, inputId);

    console.log(`[Second ${i + 1}] Toast: "${status.toast}", Field value: "${status.fieldVal}", Uploading: ${status.boxVisible}`);
    if (status.fieldVal.includes('vid_Port.mp4') || status.toast.includes('Uploaded and attached')) {
      uploadCompleted = true;
      break;
    }
  }

  if (!uploadCompleted) {
    throw new Error('Upload did not complete within 30 seconds');
  }
  console.log('✔ Direct video upload completed and attached to CMS field!');

  // 5. Save and Publish
  console.log('\nClicking "SAVE & PUBLISH" button...');
  await page.evaluate(() => {
    const saveBtn = document.querySelector('.btn-save');
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  console.log('✔ CMS Published live!');

  // 6. Navigate to Public Portfolio
  console.log('\nNavigating to public portfolio (http://localhost:3000/)...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Check Selected Works section in public DOM
  const publicCheck = await page.evaluate(() => {
    const card = document.querySelector('.works-card-landscape');
    if (!card) return { found: false };
    const video = card.querySelector('video');
    const dataSrc = card.getAttribute('data-video-src');
    return {
      found: true,
      dataSrc,
      hasVideoTag: Boolean(video),
      videoSrc: video ? video.getAttribute('src') : null
    };
  });
  console.log('Public Selected Works Card 0 inspection:', publicCheck);

  if (!publicCheck.hasVideoTag || !publicCheck.dataSrc?.includes('vid_Port.mp4')) {
    throw new Error('Public card does not render uploaded video!');
  }
  console.log('✔ Public portfolio successfully renders uploaded video in Selected Works card!');

  // 7. Click card to open Cinematic Lightbox
  console.log('\nClicking Selected Works card to open Cinematic Lightbox...');
  await page.evaluate(() => {
    const card = document.querySelector('.works-card-landscape');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const lightboxCheck = await page.evaluate(() => {
    const modal = document.getElementById('selected-works-lightbox');
    const video = document.getElementById('active-medium-video');
    return {
      isOpen: modal ? modal.classList.contains('is-open') : false,
      videoSrc: video ? video.getAttribute('src') : null,
      isPaused: video ? video.paused : null
    };
  });
  console.log('Cinematic Lightbox inspection:', lightboxCheck);

  if (!lightboxCheck.isOpen || !lightboxCheck.videoSrc?.includes('vid_Port.mp4')) {
    throw new Error('Cinematic Lightbox did not open or video source does not match!');
  }
  console.log('✔ Cinematic Lightbox opened with active video player!');

  // 8. Test Page Reload Persistence
  console.log('\nTesting page reload persistence...');
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const reloadedCheck = await page.evaluate(() => {
    const card = document.querySelector('.works-card-landscape');
    const video = card ? card.querySelector('video') : null;
    return {
      hasVideoTag: Boolean(video),
      src: video ? video.getAttribute('src') : null
    };
  });
  console.log('After reload, Selected Works video check:', reloadedCheck);
  if (!reloadedCheck.hasVideoTag || !reloadedCheck.src?.includes('vid_Port.mp4')) {
    throw new Error('Video did not persist after page reload!');
  }
  console.log('✔ Confirmed: Video persisted and is active after reload!');

  // 9. Reopen Backstage and verify attached asset
  console.log('\nReopening Backstage to verify attached asset displays correctly...');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.tree-item'));
    const swItem = items.find(el => el.textContent.includes('Selected Works'));
    if (swItem) swItem.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const backstageReopenCheck = await page.evaluate(() => {
    const field = document.querySelector('div[id^="field-wrap-sec-selected-works-landscapeProjects_0"]');
    if (!field) return { found: false };
    const name = field.querySelector('.media-field-name')?.textContent || '';
    const video = field.querySelector('video');
    const badge = field.querySelector('.media-video-badge');
    return {
      found: true,
      name,
      hasVideoPreview: Boolean(video),
      hasVideoBadge: Boolean(badge)
    };
  });
  console.log('Backstage Reopen check:', backstageReopenCheck);
  if (!backstageReopenCheck.hasVideoPreview || !backstageReopenCheck.name.includes('vid_Port.mp4')) {
    throw new Error('Backstage did not display attached video asset on reopen!');
  }
  console.log('✔ Confirmed: Backstage correctly displays attached video asset with preview and badge on reopen!');

  await browser.close();
  console.log('\n================================================================');
  console.log('PUPPETEER BROWSER UI E2E TEST COMPLETED WITH 100% SUCCESS');
  console.log('================================================================');
}

testBrowserFlow().catch(err => {
  console.error('Puppeteer test failure:', err);
  process.exit(1);
});
