const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('===============================================================');
  console.log('  CBK DESIGNFOLIO — WIDE CINEMATIC SCROLL STACK VERIFICATION   ');
  console.log('===============================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  // Test at 1920x1080 to test full 1584px width
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setCacheEnabled(false);

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('\n[NAVIGATING TO http://localhost:3000/]');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  // -------------------------------------------------------------
  // TEST 1: DOM STRUCTURE & HIERARCHY
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: DOM STRUCTURE & 4-TIER HIERARCHY ---');
  const hierarchy = await page.evaluate(() => {
    const section = document.querySelector('.beyond-frame-section');
    const inner = document.querySelector('.beyond-frame-inner');
    const meta = document.querySelector('.beyond-frame-meta');
    const wordmarkTrack = document.querySelector('.beyond-frame-wordmark-track');
    const wordmarkStream = document.querySelector('.beyond-frame-wordmark-stream');
    const desc = document.querySelector('.beyond-frame-description');
    const stack = document.querySelector('.beyond-frame-stack');
    const cards = Array.from(document.querySelectorAll('.beyond-frame-card'));

    const descRect = desc ? desc.getBoundingClientRect() : null;
    const stackRect = stack ? stack.getBoundingClientRect() : null;
    const gap = (descRect && stackRect) ? (stackRect.top - descRect.bottom) : null;

    return {
      sectionExists: !!section,
      innerExists: !!inner,
      metaText: meta ? meta.innerText.trim() : null,
      wordmarkExists: !!wordmarkTrack,
      wordmarkItemsCount: wordmarkStream ? wordmarkStream.querySelectorAll('.beyond-frame-wordmark-item').length : 0,
      descText: desc ? desc.innerText.trim() : null,
      stackExists: !!stack,
      cardCount: cards.length,
      gapDescToStack: gap
    };
  });

  console.log('Section exists:', hierarchy.sectionExists);
  console.log('Inner container exists:', hierarchy.innerExists);
  console.log('Hierarchy A (Metadata):', hierarchy.metaText);
  console.log('Hierarchy B (Wordmark Marquee):', hierarchy.wordmarkExists ? `${hierarchy.wordmarkItemsCount} repeating items in track` : 'MISSING');
  console.log('Hierarchy C (Description):', hierarchy.descText);
  console.log('Hierarchy D (Stack Mount):', hierarchy.stackExists ? `Contains ${hierarchy.cardCount} cards` : 'MISSING');
  console.log(`Gap between Description and Stack: ${hierarchy.gapDescToStack !== null ? hierarchy.gapDescToStack.toFixed(1) + 'px' : 'N/A'} (Target: ~24–32px)`);

  // -------------------------------------------------------------
  // TEST 2: CARD GEOMETRY & 4:1 ASPECT RATIO AT 1920PX VIEWPORT
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: CARD GEOMETRY & EXACT 4:1 RATIO AT 1920PX VIEWPORT ---');
  const cardMetrics = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.beyond-frame-card'));
    return cards.map((card, idx) => {
      const rect = card.getBoundingClientRect();
      const computed = window.getComputedStyle(card);
      const img = card.querySelector('.beyond-frame-card__image');
      const ratio = rect.width / rect.height;
      return {
        index: idx + 1,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
        ratio: Math.round(ratio * 1000) / 1000,
        computedAspectRatio: computed.aspectRatio,
        computedHeight: computed.height,
        imgSrc: img ? img.getAttribute('src') : null,
        imgObjPosition: img ? img.style.objectPosition : null
      };
    });
  });

  console.log('Cards measured:');
  cardMetrics.forEach(c => {
    const ratioDelta = Math.abs(c.ratio - 4.0);
    const pass = ratioDelta < 0.05;
    console.log(`  Card ${c.index}: ${c.width}px × ${c.height}px | Ratio: ${c.ratio} (Delta: ${ratioDelta.toFixed(3)}) | Pass 4:1: ${pass ? 'YES' : 'FAIL'} | Img: ${c.imgSrc} | ObjPos: ${c.imgObjPosition}`);
  });

  // Check section width at 1920px
  const containerMetrics = await page.evaluate(() => {
    const inner = document.querySelector('.beyond-frame-inner');
    const stack = document.querySelector('.beyond-frame-stack');
    const firstCard = document.querySelector('.beyond-frame-card');
    return {
      innerWidth: inner ? inner.getBoundingClientRect().width : 0,
      stackWidth: stack ? stack.getBoundingClientRect().width : 0,
      cardWidth: firstCard ? firstCard.getBoundingClientRect().width : 0
    };
  });
  console.log('\nContainer Widths at 1920px Viewport:');
  console.log(`  .beyond-frame-inner width: ${containerMetrics.innerWidth}px (Max expected: 1584px)`);
  console.log(`  .beyond-frame-stack width: ${containerMetrics.stackWidth}px`);
  console.log(`  .beyond-frame-card width:  ${containerMetrics.cardWidth}px`);

  // Scroll to Beyond The Frame section and capture desktop screenshot
  await page.evaluate(() => {
    const section = document.querySelector('.beyond-frame-section');
    if (section) {
      section.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: 'scratch/verify_btf_1920_desktop.png' });
  console.log('Captured screenshot: scratch/verify_btf_1920_desktop.png');

  // -------------------------------------------------------------
  // TEST 3: SCROLL INTERACTION & STACK PROGRESSION
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: STICKY STACK SCROLL PROGRESSION ---');
  // Scroll down incrementally and measure card transforms/visibility
  const scrollSteps = [300, 600, 1000];
  for (const step of scrollSteps) {
    await page.evaluate(s => window.scrollBy(0, s), step);
    await new Promise(r => setTimeout(r, 600));

    const stackState = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.beyond-frame-card'));
      return cards.map((c, i) => {
        const r = c.getBoundingClientRect();
        return {
          index: i + 1,
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          scale: c.style.transform || 'none'
        };
      });
    });
    console.log(`After scroll +${step}px:`);
    stackState.forEach(s => console.log(`  Card ${s.index}: top=${s.top}px, transform=${s.scale}`));
  }

  await page.screenshot({ path: 'scratch/verify_btf_scrolled.png' });
  console.log('Captured screenshot: scratch/verify_btf_scrolled.png');

  // -------------------------------------------------------------
  // TEST 4: RESPONSIVE VIEWPORT TESTS (1200px, 800px, 390px)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: RESPONSIVE VIEWPORTS & RATIO PRESERVATION ---');
  const testViewports = [
    { width: 1200, height: 800, name: 'Small Desktop (1200px)' },
    { width: 800, height: 900, name: 'Tablet (800px)' },
    { width: 390, height: 844, name: 'Mobile iPhone (390px)' }
  ];

  for (const vp of testViewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.evaluate(() => {
      const section = document.querySelector('.beyond-frame-section');
      if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 800));

    const vpMetrics = await page.evaluate(() => {
      const card = document.querySelector('.beyond-frame-card');
      const inner = document.querySelector('.beyond-frame-inner');
      const cardRect = card ? card.getBoundingClientRect() : null;
      const innerRect = inner ? inner.getBoundingClientRect() : null;
      return {
        innerWidth: innerRect ? Math.round(innerRect.width * 10) / 10 : 0,
        cardWidth: cardRect ? Math.round(cardRect.width * 10) / 10 : 0,
        cardHeight: cardRect ? Math.round(cardRect.height * 10) / 10 : 0,
        ratio: cardRect ? Math.round((cardRect.width / cardRect.height) * 1000) / 1000 : 0,
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth
      };
    });

    const ratioDelta = Math.abs(vpMetrics.ratio - 4.0);
    const passRatio = ratioDelta < 0.05;
    const hasHorizontalOverflow = vpMetrics.docScrollWidth > vpMetrics.docClientWidth;

    console.log(`Viewport ${vp.name}:`);
    console.log(`  Inner: ${vpMetrics.innerWidth}px | Card: ${vpMetrics.cardWidth}px × ${vpMetrics.cardHeight}px`);
    console.log(`  Ratio: ${vpMetrics.ratio} (Pass 4:1: ${passRatio ? 'YES' : 'FAIL'})`);
    console.log(`  Horizontal overflow: ${hasHorizontalOverflow ? 'DETECTED' : 'NONE'}`);

    if (vp.width === 390) {
      await page.screenshot({ path: 'scratch/verify_btf_mobile_390.png' });
      console.log('Captured screenshot: scratch/verify_btf_mobile_390.png');
    }
  }

  // -------------------------------------------------------------
  // TEST 5: LIGHT / DARK THEME COMPATIBILITY
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: THEME COMPATIBILITY ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluate(() => {
    // Switch to light theme
    document.documentElement.setAttribute('data-theme', 'light');
    const section = document.querySelector('.beyond-frame-section');
    if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 800));

  const lightThemeCheck = await page.evaluate(() => {
    const card = document.querySelector('.beyond-frame-card');
    const comp = card ? window.getComputedStyle(card) : null;
    return {
      cardBg: comp ? comp.backgroundColor : null,
      cardBorder: comp ? comp.borderColor : null
    };
  });
  console.log('Light Theme Card Background:', lightThemeCheck.cardBg);
  await page.screenshot({ path: 'scratch/verify_btf_light_theme.png' });
  console.log('Captured screenshot: scratch/verify_btf_light_theme.png');

  // Restore dark theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  // -------------------------------------------------------------
  // TEST 6: UNRELATED SECTION PRESERVATION
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: PRESERVED WORK CHECK ---');
  const preservedCheck = await page.evaluate(() => {
    return {
      heroCanvas: !!document.getElementById('name-particle-canvas'),
      wireTerrain: !!document.getElementById('post-hero-bg-mount'),
      splashCursor: !!document.getElementById('post-hero-splash-cursor-mount'),
      lightBgCubes: !!document.getElementById('post-hero-bg-mount-light'),
      visualOrbit: !!document.getElementById('dome-gallery-mount'),
      lanyardProfile: !!document.getElementById('lanyard-profile-mount'),
      byTheNumbers: !!document.getElementById('by-the-numbers')
    };
  });
  console.log('Preserved Components Status:', preservedCheck);

  console.log('\nErrors detected during run:', errors.length);
  if (errors.length > 0) {
    console.log('Console Errors:', errors.slice(0, 5));
  }

  await browser.close();
  console.log('\n===============================================================');
  console.log('                 VERIFICATION RUN COMPLETE                    ');
  console.log('===============================================================');
})();
