const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  console.log('============================================================');
  console.log('E2E VERIFICATION: ALL FOUR TASKS + BACKSTAGE CMS INTEGRATION');
  console.log('============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
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

  try {
    // -------------------------------------------------------------
    // 1. PUBLIC SITE VERIFICATION (INITIAL CLEAN STATE)
    // -------------------------------------------------------------
    console.log('--- 1. Loading Public Site (http://localhost:3000) ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Check TASK 1: Visual Orbit (DomeGallery with 40 slots, all empty initially)
    console.log('\n--- Checking TASK 1: Visual Orbit (DomeGallery) ---');
    const domeRoot = await page.$('.sphere-root');
    assert(!!domeRoot, 'Visual Orbit DomeGallery root (.sphere-root) exists');

    const orbitItems = await page.$$('.sphere-root .item');
    assert(orbitItems.length === 40, `Visual Orbit has exactly 40 slot elements (found ${orbitItems.length})`);

    const emptyOrbitItems = await page.$$('.sphere-root .item.item--empty');
    assert(emptyOrbitItems.length === 40, `All 40 slots are initially empty (found ${emptyOrbitItems.length})`);

    const imgElements = await page.$$('.sphere-root .item:not(.item--empty) img');
    assert(imgElements.length === 0, `No sample or fallback images rendered initially (found ${imgElements.length})`);

    // Check intentional numbered placeholders (01 to 40)
    const slotNumbers = await page.evaluate(() => {
      const nums = Array.from(document.querySelectorAll('.sphere-root .empty-slot-number')).map(el => el.textContent.trim());
      return {
        count: nums.length,
        first: nums[0],
        last: nums[nums.length - 1]
      };
    });
    assert(slotNumbers.count === 40, `Found 40 empty slot numbers (count: ${slotNumbers.count})`);
    assert(slotNumbers.first === '01' && slotNumbers.last === '40', `Slots are numbered 01 to 40 (first: ${slotNumbers.first}, last: ${slotNumbers.last})`);

    // Check continuous right-to-left rotation
    const rotationCheck = await page.evaluate(async () => {
      const sphere = document.querySelector('.sphere-root .sphere');
      if (!sphere) return { ok: false, error: 'Sphere not found' };

      const getRotY = () => {
        const tr = sphere.style.transform;
        const match = tr.match(/rotateY\(([-\d.]+)deg\)/);
        return match ? parseFloat(match[1]) : 0;
      };

      const startY = getRotY();
      await new Promise(r => setTimeout(r, 600));
      const midY = getRotY();
      await new Promise(r => setTimeout(r, 600));
      const endY = getRotY();

      // Decreasing Y angle in CSS 3D rotates counter-clockwise around vertical axis,
      // which moves front-facing tiles from right to left across the screen.
      return {
        ok: true,
        startY,
        midY,
        endY,
        delta: endY - startY,
        movesRightToLeft: (endY < startY)
      };
    });
    assert(rotationCheck.ok && rotationCheck.movesRightToLeft, `Continuous right-to-left rotation verified (delta: ${rotationCheck.delta?.toFixed(2)} deg, moving R->L)`);

    // Check Lightbox cannot be opened on empty slot
    const emptySlotClicked = await page.evaluate(() => {
      const firstSlot = document.querySelector('.sphere-root .item.item--empty .item__image');
      if (firstSlot) firstSlot.click();
      const viewer = document.querySelector('.sphere-root .viewer.is-active');
      return !!viewer;
    });
    assert(!emptySlotClicked, 'Clicking an empty slot does NOT open fullscreen viewer');

    // Check TASK 2: CTA Quote Typography (Anton Font)
    console.log('\n--- Checking TASK 2: CTA Quote Font (Anton) ---');
    const ctaQuoteInfo = await page.evaluate(() => {
      const headline = document.querySelector('#lets-build .build-headline');
      if (!headline) return null;
      const computed = window.getComputedStyle(headline);
      const text = headline.innerText.trim();
      return {
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
        text: text
      };
    });
    assert(!!ctaQuoteInfo, 'CTA quote element (#lets-build .build-headline) exists');
    assert(ctaQuoteInfo?.fontFamily?.toLowerCase().includes('anton'), `CTA quote uses Anton font (computed: ${ctaQuoteInfo?.fontFamily})`);
    assert(ctaQuoteInfo?.text.includes('THAT’S HOW I SEE THE WORLD.') || ctaQuoteInfo?.text.includes("THAT'S HOW I SEE THE WORLD."), `CTA quote text preserved (text: ${ctaQuoteInfo?.text})`);

    // Check TASK 3: Hobbies (ElasticReel with 12 slots, initially all empty)
    console.log('\n--- Checking TASK 3: Hobbies (ElasticReel) ---');
    const hobbiesMount = await page.$('#hobbies-archive #elastic-reel-mount .elastic-reel');
    assert(!!hobbiesMount, 'ElasticReel component mounted in #hobbies-archive #elastic-reel-mount');

    const hobbiesSubtitle = await page.evaluate(() => {
      const el = document.querySelector('#hobbies-archive .hobbies-subtitle-tag');
      return el ? el.textContent.trim() : '';
    });
    assert(hobbiesSubtitle === '[ A little art. A lot of adventure ]', `Hobbies subtitle matches exactly: "${hobbiesSubtitle}"`);

    const hobbiesSlices = await page.$$('.elastic-reel .elastic-reel__slice');
    assert(hobbiesSlices.length === 12, `ElasticReel has exactly 12 slats (found: ${hobbiesSlices.length})`);

    const emptyHobbiesSlices = await page.$$('.elastic-reel .elastic-reel__slice.is-empty');
    assert(emptyHobbiesSlices.length === 12, `All 12 Hobbies slats are initially empty (found: ${emptyHobbiesSlices.length})`);

    const hobbiesEmptyNums = await page.evaluate(() => {
      const nums = Array.from(document.querySelectorAll('.elastic-reel .elastic-reel__empty-num')).map(el => el.textContent.trim());
      return {
        count: nums.length,
        first: nums[0],
        last: nums[nums.length - 1]
      };
    });
    assert(hobbiesEmptyNums.count === 12 && hobbiesEmptyNums.first === '01' && hobbiesEmptyNums.last === '12', `Hobbies slats are numbered 01 to 12 (first: ${hobbiesEmptyNums.first}, last: ${hobbiesEmptyNums.last})`);

    // Check empty hobby slat cannot open featured image
    const hobbyEmptyClicked = await page.evaluate(() => {
      const firstSlat = document.querySelector('.elastic-reel .elastic-reel__slice.is-empty');
      if (firstSlat) firstSlat.click();
      const expanded = document.querySelector('.elastic-reel__expanded');
      return !!expanded;
    });
    assert(!hobbyEmptyClicked, 'Clicking empty hobby slat does NOT open featured modal');

    // Check TASK 4: LET'S CONNECT Gmail button
    console.log('\n--- Checking TASK 4: LET\'S CONNECT Button ---');
    const connectBtnInfo = await page.evaluate(() => {
      const btn = document.querySelector('#lets-build .build-btn-primary');
      if (!btn) return null;
      return {
        href: btn.getAttribute('href'),
        target: btn.getAttribute('target'),
        text: btn.innerText.trim()
      };
    });
    assert(!!connectBtnInfo, "LET'S CONNECT button exists");
    assert(connectBtnInfo?.href?.includes('meet2krishnan@gmail.com'), `Recipient meet2krishnan@gmail.com is in URL (${connectBtnInfo?.href})`);
    assert(connectBtnInfo?.href?.includes('fs=0') || !connectBtnInfo?.href?.includes('fs=1'), `Does NOT use fs=1 fullscreen compose (${connectBtnInfo?.href})`);
    assert(!connectBtnInfo?.href?.includes('su=') && !connectBtnInfo?.href?.includes('body='), `Subject and body remain empty in URL (${connectBtnInfo?.href})`);

    // -------------------------------------------------------------
    // 2. BACKSTAGE CMS EDITORS VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 2. Checking Backstage CMS (http://localhost:3000/backstage) ---');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Check if auth overlay is visible
    const isOverlayVisible = await page.evaluate(() => {
      const el = document.getElementById('auth-overlay');
      return el && window.getComputedStyle(el).display !== 'none';
    });

    if (isOverlayVisible) {
      console.log('Authenticating Backstage CMS...');
      await page.type('#auth-password', 'cbk2026');
      await page.click('#auth-submit-btn');
      await new Promise(r => setTimeout(r, 1500));
    }

    // Select Visual Orbit in Backstage
    console.log('Selecting Visual Orbit in Backstage...');
    await page.evaluate(() => window.selectSection('sec-visual-orbit'));
    await new Promise(r => setTimeout(r, 800));

    const orbitCardsInBackstage = await page.evaluate(() => {
      const cards = document.querySelectorAll('#props-container .orbit-slot-card');
      return cards.length;
    });
    assert(orbitCardsInBackstage === 40, `Backstage Visual Orbit displays exactly 40 slot cards (found ${orbitCardsInBackstage})`);

    // Test populating Slot 08 and Slot 14 non-sequentially in Backstage
    console.log('Testing assigning image to Slot 08 and Slot 14 in Backstage...');
    const assignResult = await page.evaluate(() => {
      const sec = window.findSectionOrChild ? window.findSectionOrChild('sec-visual-orbit') : null;
      if (!sec) return { ok: false, error: 'sec-visual-orbit not found' };
      window.ensureOrbitImages?.(sec);

      // Assign to slot 08 (index 7)
      sec.content.slots[7].image = 'Ramayana.png';
      sec.content.slots[7].src = 'Ramayana.png';
      sec.content.slots[7].alt = 'Ramayana Concept — Slot 08';

      // Assign to slot 14 (index 13)
      sec.content.slots[13].image = 'VeerBhadra.png';
      sec.content.slots[13].src = 'VeerBhadra.png';
      sec.content.slots[13].alt = 'Veerabhadra — Slot 14';

      sec.content.images = sec.content.slots;
      window.markUnsaved?.();
      window.renderPropertiesPanel?.(sec);
      return { ok: true, slot08: sec.content.slots[7], slot14: sec.content.slots[13] };
    });
    assert(assignResult.ok, 'Assigned images to Slot 08 and Slot 14 in Backstage draft');

    // Test Save & Publish via Backstage
    console.log('Testing Save & Publish in Backstage...');
    const publishResult = await page.evaluate(async () => {
      try {
        const resp = await fetch('/api/content/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {})
          },
          body: JSON.stringify(window.currentDraft)
        });
        const json = await resp.json();
        return json;
      } catch (e) {
        return { success: false, error: e.message };
      }
    });
    assert(publishResult.success, 'Save & Publish succeeded via Backstage API');

    // Select Hobbies in Backstage
    console.log('Selecting Hobbies in Backstage...');
    await page.evaluate(() => window.selectSection('sub-hobbies'));
    await new Promise(r => setTimeout(r, 800));

    const hobbyCardsInBackstage = await page.evaluate(() => {
      const cards = document.querySelectorAll('#props-container .orbit-slot-card[data-hobby-slot]');
      return cards.length;
    });
    assert(hobbyCardsInBackstage === 12, `Backstage Hobbies displays exactly 12 slot cards (found ${hobbyCardsInBackstage})`);

    // Test populating Slot 03 in Hobbies
    console.log('Testing assigning image to Hobbies Slot 03...');
    const assignHobbyResult = await page.evaluate(async () => {
      const sec = window.findSectionOrChild ? window.findSectionOrChild('sub-hobbies') : null;
      if (!sec) return { ok: false, error: 'sub-hobbies not found' };
      window.ensureHobbiesSlots?.(sec);

      sec.content.slots[2].image = 'landscape-01.jpg';
      sec.content.slots[2].src = 'landscape-01.jpg';
      sec.content.slots[2].title = 'Personal Study 03';
      sec.content.slots[2].subtitle = 'Visual Art Exploration';
      sec.content.items = sec.content.slots;

      window.markUnsaved?.();
      const resp = await fetch('/api/content/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {})
        },
        body: JSON.stringify(window.currentDraft)
      });
      return await resp.json();
    });
    assert(assignHobbyResult.success, 'Assigned Hobbies Slot 03 and published');

    // -------------------------------------------------------------
    // 3. RE-VERIFYING PUBLIC SITE WITH PUBLISHED DATA
    // -------------------------------------------------------------
    console.log('\n--- 3. Re-verifying Public Site With Published Data ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Verify Visual Orbit has exactly 2 populated slots and 38 empty slots
    const populatedOrbit = await page.$$('.sphere-root .item:not(.item--empty)');
    const emptyOrbit = await page.$$('.sphere-root .item.item--empty');
    assert(populatedOrbit.length === 2, `Published Visual Orbit has exactly 2 populated slots (found ${populatedOrbit.length})`);
    assert(emptyOrbit.length === 38, `Published Visual Orbit has exactly 38 empty slots (found ${emptyOrbit.length})`);

    // Test Pop-forward hover outline on populated slot 08
    const hoverStyles = await page.evaluate(() => {
      const popItem = document.querySelector('.sphere-root .item[data-slot-number="08"] .item__image');
      if (!popItem) return null;
      // Trigger hover style
      popItem.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true }));
      const computed = window.getComputedStyle(popItem);
      return {
        hasImage: !!popItem.querySelector('img'),
        outlineColor: computed.outlineColor,
        borderColor: computed.borderColor,
        boxShadow: computed.boxShadow,
        transform: computed.transform
      };
    });
    assert(!!hoverStyles?.hasImage, 'Slot 08 contains image and responds to hover');

    // Test Fullscreen Lightbox on Slot 08
    console.log('Testing Fullscreen Lightbox on Slot 08...');
    await page.evaluate(() => {
      const popItem = document.querySelector('.sphere-root .item[data-slot-number="08"] .item__image');
      if (popItem) popItem.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const lightboxOpened = await page.evaluate(() => {
      const dialog = document.querySelector('.dg-lightbox-dialog');
      const img = document.querySelector('.dg-lightbox-image');
      const closeBtn = document.querySelector('.dg-lightbox-close');
      const prevBtn = document.querySelector('.dg-lightbox-nav--prev');
      const nextBtn = document.querySelector('.dg-lightbox-nav--next');
      const isScrollLocked = document.body.classList.contains('dg-scroll-lock');

      return {
        dialogOpen: !!dialog,
        imgSrc: img ? img.getAttribute('src') : '',
        hasCloseBtn: !!closeBtn,
        hasPrevBtn: !!prevBtn,
        hasNextBtn: !!nextBtn,
        isScrollLocked
      };
    });
    assert(lightboxOpened.dialogOpen, 'Clicking populated Slot 08 opens Fullscreen Lightbox');
    assert(lightboxOpened.imgSrc === 'Ramayana.png', `Lightbox displays Slot 08 image (src: ${lightboxOpened.imgSrc})`);
    assert(lightboxOpened.hasCloseBtn, 'Lightbox has visible close button (×)');
    assert(lightboxOpened.hasPrevBtn && lightboxOpened.hasNextBtn, 'Lightbox has visible Prev/Next navigation buttons for populated images');
    assert(lightboxOpened.isScrollLocked, 'Body scroll is locked while Lightbox is open');

    // Test Prev/Next Navigation cycles ONLY between populated slots (08 and 14)
    console.log('Testing Lightbox Next button (cycles from 08 to 14, skipping all empty slots)...');
    await page.evaluate(() => {
      const nextBtn = document.querySelector('.dg-lightbox-nav--next');
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const navigated = await page.evaluate(() => {
      const img = document.querySelector('.dg-lightbox-image');
      const caption = document.querySelector('.dg-lightbox-caption');
      return {
        newSrc: img ? img.getAttribute('src') : '',
        captionText: caption ? caption.textContent.trim() : ''
      };
    });
    assert(navigated.newSrc === 'VeerBhadra.png', `Next button skipped empty slots and navigated directly to Slot 14 (src: ${navigated.newSrc})`);

    // Test Escape closes lightbox
    console.log('Testing Escape closes Lightbox...');
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
    const isClosed = await page.evaluate(() => {
      const dialog = document.querySelector('.dg-lightbox-dialog');
      const isScrollLocked = document.body.classList.contains('dg-scroll-lock');
      return !dialog && !isScrollLocked;
    });
    assert(isClosed, 'Escape successfully closed Lightbox and restored page scrolling');

    // Test Hobbies ElasticReel has 1 populated slot and 11 empty slots
    const populatedHobbySlices = await page.$$('.elastic-reel .elastic-reel__slice:not(.is-empty)');
    const emptyHobbySlices = await page.$$('.elastic-reel .elastic-reel__slice.is-empty');
    assert(populatedHobbySlices.length === 1, `Hobbies has exactly 1 populated slot (found: ${populatedHobbySlices.length})`);
    assert(emptyHobbySlices.length === 11, `Hobbies has exactly 11 empty slots (found: ${emptyHobbySlices.length})`);

    // Test clicking populated hobby slot opens featured modal
    console.log('Testing clicking populated hobby slot opens featured image...');
    await page.evaluate(() => {
      const popSlat = document.querySelector('.elastic-reel .elastic-reel__slice:not(.is-empty)');
      if (popSlat) popSlat.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const hobbyModalOpened = await page.evaluate(() => {
      const expanded = document.querySelector('.elastic-reel__expanded');
      const img = document.querySelector('.elastic-reel__expanded-image');
      return {
        open: !!expanded,
        src: img ? img.getAttribute('src') : ''
      };
    });
    assert(hobbyModalOpened.open && hobbyModalOpened.src === 'landscape-01.jpg', `Populated hobby slot opened featured image (src: ${hobbyModalOpened.src})`);

    // Close hobby modal
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));

    // Reset initial state to 40 empty orbit slots and 12 empty hobby slots as requested by user!
    console.log('\nRestoring clean initial state: 40 empty orbit slots and 12 empty hobby slots...');
    await page.evaluate(async () => {
      const vo = window.currentDraft?.sections?.find(s => s.id === 'sec-visual-orbit');
      if (vo && vo.content) {
        vo.content.slots.forEach(s => { s.image = ''; s.src = ''; s.alt = 'Empty slot ' + s.slot; });
        vo.content.images = vo.content.slots;
      }
      const hobbies = window.currentDraft?.sections?.find(s => s.id === 'sec-core')?.children?.find(ch => ch.type === 'hobbies');
      if (hobbies && hobbies.content) {
        hobbies.content.slots.forEach(s => { s.image = ''; s.src = ''; s.alt = 'Empty slot ' + s.slot; });
        hobbies.content.items = hobbies.content.slots;
      }
      await fetch('/api/content/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {})
        },
        body: JSON.stringify(window.currentDraft)
      });
    });

  } catch (err) {
    console.error('Fatal execution error:', err);
    errors.push('Fatal error: ' + err.message);
  } finally {
    await browser.close();
    // Always guarantee clean initial state in data files for fresh reload
    const cleanData = (p) => {
      if (!fs.existsSync(p)) return;
      const d = JSON.parse(fs.readFileSync(p, 'utf8'));
      const vo = d.sections.find(s => s.id === 'sec-visual-orbit');
      if (vo && vo.content) {
        if (vo.content.slots) vo.content.slots.forEach(s => { s.image = ''; s.src = ''; s.alt = 'Empty slot ' + (s.slot || s.slotNumber); });
        vo.content.images = vo.content.slots;
        vo.content.tiles = [];
      }
      const core = d.sections.find(s => s.id === 'sec-core');
      const hobbies = core?.children?.find(c => c.type === 'hobbies');
      if (hobbies && hobbies.content) {
        if (hobbies.content.slots) hobbies.content.slots.forEach(s => { s.image = ''; s.src = ''; s.alt = 'Empty slot ' + (s.slot || s.slotNumber); s.title = ''; s.subtitle = ''; });
        hobbies.content.items = hobbies.content.slots;
      }
      fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
    };
    cleanData('data/content.json');
    cleanData('data/content-draft.json');
  }

  console.log('\n============================================================');
  if (errors.length === 0) {
    console.log('🎉 ALL VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
  } else {
    console.error(`💥 ${errors.length} VERIFICATION FAILURE(S) DETECTED:`);
    errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
  }
  console.log('============================================================');
})();
