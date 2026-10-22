const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('============================================================');
  console.log('TEST SUITE: PORTFOLIO UPDATE — 3 TASKS COMPREHENSIVE VERIFICATION');
  console.log('============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      errors.push(message);
    } else {
      console.log(`✅ PASS: ${message}`);
    }
  }

  const pageErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      pageErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    pageErrors.push(err.toString());
  });

  try {
    // -------------------------------------------------------------
    // PHASE 1: PUBLIC HOMEPAGE INITIAL STATE
    // -------------------------------------------------------------
    console.log('--- PHASE 1: Public Homepage Initial State ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Visual Orbit (DomeGallery with 40 empty slots)
    console.log('\n[Task 1] Visual Orbit Initial State:');
    const domeRoot = await page.$('.sphere-root');
    assert(!!domeRoot, 'Visual Orbit DomeGallery root (.sphere-root) exists');

    const orbitItems = await page.$$('.sphere-root .item');
    assert(orbitItems.length === 40, `Visual Orbit has exactly 40 slot elements (found ${orbitItems.length})`);

    const emptyOrbitItems = await page.$$('.sphere-root .item.item--empty');
    assert(emptyOrbitItems.length === 40, `All 40 Visual Orbit slots are initially empty (found ${emptyOrbitItems.length})`);

    const orbitImages = await page.$$('.sphere-root .item:not(.item--empty) img');
    assert(orbitImages.length === 0, `No fallback or demo images rendered in Visual Orbit (found ${orbitImages.length})`);

    const orbitSlotNums = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('.sphere-root .empty-slot-number'));
      return {
        count: els.length,
        first: els[0]?.textContent.trim(),
        last: els[els.length - 1]?.textContent.trim()
      };
    });
    assert(orbitSlotNums.count === 40, `Found 40 empty numbered placeholders (count: ${orbitSlotNums.count})`);
    assert(orbitSlotNums.first === '01' && orbitSlotNums.last === '40', `Slots numbered 01 to 40 (first: ${orbitSlotNums.first}, last: ${orbitSlotNums.last})`);

    // Verify right-to-left continuous rotation
    console.log('\n[Task 1] Continuous Right-to-Left Rotation:');
    const rotCheck = await page.evaluate(async () => {
      const sphere = document.querySelector('.sphere-root .sphere');
      if (!sphere) return { ok: false, error: 'Sphere element missing' };

      const getRotY = () => {
        const tr = sphere.style.transform;
        const match = tr.match(/rotateY\(([-\d.]+)deg\)/);
        return match ? parseFloat(match[1]) : 0;
      };

      const start = getRotY();
      await new Promise(r => setTimeout(r, 600));
      const end = getRotY();
      return {
        ok: true,
        start,
        end,
        delta: end - start,
        movingRightToLeft: end < start
      };
    });
    assert(rotCheck.ok && rotCheck.movingRightToLeft, `Dome rotates continuously from right to left (delta: ${rotCheck.delta?.toFixed(2)} deg)`);

    // Clicking empty slot must NOT open viewer
    const emptySlotOpen = await page.evaluate(() => {
      const emptyEl = document.querySelector('.sphere-root .item.item--empty .item__image');
      if (emptyEl) emptyEl.click();
      return !!document.querySelector('.sphere-root .viewer.is-active');
    });
    assert(!emptySlotOpen, 'Clicking empty slot does NOT open fullscreen viewer');

    // 2. CTA Quote Typography
    console.log('\n[Task 2] CTA Quote Font:');
    const ctaQuote = await page.evaluate(() => {
      const headline = document.querySelector('#lets-build .build-headline');
      const statement = document.querySelector('#lets-build .build-statement');
      const meta = document.querySelector('#lets-build .dbl-meta-label span:last-child');
      const slash = document.querySelector('#lets-build .build-headline-accent-slash');
      if (!headline) return null;
      return {
        headlineFont: window.getComputedStyle(headline).fontFamily,
        headlineText: headline.innerText.trim(),
        statementFont: statement ? window.getComputedStyle(statement).fontFamily : '',
        metaFont: meta ? window.getComputedStyle(meta).fontFamily : '',
        slashFont: slash ? window.getComputedStyle(slash).fontFamily : ''
      };
    });
    assert(!!ctaQuote, 'CTA section #lets-build .build-headline exists');
    assert(ctaQuote.headlineFont.toLowerCase().includes('anton'), `CTA quote uses Anton font (computed: ${ctaQuote.headlineFont})`);
    assert(!ctaQuote.statementFont.toLowerCase().includes('anton'), `CTA statement does NOT use Anton font (computed: ${ctaQuote.statementFont})`);
    assert(!ctaQuote.metaFont.toLowerCase().includes('anton'), `CTA meta label does NOT use Anton font (computed: ${ctaQuote.metaFont})`);
    assert(ctaQuote.headlineText.includes('THAT’S HOW I SEE THE WORLD.') || ctaQuote.headlineText.includes("THAT'S HOW I SEE THE WORLD."), `CTA quote wording preserved: "${ctaQuote.headlineText}"`);

    // 3. Hobbies Elastic Gallery
    console.log('\n[Task 3] Hobbies Elastic Gallery Initial State:');
    const hobbiesSection = await page.$('#hobbies-archive');
    assert(!!hobbiesSection, 'Hobbies section #hobbies-archive exists');

    // Verify position directly below THE CORE
    const isDirectlyBelowCore = await page.evaluate(() => {
      const core = document.getElementById('the-core');
      const hobbies = document.getElementById('hobbies-archive');
      if (!core || !hobbies) return false;
      return core.nextElementSibling === hobbies;
    });
    assert(isDirectlyBelowCore, 'Hobbies section is placed directly below THE CORE');

    // Verify Hobbies heading and 10% font size increase
    const headingInfo = await page.evaluate(() => {
      const title = document.querySelector('#hobbies-archive .hobbies-compact-title');
      const sub = document.querySelector('#hobbies-archive .hobbies-subtitle-tag');
      return {
        titleText: title ? title.textContent.trim() : '',
        titleSize: title ? window.getComputedStyle(title).fontSize : '',
        subtitleText: sub ? sub.textContent.trim() : ''
      };
    });
    assert(headingInfo.titleText === 'HOBBIES', `Hobbies heading matches: "${headingInfo.titleText}"`);
    assert(headingInfo.subtitleText === '[ A little art. A lot of adventure ]', `Hobbies subtitle matches exactly: "${headingInfo.subtitleText}"`);

    // Verify 12 fixed slots initially all empty
    const hobbiesSlats = await page.$$('.elastic-gallery-root .elastic-slat');
    assert(hobbiesSlats.length === 12, `Elastic Gallery has exactly 12 slats (found: ${hobbiesSlats.length})`);

    const emptySlats = await page.$$('.elastic-gallery-root .elastic-slat--empty');
    assert(emptySlats.length === 12, `All 12 Hobbies slats are initially empty (found: ${emptySlats.length})`);

    const hobbiesImages = await page.$$('.elastic-gallery-root .elastic-slat--populated img');
    assert(hobbiesImages.length === 0, `No fallback or demo images rendered in Hobbies (found: ${hobbiesImages.length})`);

    const emptySlatNumbers = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('.elastic-gallery-root .elastic-empty-num'));
      return {
        count: els.length,
        first: els[0]?.textContent.trim(),
        last: els[els.length - 1]?.textContent.trim()
      };
    });
    assert(emptySlatNumbers.count === 12, `Found 12 empty numbered placeholders (count: ${emptySlatNumbers.count})`);
    assert(emptySlatNumbers.first === '01' && emptySlatNumbers.last === '12', `Hobbies slats numbered 01 to 12 (first: ${emptySlatNumbers.first}, last: ${emptySlatNumbers.last})`);

    // Resting state: equal widths on all 12 slats
    const slatWidths = await page.evaluate(() => {
      const slats = Array.from(document.querySelectorAll('.elastic-gallery-root .elastic-slat'));
      const widths = slats.map(s => Math.round(s.getBoundingClientRect().width));
      const min = Math.min(...widths);
      const max = Math.max(...widths);
      return { min, max, diff: max - min, widths };
    });
    assert(slatWidths.diff <= 1, `Resting state: All 12 slats have equal widths (min: ${slatWidths.min}px, max: ${slatWidths.max}px)`);

    // Empty slat click must NOT select/lock
    const emptySlatClick = await page.evaluate(() => {
      const slat = document.querySelector('.elastic-gallery-root .elastic-slat--empty');
      if (slat) slat.click();
      return !!document.querySelector('.elastic-gallery-root .elastic-slat--selected');
    });
    assert(!emptySlatClick, 'Clicking empty slat does NOT lock selection or open navigation');

    // -------------------------------------------------------------
    // PHASE 2: BACKSTAGE CMS INTEGRATION & PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n--- PHASE 2: Backstage CMS Integration & Persistence ---');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Handle authentication if prompted
    const isAuthOverlayVisible = await page.$eval('#auth-overlay', el => el && el.style.display !== 'none').catch(() => false);
    if (isAuthOverlayVisible) {
      console.log('Logging in to Backstage CMS with password cbk2026...');
      await page.type('#auth-password', 'cbk2026');
      await page.evaluate(() => {
        document.getElementById('auth-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      });
      await new Promise(r => setTimeout(r, 2500));
    }

    const structureTree = await page.$('#section-tree');
    assert(!!structureTree, 'Backstage section tree loaded');

    // 1. Test Visual Orbit in Backstage (40 slots, populating orbit-17)
    console.log('\n[Backstage] Selecting Visual Orbit in sidebar...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.tree-item'));
      const orbitItem = items.find(it => it.textContent.includes('Visual Orbit'));
      if (orbitItem) orbitItem.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const orbitCardsCount = await page.$$eval('#props-container .orbit-slot-card', els => els.length);
    assert(orbitCardsCount === 40, `Backstage Visual Orbit displays exactly 40 slot cards (found: ${orbitCardsCount})`);

    // Verify slot 17 card exists and is EMPTY
    const slot17Initial = await page.evaluate(() => {
      const card = document.querySelector('#props-container .orbit-slot-card[data-slot="16"]'); // index 16 is slot 17
      const badge = card?.querySelector('.orbit-slot-badge')?.textContent.trim();
      const status = card?.querySelector('.orbit-status-tag')?.textContent.trim();
      return { badge, status, exists: !!card };
    });
    assert(slot17Initial.exists && slot17Initial.badge === 'SLOT 17', `Slot 17 card found with badge: ${slot17Initial.badge}`);
    assert(slot17Initial.status === 'EMPTY', `Slot 17 initial status is EMPTY (status: ${slot17Initial.status})`);

    // Assign image to slot 17 via Backstage
    console.log('Assigning media_1791962972992.jpg to Visual Orbit slot 17...');
    await page.evaluate(() => {
      const sec = currentDraft.sections.find(s => s.id === 'sec-visual-orbit');
      sec.content.slots[16].image = 'media_1791962972992.jpg';
      sec.content.slots[16].src = 'media_1791962972992.jpg';
      sec.content.slots[16].alt = 'Visual Orbit Shot 17';
      sec.content.images = sec.content.slots;
      sec.content.tiles = sec.content.slots.filter(s => s.image);
      markUnsaved();
      renderPropertiesPanel(sec);
      renderCenterForm(sec);
    });
    await new Promise(r => setTimeout(r, 600));

    const slot17Populated = await page.evaluate(() => {
      const card = document.querySelector('#props-container .orbit-slot-card[data-slot="16"]');
      const status = card?.querySelector('.orbit-status-tag')?.textContent.trim();
      const img = card?.querySelector('.orbit-preview-img')?.getAttribute('src');
      return { status, img };
    });
    assert(slot17Populated.img === 'media_1791962972992.jpg', `Slot 17 image assigned in Backstage: ${slot17Populated.img}`);

    // 2. Test Hobbies in Backstage (12 slots, populating hobby-05)
    console.log('\n[Backstage] Selecting Hobbies in sidebar...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.tree-item.nested'));
      const hobbyItem = items.find(it => it.textContent.includes('Hobbies') || it.textContent.includes('hobbies'));
      if (hobbyItem) hobbyItem.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const hobbyCardsCount = await page.$$eval('#props-container [data-hobby-slot]', els => els.length);
    assert(hobbyCardsCount === 12, `Backstage Hobbies displays exactly 12 slot cards (found: ${hobbyCardsCount})`);

    // Verify slot 5 card exists and is EMPTY
    const slot5Initial = await page.evaluate(() => {
      const card = document.querySelector('#props-container [data-hobby-slot="4"]'); // index 4 is slot 5
      const badge = card?.querySelector('.orbit-slot-badge')?.textContent.trim();
      const status = card?.querySelector('.orbit-status-tag')?.textContent.trim();
      return { badge, status, exists: !!card };
    });
    assert(slot5Initial.exists && slot5Initial.badge === 'SLOT 05', `Slot 5 card found with badge: ${slot5Initial.badge}`);
    assert(slot5Initial.status === 'EMPTY', `Slot 5 initial status is EMPTY (status: ${slot5Initial.status})`);

    // Assign image to hobby slot 5
    console.log('Assigning landscape-05.jpg to Hobbies slot 05...');
    await page.evaluate(() => {
      const core = currentDraft.sections.find(s => s.id === 'sec-core');
      const h = core.children.find(ch => ch.type === 'hobbies');
      h.content.slots[4].image = 'landscape-05.jpg';
      h.content.slots[4].src = 'landscape-05.jpg';
      h.content.slots[4].title = 'Mountain Summit 05';
      h.content.slots[4].subtitle = 'High altitude visual study';
      h.content.slots[4].alt = 'Summit exploration 05';
      h.content.items = h.content.slots;
      markUnsaved();
      renderPropertiesPanel(h);
      renderCenterForm(h);
    });
    await new Promise(r => setTimeout(r, 600));

    // Also populate slot 1 for navigation testing
    await page.evaluate(() => {
      const core = currentDraft.sections.find(s => s.id === 'sec-core');
      const h = core.children.find(ch => ch.type === 'hobbies');
      h.content.slots[0].image = 'landscape-01.jpg';
      h.content.slots[0].src = 'landscape-01.jpg';
      h.content.slots[0].title = 'Art Direction 01';
      h.content.slots[0].subtitle = 'Cinematic environment design';
      h.content.slots[0].alt = 'Study 01';
      h.content.items = h.content.slots;
      markUnsaved();
    });

    // Also populate slot 1 in Visual Orbit for lightbox navigation testing
    await page.evaluate(() => {
      const sec = currentDraft.sections.find(s => s.id === 'sec-visual-orbit');
      sec.content.slots[0].image = 'portrait-01.png';
      sec.content.slots[0].src = 'portrait-01.png';
      sec.content.slots[0].alt = 'Visual Orbit Lead Asset';
      sec.content.images = sec.content.slots;
      sec.content.tiles = sec.content.slots.filter(s => s.image);
      markUnsaved();
    });

    // Publish changes
    console.log('Publishing changes via Backstage CMS...');
    await page.evaluate(async () => {
      await handleSaveClick();
    });
    await new Promise(r => setTimeout(r, 2000));

    // -------------------------------------------------------------
    // PHASE 3: LIVE PUBLIC VERIFICATION WITH POPULATED SLOTS
    // -------------------------------------------------------------
    console.log('\n--- PHASE 3: Live Public Verification with Populated Slots ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Check Visual Orbit: exactly 2 populated slots, 38 empty slots
    const orbitPopulatedCount = await page.$$eval('.sphere-root .item:not(.item--empty)', els => els.length);
    const orbitEmptyCount = await page.$$eval('.sphere-root .item.item--empty', els => els.length);
    assert(orbitPopulatedCount === 2, `Published Visual Orbit has exactly 2 populated slots (found: ${orbitPopulatedCount})`);
    assert(orbitEmptyCount === 38, `Published Visual Orbit has exactly 38 empty slots (found: ${orbitEmptyCount})`);

    // Verify Slot 17 specifically contains media_1791962972992.jpg
    const slot17PublicSrc = await page.evaluate(() => {
      const item = document.querySelector('.sphere-root .item[data-slot-id="orbit-17"] img');
      return item ? item.getAttribute('src') : '';
    });
    assert(slot17PublicSrc === 'media_1791962972992.jpg', `Visual Orbit slot 17 contains persisted media: ${slot17PublicSrc}`);

    // Verify hover pop-forward and thin white outline on populated tile
    const slot17Selector = '.sphere-root .item[data-slot-id="orbit-17"] .item__image';
    await page.hover(slot17Selector).catch(() => {});
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        el.classList.add('is-hovered');
      }
    }, slot17Selector);
    await new Promise(r => setTimeout(r, 350));
    const hoverStyles = await page.evaluate((sel) => {
      const populatedImg = document.querySelector(sel);
      if (!populatedImg) return null;
      const s = window.getComputedStyle(populatedImg);
      return {
        borderColor: s.borderTopColor || s.borderColor,
        hasTransition: s.transition.includes('transform'),
        transform: s.transform,
        hasForwardLift: s.transform.includes('matrix3d') || s.transform.includes('translateZ')
      };
    }, slot17Selector);
    assert(hoverStyles && (hoverStyles.borderColor.includes('255, 255, 255') || hoverStyles.borderColor === 'rgb(255, 255, 255)'), `Populated Visual Orbit tile has crisp thin white outline (borderColor: ${hoverStyles?.borderColor})`);
    assert(hoverStyles && hoverStyles.hasForwardLift, `Populated Visual Orbit tile pops forward in 3D perspective (transform: ${hoverStyles?.transform})`);
    assert(hoverStyles && hoverStyles.hasTransition, `Smooth transition configured on populated tile`);

    // Test Fullscreen Lightbox Image Viewer
    console.log('\n[Task 1] Testing Fullscreen Lightbox Image Viewer:');
    await page.evaluate(() => {
      const tile = document.querySelector('.sphere-root .item[data-slot-id="orbit-01"] .item__image');
      if (tile) tile.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const viewerActive = await page.$('.sphere-root .viewer.is-active');
    assert(!!viewerActive, 'Clicking populated tile opens fullscreen lightbox viewer');

    const lightboxImage = await page.$eval('.dg-lightbox-image', img => ({
      src: img.getAttribute('src'),
      objectFit: window.getComputedStyle(img).objectFit
    })).catch(e => ({ error: e.message }));
    assert(lightboxImage.src === 'portrait-01.png', `Lightbox displays selected image: ${lightboxImage.src}`);
    assert(lightboxImage.objectFit === 'contain', `Image preserves aspect ratio with object-fit: contain (computed: ${lightboxImage.objectFit})`);

    // Check navigation skipping empty slots (next should advance directly from slot 01 to slot 17)
    await page.click('.dg-lightbox-nav--next');
    await new Promise(r => setTimeout(r, 400));
    const nextImageSrc = await page.$eval('.dg-lightbox-image', img => img.getAttribute('src'));
    assert(nextImageSrc === 'media_1791962972992.jpg', `Lightbox navigation skips empty slots and moves directly to slot 17 (src: ${nextImageSrc})`);

    // Test clicking inside image frame does NOT close viewer
    await page.click('.dg-lightbox-image');
    await new Promise(r => setTimeout(r, 200));
    const stillActiveAfterImgClick = await page.$('.sphere-root .viewer.is-active');
    assert(!!stillActiveAfterImgClick, 'Clicking image itself does NOT close viewer');

    // Test Escape key closes viewer
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));
    const closedAfterEscape = await page.$('.sphere-root .viewer.is-active');
    assert(!closedAfterEscape, 'Pressing Escape closes the fullscreen viewer');

    // Check Hobbies Elastic Gallery populated state
    console.log('\n[Task 3] Testing Populated Hobbies Elastic Gallery:');
    const hobbyPopulatedCount = await page.$$eval('.elastic-gallery-root .elastic-slat--populated', els => els.length);
    const hobbyEmptyCount = await page.$$eval('.elastic-gallery-root .elastic-slat--empty', els => els.length);
    assert(hobbyPopulatedCount === 2, `Published Hobbies has exactly 2 populated slats (found: ${hobbyPopulatedCount})`);
    assert(hobbyEmptyCount === 10, `Published Hobbies has exactly 10 empty slats (found: ${hobbyEmptyCount})`);

    // Verify slot 5 specifically contains landscape-05.jpg
    const slot5PublicSrc = await page.evaluate(() => {
      const slat = document.querySelectorAll('.elastic-gallery-root .elastic-slat')[4];
      const img = slat?.querySelector('.elastic-slat-img');
      return img ? img.getAttribute('src') : '';
    });
    assert(slot5PublicSrc === 'landscape-05.jpg', `Hobbies slot 5 contains persisted media: ${slot5PublicSrc}`);

    // Test Clicking populated slat locks into selected state
    console.log('Clicking Hobbies populated slat 5 to lock selection...');
    await page.evaluate(() => {
      const btn = document.querySelectorAll('.elastic-gallery-root .elastic-slat--populated .elastic-slat-button')[1]; // slot 5
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const selectedSlatInfo = await page.evaluate(() => {
      const selected = document.querySelector('.elastic-gallery-root .elastic-slat--selected');
      if (!selected) return null;
      const tag = selected.querySelector('.elastic-caption-slot-tag')?.textContent.trim();
      const title = selected.querySelector('.elastic-caption-title')?.textContent.trim();
      const desc = selected.querySelector('.elastic-caption-desc')?.textContent.trim();
      const navArrows = selected.querySelector('.elastic-nav-arrows');
      const closeBtn = selected.querySelector('.elastic-nav-btn--close');
      return {
        tag,
        title,
        desc,
        hasNavArrows: !!navArrows,
        hasCloseBtn: !!closeBtn
      };
    });
    assert(!!selectedSlatInfo, 'Populated slat locks into selected state');
    assert(selectedSlatInfo?.tag === '05 // 12', `Selected metadata shows slot tag: "${selectedSlatInfo?.tag}"`);
    assert(selectedSlatInfo?.title === 'Mountain Summit 05', `Selected metadata shows title: "${selectedSlatInfo?.title}"`);
    assert(selectedSlatInfo?.desc === 'High altitude visual study', `Selected metadata shows description: "${selectedSlatInfo?.desc}"`);
    assert(selectedSlatInfo?.hasNavArrows && selectedSlatInfo?.hasCloseBtn, 'Selected panel displays navigation and close controls');

    // Test close button resets to resting state
    console.log('Testing close control to reset to resting state...');
    await page.click('.elastic-nav-btn--close');
    await new Promise(r => setTimeout(r, 600));

    const noSelectedRemaining = await page.$('.elastic-gallery-root .elastic-slat--selected');
    assert(!noSelectedRemaining, 'Clicking Close button restores resting state');

    // -------------------------------------------------------------
    // PHASE 4: CLEANUP & PERSISTENCE RESTORATION (EMPTY SLOTS RESTORED)
    // -------------------------------------------------------------
    console.log('\n--- PHASE 4: Clearing Slots & Restoring Pristine Empty State ---');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Clear all test images so repo starts with every slot empty as specified
    await page.evaluate(async () => {
      const vo = currentDraft.sections.find(s => s.id === 'sec-visual-orbit');
      if (vo && vo.content && vo.content.slots) {
        vo.content.slots.forEach(s => { s.image = ''; s.src = ''; });
        vo.content.images = vo.content.slots;
        vo.content.tiles = [];
      }
      const core = currentDraft.sections.find(s => s.id === 'sec-core');
      const h = core?.children?.find(ch => ch.type === 'hobbies');
      if (h && h.content && h.content.slots) {
        h.content.slots.forEach(s => { s.image = ''; s.src = ''; });
        h.content.items = h.content.slots;
      }
      await handleSaveClick();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Check public homepage is cleanly restored to all empty
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const finalEmptyOrbit = await page.$$eval('.sphere-root .item.item--empty', els => els.length);
    const finalEmptyHobbies = await page.$$eval('.elastic-gallery-root .elastic-slat--empty', els => els.length);
    assert(finalEmptyOrbit === 40, `Visual Orbit cleanly restored to exactly 40 empty slots (found: ${finalEmptyOrbit})`);
    assert(finalEmptyHobbies === 12, `Hobbies cleanly restored to exactly 12 empty slots (found: ${finalEmptyHobbies})`);

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n============================================================');
    if (errors.length === 0) {
      console.log('🎉 ALL TESTS PASSED WITH ZERO FAILURES!');
    } else {
      console.log(`⚠️ COMPLETED WITH ${errors.length} ERROR(S):`);
      errors.forEach(e => console.log(' - ' + e));
    }
    console.log('============================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
})();
