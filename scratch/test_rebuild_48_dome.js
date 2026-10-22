const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('--- NAVIGATING TO http://localhost:3000 ---');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Wait for dome items
  await page.waitForSelector('#dome-gallery-mount .item', { timeout: 10000 });

  // Scroll to Visual Orbit
  await page.evaluate(() => {
    document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Inspect 48-slot model and 6-row geometry
  const domeMetrics = await page.evaluate(async () => {
    const root = document.querySelector('#dome-gallery-mount .sphere-root');
    const container = document.querySelector('.visual-orbit-container');
    const sphere = document.querySelector('#dome-gallery-mount .sphere');
    const items = Array.from(document.querySelectorAll('#dome-gallery-mount .item'));

    const rootRect = root.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Verify 48 items
    const totalSlots = items.length;
    const slotIds = items.map(it => it.getAttribute('data-slot-id'));
    const uniqueSlotIds = Array.from(new Set(slotIds));

    // Group by row (0 to 3)
    const rowGroups = {};
    for (let r = 0; r <= 3; r++) rowGroups[r] = [];

    items.forEach(it => {
      const r = parseInt(it.getAttribute('data-row'), 10);
      const img = it.querySelector('img');
      const isEmpty = it.classList.contains('item--empty');
      const imgWrap = it.querySelector('.item__image');
      const b = imgWrap ? imgWrap.getBoundingClientRect() : it.getBoundingClientRect();
      if (rowGroups[r]) {
        rowGroups[r].push({
          id: it.getAttribute('data-slot-id'),
          slotNumber: it.getAttribute('data-slot-number'),
          col: parseInt(it.getAttribute('data-col'), 10),
          row: r,
          rotX: it.style.getPropertyValue('--rot-x'),
          rotY: it.style.getPropertyValue('--rot-y'),
          hasImg: !!img,
          src: img ? img.getAttribute('src') : null,
          isEmpty,
          objectFit: img ? window.getComputedStyle(img).objectFit : null,
          width: b.width,
          height: b.height,
          top: b.top,
          bottom: b.bottom,
          left: b.left,
          right: b.right
        });
      }
    });

    const rowCounts = Object.keys(rowGroups).map(r => rowGroups[r].length);

    // Check extremes across all tiles
    let minTop = Infinity, maxBottom = -Infinity;
    items.forEach(it => {
      const wrap = it.querySelector('.item__image') || it;
      const b = wrap.getBoundingClientRect();
      if (b.top < minTop) minTop = b.top;
      if (b.bottom > maxBottom) maxBottom = b.bottom;
    });

    const topClearance = minTop - containerRect.top;
    const bottomClearance = containerRect.bottom - maxBottom;

    // Check vertical row gaps at center between consecutive rows sorted TOP TO BOTTOM:
    // Row 0 (lat +22.5, top), Row 1 (lat +7.5), Row 2 (lat -7.5), Row 3 (lat -22.5, bottom)
    const visualRowOrder = [0, 1, 2, 3];
    const rowGaps = [];
    for (let i = 0; i < visualRowOrder.length - 1; i++) {
      const rUpper = visualRowOrder[i];
      const rLower = visualRowOrder[i + 1];
      const itemsUpper = rowGroups[rUpper];
      const itemsLower = rowGroups[rLower];
      const uTile = itemsUpper.find(t => t.col === 0) || itemsUpper[0];
      const lTile = itemsLower.find(t => t.col === 0) || itemsLower[0];
      if (uTile && lTile) {
        // Gap is lower tile top minus upper tile bottom
        const gapPx = lTile.top - uTile.bottom;
        rowGaps.push({ upperRow: rUpper, lowerRow: rLower, gapPx, upperBottom: uTile.bottom, lowerTop: lTile.top });
      }
    }

    // Check populated vs empty
    const populatedItems = items.filter(it => it.querySelector('img') && it.querySelector('img').getAttribute('src'));
    const emptyItems = items.filter(it => it.classList.contains('item--empty') || !it.querySelector('img'));

    // Check rotation over 800ms
    const parseRotY = (t) => {
      const m = t ? t.match(/rotateY\(([-0-9.]+)deg\)/) : null;
      return m ? parseFloat(m[1]) : null;
    };
    const t1 = sphere.style.transform;
    await new Promise(res => setTimeout(res, 800));
    const t2 = sphere.style.transform;
    const angle1 = parseRotY(t1);
    const angle2 = parseRotY(t2);

    return {
      totalSlots,
      uniqueSlotIdsCount: uniqueSlotIds.length,
      firstSlot: slotIds[0],
      lastSlot: slotIds[slotIds.length - 1],
      rowCounts,
      populatedCount: populatedItems.length,
      emptyCount: emptyItems.length,
      radiusVar: root.style.getPropertyValue('--radius'),
      itemWidthVar: root.style.getPropertyValue('--item-width'),
      itemHeightVar: root.style.getPropertyValue('--item-height'),
      containerHeight: containerRect.height,
      domeVisibleHeight: maxBottom - minTop,
      topClearance,
      bottomClearance,
      isFullyInsideContainer: topClearance >= 0 && bottomClearance >= 0,
      rowGaps,
      allImagesContain: populatedItems.every(it => window.getComputedStyle(it.querySelector('img')).objectFit === 'contain'),
      uniqueSrcCount: new Set(populatedItems.map(it => it.querySelector('img').getAttribute('src'))).size,
      angle1,
      angle2,
      isRotatingRightToLeft: angle2 !== null && angle1 !== null && angle2 < angle1,
      hasOverlayBlur: !!document.querySelector('#dome-gallery-mount .overlay--blur'),
      hasOverlayVignette: !!document.querySelector('#dome-gallery-mount .overlay--vignette')
    };
  });

  console.log('=== VISUAL ORBIT 48-SLOT (12x4) REGULAR DOME METRICS ===');
  console.log('Total slots:', domeMetrics.totalSlots, `(Expected: 48, First: ${domeMetrics.firstSlot}, Last: ${domeMetrics.lastSlot})`);
  console.log('Unique Slot IDs:', domeMetrics.uniqueSlotIdsCount);
  console.log('Row distribution:', domeMetrics.rowCounts, '(Expected: [12, 12, 12, 12])');
  console.log('Populated slots:', domeMetrics.populatedCount, '| Empty slots:', domeMetrics.emptyCount);
  console.log('Unique image sources:', domeMetrics.uniqueSrcCount, '(zero duplicate filler)');
  console.log('All images object-fit: contain:', domeMetrics.allImagesContain);
  console.log('Dome Radius:', domeMetrics.radiusVar, '| Item Width/Height fallbacks:', domeMetrics.itemWidthVar, 'x', domeMetrics.itemHeightVar);
  console.log('Container Height:', domeMetrics.containerHeight.toFixed(1) + 'px | Dome Visible Height:', domeMetrics.domeVisibleHeight.toFixed(1) + 'px');
  console.log('Clearance -> Top:', domeMetrics.topClearance.toFixed(1) + 'px | Bottom:', domeMetrics.bottomClearance.toFixed(1) + 'px');
  console.log('Zero edge clipping (100% inside container):', domeMetrics.isFullyInsideContainer);
  console.log('Top-to-Bottom row-to-row gaps (negative = tight interlocking overlap, small positive = hairline seam):');
  domeMetrics.rowGaps.forEach(g => {
    console.log(`  Row ${g.upperRow} -> Row ${g.lowerRow}: gap = ${g.gapPx.toFixed(1)}px (upper bottom ${g.upperBottom.toFixed(1)} -> lower top ${g.lowerTop.toFixed(1)})`);
  });
  console.log('Continuous Right-to-Left Orbit:', domeMetrics.isRotatingRightToLeft, `(${domeMetrics.angle1}° -> ${domeMetrics.angle2}°)`);
  console.log('Clean surface (no blur/vignette):', !domeMetrics.hasOverlayBlur && !domeMetrics.hasOverlayVignette);

  // 2. Test Pointer Pause & Resume
  const domeBox = await page.evaluate(() => {
    const el = document.getElementById('visual-orbit-gallery-wrap') || document.querySelector('#dome-gallery-mount .sphere-root');
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  });

  const parseRotYFromPage = () => page.evaluate(() => {
    const s = document.querySelector('#dome-gallery-mount .sphere');
    const m = s.style.transform.match(/rotateY\(([-0-9.]+)deg\)/);
    return m ? parseFloat(m[1]) : null;
  });

  // Move inside dome
  await page.mouse.move(domeBox.x + domeBox.width / 2, domeBox.y + domeBox.height / 2);
  await new Promise(r => setTimeout(r, 200));
  const pAngle1 = await parseRotYFromPage();
  await new Promise(r => setTimeout(r, 600));
  const pAngle2 = await parseRotYFromPage();
  const isPaused = pAngle1 === pAngle2;
  console.log('Pointer Enter Pauses Rotation:', isPaused, `(${pAngle1}° === ${pAngle2}°)`);

  // Move outside dome
  await page.mouse.move(5, 5);
  await new Promise(r => setTimeout(r, 800));
  const rAngle = await parseRotYFromPage();
  const isResumed = rAngle !== pAngle2;
  console.log('Pointer Leave Resumes Rotation:', isResumed, `(${pAngle2}° -> ${rAngle}°)`);

  // 3. Test Hover outline and Lightbox
  const hoverCheck = await page.evaluate(() => {
    const tile = document.querySelector('#dome-gallery-mount .item:not(.item--empty) .item__image');
    if (!tile) return null;
    tile.classList.add('is-hovered');
    const cs = window.getComputedStyle(tile);
    const border = cs.border;
    const boxs = cs.boxShadow;
    const tf = cs.transform;
    tile.classList.remove('is-hovered');
    return { border, boxs, tf };
  });
  console.log('Hover pop-forward outline test:', hoverCheck);

  // Lightbox click
  const lightboxResult = await page.evaluate(async () => {
    const firstImg = document.querySelector('#dome-gallery-mount .item:not(.item--empty) .item__image');
    if (!firstImg) return { error: 'No populated tile' };
    firstImg.click();
    await new Promise(res => setTimeout(res, 300));
    const overlay = document.querySelector('.dg-lightbox-overlay');
    const isOverlayOpen = !!overlay && window.getComputedStyle(overlay).display !== 'none';
    const isBlackBg = overlay ? window.getComputedStyle(overlay).backgroundColor === 'rgb(0, 0, 0)' : false;
    const img = document.querySelector('.dg-lightbox-image');
    const isScrollLocked = document.body.classList.contains('dg-scroll-lock');

    // Close with Escape
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(res => setTimeout(res, 200));
    const isClosed = !document.querySelector('.dg-lightbox-overlay');

    return { isOverlayOpen, isBlackBg, hasImageSrc: !!img?.getAttribute('src'), isScrollLocked, isClosed };
  });
  console.log('Lightbox test:', lightboxResult);

  // 4. Capture screenshot of the 6-row 48-slot dome
  const domeSection = await page.$('#visual-orbit');
  const screenshotPath = path.join(__dirname, 'rebuilt_48_dome.png');
  await domeSection.screenshot({ path: screenshotPath });
  console.log('Saved screenshot of rebuilt 48-slot dome to:', screenshotPath);

  // 5. Verify Backstage editor reflects 48 slots
  console.log('\n--- NAVIGATING TO http://localhost:3000/backstage ---');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });

  // Handle auth overlay if present
  const isAuthVisible = await page.evaluate(() => {
    const el = document.getElementById('auth-overlay');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  if (isAuthVisible) {
    console.log('Entering Backstage auth password...');
    await page.type('#auth-password', 'cbk2026');
    await page.click('#auth-submit-btn');
    await new Promise(r => setTimeout(r, 1500));
  }

  // Select Visual Orbit in Backstage
  await page.evaluate(() => {
    if (window.selectSection) {
      window.selectSection('sec-visual-orbit');
    }
  });
  await new Promise(r => setTimeout(r, 800));

  const backstageOrbit = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#props-container .orbit-slot-card'));
    const populated = cards.filter(c => c.classList.contains('populated'));
    const empty = cards.filter(c => c.classList.contains('empty'));
    const title = document.querySelector('#props-container .orbit-panel-title')?.textContent.trim();
    const firstCardNumber = cards[0]?.querySelector('.orbit-slot-number')?.textContent.trim();
    const lastCardNumber = cards[cards.length - 1]?.querySelector('.orbit-slot-number')?.textContent.trim();
    return {
      totalCards: cards.length,
      populatedCount: populated.length,
      emptyCount: empty.length,
      title,
      firstCardNumber,
      lastCardNumber
    };
  });
  console.log('Backstage Visual Orbit:', backstageOrbit);

  await browser.close();
  console.log('\n=== VERIFICATION FINISHED ===');
})();
