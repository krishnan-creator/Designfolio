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
  console.log('VERIFICATION: VISUAL ORBIT SHARPNESS, CLEAN SURFACE & HOVER-PAUSE');
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
    console.log('Loading public homepage (http://localhost:3000)...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // ------------------------------------------------------------------
    // TEST 1: NO RECTANGULAR BACKING PANEL & CLEAN SURFACE
    // ------------------------------------------------------------------
    console.log('\n--- TEST 1: Clean Surface & Zero Rectangular Backing Panel ---');
    const surfaceStyles = await page.evaluate(() => {
      const root = document.querySelector('.sphere-root');
      const main = document.querySelector('.sphere-main');
      const stage = document.querySelector('.stage');
      const container = document.querySelector('.visual-orbit-container');
      const backdropGlow = document.querySelector('.visual-orbit-backdrop-glow');

      const isTransparent = (bg) => !bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';

      return {
        hasBackdropGlow: !!backdropGlow,
        rootBg: window.getComputedStyle(root).backgroundColor,
        mainBg: window.getComputedStyle(main).backgroundColor,
        stageBg: window.getComputedStyle(stage).backgroundColor,
        containerBg: window.getComputedStyle(container).backgroundColor,
        containerBorderRadius: window.getComputedStyle(container).borderRadius,
        containerBorder: window.getComputedStyle(container).borderStyle,
        isRootTransparent: isTransparent(window.getComputedStyle(root).backgroundColor),
        isMainTransparent: isTransparent(window.getComputedStyle(main).backgroundColor),
        isStageTransparent: isTransparent(window.getComputedStyle(stage).backgroundColor),
        isContainerTransparent: isTransparent(window.getComputedStyle(container).backgroundColor)
      };
    });

    assert(!surfaceStyles.hasBackdropGlow, 'visual-orbit-backdrop-glow element is completely removed from DOM');
    assert(surfaceStyles.isRootTransparent, `sphere-root has transparent background (found: ${surfaceStyles.rootBg})`);
    assert(surfaceStyles.isMainTransparent, `sphere-main has transparent background (found: ${surfaceStyles.mainBg})`);
    assert(surfaceStyles.isStageTransparent, `stage has transparent background (found: ${surfaceStyles.stageBg})`);
    assert(surfaceStyles.isContainerTransparent, `visual-orbit-container has transparent background (found: ${surfaceStyles.containerBg})`);
    assert(surfaceStyles.containerBorderRadius === '0px', `visual-orbit-container has zero border-radius rectangle (found: ${surfaceStyles.containerBorderRadius})`);

    // ------------------------------------------------------------------
    // TEST 2: REMOVE ALL UNINTENDED BLUR & VIGNETTES IN BOTH THEMES
    // ------------------------------------------------------------------
    console.log('\n--- TEST 2: Complete Removal of Blur & Vignette Overlays ---');
    const vignetteAudit = await page.evaluate(() => {
      const overlay = document.querySelector('.sphere-root .overlay');
      const overlayBlur = document.querySelector('.sphere-root .overlay--blur');
      const edgeTop = document.querySelector('.sphere-root .edge-fade--top');
      const edgeBottom = document.querySelector('.sphere-root .edge-fade--bottom');

      const tiles = Array.from(document.querySelectorAll('.sphere-root .item:not(.item--empty) img'));
      const anyTileBlurred = tiles.some(img => {
        const s = window.getComputedStyle(img);
        return s.filter.includes('blur') || s.backdropFilter.includes('blur');
      });

      return {
        hasOverlay: !!overlay,
        hasOverlayBlur: !!overlayBlur,
        hasEdgeTop: !!edgeTop,
        hasEdgeBottom: !!edgeBottom,
        anyTileBlurred
      };
    });

    assert(!vignetteAudit.hasOverlay, 'Radial darkening .overlay element removed from DomeGallery');
    assert(!vignetteAudit.hasOverlayBlur, 'Blurring .overlay--blur element removed from DomeGallery');
    assert(!vignetteAudit.hasEdgeTop && !vignetteAudit.hasEdgeBottom, 'Top and bottom .edge-fade gradient elements removed from DomeGallery');
    assert(!vignetteAudit.anyTileBlurred, 'Zero CSS blur filter applied to gallery image tiles');

    // Test in Light Theme as well
    console.log('\nTesting Light Theme clean surface...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await new Promise(r => setTimeout(r, 600));

    const lightThemeClean = await page.evaluate(() => {
      const root = document.querySelector('.sphere-root');
      const main = document.querySelector('.sphere-main');
      const sRoot = window.getComputedStyle(root);
      const sMain = window.getComputedStyle(main);
      const isTransparent = (bg) => !bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
      return {
        rootTransparent: isTransparent(sRoot.backgroundColor),
        mainTransparent: isTransparent(sMain.backgroundColor),
        rootBg: sRoot.backgroundColor
      };
    });
    assert(lightThemeClean.rootTransparent && lightThemeClean.mainTransparent, 'Light theme preserves 100% transparent surface without white/gray backing cards');

    // Restore Dark Theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise(r => setTimeout(r, 400));

    // ------------------------------------------------------------------
    // TEST 3: UHD IMAGE QUALITY & INTRINSIC RESOLUTION
    // ------------------------------------------------------------------
    console.log('\n--- TEST 3: UHD Image Quality on Dome Tiles & Lightbox ---');
    const imageQuality = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('.sphere-root .item:not(.item--empty) img'));
      return imgs.map(img => ({
        src: img.getAttribute('src'),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.clientWidth,
        displayHeight: img.clientHeight,
        objectFit: window.getComputedStyle(img).objectFit
      }));
    });

    console.log('Rendered Populated Images:', imageQuality);
    assert(imageQuality.length >= 4, `Found ${imageQuality.length} populated images with high-resolution sources`);
    const allHighRes = imageQuality.every(img => img.naturalWidth >= 700 || img.naturalHeight >= 700);
    assert(allHighRes, 'All populated images render high-resolution genuine sources (>= 700px intrinsic resolution)');
    assert(imageQuality.every(img => img.objectFit === 'cover'), 'Image tiles use object-fit: cover for crisp cropping');

    // ------------------------------------------------------------------
    // TEST 4: HOVER-PAUSE MOTION BEHAVIOR
    // ------------------------------------------------------------------
    console.log('\n--- TEST 4: Continuous Orbit & Hover-Pause Motion Behavior ---');
    await page.evaluate(() => {
      document.querySelector('#visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 600));

    // 4.1 Pointer OUTSIDE dome: Verify continuous right-to-left rotation
    await page.mouse.move(50, 50); // Outside gallery
    await new Promise(r => setTimeout(r, 300));

    const outsideRotation = await page.evaluate(async () => {
      const sphere = document.querySelector('.sphere-root .sphere');
      const getRotY = () => {
        const m = sphere.style.transform.match(/rotateY\(([-\d.]+)deg\)/);
        return m ? parseFloat(m[1]) : 0;
      };
      const r1 = getRotY();
      await new Promise(r => setTimeout(r, 600));
      const r2 = getRotY();
      return {
        r1,
        r2,
        delta: r2 - r1,
        movesRightToLeft: r2 < r1
      };
    });
    assert(outsideRotation.movesRightToLeft, `Pointer OUTSIDE dome: Rotates continuously right to left (delta: ${outsideRotation.delta?.toFixed(2)} deg)`);

    // 4.2 Pointer ENTERS dome: Verify rotation PAUSES immediately
    console.log('Moving pointer INTO dome interaction area...');
    const domeBox = await page.$eval('.sphere-root', el => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, width: r.width, top: r.top, height: r.height };
    });

    await page.mouse.move(domeBox.x, domeBox.y);
    await new Promise(r => setTimeout(r, 200));

    const pausedRotation = await page.evaluate(async () => {
      const sphere = document.querySelector('.sphere-root .sphere');
      const getRotY = () => {
        const m = sphere.style.transform.match(/rotateY\(([-\d.]+)deg\)/);
        return m ? parseFloat(m[1]) : 0;
      };
      const r1 = getRotY();
      await new Promise(r => setTimeout(r, 700));
      const r2 = getRotY();
      return {
        r1,
        r2,
        diff: Math.abs(r2 - r1)
      };
    });
    assert(pausedRotation.diff <= 0.05, `Pointer INSIDE dome: Rotation strictly PAUSES at current angle (angle change: ${pausedRotation.diff?.toFixed(3)} deg)`);

    // 4.3 Pointer moves over gaps and neighboring tiles: Verify rotation remains paused without flickering
    console.log('Moving pointer across gaps and tiles within dome...');
    await page.mouse.move(domeBox.x + 80, domeBox.y - 40, { steps: 5 });
    await new Promise(r => setTimeout(r, 300));
    await page.mouse.move(domeBox.x - 120, domeBox.y + 60, { steps: 5 });
    await new Promise(r => setTimeout(r, 300));

    const stillPaused = await page.evaluate(async () => {
      const sphere = document.querySelector('.sphere-root .sphere');
      const getRotY = () => {
        const m = sphere.style.transform.match(/rotateY\(([-\d.]+)deg\)/);
        return m ? parseFloat(m[1]) : 0;
      };
      const r1 = getRotY();
      await new Promise(r => setTimeout(r, 500));
      const r2 = getRotY();
      return { diff: Math.abs(r2 - r1) };
    });
    assert(stillPaused.diff <= 0.05, `Moving across tiles and internal gaps: Rotation stays paused without flickering (diff: ${stillPaused.diff?.toFixed(3)} deg)`);

    // 4.4 Pointer LEAVES dome: Verify rotation resumes smoothly
    console.log('Moving pointer OUTSIDE dome interaction area...');
    await page.mouse.move(50, 50); // Move outside
    await new Promise(r => setTimeout(r, 300));

    const resumedRotation = await page.evaluate(async () => {
      const sphere = document.querySelector('.sphere-root .sphere');
      const getRotY = () => {
        const m = sphere.style.transform.match(/rotateY\(([-\d.]+)deg\)/);
        return m ? parseFloat(m[1]) : 0;
      };
      const r1 = getRotY();
      await new Promise(r => setTimeout(r, 600));
      const r2 = getRotY();
      return {
        r1,
        r2,
        delta: r2 - r1,
        movesRightToLeft: r2 < r1
      };
    });
    assert(resumedRotation.movesRightToLeft, `Pointer LEAVES dome: Rotation resumes smoothly right-to-left (delta: ${resumedRotation.delta?.toFixed(2)} deg)`);

    // 4.5 Dragging & Releasing while pointer inside dome
    console.log('Testing Dragging priority & remaining paused while pointer stays inside...');
    await page.mouse.move(domeBox.x, domeBox.y);
    await new Promise(r => setTimeout(r, 200));

    // Drag left
    await page.mouse.down();
    await page.mouse.move(domeBox.x - 100, domeBox.y, { steps: 5 });
    await new Promise(r => setTimeout(r, 200));
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 600)); // Allow inertia to settle

    const postDragStayPaused = await page.evaluate(async () => {
      const sphere = document.querySelector('.sphere-root .sphere');
      const getRotY = () => {
        const m = sphere.style.transform.match(/rotateY\(([-\d.]+)deg\)/);
        return m ? parseFloat(m[1]) : 0;
      };
      const r1 = getRotY();
      await new Promise(r => setTimeout(r, 600));
      const r2 = getRotY();
      return { diff: Math.abs(r2 - r1) };
    });
    assert(postDragStayPaused.diff <= 0.05, `After drag ends with pointer inside dome: Remains paused until pointer exits (diff: ${postDragStayPaused.diff?.toFixed(3)} deg)`);

    // Now move pointer outside to confirm resumption
    await page.mouse.move(50, 50);
    await new Promise(r => setTimeout(r, 300));

    const postDragResume = await page.evaluate(async () => {
      const sphere = document.querySelector('.sphere-root .sphere');
      const getRotY = () => {
        const m = sphere.style.transform.match(/rotateY\(([-\d.]+)deg\)/);
        return m ? parseFloat(m[1]) : 0;
      };
      const r1 = getRotY();
      await new Promise(r => setTimeout(r, 600));
      const r2 = getRotY();
      return { movesRightToLeft: r2 < r1 };
    });
    assert(postDragResume.movesRightToLeft, 'Exiting dome after drag resumes continuous right-to-left orbit');

    // ------------------------------------------------------------------
    // TEST 5: FULLSCREEN LIGHTBOX & PRESERVED FUNCTIONALITY
    // ------------------------------------------------------------------
    console.log('\n--- TEST 5: Fullscreen Lightbox & Preserved Functions ---');
    await page.evaluate(() => {
      const tile = document.querySelector('.sphere-root .item[data-slot-id="orbit-01"] .item__image');
      if (tile) tile.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const lightboxCheck = await page.evaluate(() => {
      const overlay = document.querySelector('.dg-lightbox-overlay');
      const img = overlay?.querySelector('.dg-lightbox-image');
      const prev = overlay?.querySelector('.dg-lightbox-btn--prev');
      const next = overlay?.querySelector('.dg-lightbox-btn--next');
      const s = img ? window.getComputedStyle(img) : null;
      return {
        isOpen: !!overlay,
        src: img?.getAttribute('src'),
        objectFit: s?.objectFit,
        hasPrev: !!prev,
        hasNext: !!next,
        isSharp: s && !s.filter.includes('blur')
      };
    });

    assert(lightboxCheck.isOpen, 'Lightbox dialog opens upon clicking populated tile');
    assert(lightboxCheck.src.includes('Ramayana.png'), `Selected image displayed in lightbox: ${lightboxCheck.src}`);
    assert(lightboxCheck.objectFit === 'contain', `Preserves aspect ratio with object-fit: contain (found: ${lightboxCheck.objectFit})`);
    assert(lightboxCheck.isSharp, 'Fullscreen lightbox image has zero blur filter');

    // Test Escape to close
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));
    const closed = await page.evaluate(() => !document.querySelector('.dg-lightbox-overlay'));
    assert(closed, 'Escape key closes the fullscreen viewer cleanly');

    console.log('\nConsole error count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(e => console.log('  ⚠️', e));
    }

    if (errors.length === 0) {
      console.log('\n============================================================');
      console.log('🎉 ALL SHARPNESS, CLEAN SURFACE & HOVER-PAUSE TESTS PASSED!');
      console.log('============================================================\n');
    } else {
      console.log(`\n⚠️ COMPLETED WITH ${errors.length} ERROR(S):`);
      errors.forEach(e => console.log(` - ${e}`));
    }

  } catch (err) {
    console.error('Test Suite encountered an error:', err);
  } finally {
    await browser.close();
  }
})();
