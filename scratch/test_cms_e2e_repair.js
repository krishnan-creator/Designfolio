const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BACKUP_CONTENT_FILE = path.join(__dirname, '..', 'data', 'content.clean_before_repair.json');
const CONTENT_FILE = path.join(__dirname, '..', 'data', 'content.json');

(async () => {
  console.log('=== STARTING CBK DESIGNFOLIO CMS E2E REPAIR AUDIT ===');
  
  // 0. Backup clean content before test
  if (!fs.existsSync(BACKUP_CONTENT_FILE)) {
    fs.copyFileSync(CONTENT_FILE, BACKUP_CONTENT_FILE);
    console.log('Created backup of initial content.json');
  }

  const results = {
    auth: { status: 'PENDING' },
    btf: { status: 'PENDING' },
    selectedWorks: { status: 'PENDING' },
    expertise: { status: 'PENDING' },
    expertiseDynamicRow: { status: 'PENDING' },
    visualOrbit: { status: 'PENDING' },
    hobbies: { status: 'PENDING' },
    hero: { status: 'PENDING' },
    persistenceReload: { status: 'PENDING' }
  };

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    // -------------------------------------------------------------
    // PHASE 1: LOGIN TO BACKSTAGE
    // -------------------------------------------------------------
    console.log('\n[Phase 1] Logging into Backstage...');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
    await page.type('#auth-password', 'cbk2026');
    await page.click('#auth-submit-btn');

    await page.waitForFunction(() => {
      const overlay = document.getElementById('auth-overlay');
      return overlay && overlay.style.display === 'none';
    }, { timeout: 6000 });

    const authed = await page.evaluate(() => Boolean(window.currentDraft && window.currentDraft.sections));
    if (!authed) throw new Error('Authentication to Backstage failed');
    results.auth = { status: 'PASS', details: 'Authenticated as administrator with session token' };
    console.log(' ✓ Auth passed');

    // Create temporary test image assets on disk
    const testBtfFile = 'test_btf_asset.png';
    const testWorksFile = 'test_works_asset.png';
    const testExpFile = 'test_exp_asset.png';
    fs.copyFileSync(path.join(__dirname, '..', 'card-front.png'), path.join(__dirname, '..', testBtfFile));
    fs.copyFileSync(path.join(__dirname, '..', 'card-front.png'), path.join(__dirname, '..', testWorksFile));
    fs.copyFileSync(path.join(__dirname, '..', 'card-front.png'), path.join(__dirname, '..', testExpFile));

    // -------------------------------------------------------------
    // PHASE 2: BEYOND THE FRAME E2E REPAIR VERIFICATION
    // -------------------------------------------------------------
    console.log('\n[Phase 2] Testing Beyond the Frame...');
    await page.evaluate((fileName) => {
      selectSection('sec-beyond-frame');
      updateContentField('sec-beyond-frame', 'entries.0.image', fileName);
      updateContentField('sec-beyond-frame', 'entries.0.title', 'REPAIRED MYTHIC WORLDS');
      const sec = findSectionOrChild('sec-beyond-frame');
      if (sec) {
        renderPropertiesPanel(sec);
        renderCenterForm(sec);
      }
    }, testBtfFile);

    // Save and Publish
    await page.evaluate(() => handleSaveClick());
    await new Promise(r => setTimeout(r, 2000));

    // Check disk content.json
    const diskContent1 = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
    const btfSec = diskContent1.sections.find(s => s.id === 'sec-beyond-frame');
    if (btfSec.content.entries[0].image !== testBtfFile) {
      throw new Error(`BTF disk persistence failed: expected ${testBtfFile}, got ${btfSec.content.entries[0].image}`);
    }

    // Check public page
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const btfPublicData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.beyond-frame-card'));
      const firstImg = document.querySelector('.beyond-frame-card__image');
      const firstTitle = document.querySelector('.beyond-frame-card__title');
      return {
        cardsCount: cards.length,
        imgSrc: firstImg ? firstImg.getAttribute('src') : null,
        title: firstTitle ? firstTitle.textContent.trim() : null
      };
    });

    console.log('BTF Public Rendered:', btfPublicData);
    if (btfPublicData.imgSrc !== testBtfFile || btfPublicData.title !== 'REPAIRED MYTHIC WORLDS') {
      throw new Error(`BTF public rendering failed: got src=${btfPublicData.imgSrc}, title=${btfPublicData.title}`);
    }

    // Hard reload public page to verify persistence
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    const btfAfterReload = await page.evaluate(() => {
      const firstImg = document.querySelector('.beyond-frame-card__image');
      return firstImg ? firstImg.getAttribute('src') : null;
    });
    if (btfAfterReload !== testBtfFile) {
      throw new Error(`BTF failed to survive reload: got ${btfAfterReload}`);
    }
    results.btf = { status: 'PASS', details: 'BTF image and title updated, persisted to disk, rendered in React ScrollStack, survived reload' };
    console.log(' ✓ Beyond the Frame PASS');

    // -------------------------------------------------------------
    // PHASE 3: SELECTED WORKS E2E REPAIR VERIFICATION
    // -------------------------------------------------------------
    console.log('\n[Phase 3] Testing Selected Works...');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    await page.evaluate((fileName) => {
      selectSection('sec-selected-works');
      updateContentField('sec-selected-works', 'landscapeProjects.0.image', fileName);
      updateContentField('sec-selected-works', 'landscapeProjects.0.title', 'REPAIRED RAMAYANA FEATURE');
      const sec = findSectionOrChild('sec-selected-works');
      if (sec) {
        renderPropertiesPanel(sec);
        renderCenterForm(sec);
      }
    }, testWorksFile);

    await page.evaluate(() => handleSaveClick());
    await new Promise(r => setTimeout(r, 2000));

    // Verify disk
    const diskContent2 = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
    const swSec = diskContent2.sections.find(s => s.id === 'sec-selected-works');
    if (swSec.content.landscapeProjects[0].image !== testWorksFile) {
      throw new Error(`Selected Works disk persistence failed: got ${swSec.content.landscapeProjects[0].image}`);
    }

    // Verify public page
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const swPublicData = await page.evaluate(() => {
      const firstImg = document.querySelector('#works-row-1 .works-media-wrap img');
      const firstTitle = document.querySelector('#works-row-1 .works-title');
      return {
        imgSrc: firstImg ? firstImg.getAttribute('src') : null,
        title: firstTitle ? firstTitle.textContent.trim() : null
      };
    });

    console.log('Selected Works Public Rendered:', swPublicData);
    if (swPublicData.imgSrc !== testWorksFile || swPublicData.title !== 'REPAIRED RAMAYANA FEATURE') {
      throw new Error(`Selected Works public rendering failed: got src=${swPublicData.imgSrc}, title=${swPublicData.title}`);
    }
    results.selectedWorks = { status: 'PASS', details: 'Selected Works project 1 image and title updated, persisted, rendered in DOM, survived reload' };
    console.log(' ✓ Selected Works PASS');

    // -------------------------------------------------------------
    // PHASE 4: MY EXPERTISE E2E REPAIR VERIFICATION
    // -------------------------------------------------------------
    console.log('\n[Phase 4] Testing My Expertise...');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    await page.evaluate((fileName) => {
      selectSection('sec-expertise');
      updateContentField('sec-expertise', 'companies.0.mediaSlots.0.image', fileName);
      updateContentField('sec-expertise', 'companies.0.mediaSlots.0.title', 'REPAIRED DUNE LOOK-DEV');

      // Also add a media slot to Cyberedge (company index 2) which originally had 0 media slots
      const sec = findSectionOrChild('sec-expertise');
      if (sec && sec.content && sec.content.companies && sec.content.companies[2]) {
        sec.content.companies[2].mediaSlots = [
          {
            image: fileName,
            title: 'CYBEREDGE VR SIMULATION',
            meta: 'Immersive Real-Time Systems',
            badge: '[◈] 01 / VR ENGINE'
          }
        ];
      }
      markUnsaved();
      if (sec) {
        renderPropertiesPanel(sec);
        renderCenterForm(sec);
      }
    }, testExpFile);

    await page.evaluate(() => handleSaveClick());
    await new Promise(r => setTimeout(r, 2000));

    // Verify disk
    const diskContent3 = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
    const expSec = diskContent3.sections.find(s => s.id === 'sec-expertise');
    if (expSec.content.companies[0].mediaSlots[0].image !== testExpFile) {
      throw new Error(`Expertise disk persistence failed for DNEG: got ${expSec.content.companies[0].mediaSlots[0].image}`);
    }
    if (!expSec.content.companies[2].mediaSlots || expSec.content.companies[2].mediaSlots[0].image !== testExpFile) {
      throw new Error('Expertise disk persistence failed for Cyberedge dynamic media slot');
    }

    // Verify public page
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const expPublicData = await page.evaluate(() => {
      const dnegFirstImg = document.querySelector('#exp-dneg .expertise-media-row img');
      const dnegFirstTitle = document.querySelector('#exp-dneg .expertise-media-title');
      const cyberedgeImg = document.querySelector('#exp-cyberedge .expertise-media-row img');
      const cyberedgeTitle = document.querySelector('#exp-cyberedge .expertise-media-title');
      return {
        dnegImg: dnegFirstImg ? dnegFirstImg.getAttribute('src') : null,
        dnegTitle: dnegFirstTitle ? dnegFirstTitle.textContent.trim() : null,
        cyberedgeImg: cyberedgeImg ? cyberedgeImg.getAttribute('src') : null,
        cyberedgeTitle: cyberedgeTitle ? cyberedgeTitle.textContent.trim() : null
      };
    });

    console.log('My Expertise Public Rendered:', expPublicData);
    if (expPublicData.dnegImg !== testExpFile || expPublicData.dnegTitle !== 'REPAIRED DUNE LOOK-DEV') {
      throw new Error(`Expertise DNEG public rendering failed: got src=${expPublicData.dnegImg}, title=${expPublicData.dnegTitle}`);
    }
    results.expertise = { status: 'PASS', details: 'My Expertise DNEG spotlight image updated, persisted, and rendered in DOM' };

    if (expPublicData.cyberedgeImg !== testExpFile || expPublicData.cyberedgeTitle !== 'CYBEREDGE VR SIMULATION') {
      throw new Error(`Expertise Cyberedge dynamic media row failed: got src=${expPublicData.cyberedgeImg}`);
    }
    results.expertiseDynamicRow = { status: 'PASS', details: 'Expertise Cyberedge dynamically generated .expertise-media-row for newly added slot and rendered image' };
    console.log(' ✓ My Expertise PASS');

    // -------------------------------------------------------------
    // PHASE 5: PERSISTENCE, RELOAD & BACKSTAGE REOPEN TEST
    // -------------------------------------------------------------
    console.log('\n[Phase 5] Testing full page reload and Backstage reopen...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Confirm all 3 sections retained their edits after hard reload
    const reloadCheck = await page.evaluate(() => {
      const btfImg = document.querySelector('.beyond-frame-card__image')?.getAttribute('src');
      const worksImg = document.querySelector('#works-row-1 .works-media-wrap img')?.getAttribute('src');
      const expImg = document.querySelector('#exp-dneg .expertise-media-row img')?.getAttribute('src');
      return { btfImg, worksImg, expImg };
    });

    if (reloadCheck.btfImg !== testBtfFile || reloadCheck.worksImg !== testWorksFile || reloadCheck.expImg !== testExpFile) {
      throw new Error('Persistence reload check failed: ' + JSON.stringify(reloadCheck));
    }

    // Reopen Backstage
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    const backstageReopenCheck = await page.evaluate(() => {
      const draft = window.currentDraft;
      const btf = draft.sections.find(s => s.id === 'sec-beyond-frame');
      const sw = draft.sections.find(s => s.id === 'sec-selected-works');
      const exp = draft.sections.find(s => s.id === 'sec-expertise');
      return {
        btfImg: btf?.content?.entries?.[0]?.image,
        swImg: sw?.content?.landscapeProjects?.[0]?.image,
        expImg: exp?.content?.companies?.[0]?.mediaSlots?.[0]?.image
      };
    });

    if (backstageReopenCheck.btfImg !== testBtfFile || backstageReopenCheck.swImg !== testWorksFile || backstageReopenCheck.expImg !== testExpFile) {
      throw new Error('Backstage reopen failed to restore saved values: ' + JSON.stringify(backstageReopenCheck));
    }
    results.persistenceReload = { status: 'PASS', details: 'All changes survived hard page reload and correctly restored upon reopening Backstage' };
    console.log(' ✓ Reload & Backstage Reopen PASS');

    // -------------------------------------------------------------
    // PHASE 6: RESTORE CANONICAL PRISTINE CONTENT
    // -------------------------------------------------------------
    console.log('\n[Phase 6] Restoring clean canonical portfolio content...');
    if (fs.existsSync(BACKUP_CONTENT_FILE)) {
      const cleanContent = JSON.parse(fs.readFileSync(BACKUP_CONTENT_FILE, 'utf8'));
      fs.writeFileSync(CONTENT_FILE, JSON.stringify(cleanContent, null, 2), 'utf8');
      fs.writeFileSync(path.join(__dirname, '..', 'data', 'content-draft.json'), JSON.stringify(cleanContent, null, 2), 'utf8');
      console.log('Restored canonical content.json and content-draft.json');
    }

    // Clean up temporary test image files
    [testBtfFile, testWorksFile, testExpFile].forEach(f => {
      const p = path.join(__dirname, '..', f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    // Re-verify canonical public site
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const finalPublicCheck = await page.evaluate(() => {
      const btfImg = document.querySelector('.beyond-frame-card__image')?.getAttribute('src');
      const btfTitle = document.querySelector('.beyond-frame-card__title')?.textContent.trim();
      const worksImg = document.querySelector('#works-row-1 .works-media-wrap img')?.getAttribute('src');
      const expImg = document.querySelector('#exp-dneg .expertise-media-row img')?.getAttribute('src');
      return { btfImg, btfTitle, worksImg, expImg };
    });
    console.log('Final Canonical Public State:', finalPublicCheck);

    console.log('\n=== ALL E2E INTEGRATION & REPAIR TESTS PASSED ===');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
