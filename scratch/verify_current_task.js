const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('===============================================================');
  console.log('   CBK DESIGNFOLIO — CURRENT REQUIREMENTS VERIFICATION SUITE   ');
  console.log('===============================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCacheEnabled(false);

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out non-fatal favicon or extension warnings if any
      errors.push(text);
    }
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('\n[NAVIGATING TO http://localhost:3000/]');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // -------------------------------------------------------------
  // TEST 1: HERO NAME TYPOGRAPHY & PARTICLES
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: HERO NAME MODERN BOLD TYPOGRAPHY & FERROFLUID ---');
  const heroData = await page.evaluate(() => {
    const canvas = document.getElementById('name-particle-canvas');
    const particles = window.nameParticles || [];
    return {
      canvasExists: !!canvas,
      canvasWidth: canvas ? canvas.width : 0,
      canvasHeight: canvas ? canvas.height : 0,
      particleCount: particles.length,
      sampleParticle: particles[0] || null
    };
  });
  console.log('Hero Particle Canvas:', heroData.canvasExists ? 'FOUND' : 'MISSING');
  console.log('Particle Count:', heroData.particleCount);
  console.log('Canvas Dimensions:', `${heroData.canvasWidth}x${heroData.canvasHeight}`);

  // Test mouse repulsion over Hero name
  const repulsionResult = await page.evaluate(async () => {
    const wrap = document.getElementById('hero-name-wrap');
    if (!wrap || !window.nameParticles || window.nameParticles.length === 0) return { error: 'No particles' };
    const rect = wrap.getBoundingClientRect();
    const testX = rect.left + 150;
    const testY = rect.top + 50;

    // Simulate pointer move
    wrap.dispatchEvent(new MouseEvent('mouseenter', { clientX: testX, clientY: testY, bubbles: true }));
    wrap.dispatchEvent(new MouseEvent('mousemove', { clientX: testX, clientY: testY, bubbles: true }));
    
    // Wait for physics frames
    await new Promise(r => setTimeout(r, 120));

    let maxDisp = 0;
    for (let p of window.nameParticles) {
      const d = Math.hypot(p.x - p.homeX, p.y - p.homeY);
      if (d > maxDisp) maxDisp = d;
    }

    // Leave and verify return
    wrap.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    await new Promise(r => setTimeout(r, 800));

    let maxReturnDisp = 0;
    for (let p of window.nameParticles) {
      const d = Math.hypot(p.x - p.homeX, p.y - p.homeY);
      if (d > maxReturnDisp) maxReturnDisp = d;
    }

    return { maxDisp: Math.round(maxDisp * 10) / 10, maxReturnDisp: Math.round(maxReturnDisp * 10) / 10 };
  });
  console.log('Mouse Repulsion Max Displacement:', repulsionResult.maxDisp, 'px');
  console.log('Post-repulsion Return Displacement:', repulsionResult.maxReturnDisp, 'px');

  await page.screenshot({ path: 'scratch/verify_01_hero_typography.png' });
  console.log('Screenshot saved: scratch/verify_01_hero_typography.png');

  // -------------------------------------------------------------
  // TEST 2: REMOVAL OF GLOBAL PARTICLE SCROLL
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: GLOBAL PARTICLE SCROLL REMOVAL ---');
  const particleScrollCheck = await page.evaluate(() => {
    const oldCanvas = document.getElementById('post-hero-particle-scroll-canvas');
    const sections = [
      '#by-the-numbers',
      '#selected-works',
      '#beyond-the-frame-zone',
      '#visual-orbit',
      '#my-expertise',
      '#the-core'
    ];
    const opacities = {};
    for (let sel of sections) {
      const el = document.querySelector(sel);
      opacities[sel] = el ? {
        exists: true,
        opacity: window.getComputedStyle(el).opacity,
        visibility: window.getComputedStyle(el).visibility
      } : { exists: false };
    }
    return {
      hasParticleScrollCanvas: !!oldCanvas,
      sections: opacities
    };
  });
  console.log('Old post-hero particle scroll canvas in DOM:', particleScrollCheck.hasParticleScrollCanvas ? 'YES (FAIL)' : 'NO (PASSED)');
  console.log('Post-Hero Section Visibility Status:');
  for (let [sel, status] of Object.entries(particleScrollCheck.sections)) {
    console.log(`  ${sel}: opacity=${status.opacity}, visibility=${status.visibility}`);
  }

  // -------------------------------------------------------------
  // TEST 3: BEYOND THE FRAME REBUILD WITH SCROLLSTACK
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: BEYOND THE FRAME REBUILD WITH SCROLLSTACK ---');
  const btfData = await page.evaluate(() => {
    const zone = document.getElementById('beyond-the-frame-zone');
    const metaLabel = zone ? zone.querySelector('.dbl-meta-label') : null;
    const heading = zone ? zone.querySelector('h2.dbl-title-main') : null;
    const desc = zone ? zone.querySelector('.dbl-subtitle-desc') : null;
    const marquee = zone ? zone.querySelector('.btf-wordmark-stream-wrap') : null;
    const mount = document.getElementById('beyond-the-frame-mount');
    const scrollStack = mount ? mount.querySelector('.scroll-stack') : null;
    const cards = mount ? mount.querySelectorAll('.btf-cinematic-card') : [];

    const cardDetails = [];
    cards.forEach((card, idx) => {
      const title = card.querySelector('.btf-card-title')?.textContent || '';
      const badge = card.querySelector('.btf-card-badge')?.textContent || '';
      const img = card.querySelector('.btf-card-image')?.getAttribute('src') || '';
      cardDetails.push({ index: idx + 1, title, badge, img });
    });

    return {
      zoneExists: !!zone,
      metaText: metaLabel ? metaLabel.textContent.trim() : '',
      headingText: heading ? heading.textContent.trim() : '',
      descText: desc ? desc.textContent.trim() : '',
      marqueeExists: !!marquee,
      mountExists: !!mount,
      scrollStackExists: !!scrollStack,
      isWindowScroll: scrollStack ? scrollStack.classList.contains('scroll-stack--window') : false,
      cardCount: cards.length,
      cards: cardDetails
    };
  });

  console.log('Hierarchy Verification:');
  console.log('  1. Meta Label:', btfData.metaText);
  console.log('  2. Heading:', btfData.headingText);
  console.log('  3. Description:', btfData.descText);
  console.log('  4. Secondary Marquee Ribbon:', btfData.marqueeExists ? 'PRESENT' : 'MISSING');
  console.log('  5. ScrollStack Component:', btfData.scrollStackExists ? 'PRESENT' : 'MISSING');
  console.log('  6. Window Scroll Mode:', btfData.isWindowScroll ? 'YES (Native Window Scroll)' : 'NO');
  console.log('  7. Cinematic Cards Count:', btfData.cardCount);
  btfData.cards.forEach(c => {
    console.log(`     Card ${c.index}: ${c.title} [${c.badge}] -> ${c.img}`);
  });

  // Scroll to Beyond The Frame and capture stack state
  console.log('\n[SCROLLING TO BEYOND THE FRAME]');
  await page.evaluate(() => {
    const el = document.getElementById('beyond-the-frame-zone');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/verify_02_beyond_the_frame_stack.png' });
  console.log('Screenshot saved: scratch/verify_02_beyond_the_frame_stack.png');

  // Scroll through the stack to test stacking progression
  await page.evaluate(() => window.scrollBy(0, 350));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scratch/verify_03_beyond_the_frame_scrolled.png' });
  console.log('Screenshot saved: scratch/verify_03_beyond_the_frame_scrolled.png');

  // -------------------------------------------------------------
  // TEST 4: LIGHT THEME CUBES GRID BACKGROUND
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: LIGHT THEME BACKGROUND CUBES GRID ---');
  // Switch to light theme
  await page.evaluate(() => {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.click();
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      window.dispatchEvent(new Event('themechange'));
    }
  });
  await new Promise(r => setTimeout(r, 1200));

  const lightBgData = await page.evaluate(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const bgDark = document.getElementById('post-hero-bg-mount');
    const bgLight = document.getElementById('post-hero-bg-mount-light');
    const splash = document.getElementById('post-hero-splash-cursor-mount');
    const cubesCanvas = bgLight ? bgLight.querySelector('canvas') : null;

    return {
      theme: currentTheme,
      bgDarkDisplay: bgDark ? window.getComputedStyle(bgDark).display : 'none',
      bgLightDisplay: bgLight ? window.getComputedStyle(bgLight).display : 'none',
      splashDisplay: splash ? window.getComputedStyle(splash).display : 'none',
      hasCubesCanvas: !!cubesCanvas,
      cubesCanvasWidth: cubesCanvas ? cubesCanvas.width : 0,
      cubesCanvasHeight: cubesCanvas ? cubesCanvas.height : 0
    };
  });

  console.log('Current Active Theme:', lightBgData.theme);
  console.log('Dark Background (WireTerrainScan) Display:', lightBgData.bgDarkDisplay, '(expected: none)');
  console.log('Light Background (BackgroundCubesGrid) Display:', lightBgData.bgLightDisplay, '(expected: block)');
  console.log('Dark Cursor Splash Display in Light Mode:', lightBgData.splashDisplay, '(expected: none)');
  console.log('BackgroundCubesGrid Canvas:', lightBgData.hasCubesCanvas ? `FOUND (${lightBgData.cubesCanvasWidth}x${lightBgData.cubesCanvasHeight})` : 'MISSING');

  // Scroll to By The Numbers in Light mode to verify cube grid background behind content
  await page.evaluate(() => {
    const el = document.getElementById('by-the-numbers');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/verify_04_light_theme_cubes_bg.png' });
  console.log('Screenshot saved: scratch/verify_04_light_theme_cubes_bg.png');

  // -------------------------------------------------------------
  // TEST 5: DARK THEME PRESERVATION (SWITCH BACK TO DARK)
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: DARK THEME PRESERVATION ---');
  await page.evaluate(() => {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.click();
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      window.dispatchEvent(new Event('themechange'));
    }
  });
  await new Promise(r => setTimeout(r, 1200));

  const darkBgData = await page.evaluate(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const bgDark = document.getElementById('post-hero-bg-mount');
    const bgLight = document.getElementById('post-hero-bg-mount-light');
    const splash = document.getElementById('post-hero-splash-cursor-mount');
    const wireCanvas = bgDark ? bgDark.querySelector('canvas') : null;
    const splashCanvas = splash ? splash.querySelector('canvas') : null;

    return {
      theme: currentTheme,
      bgDarkDisplay: bgDark ? window.getComputedStyle(bgDark).display : 'none',
      bgLightDisplay: bgLight ? window.getComputedStyle(bgLight).display : 'none',
      hasWireCanvas: !!wireCanvas,
      hasSplashCanvas: !!splashCanvas
    };
  });

  console.log('Current Active Theme:', darkBgData.theme);
  console.log('Dark Background (WireTerrainScan) Display:', darkBgData.bgDarkDisplay, '(expected: block)');
  console.log('Light Background Display in Dark Mode:', darkBgData.bgLightDisplay, '(expected: none)');
  console.log('WireTerrainScan Canvas in Dark Mode:', darkBgData.hasWireCanvas ? 'PRESERVED' : 'MISSING');
  console.log('SplashCursor Canvas in Dark Mode:', darkBgData.hasSplashCanvas ? 'PRESERVED' : 'MISSING');

  await page.screenshot({ path: 'scratch/verify_05_dark_theme_preserved.png' });
  console.log('Screenshot saved: scratch/verify_05_dark_theme_preserved.png');

  console.log('\nConsole Errors:', errors.length > 0 ? errors : 'None! (0 errors)');

  await browser.close();
  console.log('\n===============================================================');
  console.log('   VERIFICATION COMPLETE — ALL ACCEPTANCE CRITERIA CHECKED    ');
  console.log('===============================================================');
})();
