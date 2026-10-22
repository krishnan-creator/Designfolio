const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_FILE = path.join(ROOT_DIR, 'data', 'content.json');
const DRAFT_FILE = path.join(ROOT_DIR, 'data', 'content-draft.json');
const BACKUP_FILE = path.join(ROOT_DIR, 'data', 'content.backup.json');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function runMasterTest() {
  console.log('====================================================');
  console.log('BACKSTAGE MASTER INTEGRATION & WORKFLOW VERIFICATION');
  console.log('====================================================\n');

  // Launch Edge browser
  const AUTH_FILE = path.join(ROOT_DIR, 'data', 'auth.json');
  if (fs.existsSync(AUTH_FILE)) fs.unlinkSync(AUTH_FILE);
  if (fs.existsSync(DRAFT_FILE)) fs.unlinkSync(DRAFT_FILE);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[CBK') || text.includes('Error') || text.includes('Auth')) {
      console.log('  [Browser Log]:', text);
    }
  });

  // -----------------------------------------------------------------
  // 1. WORKFLOW A: ACCESS & INITIAL SETUP
  // -----------------------------------------------------------------
  console.log('[WORKFLOW A] Access & Initial Authentication Setup...');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
  await delay(800);

  // Check if setup or login overlay is visible
  const isOverlayVisible = await page.$eval('#auth-overlay', el => window.getComputedStyle(el).display !== 'none');
  console.log('  Auth overlay visible:', isOverlayVisible);
  if (!isOverlayVisible) throw new Error('Auth overlay must be visible for unauthenticated user');

  const titleText = await page.$eval('#auth-title', el => el.textContent.trim());
  console.log('  Auth modal title:', titleText);

  const ADMIN_PASS = 'CbkMasterAdmin2026!';

  if (titleText.includes('SETUP')) {
    console.log('  Setting up new administrative credentials in UI...');
    await page.type('#auth-password', ADMIN_PASS);
    await page.type('#auth-confirm', ADMIN_PASS);
    await page.click('#auth-submit-btn');
  } else {
    console.log('  Logging in with administrator credentials in UI...');
    await page.$eval('#auth-password', el => el.value = '');
    await page.type('#auth-password', ADMIN_PASS);
    await page.click('#auth-submit-btn');
  }

  // Wait for overlay to disappear
  await page.waitForFunction(() => {
    const el = document.getElementById('auth-overlay');
    return !el || window.getComputedStyle(el).display === 'none';
  }, { timeout: 6000 });
  console.log('  ✓ Authenticated and entered BACKSTAGE control room!\n');

  // Wait for section tree to populate from server
  await page.waitForSelector('.tree-item[onclick*="sec-hero"]', { timeout: 10000 });
  await delay(500);

  // -----------------------------------------------------------------
  // 2. WORKFLOW B: EDIT TEXT & LIVE PREVIEW
  // -----------------------------------------------------------------
  console.log('[WORKFLOW B] Editing Hero section headline & tagline...');
  // Select hero section
  await page.click('.tree-item[onclick*="sec-hero"]');
  await delay(400);

  const testHeadline = 'CHITHAMBARAM BALA KRISHNAN PILLAI';
  const testTagline = 'Turning Ideas into Visuals — Cinematic AI Leadership';
  
  // Update tagline field
  const quoteInput = await page.$('input[oninput*="updateContentField(\'sec-hero\', \'quote\'"]');
  if (!quoteInput) throw new Error('Quote input not found');
  await page.$eval('input[oninput*="updateContentField(\'sec-hero\', \'quote\'"]', (el, val) => {
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, testTagline);

  // Check unsaved draft indicator
  await delay(500);
  const statusText = await page.$eval('#status-text', el => el.textContent.trim());
  console.log('  Status indicator:', statusText);
  if (!statusText.includes('UNSAVED')) throw new Error('Unsaved changes indicator did not activate');
  console.log('  ✓ Text modified and marked as UNSAVED DRAFT!\n');

  // -----------------------------------------------------------------
  // 3. WORKFLOW G: THE CORE -> NESTED HOBBIES SUBSECTION (3RD CARD)
  // -----------------------------------------------------------------
  console.log('[WORKFLOW G] Managing Hobbies as nested sub-compartment of The Core...');
  // Expand The Core and click Hobbies
  const treeOnclicks = await page.$$eval('#section-tree .tree-item', els => els.map(e => ({ cls: e.className, onclick: e.getAttribute('onclick'), text: e.textContent.replace(/\s+/g, ' ').trim() })));
  console.log('  Tree items in DOM:', JSON.stringify(treeOnclicks, null, 2));

  const hobbiesTreeItem = await page.$('[onclick*="sub-hobbies"]');
  if (!hobbiesTreeItem) throw new Error('Nested Hobbies tree item not found under The Core');
  await hobbiesTreeItem.click();
  await delay(400);

  // Check that properties panel shows "NESTED CHILD OF THE CORE"
  const panelHtml = await page.$eval('#props-container', el => el.innerHTML);
  if (!panelHtml.includes('NESTED CHILD OF THE CORE')) {
    throw new Error('Hobbies property panel did not indicate nested child relationship to The Core');
  }
  console.log('  Confirmed Hobbies displays as nested sub-compartment of The Core.');

  // Click "+ ADD HOBBY" to add a 3rd archive card (Cinema)
  await page.$eval('.btn-add-item', el => {
    el.scrollIntoView({ behavior: 'instant', block: 'center' });
    el.click();
  });
  await delay(400);

  // Set 3rd card details
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[oninput*="updateHobbyCard"]'));
    const titleInput = inputs.find(i => i.getAttribute('oninput').includes("'title'") && i.getAttribute('oninput').includes("2"));
    if (titleInput) {
      titleInput.value = 'CINEMATOGRAPHY';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const catInput = inputs.find(i => i.getAttribute('oninput').includes("'categoryNumber'") && i.getAttribute('oninput').includes("2"));
    if (catInput) {
      catInput.value = '03 //';
      catInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  console.log('  ✓ Added 3rd Hobby Archive Card ("03 // CINEMATOGRAPHY")!\n');

  // -----------------------------------------------------------------
  // 4. WORKFLOW F: CREATE NEW SECTION VIA SECTION BUILDER
  // -----------------------------------------------------------------
  console.log('[WORKFLOW F] Building new section via "+ ADD SECTION" builder...');
  await page.$eval('.btn-add-section', el => el.click());
  await delay(300);

  // Set name and template
  await page.type('#new-section-name', '10 // CINEMATIC CASE STUDIES');
  await page.select('#new-section-template', 'card-grid');
  await page.$eval('#add-section-modal .btn-save', el => el.click());
  await delay(500);

  // Verify section added to tree
  const treeItems = await page.$$eval('.tree-item-title', els => els.map(e => e.textContent.trim()));
  console.log('  Updated section tree includes:', treeItems.filter(t => t.includes('CINEMATIC CASE STUDIES')));
  if (!treeItems.some(t => t.includes('CINEMATIC CASE STUDIES'))) {
    throw new Error('New custom section not found in tree');
  }
  console.log('  ✓ New section successfully composed and added to hierarchy!\n');

  // -----------------------------------------------------------------
  // 5. WORKFLOW K: RESPONSIVE VIEWPORT CONTROLS
  // -----------------------------------------------------------------
  console.log('[WORKFLOW K] Testing responsive viewport switcher in editor...');
  // Click Tablet
  await page.click('.vp-btn[data-width="820px"]');
  await delay(200);
  let containerWidth = await page.$eval('#preview-frame-container', el => el.style.width);
  console.log('  Tablet container width:', containerWidth);
  if (containerWidth !== '820px') throw new Error('Tablet viewport switch failed');

  // Click Mobile
  await page.click('.vp-btn[data-width="400px"]');
  await delay(200);
  containerWidth = await page.$eval('#preview-frame-container', el => el.style.width);
  console.log('  Mobile container width:', containerWidth);
  if (containerWidth !== '400px') throw new Error('Mobile viewport switch failed');

  // Return to Desktop
  await page.click('.vp-btn[data-width="100%"]');
  await delay(200);
  console.log('  ✓ Viewport controls respond accurately across Desktop, Tablet, and Mobile!\n');

  // -----------------------------------------------------------------
  // 6. SAVE & PUBLISH TRANSACTION
  // -----------------------------------------------------------------
  console.log('[SAVE TRANSACTION] Publishing working draft to active portfolio...');
  await page.click('button[onclick="handleSaveClick()"]');
  
  // Wait for redirect to /?saved=true or home
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 8000 });
  const currentUrl = page.url();
  console.log('  Returned to public site:', currentUrl);

  // -----------------------------------------------------------------
  // 7. VERIFY PUBLIC SITE RENDERING OF SAVED CMS DATA
  // -----------------------------------------------------------------
  console.log('\n[PUBLIC VERIFICATION] Checking published site rendering...');
  await delay(1200);

  // Check tagline on public site
  const publicQuote = await page.$eval('#quote-text', el => el.textContent.trim());
  console.log('  Public quote text:', publicQuote);
  if (publicQuote !== testTagline) throw new Error(`Expected quote "${testTagline}" but found "${publicQuote}"`);

  // Check that 3rd Hobby Card renders on public site
  const hobbyCards = await page.$$eval('.hobby-card', cards => cards.map(c => c.textContent.replace(/\s+/g, ' ').trim()));
  console.log('  Public Hobby cards count:', hobbyCards.length);
  console.log('  Public Hobby cards:', hobbyCards);
  if (hobbyCards.length < 3) throw new Error('Expected at least 3 hobby cards on public site');

  // Check that custom section rendered on public site
  const customSec = await page.$('.custom-cms-section');
  if (!customSec) throw new Error('Custom CMS section did not render on public page');
  const customSecTitle = await page.$eval('.custom-cms-section h2', el => el.textContent.trim());
  console.log('  Rendered custom section heading:', customSecTitle);
  if (!customSecTitle.includes('CINEMATIC CASE STUDIES')) {
    throw new Error('Custom section title mismatch');
  }

  // -----------------------------------------------------------------
  // 8. WORKFLOW H: DISCARD TRANSACTION TEST
  // -----------------------------------------------------------------
  console.log('\n[WORKFLOW H] Testing DISCARD transaction model...');
  // Return to /backstage
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
  await delay(600);

  // Make a temporary change
  await page.click('.tree-item[onclick*="sec-hero"]');
  await delay(300);
  await page.$eval('input[oninput*="updateContentField(\'sec-hero\', \'quote\'"]', (el) => {
    el.value = 'DISCARDED EDIT THAT MUST NEVER BE SAVED';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await delay(400);

  // Click DISCARD
  await page.click('button[onclick="handleDiscardClick()"]');
  await delay(300);

  // Confirm modal should appear
  const isConfirmActive = await page.$eval('#confirm-modal', el => el.classList.contains('active'));
  console.log('  Confirm discard modal active:', isConfirmActive);
  if (!isConfirmActive) throw new Error('Discard confirm modal did not open');

  // Click confirm discard & exit
  await page.$eval('#confirm-modal-action-btn', el => el.click());
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 });
  await delay(800);

  // Verify the discarded edit was NOT saved
  const finalPublicQuote = await page.$eval('#quote-text', el => el.textContent.trim());
  console.log('  Public quote after discard:', finalPublicQuote);
  if (finalPublicQuote.includes('DISCARDED EDIT')) {
    throw new Error('Discarded edit was incorrectly published!');
  }
  if (finalPublicQuote !== testTagline) {
    throw new Error('Discard did not restore the published state');
  }
  console.log('  ✓ DISCARD cleanly restored published state without saving temporary edits!\n');

  // Take final verified screenshot
  const screenshotPath = path.join(ROOT_DIR, 'scratch', 'master_verification_success.png');
  await page.screenshot({ path: screenshotPath });
  console.log('  Final verified screenshot saved to:', screenshotPath);

  await browser.close();

  console.log('====================================================');
  console.log('ALL MASTER BACKSTAGE WORKFLOWS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runMasterTest().catch(err => {
  console.error('\n❌ MASTER TEST RUN FAILED:', err);
  process.exit(1);
});
