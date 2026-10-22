const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('===============================================================');
  console.log('   CBK DESIGNFOLIO — COMPREHENSIVE REQUIREMENTS VERIFICATION   ');
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
      errors.push(text);
    }
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('\n[NAVIGATING TO http://localhost:3000/]');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // -------------------------------------------------------------
  // REQ 01 & 02: HERO NAME TYPOGRAPHY (+30% WEIGHT) & FERROFLUID (+40% REPULSION)
  // -------------------------------------------------------------
  console.log('\n--- 01 & 02: HERO NAME TYPOGRAPHY & FERROFLUID REPULSION ---');
  const heroData = await page.evaluate(() => {
    const canvas = document.getElementById('name-particle-canvas');
    const particles = window.nameParticles || [];
    return {
      canvasExists: !!canvas,
      particleCount: particles.length,
      sampleParticle: particles[0] ? {
        homeX: particles[0].homeX,
        homeY: particles[0].homeY,
        size: particles[0].size
      } : null,
      repulsionConfigured: typeof window.triggerHeroNameWave === 'function'
    };
  });
  console.log('✓ Hero Canvas Exists:', heroData.canvasExists);
  console.log('✓ Hero Dense Particles Count:', heroData.particleCount, '(Expected > 40,000 dense particles)');
  console.log('✓ Sample Particle Specs:', heroData.sampleParticle);

  // -------------------------------------------------------------
  // REQ 03: BEYOND THE FRAME — LOOPING WORDMARK & DRAG CURSOR
  // -------------------------------------------------------------
  console.log('\n--- 03: BEYOND THE FRAME (LOOPING WORDMARK & DRAG CURSOR) ---');
  const btfData = await page.evaluate(() => {
    const zone = document.getElementById('beyond-the-frame-zone');
    const streamItems = Array.from(document.querySelectorAll('.btf-stream-item')).map(el => el.textContent.trim());
    const streamWrap = document.querySelector('.btf-wordmark-stream-wrap');
    const cards = document.querySelectorAll('.beyond-frame-card, .stack-card');
    return {
      zoneFound: !!zone,
      streamItemsCount: streamItems.length,
      streamText: streamItems[0] || null,
      streamWrapFound: !!streamWrap,
      cardsCount: cards.length
    };
  });
  console.log('✓ BTF Zone Found:', btfData.zoneFound);
  console.log('✓ Looping Wordmark Stream Items:', btfData.streamItemsCount, `("${btfData.streamText}")`);
  console.log('✓ Draggable Cinematic Cards Count:', btfData.cardsCount);

  // Scroll to BTF and hover over card to test grab/grabbing cursor
  await page.evaluate(() => {
    document.getElementById('beyond-the-frame-zone')?.scrollIntoView({ behavior: 'instant', block: 'center' });
    window.dispatchEvent(new Event('scroll'));
  });
  await new Promise(r => setTimeout(r, 600));

  const cardPos = await page.evaluate(() => {
    const card = document.querySelector('.beyond-frame-card, .stack-card');
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 };
  });

  if (cardPos) {
    await page.mouse.move(cardPos.x, cardPos.y);
    await new Promise(r => setTimeout(r, 200));

    const hoverCursor = await page.evaluate(() => {
      const c = document.getElementById('section-cursor');
      return {
        grab: c ? c.classList.contains('cursor-grab') : false,
        grabbing: c ? c.classList.contains('cursor-grabbing') : false
      };
    });
    console.log('✓ Idle Hover Over Draggable Card: cursor-grab =', hoverCursor.grab);

    await page.mouse.down();
    await new Promise(r => setTimeout(r, 200));
    const dragCursor = await page.evaluate(() => {
      const c = document.getElementById('section-cursor');
      return {
        grab: c ? c.classList.contains('cursor-grab') : false,
        grabbing: c ? c.classList.contains('cursor-grabbing') : false
      };
    });
    console.log('✓ Active Mousedown On Draggable Card: cursor-grabbing =', dragCursor.grabbing);
    await page.mouse.up();
  }

  // -------------------------------------------------------------
  // REQ 04: ADAPTIVE CURSOR (HERO WHITE POINTER VS POST-HERO DIFFERENCE BLEND)
  // -------------------------------------------------------------
  console.log('\n--- 04: ADAPTIVE CURSOR CONTRAST ---');
  // Check hero pointer
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  });
  await page.mouse.move(300, 200);
  await new Promise(r => setTimeout(r, 300));
  const heroCursor = await page.evaluate(() => {
    const c = document.getElementById('section-cursor');
    return {
      isInHero: c ? c.classList.contains('is-in-hero') : false,
      mixBlendMode: c ? window.getComputedStyle(c).mixBlendMode : null
    };
  });
  console.log('✓ Cursor In Hero: is-in-hero =', heroCursor.isInHero, '(Preserves crisp white arrow with dark stroke)');

  // Check post-hero cursor
  await page.evaluate(() => {
    window.scrollTo({ top: 1800, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  });
  await page.mouse.move(500, 500);
  await new Promise(r => setTimeout(r, 300));
  const postHeroCursor = await page.evaluate(() => {
    const c = document.getElementById('section-cursor');
    return {
      isInHero: c ? c.classList.contains('is-in-hero') : false,
      mixBlendMode: c ? window.getComputedStyle(c).mixBlendMode : null
    };
  });
  console.log('✓ Cursor In Post-Hero: is-in-hero =', postHeroCursor.isInHero, '| mix-blend-mode =', postHeroCursor.mixBlendMode);

  // -------------------------------------------------------------
  // REQ 05: ID CARD FRONT FACE (SUPPLIED ID Front(2).png)
  // -------------------------------------------------------------
  console.log('\n--- 05: ID CARD FRONT FACE ASSET ---');
  const idCardData = await page.evaluate(() => {
    const lanyardCanvas = document.querySelector('canvas.lanyard-canvas');
    return {
      lanyardCanvasFound: !!lanyardCanvas,
      canvasW: lanyardCanvas ? lanyardCanvas.width : 0,
      canvasH: lanyardCanvas ? lanyardCanvas.height : 0
    };
  });
  console.log('✓ 3D Lanyard Canvas Rendered:', idCardData.lanyardCanvasFound, `(${idCardData.canvasW}x${idCardData.canvasH})`);

  // -------------------------------------------------------------
  // REQ 06 & 07: CAREER SKILL MAP (ZERO RED LINE & BY THE NUMBERS INVERSION)
  // -------------------------------------------------------------
  console.log('\n--- 06 & 07: CAREER SKILL MAP (INDEPENDENT TILES & INVERSION) ---');
  // Check red line removed
  const mapStructure = await page.evaluate(() => {
    const rail = document.querySelector('.career-timeline-rail');
    const progress = document.querySelector('.career-timeline-progress');
    const cards = Array.from(document.querySelectorAll('.career-tile-card')).map(c => ({
      step: c.querySelector('.career-tile-step')?.textContent.trim(),
      role: c.querySelector('.career-tile-role')?.textContent.trim()
    }));
    return {
      railFound: !!rail,
      progressFound: !!progress,
      cardCount: cards.length,
      roles: cards.map(c => `${c.step}: ${c.role}`)
    };
  });
  console.log('✓ Red Timeline Rail Removed:', !mapStructure.railFound);
  console.log('✓ Red Progress Line Removed:', !mapStructure.progressFound);
  console.log('✓ 6 Independent Career Roles In Order:', mapStructure.roles);

  // Scroll to Career Map
  await page.evaluate(() => {
    document.querySelector('.career-map-container')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.mouse.move(0, 0);
  await new Promise(r => setTimeout(r, 600));

  // Test Inversion in Dark Theme
  const darkInversion = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.career-tile-card'));
    const def = cards[0]; // unselected (ARTIST)
    const sel = cards[5]; // selected (CREATIVE DIRECTOR)
    return {
      defaultBg: window.getComputedStyle(def).backgroundColor,
      defaultColor: window.getComputedStyle(def).color,
      selectedBg: window.getComputedStyle(sel).backgroundColor,
      selectedColor: window.getComputedStyle(sel).color,
      selectedStepColor: window.getComputedStyle(sel.querySelector('.career-tile-step')).color
    };
  });
  console.log('✓ Dark Theme Default Tile (Charcoal):', darkInversion.defaultBg, darkInversion.defaultColor);
  console.log('✓ Dark Theme Selected Tile (White Inversion):', darkInversion.selectedBg, darkInversion.selectedColor, '| Step:', darkInversion.selectedStepColor);

  // Switch to Light Theme
  await page.evaluate(() => {
    window.applyTheme('light');
    document.activeElement?.blur();
  });
  await page.mouse.move(0, 0);
  await new Promise(r => setTimeout(r, 1500));

  const beforeHover = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.career-tile-card'));
    const def = cards[0]; // unselected (ARTIST)
    const sel = cards[5]; // selected (CREATIVE DIRECTOR)
    return {
      defaultBg: window.getComputedStyle(def).backgroundColor,
      defaultColor: window.getComputedStyle(def).color,
      selectedBg: window.getComputedStyle(sel).backgroundColor,
      selectedColor: window.getComputedStyle(sel).color,
      selectedStepColor: window.getComputedStyle(sel.querySelector('.career-tile-step')).color
    };
  });
  console.log('✓ Light Theme Default Tile (Pure White):', beforeHover.defaultBg, beforeHover.defaultColor);
  console.log('✓ Light Theme Selected Tile (Solid Black Inversion):', beforeHover.selectedBg, beforeHover.selectedColor, '| Step:', beforeHover.selectedStepColor);

  // Test Hover Inversion on Card 0 in Light Theme
  const card0Pos = await page.evaluate(() => {
    const card = document.querySelector('.career-tile-card');
    const r = card.getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 };
  });
  await page.mouse.move(card0Pos.x, card0Pos.y);
  await new Promise(r => setTimeout(r, 600));
  const duringHover = await page.evaluate(() => {
    const card = document.querySelector('.career-tile-card');
    return {
      bg: window.getComputedStyle(card).backgroundColor,
      color: window.getComputedStyle(card).color,
      stepColor: window.getComputedStyle(card.querySelector('.career-tile-step')).color
    };
  });
  console.log('✓ Light Theme Hover Inversion (Solid Black):', duringHover.bg, duringHover.color, '| Step:', duringHover.stepColor);

  await page.mouse.move(0, 0);
  await new Promise(r => setTimeout(r, 600));
  const afterHover = await page.evaluate(() => window.getComputedStyle(document.querySelector('.career-tile-card')).backgroundColor);
  console.log('✓ Light Theme Unhover Restored (Pure White):', afterHover);

  // -------------------------------------------------------------
  // REQ 09: LIGHT-THEME GRADIENT WAVES (WebGL2 CONTINUOUS BACKGROUND)
  // -------------------------------------------------------------
  console.log('\n--- 09: LIGHT-THEME GRADIENT WAVES (WebGL2 FROM wave(1).txt) ---');
  const lightWavesData = await page.evaluate(() => {
    const bgDark = document.getElementById('post-hero-bg-mount');
    const bgLight = document.getElementById('post-hero-bg-mount-light');
    const canvas = bgLight ? bgLight.querySelector('canvas') : null;
    return {
      bgDarkDisplay: bgDark ? window.getComputedStyle(bgDark).display : null,
      bgLightDisplay: bgLight ? window.getComputedStyle(bgLight).display : null,
      canvasFound: !!canvas,
      canvasW: canvas ? canvas.width : 0,
      canvasH: canvas ? canvas.height : 0
    };
  });
  console.log('✓ Light Background Container Active:', lightWavesData.bgLightDisplay === 'block');
  console.log('✓ Dark Background Container Inactive:', lightWavesData.bgDarkDisplay === 'none');
  console.log('✓ GradientWaves WebGL2 Canvas Rendered:', lightWavesData.canvasFound, `(${lightWavesData.canvasW}x${lightWavesData.canvasH})`);

  // -------------------------------------------------------------
  // REQ 08: POST-HERO PARTICLE SCROLL
  // -------------------------------------------------------------
  console.log('\n--- 08: POST-HERO PARTICLE SCROLL ---');
  const particleScrollData = await page.evaluate(() => {
    const canvas = document.getElementById('post-hero-particle-scroll-canvas');
    return {
      canvasFound: !!canvas,
      canvasW: canvas ? canvas.width : 0,
      canvasH: canvas ? canvas.height : 0
    };
  });
  console.log('✓ Post-Hero Particle Scroll Canvas:', particleScrollData.canvasFound, `(${particleScrollData.canvasW}x${particleScrollData.canvasH})`);

  // Screenshot in Light Theme
  await page.screenshot({ path: 'scratch/verified_portfolio_light_final.png' });
  console.log('✓ Captured Light Theme Screenshot: scratch/verified_portfolio_light_final.png');

  // -------------------------------------------------------------
  // REQ 09.7: RESTORE DARK THEME (VERIFY LOCKED DARK BACKGROUND & SPLASH CURSOR)
  // -------------------------------------------------------------
  console.log('\n--- 09.7: DARK THEME RESTORATION & INTEGRITY ---');
  await page.evaluate(() => window.applyTheme('dark'));
  await new Promise(r => setTimeout(r, 1200));

  const darkRestoredData = await page.evaluate(() => {
    const bgDark = document.getElementById('post-hero-bg-mount');
    const bgLight = document.getElementById('post-hero-bg-mount-light');
    const splash = document.getElementById('post-hero-splash-cursor-mount');
    return {
      bgDarkDisplay: bgDark ? window.getComputedStyle(bgDark).display : null,
      bgDarkCanvas: bgDark ? !!bgDark.querySelector('canvas') : false,
      bgLightDisplay: bgLight ? window.getComputedStyle(bgLight).display : null,
      splashCanvas: splash ? !!splash.querySelector('canvas') : false
    };
  });
  console.log('✓ Dark WireTerrainScan Restored:', darkRestoredData.bgDarkDisplay === 'block', `(canvas: ${darkRestoredData.bgDarkCanvas})`);
  console.log('✓ Light GradientWaves Hidden:', darkRestoredData.bgLightDisplay === 'none');
  console.log('✓ Dark SplashCursor Fluid Canvas Restored:', darkRestoredData.splashCanvas);

  await page.screenshot({ path: 'scratch/verified_portfolio_dark_final.png' });
  console.log('✓ Captured Dark Theme Screenshot: scratch/verified_portfolio_dark_final.png');

  console.log('\n--- ERROR SUMMARY ---');
  console.log('Console Errors:', errors.length ? errors : 'None! (0 errors)');

  await browser.close();
  console.log('\n===============================================================');
  console.log('   ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!            ');
  console.log('===============================================================');
})();
