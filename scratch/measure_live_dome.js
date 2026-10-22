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

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Wait for dome items to mount
  await page.waitForSelector('#dome-gallery-mount .item', { timeout: 10000 });

  // Scroll to Visual Orbit
  await page.evaluate(() => {
    document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1500));

  // Inspect DOM items and bounding boxes
  const metrics = await page.evaluate(() => {
    const root = document.querySelector('#dome-gallery-mount .sphere-root');
    const container = document.querySelector('.visual-orbit-container');
    const sphere = document.querySelector('#dome-gallery-mount .sphere');
    const items = Array.from(document.querySelectorAll('#dome-gallery-mount .item'));

    const rootRect = root.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Group items by row (0, 1, 2, 3)
    const rows = { 0: [], 1: [], 2: [], 3: [] };
    items.forEach((it) => {
      const r = parseInt(it.getAttribute('data-row'), 10);
      const imgWrap = it.querySelector('.item__image');
      const img = it.querySelector('img');
      const b = imgWrap ? imgWrap.getBoundingClientRect() : it.getBoundingClientRect();
      const itemB = it.getBoundingClientRect();
      rows[r].push({
        slotId: it.getAttribute('data-slot-id'),
        slotNumber: it.getAttribute('data-slot-number'),
        col: parseInt(it.getAttribute('data-col'), 10),
        row: r,
        rotX: it.style.getPropertyValue('--rot-x'),
        rotY: it.style.getPropertyValue('--rot-y'),
        width: b.width,
        height: b.height,
        top: b.top,
        bottom: b.bottom,
        left: b.left,
        right: b.right,
        itemTop: itemB.top,
        itemBottom: itemB.bottom,
        src: img ? img.getAttribute('src') : null,
        naturalWidth: img ? img.naturalWidth : 0,
        naturalHeight: img ? img.naturalHeight : 0,
        objectFit: img ? window.getComputedStyle(img).objectFit : null
      });
    });

    // Check top and bottom extremes of all visible tiles
    let minTop = Infinity;
    let maxBottom = -Infinity;
    items.forEach(it => {
      const imgWrap = it.querySelector('.item__image') || it;
      const b = imgWrap.getBoundingClientRect();
      if (b.top < minTop) minTop = b.top;
      if (b.bottom > maxBottom) maxBottom = b.bottom;
    });

    const topClearance = minTop - containerRect.top;
    const bottomClearance = containerRect.bottom - maxBottom;

    // Check row-to-row vertical gaps at the center (where tiles face forward):
    // For each col, check distance between bottom of row k and top of row k+1
    const centerCols = [0, 9, 1]; // tiles closest to theta = 0
    const rowGaps = [];
    for (let r = 0; r < 3; r++) {
      const rCurrent = rows[r];
      const rNext = rows[r + 1];
      // Compare center tiles
      const c1 = rCurrent.find(t => t.col === 0);
      const c2 = rNext.find(t => t.col === 0);
      if (c1 && c2) {
        // Vertical gap between bottom of c1 and top of c2
        const gap = c2.top - c1.bottom;
        rowGaps.push({ fromRow: r, toRow: r + 1, gap, c1Bottom: c1.bottom, c2Top: c2.top });
      }
    }

    return {
      totalItems: items.length,
      containerHeight: containerRect.height,
      containerWidth: containerRect.width,
      rootHeight: rootRect.height,
      rootWidth: rootRect.width,
      minTop,
      maxBottom,
      domeVisibleHeight: maxBottom - minTop,
      topClearance,
      bottomClearance,
      isFullyInsideContainer: topClearance >= 0 && bottomClearance >= 0,
      rowGaps,
      sampleTile: rows[1][0],
      radius: root.style.getPropertyValue('--radius'),
      itemWidthVar: root.style.getPropertyValue('--item-width'),
      itemHeightVar: root.style.getPropertyValue('--item-height')
    };
  });

  console.log('--- LIVE DOME MEASUREMENTS ---');
  console.log('Total items:', metrics.totalItems);
  console.log('CSS Variables:', { radius: metrics.radius, itemWidth: metrics.itemWidthVar, itemHeight: metrics.itemHeightVar });
  console.log('Container rect:', { width: metrics.containerWidth, height: metrics.containerHeight });
  console.log('Dome total visible height:', metrics.domeVisibleHeight.toFixed(1));
  console.log('Top clearance:', metrics.topClearance.toFixed(1), 'px | Bottom clearance:', metrics.bottomClearance.toFixed(1), 'px');
  console.log('Is completely inside container (no clipping):', metrics.isFullyInsideContainer);
  console.log('Row-to-row gaps at center:');
  metrics.rowGaps.forEach(g => {
    console.log(`  Row ${g.fromRow} -> Row ${g.toRow}: gap = ${g.gap.toFixed(1)}px (bottom ${g.c1Bottom.toFixed(1)} -> top ${g.c2Top.toFixed(1)})`);
  });
  console.log('Sample tile dimensions:', {
    width: metrics.sampleTile.width.toFixed(1),
    height: metrics.sampleTile.height.toFixed(1),
    objectFit: metrics.sampleTile.objectFit,
    naturalSize: `${metrics.sampleTile.naturalWidth}x${metrics.sampleTile.naturalHeight}`
  });

  // Capture screenshot of the dome section
  const domeSection = await page.$('#visual-orbit');
  const screenshotPath = path.join(__dirname, 'live_dome_repaired.png');
  await domeSection.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);

  await browser.close();
})();
