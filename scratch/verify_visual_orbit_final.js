const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runVerification() {
  console.log('================================================================');
  console.log('ANTIGRAVITY — VISUAL ORBIT FINAL RECONSTRUCTION VERIFICATION');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Wait for dome-gallery-mount to be populated
  await page.waitForSelector('#dome-gallery-mount .sphere .item', { timeout: 10000 });

  // Give 1 second for any initial scripts to settle
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- PHASE 1 & 2: TILE COUNT & ASSET AUDIT ---');
  const tileAudit = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#dome-gallery-mount .sphere .item'));
    const images = Array.from(document.querySelectorAll('#dome-gallery-mount .sphere .item img'));
    const emptyPlaceholders = document.querySelectorAll('#dome-gallery-mount .empty-slot-tile, #dome-gallery-mount .item--empty');

    const sources = images.map(img => img.getAttribute('src') || '');
    const uniqueSources = new Set(sources);
    const nonDemoSources = sources.filter(s => !s.includes('unsplash') && !s.includes('twimg'));
    const emptySources = sources.filter(s => !s || s.trim() === '');

    const slotIds = items.map(it => it.getAttribute('data-slot-id'));
    const uniqueSlotIds = new Set(slotIds);

    const cols = items.map(it => it.getAttribute('data-col'));
    const rows = items.map(it => it.getAttribute('data-row'));

    return {
      totalItems: items.length,
      totalImages: images.length,
      emptyPlaceholdersCount: emptyPlaceholders.length,
      uniqueSourcesCount: uniqueSources.size,
      emptySourcesCount: emptySources.length,
      nonDemoSourcesCount: nonDemoSources.length,
      slotIdsCount: slotIds.length,
      uniqueSlotIdsCount: uniqueSlotIds.size,
      sampleSources: sources.slice(0, 10),
      colsSample: cols.slice(0, 10),
      rowsSample: rows.slice(0, 10)
    };
  });

  console.log('Tile Audit Results:', JSON.stringify(tileAudit, null, 2));

  assert(tileAudit.totalItems === 40, `Exactly 40 tile elements rendered (found: ${tileAudit.totalItems})`);
  assert(tileAudit.totalImages === 40, `Exactly 40 img elements rendered (found: ${tileAudit.totalImages})`);
  assert(tileAudit.emptyPlaceholdersCount === 0, `Zero empty placeholder tiles rendered (found: ${tileAudit.emptyPlaceholdersCount})`);
  assert(tileAudit.emptySourcesCount === 0, `Zero empty src attributes (found: ${tileAudit.emptySourcesCount})`);
  assert(tileAudit.uniqueSourcesCount === 40, `Exactly 40 unique, distinct image assets loaded (found: ${tileAudit.uniqueSourcesCount})`);
  assert(tileAudit.uniqueSlotIdsCount === 40, `Exactly 40 stable, unique slot IDs (found: ${tileAudit.uniqueSlotIdsCount})`);
  assert(tileAudit.nonDemoSourcesCount === 40, `Zero demo images used; all 40 are real portfolio assets (found: ${tileAudit.nonDemoSourcesCount})`);

  console.log('\n--- PHASE 4: ZERO IMAGE CROPPING & OBJECT-FIT CONTAIN ---');
  const croppingAudit = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('#dome-gallery-mount .sphere .item img'));
    const fitStyles = images.map(img => window.getComputedStyle(img).objectFit);
    const nonContain = fitStyles.filter(f => f !== 'contain');

    const containers = Array.from(document.querySelectorAll('#dome-gallery-mount .sphere .item__image'));
    const containerDisplays = containers.map(c => window.getComputedStyle(c).display);

    const wrap = document.getElementById('visual-orbit-gallery-wrap');
    const wrapStyle = wrap ? window.getComputedStyle(wrap) : null;

    return {
      totalImagesAudited: images.length,
      nonContainCount: nonContain.length,
      allContain: nonContain.length === 0,
      containerDisplay: containerDisplays[0],
      wrapOverflow: wrapStyle ? wrapStyle.overflow : null,
      wrapBg: wrapStyle ? wrapStyle.backgroundColor : null
    };
  });

  console.log('Cropping Audit Results:', JSON.stringify(croppingAudit, null, 2));
  assert(croppingAudit.allContain, `All 40 images use object-fit: contain (no cropping!)`);
  assert(croppingAudit.wrapOverflow === 'visible', `visual-orbit-gallery-wrap has overflow: visible`);

  console.log('\n--- PHASE 5: DOME GEOMETRY & CLEAN SURFACES ---');
  const surfaceAudit = await page.evaluate(() => {
    const mount = document.getElementById('dome-gallery-mount');
    const sphere = document.querySelector('#dome-gallery-mount .sphere');
    const root = document.querySelector('#dome-gallery-mount .sphere-root');
    const instructionPill = document.querySelector('.orbit-drag-hint');

    const mountStyle = window.getComputedStyle(mount);
    const rootStyle = window.getComputedStyle(root);

    return {
      mountBg: mountStyle.backgroundColor,
      rootBg: rootStyle.backgroundColor,
      instructionPillPresent: !!instructionPill && window.getComputedStyle(instructionPill).display !== 'none',
      hasSphere: !!sphere
    };
  });

  console.log('Surface Audit Results:', JSON.stringify(surfaceAudit, null, 2));
  assert(!surfaceAudit.instructionPillPresent, 'Persistent instruction pill is completely removed/hidden');

  console.log('\n--- PHASE 6: CONTINUOUS RIGHT-TO-LEFT ROTATION & POINTER PAUSE/RESUME ---');
  // Get initial transform of sphere
  const getSphereYaw = async () => {
    return page.evaluate(() => {
      const sphere = document.querySelector('#dome-gallery-mount .sphere');
      if (!sphere) return null;
      const transform = sphere.style.transform;
      // Match rotateY(Xdeg)
      const match = transform.match(/rotateY\(([-\d.]+)deg\)/);
      return match ? parseFloat(match[1]) : null;
    });
  };

  // Scroll Visual Orbit into view so mouse coordinates are inside the viewport
  await page.evaluate(() => {
    document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 500));

  // Move mouse away to ensure no hover initially
  await page.mouse.move(10, 10);
  await new Promise(r => setTimeout(r, 600));

  const yaw1 = await getSphereYaw();
  await new Promise(r => setTimeout(r, 800));
  const yaw2 = await getSphereYaw();

  console.log(`Yaw check over 800ms: ${yaw1}° -> ${yaw2}°`);
  // In right-to-left rotation, yaw decreases (moves in negative deg direction or wrap)
  const diff = yaw2 - yaw1;
  console.log(`Yaw delta: ${diff.toFixed(2)}°`);
  assert(Math.abs(diff) > 0.5, `Sphere is rotating automatically (delta: ${diff.toFixed(2)}°)`);
  assert(diff < 0 || (yaw1 < -170 && yaw2 > 170), `Rotation direction is right-to-left (negative yaw delta: ${diff.toFixed(2)}°)`);

  // Now test POINTER PAUSE: Move pointer inside dome
  console.log('Testing Pointer Hover-Pause: moving mouse to center of Visual Orbit...');
  const orbitBox = await page.evaluate(() => {
    const rect = document.getElementById('dome-gallery-mount').getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  console.log(`Moving mouse to (${orbitBox.x.toFixed(1)}, ${orbitBox.y.toFixed(1)})...`);
  await page.mouse.move(orbitBox.x, orbitBox.y);
  await new Promise(r => setTimeout(r, 400));

  const pausedYaw1 = await getSphereYaw();
  await new Promise(r => setTimeout(r, 700));
  const pausedYaw2 = await getSphereYaw();

  const pauseDiff = Math.abs(pausedYaw2 - pausedYaw1);
  console.log(`Yaw change while hovered over dome: ${pauseDiff.toFixed(2)}°`);
  assert(pauseDiff < 0.25, `Rotation paused while pointer is inside dome (change: ${pauseDiff.toFixed(2)}°)`);

  // Move pointer outside dome to test RESUME
  console.log('Testing Pointer Resume: moving mouse outside dome...');
  await page.mouse.move(10, 10);
  await new Promise(r => setTimeout(r, 300));

  const resumeYaw1 = await getSphereYaw();
  await new Promise(r => setTimeout(r, 700));
  const resumeYaw2 = await getSphereYaw();

  const resumeDiff = resumeYaw2 - resumeYaw1;
  console.log(`Yaw change after pointer exit: ${resumeDiff.toFixed(2)}°`);
  assert(Math.abs(resumeDiff) > 0.4, `Rotation resumed after pointer exited dome (change: ${resumeDiff.toFixed(2)}°)`);

  console.log('\n--- PHASE 7: HOVER POP-FORWARD & WHITE OUTLINE ---');
  // Hover over the first visible tile using Puppeteer native hover
  await page.hover('#dome-gallery-mount .sphere .item .item__image');
  await new Promise(r => setTimeout(r, 300));

  const hoverResult = await page.evaluate(() => {
    const tile = document.querySelector('#dome-gallery-mount .sphere .item .item__image');
    if (!tile) return { error: 'No tile found' };

    const computed = window.getComputedStyle(tile);
    const borderColor = computed.borderTopColor;
    const borderWidth = computed.borderTopWidth;
    const transform = computed.transform;

    return {
      borderColor,
      borderWidth,
      transform,
      hasWhiteBorder: borderColor.includes('255, 255, 255') || borderColor === 'rgb(255, 255, 255)' || borderColor === '#ffffff'
    };
  });

  console.log('Hover evaluation result:', JSON.stringify(hoverResult, null, 2));
  assert(hoverResult.hasWhiteBorder, `Hovered tile displays crisp white outline (found border: ${hoverResult.borderColor})`);

  console.log('\n--- PHASE 8: CLICK-TO-FULLSCREEN LIGHTBOX & PREV/NEXT ---');
  // Click on a tile
  await page.evaluate(() => {
    const tile = document.querySelector('#dome-gallery-mount .sphere .item .item__image');
    if (tile) tile.click();
  });

  await page.waitForSelector('.dg-lightbox-overlay', { timeout: 3000 });

  const lightboxAudit = await page.evaluate(() => {
    const overlay = document.querySelector('.dg-lightbox-overlay');
    const img = document.querySelector('.dg-lightbox-image');
    const prevBtn = document.querySelector('.dg-lightbox-btn--prev');
    const nextBtn = document.querySelector('.dg-lightbox-btn--next');
    const closeBtn = document.querySelector('.dg-lightbox-btn--close');

    const overlayStyle = window.getComputedStyle(overlay);
    const imgStyle = window.getComputedStyle(img);

    return {
      overlayBg: overlayStyle.backgroundColor,
      imgSrc: img ? img.getAttribute('src') : null,
      imgFit: imgStyle.objectFit,
      hasPrev: !!prevBtn,
      hasNext: !!nextBtn,
      hasClose: !!closeBtn,
      isScrollLocked: document.body.classList.contains('dg-scroll-lock')
    };
  });

  console.log('Lightbox audit result:', JSON.stringify(lightboxAudit, null, 2));
  assert(lightboxAudit.overlayBg === 'rgb(0, 0, 0)', 'Lightbox overlay has solid black background');
  assert(lightboxAudit.imgFit === 'contain', 'Lightbox image uses object-fit: contain (no cropping)');
  assert(lightboxAudit.hasPrev && lightboxAudit.hasNext && lightboxAudit.hasClose, 'Lightbox has Prev, Next, and Close buttons');
  assert(lightboxAudit.isScrollLocked, 'Document body has dg-scroll-lock applied');

  // Test next navigation
  const firstSrc = lightboxAudit.imgSrc;
  await page.click('.dg-lightbox-btn--next');
  await new Promise(r => setTimeout(r, 200));

  const secondSrc = await page.evaluate(() => {
    return document.querySelector('.dg-lightbox-image')?.getAttribute('src');
  });

  console.log(`Navigation check: ${firstSrc} -> ${secondSrc}`);
  assert(secondSrc && secondSrc !== firstSrc, `Lightbox Next button navigated to next image (${secondSrc})`);

  // Close lightbox with Escape key
  console.log('Closing lightbox via Escape key...');
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));

  const isClosed = await page.evaluate(() => {
    return !document.querySelector('.dg-lightbox-overlay') && !document.body.classList.contains('dg-scroll-lock');
  });
  assert(isClosed, 'Lightbox closed and scroll unlocked via Escape key');

  console.log('\n--- RESPONSIVE VIEWPORT TESTS (TABLET & MOBILE) ---');
  // Test Tablet Viewport
  console.log('Testing Tablet viewport (768x1024)...');
  await page.setViewport({ width: 768, height: 1024 });
  await new Promise(r => setTimeout(r, 400));
  const tabletCount = await page.evaluate(() => document.querySelectorAll('#dome-gallery-mount .sphere .item').length);
  assert(tabletCount === 40, `Tablet maintains exactly 40 tiles (found: ${tabletCount})`);

  // Test Mobile Viewport
  console.log('Testing Mobile viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 400));
  const mobileCount = await page.evaluate(() => document.querySelectorAll('#dome-gallery-mount .sphere .item').length);
  assert(mobileCount === 40, `Mobile maintains exactly 40 tiles (found: ${mobileCount})`);

  // Return to Desktop Viewport
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise(r => setTimeout(r, 400));

  // Take full screenshot of Visual Orbit section
  const visualOrbitSec = await page.$('#visual-orbit');
  if (visualOrbitSec) {
    const screenshotPath = path.join(__dirname, 'visual_orbit_final_verified.png');
    await visualOrbitSec.screenshot({ path: screenshotPath });
    console.log(`📸 Captured screenshot to ${screenshotPath}`);
  }

  await browser.close();
  console.log('\n================================================================');
  console.log('🎉 ALL VISUAL ORBIT FINAL RECONSTRUCTION ASSERTIONS PASSED!');
  console.log('================================================================');
}

runVerification().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
