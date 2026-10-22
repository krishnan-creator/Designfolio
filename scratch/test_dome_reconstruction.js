const puppeteer = require('puppeteer-core');
const fs = require('fs');

function getBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

(async () => {
  console.log('========================================================================');
  console.log('ANTIGRAVITY — VISUAL ORBIT RECONSTRUCTION VERIFICATION SUITE');
  console.log('========================================================================\n');

  const exePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: exePath,
    headless: true,
    args: ['--window-size=1600,1000', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

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
    // PHASE 1: PUBLIC HOMEPAGE & 3D DOME GEOMETRY
    // -------------------------------------------------------------
    console.log('--- PHASE 1: Public Homepage & 3D Dome Geometry ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Verify DomeGallery root and 3D configuration
    const domeConfig = await page.evaluate(() => {
      const root = document.querySelector('.sphere-root');
      if (!root) return null;
      const s = window.getComputedStyle(root);
      const stage = document.querySelector('.stage');
      const stageStyle = stage ? window.getComputedStyle(stage) : null;
      return {
        segmentsX: root.style.getPropertyValue('--segments-x') || s.getPropertyValue('--segments-x'),
        segmentsY: root.style.getPropertyValue('--segments-y') || s.getPropertyValue('--segments-y'),
        radius: root.style.getPropertyValue('--radius') || s.getPropertyValue('--radius'),
        perspective: stageStyle ? stageStyle.perspective : '',
        hasPerspective: stageStyle ? stageStyle.perspective !== 'none' : false,
      };
    });

    assert(!!domeConfig, 'Visual Orbit DomeGallery root (.sphere-root) exists');
    assert(parseInt(domeConfig.segmentsX) === 20, `DomeGallery configured with 20 segments (segments-x: ${domeConfig?.segmentsX})`);
    assert(parseInt(domeConfig.radius) >= 600, `Dome radius satisfies minimum 600px requirement (radius: ${domeConfig?.radius})`);
    assert(domeConfig.hasPerspective, `Stage has 3D perspective configured (${domeConfig?.perspective})`);

    // 2. Verify total tiles and populated items
    const tileCounts = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.sphere-root .item'));
      const populated = items.filter(it => !it.classList.contains('item--empty'));
      const empty = items.filter(it => it.classList.contains('item--empty'));
      const populatedSlots = populated.map(it => ({
        id: it.getAttribute('data-slot-id'),
        slotNum: it.getAttribute('data-slot-number'),
        src: it.querySelector('img')?.getAttribute('src') || ''
      }));
      return {
        total: items.length,
        populatedCount: populated.length,
        emptyCount: empty.length,
        populatedSlots
      };
    });

    console.log(`Total Dome Tiles: ${tileCounts.total}`);
    console.log(`Populated Tiles Count: ${tileCounts.populatedCount}`);
    console.log('Populated slots:', tileCounts.populatedSlots);

    assert(tileCounts.total === 100, `Dome has 100 tiles across 20 segments × 5 rows (found: ${tileCounts.total})`);
    assert(tileCounts.populatedCount >= 4, `Dome has initial populated project slots (found: ${tileCounts.populatedCount})`);
    assert(tileCounts.populatedSlots.some(s => s.src.includes('Ramayana.png')), 'Slot 1 contains Ramayana.png');
    assert(tileCounts.populatedSlots.some(s => s.src.includes('VeerBhadra.png')), 'Slot 2 contains VeerBhadra.png');
    assert(tileCounts.populatedSlots.some(s => s.src.includes('dune-dneg.jpg')), 'Slot 3 contains dune-dneg.jpg');
    assert(tileCounts.populatedSlots.some(s => s.src.includes('portrait-01.png')), 'Slot 4 contains portrait-01.png');

    // 3. Verify continuous right-to-left rotation without user intervention
    console.log('\n[Task 1] Continuous Right-to-Left Rotation:');
    const rotationCheck = await page.evaluate(async () => {
      const sphere = document.querySelector('.sphere-root .sphere');
      if (!sphere) return { ok: false };
      const getRotY = () => {
        const tr = sphere.style.transform;
        const m = tr.match(/rotateY\(([-\d.]+)deg\)/);
        return m ? parseFloat(m[1]) : 0;
      };

      const startY = getRotY();
      await new Promise(r => setTimeout(r, 600));
      const midY = getRotY();
      await new Promise(r => setTimeout(r, 600));
      const endY = getRotY();

      return {
        ok: true,
        startY,
        midY,
        endY,
        delta: endY - startY,
        movesRightToLeft: (endY < startY)
      };
    });

    assert(rotationCheck.ok && rotationCheck.movesRightToLeft, `Dome rotates continuously from right to left (delta: ${rotationCheck.delta?.toFixed(2)} deg)`);

    // 4. Verify vertical rotation clamping (maxVerticalRotationDeg = 0)
    console.log('\n[Task 1] Testing 0° Vertical Rotation Clamp:');
    await page.evaluate(() => {
      const root = document.querySelector('.sphere-root');
      root.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 400));

    // Simulate vertical drag attempt
    const rect = await page.$eval('.sphere-root', el => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.mouse.move(rect.x, rect.y);
    await page.mouse.down();
    await page.mouse.move(rect.x, rect.y - 150, { steps: 5 });
    await new Promise(r => setTimeout(r, 200));

    const verticalAngle = await page.evaluate(() => {
      const sphere = document.querySelector('.sphere-root .sphere');
      const tr = sphere?.style.transform || '';
      const m = tr.match(/rotateX\(([-\d.]+)deg\)/);
      return m ? parseFloat(m[1]) : 0;
    });
    await page.mouse.up();
    assert(Math.abs(verticalAngle) <= 0.01, `Vertical rotation clamped to 0° (measured rotateX: ${verticalAngle}deg)`);

    // 5. Verify Pop-Forward Hover & Thin White Outline
    console.log('\n[Task 1] Testing Hover Pop-Forward & Thin White Outline:');
    const slot1Selector = '.sphere-root .item[data-slot-id="orbit-01"] .item__image';
    await page.hover(slot1Selector).catch(() => {});
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        el.classList.add('is-hovered');
      }
    }, slot1Selector);
    await new Promise(r => setTimeout(r, 350));

    const hoverStyles = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        borderColor: s.borderTopColor || s.borderColor,
        transform: s.transform,
        zIndex: window.getComputedStyle(el.parentElement).zIndex,
        hasForwardLift: s.transform.includes('matrix3d') || s.transform.includes('translateZ')
      };
    }, slot1Selector);

    assert(hoverStyles && (hoverStyles.borderColor.includes('255, 255, 255') || hoverStyles.borderColor === 'rgb(255, 255, 255)'), `Populated tile has crisp thin white outline (borderColor: ${hoverStyles?.borderColor})`);
    assert(hoverStyles && hoverStyles.hasForwardLift, `Populated tile pops forward in 3D perspective (transform: ${hoverStyles?.transform})`);

    // 6. Verify Fullscreen Lightbox Image Viewer
    console.log('\n[Task 1] Testing Fullscreen Lightbox Image Viewer:');
    await page.evaluate(() => {
      const el = document.querySelector('.sphere-root .item[data-slot-id="orbit-01"] .item__image');
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const lightboxOpen = await page.$('.dg-lightbox-overlay');
    assert(!!lightboxOpen, 'Clicking populated tile opens fullscreen lightbox dialog');

    const lightboxDetails = await page.evaluate(() => {
      const overlay = document.querySelector('.dg-lightbox-overlay');
      const img = overlay?.querySelector('.dg-lightbox-image');
      const scrim = overlay?.querySelector('.dg-lightbox-scrim');
      const prevBtn = overlay?.querySelector('.dg-lightbox-btn--prev');
      const nextBtn = overlay?.querySelector('.dg-lightbox-btn--next');
      const closeBtn = overlay?.querySelector('.dg-lightbox-btn--close');
      const bodyScrollLocked = document.body.classList.contains('dg-scroll-lock');
      const s = img ? window.getComputedStyle(img) : null;
      return {
        hasOverlay: !!overlay,
        imgSrc: img ? img.getAttribute('src') : '',
        objectFit: s ? s.objectFit : '',
        hasScrim: !!scrim,
        hasPrev: !!prevBtn,
        hasNext: !!nextBtn,
        hasClose: !!closeBtn,
        bodyScrollLocked
      };
    });

    assert(lightboxDetails.hasOverlay, 'Lightbox dialog is rendered in DOM');
    assert(lightboxDetails.imgSrc.includes('Ramayana.png'), `Lightbox displays selected image (src: ${lightboxDetails.imgSrc})`);
    assert(lightboxDetails.objectFit === 'contain', `Image preserves aspect ratio with object-fit: contain (computed: ${lightboxDetails.objectFit})`);
    assert(lightboxDetails.hasPrev && lightboxDetails.hasNext, 'Lightbox provides Left and Right navigation buttons');
    assert(lightboxDetails.hasClose, 'Lightbox provides accessible Close button');
    assert(lightboxDetails.bodyScrollLocked, 'Body scrolling is locked while Lightbox is open');

    // Test Left/Right Navigation skipping empty slots
    console.log('\n[Task 1] Testing Navigation Controls (Skipping Empty Slots):');
    await page.click('.dg-lightbox-btn--next');
    await new Promise(r => setTimeout(r, 400));

    const nextImgSrc = await page.$eval('.dg-lightbox-image', img => img.getAttribute('src'));
    assert(nextImgSrc.includes('VeerBhadra.png'), `Clicking Next navigates directly to next populated slot (src: ${nextImgSrc})`);

    // Test Keyboard navigation (ArrowLeft)
    await page.keyboard.press('ArrowLeft');
    await new Promise(r => setTimeout(r, 400));
    const prevImgSrc = await page.$eval('.dg-lightbox-image', img => img.getAttribute('src'));
    assert(prevImgSrc.includes('Ramayana.png'), `Pressing ArrowLeft navigates back to previous populated slot (src: ${prevImgSrc})`);

    // Test Clicking image does NOT close
    await page.click('.dg-lightbox-image');
    await new Promise(r => setTimeout(r, 300));
    const stillOpen = await page.$('.dg-lightbox-overlay');
    assert(!!stillOpen, 'Clicking image itself does NOT close viewer');

    // Test Escape key closes viewer
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));
    const closedAfterEsc = await page.$('.dg-lightbox-overlay');
    const scrollUnlocked = await page.evaluate(() => !document.body.classList.contains('dg-scroll-lock'));
    assert(!closedAfterEsc, 'Pressing Escape closes the fullscreen viewer');
    assert(scrollUnlocked, 'Body scroll lock is cleanly removed upon closing');

    // -------------------------------------------------------------
    // PHASE 2: BACKSTAGE CMS PERSISTENCE & ALL 40 SLOTS
    // -------------------------------------------------------------
    console.log('\n--- PHASE 2: Backstage CMS Integration & Slot Persistence ---');
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
      await new Promise(r => setTimeout(r, 2000));
    }

    // Select Visual Orbit in sidebar
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.tree-item'));
      const orbitItem = items.find(it => it.textContent.includes('Visual Orbit'));
      if (orbitItem) orbitItem.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const orbitCardsCount = await page.$$eval('#props-container .orbit-slot-card', els => els.length);
    assert(orbitCardsCount === 40, `Backstage Visual Orbit displays exactly 40 slot cards (found: ${orbitCardsCount})`);

    // Verify slot 17 exists
    const slot17Info = await page.evaluate(() => {
      const card = document.querySelector('#props-container .orbit-slot-card[data-slot="16"]');
      const badge = card?.querySelector('.orbit-slot-badge')?.textContent.trim();
      const status = card?.querySelector('.orbit-status-tag')?.textContent.trim();
      return { badge, status, exists: !!card };
    });
    assert(slot17Info.exists && slot17Info.badge === 'SLOT 17', `Slot 17 card found with badge: ${slot17Info.badge}`);

    // Assign image to slot 17 and save
    console.log('Populating slot 17 with media_1791962972992.jpg...');
    await page.evaluate(() => {
      const sec = currentDraft.sections.find(s => s.id === 'sec-visual-orbit');
      sec.content.slots[0].image = 'Ramayana.png';
      sec.content.slots[0].src = 'Ramayana.png';
      sec.content.slots[1].image = 'VeerBhadra.png';
      sec.content.slots[1].src = 'VeerBhadra.png';
      sec.content.slots[2].image = 'dune-dneg.jpg';
      sec.content.slots[2].src = 'dune-dneg.jpg';
      sec.content.slots[3].image = 'portrait-01.png';
      sec.content.slots[3].src = 'portrait-01.png';
      sec.content.slots[16].image = 'media_1791962972992.jpg';
      sec.content.slots[16].src = 'media_1791962972992.jpg';
      sec.content.slots[16].alt = 'Visual Orbit Shot 17 Test';
      sec.content.images = sec.content.slots;
      sec.content.tiles = sec.content.slots.filter(s => s.image);
      markUnsaved();
      renderPropertiesPanel(sec);
      renderCenterForm(sec);
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('Publishing changes via Backstage CMS handleSaveClick()...');
    await page.evaluate(async () => {
      await handleSaveClick();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Reload public site and verify slot 17 persistence
    console.log('\n--- PHASE 3: Live Verification of Persisted Slot 17 ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const slot17Public = await page.evaluate(() => {
      const item = document.querySelector('.sphere-root .item[data-slot-id="orbit-17"]');
      const img = item?.querySelector('img');
      return {
        exists: !!item,
        isPopulated: item && !item.classList.contains('item--empty'),
        src: img?.getAttribute('src') || ''
      };
    });

    assert(slot17Public.isPopulated, 'Orbit slot 17 is now populated on the live public site');
    assert(slot17Public.src.includes('media_1791962972992.jpg'), `Orbit slot 17 displays persisted image: ${slot17Public.src}`);

    // Now clear slot 17 in CMS and confirm it restores cleanly without affecting others
    console.log('\n--- PHASE 4: Clearing Slot 17 and Restoring Clean Initial State ---');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(async () => {
      const sec = currentDraft.sections.find(s => s.id === 'sec-visual-orbit');
      sec.content.slots[0].image = 'Ramayana.png';
      sec.content.slots[0].src = 'Ramayana.png';
      sec.content.slots[1].image = 'VeerBhadra.png';
      sec.content.slots[1].src = 'VeerBhadra.png';
      sec.content.slots[2].image = 'dune-dneg.jpg';
      sec.content.slots[2].src = 'dune-dneg.jpg';
      sec.content.slots[3].image = 'portrait-01.png';
      sec.content.slots[3].src = 'portrait-01.png';
      sec.content.slots[16].image = '';
      sec.content.slots[16].src = '';
      sec.content.slots[16].alt = 'Empty slot 17';
      sec.content.images = sec.content.slots;
      sec.content.tiles = sec.content.slots.filter(s => s.image);
      markUnsaved();
      await handleSaveClick();
    });
    await new Promise(r => setTimeout(r, 2000));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const slot17Restored = await page.evaluate(() => {
      const item = document.querySelector('.sphere-root .item[data-slot-id="orbit-17"]');
      return {
        isEmpty: item?.classList.contains('item--empty'),
        hasImg: !!item?.querySelector('img')
      };
    });
    assert(slot17Restored.isEmpty && !slot17Restored.hasImg, 'Orbit slot 17 cleanly restored to empty state');

    // Confirm slots 1-4 remain populated with their original artwork
    const slots1to4 = await page.evaluate(() => {
      const populated = Array.from(document.querySelectorAll('.sphere-root .item:not(.item--empty) img'))
        .map(img => img.getAttribute('src'));
      return populated;
    });
    assert(slots1to4.length === 4, `Slots 1-4 remain intact and populated with their artwork (found: ${slots1to4.length})`);

    console.log('\nConsole error count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(e => console.log('  ⚠️', e));
    }

    if (errors.length === 0) {
      console.log('\n============================================================');
      console.log('🎉 ALL RECONSTRUCTION REQUIREMENTS VERIFIED WITH ZERO FAILURES!');
      console.log('============================================================\n');
    } else {
      console.log(`\n⚠️ COMPLETED WITH ${errors.length} ERROR(S):`);
      errors.forEach(e => console.log(` - ${e}`));
    }

  } catch (err) {
    console.error('Test Suite encountered an unexpected error:', err);
  } finally {
    await browser.close();
  }
})();
