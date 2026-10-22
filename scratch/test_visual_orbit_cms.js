const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ROOT_DIR = path.resolve(__dirname, '..');
const delay = ms => new Promise(r => setTimeout(r, ms));

async function runVisualOrbitTest() {
  console.log('====================================================');
  console.log('TEST SUITE: BACKSTAGE CMS INTEGRATION FOR VISUAL ORBIT');
  console.log('====================================================\n');

  // Clean auth.json and draft file, sync content with backup
  const AUTH_FILE = path.join(ROOT_DIR, 'data', 'auth.json');
  if (fs.existsSync(AUTH_FILE)) fs.unlinkSync(AUTH_FILE);
  const DRAFT_FILE = path.join(ROOT_DIR, 'data', 'content-draft.json');
  if (fs.existsSync(DRAFT_FILE)) fs.unlinkSync(DRAFT_FILE);
  const BACKUP_FILE = path.join(ROOT_DIR, 'data', 'content.backup.json');
  const CONTENT_FILE = path.join(ROOT_DIR, 'data', 'content.json');
  if (fs.existsSync(BACKUP_FILE)) fs.copyFileSync(BACKUP_FILE, CONTENT_FILE);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Toast') || text.includes('Orbit') || text.includes('Error')) {
      console.log('  [Browser Log]:', text);
    }
  });

  // -------------------------------------------------------------
  // 1. ACCESS BACKSTAGE & AUTHENTICATE
  // -------------------------------------------------------------
  console.log('[STEP 1] Accessing Backstage and initializing session...');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
  await delay(800);

  const isOverlayVisible = await page.$eval('#auth-overlay', el => window.getComputedStyle(el).display !== 'none');
  if (!isOverlayVisible) throw new Error('Auth overlay should be visible');

  const titleText = await page.$eval('#auth-title', el => el.textContent.trim());
  const ADMIN_PASS = 'CbkMasterAdmin2026!';

  if (titleText.includes('SETUP')) {
    await page.type('#auth-password', ADMIN_PASS);
    await page.type('#auth-confirm', ADMIN_PASS);
    await page.click('#auth-submit-btn');
  } else {
    await page.$eval('#auth-password', el => el.value = '');
    await page.type('#auth-password', ADMIN_PASS);
    await page.click('#auth-submit-btn');
  }

  await page.waitForFunction(() => {
    const el = document.getElementById('auth-overlay');
    return !el || window.getComputedStyle(el).display === 'none';
  }, { timeout: 6000 });

  await page.waitForSelector('.tree-item[onclick*="sec-visual-orbit"]', { timeout: 8000 });
  console.log('  ✓ Authenticated and inside Backstage!\n');

  // -------------------------------------------------------------
  // 2. SELECT VISUAL ORBIT & INSPECT PANEL
  // -------------------------------------------------------------
  console.log('[STEP 2] Selecting Visual Orbit section in structure tree...');
  await page.click('.tree-item[onclick*="sec-visual-orbit"]');
  await delay(500);

  // Check panel title and subtitle
  const propsTitle = await page.$eval('#props-title', el => el.textContent.trim());
  console.log('  Props Header Title:', propsTitle);
  if (propsTitle !== 'VISUAL ORBIT') throw new Error(`Expected props title "VISUAL ORBIT", got "${propsTitle}"`);

  const orbitSubtitle = await page.$eval('.orbit-panel-subtitle', el => el.textContent.trim());
  console.log('  Panel Subtitle:', orbitSubtitle);
  if (!orbitSubtitle.includes('Manage the four source images used throughout the interactive image sphere')) {
    throw new Error('Subtitle text mismatch');
  }

  // Check exactly 4 slots in properties panel
  const slotCards = await page.$$('#props-container .orbit-slot-card');
  console.log('  Rendered slot cards count in panel:', slotCards.length);
  if (slotCards.length !== 4) throw new Error(`Expected exactly 4 source image slots, found ${slotCards.length}`);

  const slotBadges = await page.$$eval('#props-container .orbit-slot-badge', els => els.map(e => e.textContent.trim()));
  console.log('  Slot badges:', slotBadges);
  if (JSON.stringify(slotBadges) !== JSON.stringify(['IMAGE 01', 'IMAGE 02', 'IMAGE 03', 'IMAGE 04'])) {
    throw new Error('Slot badges do not match IMAGE 01 - 04');
  }

  const slotFilenames = await page.$$eval('#props-container .orbit-slot-filename', els => els.map(e => e.textContent.trim()));
  console.log('  Slot initial filenames:', slotFilenames);

  const slotStatuses = await page.$$eval('#props-container .orbit-status-tag', els => els.map(e => e.textContent.trim()));
  console.log('  Slot initial statuses:', slotStatuses);
  if (!slotStatuses.every(s => s === 'PUBLISHED')) {
    throw new Error('Initial slots should be marked as PUBLISHED');
  }
  console.log('  ✓ Verified Visual Orbit panel and exactly 4 unique image slots!\n');

  // Take screenshot of Visual Orbit editor panel
  const panelScreenshot = path.join(ROOT_DIR, 'scratch', 'visual_orbit_backstage_panel.png');
  await page.screenshot({ path: panelScreenshot });
  console.log('  Saved panel screenshot to:', panelScreenshot);

  // -------------------------------------------------------------
  // 3. EDIT ALT TEXT & VERIFY DRAFT STATUS
  // -------------------------------------------------------------
  console.log('\n[STEP 3] Testing Alt Text editing and Draft status tracking...');
  const altInputs = await page.$$('#props-container .orbit-slot-card input[oninput*="updateOrbitImageAlt"]');
  if (altInputs.length !== 4) throw new Error(`Expected 4 alt text inputs, got ${altInputs.length}`);

  const testAlt = 'Custom Alt Text — Mythic Concept Exploration';
  await page.evaluate((val) => {
    const inputs = document.querySelectorAll('#props-container .orbit-slot-card input[oninput*="updateOrbitImageAlt"]');
    inputs[0].value = val;
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
  }, testAlt);
  await delay(400);

  const updatedStatus0 = await page.$eval('#props-container .orbit-slot-card[data-slot="0"] .orbit-status-tag', el => el.textContent.trim());
  console.log('  Slot 0 status after alt edit:', updatedStatus0);
  if (updatedStatus0 !== 'DRAFT EDITED') throw new Error('Expected status DRAFT EDITED after edit');

  const globalStatus = await page.$eval('#status-text', el => el.textContent.trim());
  console.log('  Global CMS status indicator:', globalStatus);
  if (!globalStatus.includes('UNSAVED')) throw new Error('Global status should indicate UNSAVED DRAFT');
  console.log('  ✓ Alt text updated and slot status transitioned to DRAFT EDITED!\n');

  // -------------------------------------------------------------
  // 4. TEST MEDIA REPLACEMENT (SLOT 2: IMAGE 02)
  // -------------------------------------------------------------
  console.log('[STEP 4] Replacing IMAGE 02 with "landscape-01.jpg"...');
  await page.evaluate(() => {
    // Directly invoke the media library selection callback for slot 1
    openMediaModalForOrbitImage('sec-visual-orbit', 1);
    selectMediaAsset('landscape-01.jpg');
  });
  await delay(500);

  const newFilename1 = await page.$eval('#props-container .orbit-slot-card[data-slot="1"] .orbit-slot-filename', el => el.textContent.trim());
  console.log('  Slot 1 updated filename:', newFilename1);
  if (newFilename1 !== 'landscape-01.jpg') throw new Error('Slot 1 filename did not update to landscape-01.jpg');

  const previewSrc1 = await page.$eval('#props-container .orbit-slot-card[data-slot="1"] .orbit-preview-img', el => el.getAttribute('src'));
  console.log('  Slot 1 preview image src:', previewSrc1);
  if (!previewSrc1.includes('landscape-01.jpg')) throw new Error('Slot 1 preview src mismatch');

  const status1 = await page.$eval('#props-container .orbit-slot-card[data-slot="1"] .orbit-status-tag', el => el.textContent.trim());
  console.log('  Slot 1 status:', status1);
  if (status1 !== 'DRAFT EDITED') throw new Error('Slot 1 status should be DRAFT EDITED');
  console.log('  ✓ Replaced IMAGE 02 asset and verified preview thumbnail!\n');

  // -------------------------------------------------------------
  // 5. TEST DISCARD TRANSACTION
  // -------------------------------------------------------------
  console.log('[STEP 5] Testing DISCARD transaction (reverting draft edits)...');
  await page.click('button[onclick="handleDiscardClick()"]');
  await delay(300);

  const isModalActive = await page.$eval('#confirm-modal', el => el.classList.contains('active'));
  if (!isModalActive) throw new Error('Confirm discard modal should be active');

  await page.$eval('#confirm-modal-action-btn', el => el.click());
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 });
  await delay(1200);

  // Check public site: Visual Orbit must NOT contain landscape-01.jpg
  const publicSrcsAfterDiscard = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#dome-gallery-mount .item__image img'));
    return [...new Set(imgs.map(i => i.getAttribute('src')))];
  });
  console.log('  Public Visual Orbit unique sources after DISCARD:', publicSrcsAfterDiscard);
  if (publicSrcsAfterDiscard.includes('landscape-01.jpg')) {
    throw new Error('Discarded edit was incorrectly published to public gallery!');
  }
  if (!publicSrcsAfterDiscard.includes('VeerBhadra.png')) {
    throw new Error('Original VeerBhadra.png should have been retained!');
  }
  console.log('  ✓ DISCARD cleanly preserved the published configuration!\n');

  // -------------------------------------------------------------
  // 6. RE-APPLY EDIT, SAVE & PUBLISH
  // -------------------------------------------------------------
  console.log('[STEP 6] Re-applying IMAGE 02 replacement and Publishing...');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
  await delay(600);

  await page.click('.tree-item[onclick*="sec-visual-orbit"]');
  await delay(400);

  // Replace Slot 1 with landscape-01.jpg
  await page.evaluate(() => {
    openMediaModalForOrbitImage('sec-visual-orbit', 1);
    selectMediaAsset('landscape-01.jpg');
  });
  await delay(400);

  // Set Slot 1 custom alt text
  const customAlt2 = 'Landscape 01 — Mountain Cinematic Scenery';
  await page.evaluate((val) => {
    const inputs = document.querySelectorAll('#props-container .orbit-slot-card input[oninput*="updateOrbitImageAlt"]');
    inputs[1].value = val;
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
  }, customAlt2);
  await delay(400);

  // Click Global SAVE
  console.log('  Clicking SAVE to publish...');
  await page.click('button[onclick="handleSaveClick()"]');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 8000 });
  await delay(1500);

  // -------------------------------------------------------------
  // 7. VERIFY PUBLIC GALLERY RENDERING OF 120 POSITIONS
  // -------------------------------------------------------------
  console.log('\n[STEP 7] Verifying live public Visual Orbit after publication...');
  const publicStats = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#dome-gallery-mount .item__image img'));
    const allSrcs = imgs.map(i => i.getAttribute('src'));
    const uniqueSrcs = [...new Set(allSrcs)];
    const occurrences = {};
    allSrcs.forEach(s => occurrences[s] = (occurrences[s] || 0) + 1);

    return {
      totalTiles: imgs.length,
      uniqueSources: uniqueSrcs,
      occurrences
    };
  });

  console.log('  Total Gallery Tiles Rendered:', publicStats.totalTiles);
  console.log('  Unique Image Sources in Sphere:', publicStats.uniqueSources);
  console.log('  Distribution per source image:', JSON.stringify(publicStats.occurrences, null, 2));

  if (publicStats.totalTiles !== 120) {
    throw new Error(`Expected exactly 120 tiles in DomeGallery, found ${publicStats.totalTiles}`);
  }
  if (!publicStats.uniqueSources.includes('landscape-01.jpg')) {
    throw new Error('Published image "landscape-01.jpg" not found in live sphere');
  }
  if (publicStats.uniqueSources.includes('VeerBhadra.png')) {
    throw new Error('Replaced image "VeerBhadra.png" should no longer appear in sphere');
  }

  // Check that the other 3 original images remain
  const expectedOthers = ['Ramayana.png', 'dune-dneg.jpg', 'portrait-01.png'];
  for (const src of expectedOthers) {
    if (!publicStats.uniqueSources.includes(src)) {
      throw new Error(`Expected original source "${src}" to remain in sphere`);
    }
  }

  // Check alt text of the replaced tiles
  const replacedTileAlt = await page.evaluate(() => {
    const targetImg = Array.from(document.querySelectorAll('#dome-gallery-mount .item__image img'))
      .find(i => i.getAttribute('src') === 'landscape-01.jpg');
    return targetImg ? targetImg.getAttribute('alt') : null;
  });
  console.log('  Replaced Tile Alt Text in live DOM:', replacedTileAlt);
  if (replacedTileAlt !== customAlt2) {
    throw new Error(`Expected alt text "${customAlt2}", got "${replacedTileAlt}"`);
  }
  console.log('  ✓ Live Visual Orbit successfully updated all repeated positions of IMAGE 02 to landscape-01.jpg!\n');

  // -------------------------------------------------------------
  // 8. TEST CLEAR / REMOVE SLOT RESILIENCE
  // -------------------------------------------------------------
  console.log('[STEP 8] Testing Clear / Remove slot resilience...');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
  await delay(600);

  await page.click('.tree-item[onclick*="sec-visual-orbit"]');
  await delay(400);

  // Click clear slot 3 (IMAGE 04)
  await page.evaluate(() => {
    clearOrbitImageSlot('sec-visual-orbit', 3);
  });
  await delay(300);

  // Confirm clear modal
  await page.$eval('#confirm-modal-action-btn', el => el.click());
  await delay(400);

  const slot3Status = await page.$eval('#props-container .orbit-slot-card[data-slot="3"] .orbit-status-tag', el => el.textContent.trim());
  console.log('  Slot 3 status after clear:', slot3Status);
  if (slot3Status !== 'EMPTY') throw new Error('Cleared slot should have status EMPTY');

  const slot3Placeholder = await page.$('#props-container .orbit-slot-card[data-slot="3"] .orbit-empty-placeholder');
  if (!slot3Placeholder) throw new Error('Empty placeholder should be visible in cleared slot');
  console.log('  ✓ Slot clear and empty placeholder verified!\n');

  // Discard this test clear so portfolio remains with all 4 source images
  await page.click('button[onclick="handleDiscardClick()"]');
  await delay(300);
  await page.$eval('#confirm-modal-action-btn', el => el.click());
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 });
  await delay(800);

  // Capture final public gallery screenshot
  const publicScreenshot = path.join(ROOT_DIR, 'scratch', 'visual_orbit_public_success.png');
  await page.screenshot({ path: publicScreenshot });
  console.log('  Final verified public gallery screenshot saved to:', publicScreenshot);

  await browser.close();

  // Restore pristine backup content and reset auth for user
  if (fs.existsSync(BACKUP_FILE)) fs.copyFileSync(BACKUP_FILE, CONTENT_FILE);
  if (fs.existsSync(DRAFT_FILE)) fs.unlinkSync(DRAFT_FILE);
  if (fs.existsSync(AUTH_FILE)) fs.unlinkSync(AUTH_FILE);

  console.log('====================================================');
  console.log('ALL VISUAL ORBIT CMS INTEGRATION TESTS PASSED 100%!');
  console.log('====================================================');
}

runVisualOrbitTest().catch(err => {
  console.error('\n❌ VISUAL ORBIT TEST FAILED:', err);
  process.exit(1);
});
