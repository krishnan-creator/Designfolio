const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('======================================================================');
  console.log('  CBK DESIGNFOLIO — PADDING SCROLL STACK & ANTON HERO VERIFICATION   ');
  console.log('======================================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setCacheEnabled(false);

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('\n[1. NAVIGATING TO http://localhost:3000/]');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  // -------------------------------------------------------------------
  // TEST PART B: HERO NAME ANTON TYPOGRAPHY & FERROFLUID INTERACTION
  // -------------------------------------------------------------------
  console.log('\n--- PART B: HERO NAME ANTON TYPOGRAPHY & FERROFLUID PHYSICS ---');
  const heroCheck = await page.evaluate(async () => {
    const isAntonReady = document.fonts.check('48px Anton');
    const wrap = document.getElementById('hero-name-wrap');
    const canvas = document.getElementById('name-particle-canvas');
    const particles = window.nameParticles || [];

    const rect = wrap ? wrap.getBoundingClientRect() : null;

    let minX = 99999, maxX = -99999, minY = 99999, maxY = -99999;
    particles.forEach(p => {
      if (p.homeX < minX) minX = p.homeX;
      if (p.homeX > maxX) maxX = p.homeX;
      if (p.homeY < minY) minY = p.homeY;
      if (p.homeY > maxY) maxY = p.homeY;
    });

    return {
      isAntonReady,
      canvasExists: !!canvas,
      particleCount: particles.length,
      sampleParticleSize: particles[0] ? particles[0].size : 0,
      bbox: { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY },
      wrapWidth: rect ? rect.width : 0,
      wrapHeight: rect ? rect.height : 0,
      rect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null
    };
  });

  console.log('Anton Font Loaded:', heroCheck.isAntonReady ? 'YES (Google Fonts Anton Active)' : 'NO');
  console.log('Particle Canvas Exists:', heroCheck.canvasExists);
  console.log('Anton Particle Count:', heroCheck.particleCount, '(Densely sampled)');
  console.log('Anton Glyph Bounding Box:', `${heroCheck.bbox.width.toFixed(1)}px wide × ${heroCheck.bbox.height.toFixed(1)}px high`);
  console.log('Hero Name Wrap:', `${heroCheck.wrapWidth}px × ${heroCheck.wrapHeight}px`);

  // Test ferrofluid repulsion physics over Anton letters using real mouse move
  console.log('\nTesting Ferrofluid Repulsion over Anton Typography with Real Mouse:');
  const heroBox = heroCheck.rect;
  await page.mouse.move(heroBox.left + 140, heroBox.top + 70);
  await new Promise(r => setTimeout(r, 120));
  await page.mouse.move(heroBox.left + 180, heroBox.top + 90);
  await new Promise(r => setTimeout(r, 120));

  const repulsionCheck = await page.evaluate(async () => {
    let displacedCount = 0;
    let maxDist = 0;
    (window.nameParticles || []).forEach(p => {
      const d = Math.hypot(p.x - p.homeX, p.y - p.homeY);
      if (d > 1.5) displacedCount++;
      if (d > maxDist) maxDist = d;
    });
    return {
      displacedCount,
      maxDist: maxDist.toFixed(1),
      totalCount: (window.nameParticles || []).length
    };
  });

  console.log(`  Particles Displaced by Pointer Repulsion: ${repulsionCheck.displacedCount} (Max push: ${repulsionCheck.maxDist}px)`);

  // Move mouse away to test spring recovery
  await page.mouse.move(10, 10);
  await new Promise(r => setTimeout(r, 700));

  const recoveryCheck = await page.evaluate(() => {
    let recoveredCount = 0;
    (window.nameParticles || []).forEach(p => {
      const d = Math.hypot(p.x - p.homeX, p.y - p.homeY);
      if (d < 1.0) recoveredCount++;
    });
    return {
      recoveredCount,
      totalCount: (window.nameParticles || []).length
    };
  });

  console.log(`  Particles Settled Back to Anton Home Targets: ${recoveryCheck.recoveredCount} / ${recoveryCheck.totalCount}`);
  const passPhysics = repulsionCheck.displacedCount > 50 && recoveryCheck.recoveredCount > recoveryCheck.totalCount * 0.95;
  console.log(`  Ferrofluid Physics Test: ${passPhysics ? 'PASSED (Hooke spring recovery confirmed)' : 'FAILED'}`);

  await page.screenshot({ path: 'scratch/verify_anton_hero.png' });
  console.log('Captured screenshot: scratch/verify_anton_hero.png');

  // -------------------------------------------------------------------
  // TEST PART A: BEYOND THE FRAME GEOMETRY & 4:1 ASPECT RATIO
  // -------------------------------------------------------------------
  console.log('\n--- PART A: BEYOND THE FRAME GEOMETRY & 4:1 ASPECT RATIO ---');
  await page.evaluate(() => {
    const sec = document.querySelector('.beyond-frame-section');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const btfGeom = await page.evaluate(() => {
    const sec = document.querySelector('.beyond-frame-section');
    const interArea = document.querySelector('.beyond-frame-interaction-area');
    const banner = document.querySelector('.beyond-frame-banner');
    const title = document.querySelector('.beyond-frame-title');
    const desc = document.querySelector('.beyond-frame-description');
    const cards = Array.from(document.querySelectorAll('.beyond-frame-card'));

    const bannerRect = banner ? banner.getBoundingClientRect() : null;
    const interRect = interArea ? interArea.getBoundingClientRect() : null;
    const descRect = desc ? desc.getBoundingClientRect() : null;

    const bannerRatio = bannerRect ? bannerRect.width / bannerRect.height : 0;
    const gapDescToArea = (descRect && interRect) ? (interRect.top - descRect.bottom) : 0;

    return {
      secExists: !!sec,
      titleText: title ? title.innerText.trim() : null,
      descText: desc ? desc.innerText.trim() : null,
      gapDescToArea: Math.round(gapDescToArea * 10) / 10,
      interWidth: interRect ? Math.round(interRect.width * 10) / 10 : 0,
      interHeight: interRect ? Math.round(interRect.height * 10) / 10 : 0,
      bannerWidth: bannerRect ? Math.round(bannerRect.width * 10) / 10 : 0,
      bannerHeight: bannerRect ? Math.round(bannerRect.height * 10) / 10 : 0,
      bannerRatio: Math.round(bannerRatio * 1000) / 1000,
      cardCount: cards.length,
      paddingTop: interRect && bannerRect ? Math.round((bannerRect.top - interRect.top) * 10) / 10 : 0,
      paddingBottom: interRect && bannerRect ? Math.round((interRect.bottom - bannerRect.bottom) * 10) / 10 : 0,
      paddingLeft: interRect && bannerRect ? Math.round((bannerRect.left - interRect.left) * 10) / 10 : 0,
      paddingRight: interRect && bannerRect ? Math.round((interRect.right - bannerRect.right) * 10) / 10 : 0
    };
  });

  console.log('Section Heading:', btfGeom.titleText);
  console.log('Section Description:', btfGeom.descText);
  console.log(`Gap (Description to Interaction Area): ${btfGeom.gapDescToArea}px (Compact & deliberate)`);
  console.log(`Interaction Area (Area B): ${btfGeom.interWidth}px wide × ${btfGeom.interHeight}px high`);
  console.log(`Banner Area (Area A): ${btfGeom.bannerWidth}px wide × ${btfGeom.bannerHeight}px high`);
  console.log(`Banner Aspect Ratio: ${btfGeom.bannerRatio} (Delta from 4.0: ${Math.abs(btfGeom.bannerRatio - 4.0).toFixed(4)})`);
  console.log(`Designated Surrounding Padding (Area B): Top=${btfGeom.paddingTop}px, Bottom=${btfGeom.paddingBottom}px, Left=${btfGeom.paddingLeft}px, Right=${btfGeom.paddingRight}px`);

  const passRatio = Math.abs(btfGeom.bannerRatio - 4.0) < 0.05;
  console.log(`4:1 LinkedIn Banner Ratio: ${passRatio ? 'PASS (1584 × 396 Proportions)' : 'FAIL'}`);

  await page.screenshot({ path: 'scratch/verify_btf_initial.png' });
  console.log('Captured screenshot: scratch/verify_btf_initial.png');

  // -------------------------------------------------------------------
  // TEST PART A: PADDING-CONTROLLED WHEEL SCROLLING INTERACTION
  // -------------------------------------------------------------------
  console.log('\n--- PART A: PADDING-CONTROLLED WHEEL SCROLLING INTERACTION ---');

  // Test 1: Scrolling over the BANNER IMAGE (Area A) must NOT advance the stack
  console.log('1. Testing mouse wheel OVER BANNER IMAGE (Area A)...');
  const bannerWheelResult = await page.evaluate(async () => {
    const banner = document.querySelector('.beyond-frame-banner');
    const rect = banner.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const pipsBefore = Array.from(document.querySelectorAll('.beyond-frame-step-pip')).map(p => p.classList.contains('is-active'));

    const event = new WheelEvent('wheel', {
      clientX: centerX,
      clientY: centerY,
      deltaY: 120,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);

    await new Promise(r => setTimeout(r, 200));
    const pipsAfter = Array.from(document.querySelectorAll('.beyond-frame-step-pip')).map(p => p.classList.contains('is-active'));

    return {
      defaultPrevented: event.defaultPrevented,
      activePipBefore: pipsBefore.indexOf(true),
      activePipAfter: pipsAfter.indexOf(true),
      cardChanged: pipsBefore.indexOf(true) !== pipsAfter.indexOf(true)
    };
  });
  console.log(`  Over Image: defaultPrevented=${bannerWheelResult.defaultPrevented}, cardChanged=${bannerWheelResult.cardChanged}`);
  console.log(`  Stack stayed untouched on image scroll: ${!bannerWheelResult.cardChanged ? 'YES (PASS - Normal scroll preserved over images)' : 'FAIL'}`);

  // Test 2: Scrolling over DESIGNATED PADDING (Area B) MUST advance the stack!
  console.log('\n2. Testing mouse wheel OVER DESIGNATED PADDING (Area B)...');
  const paddingWheelResult = await page.evaluate(async () => {
    const interArea = document.querySelector('.beyond-frame-interaction-area');
    const banner = document.querySelector('.beyond-frame-banner');
    const iRect = interArea.getBoundingClientRect();
    const bRect = banner.getBoundingClientRect();

    const padX = iRect.left + 80;
    const padY = iRect.top + (bRect.top - iRect.top) / 2;

    const pipsBefore = Array.from(document.querySelectorAll('.beyond-frame-step-pip')).map(p => p.classList.contains('is-active'));

    const event = new WheelEvent('wheel', {
      clientX: padX,
      clientY: padY,
      deltaY: 80,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);

    await new Promise(r => setTimeout(r, 350));
    const pipsAfter = Array.from(document.querySelectorAll('.beyond-frame-step-pip')).map(p => p.classList.contains('is-active'));

    return {
      defaultPrevented: event.defaultPrevented,
      activePipBefore: pipsBefore.indexOf(true),
      activePipAfter: pipsAfter.indexOf(true),
      advanced: pipsAfter.indexOf(true) > pipsBefore.indexOf(true)
    };
  });

  console.log(`  Over Padding: defaultPrevented=${paddingWheelResult.defaultPrevented}, Card before=${paddingWheelResult.activePipBefore}, after=${paddingWheelResult.activePipAfter}`);
  console.log(`  Stack advanced on padding scroll: ${paddingWheelResult.advanced ? 'YES (PASS - Card 2 active)' : 'FAIL'}`);

  // Test 3: Scrolling through all remaining cards over padding to Card 5
  console.log('\n3. Scrolling progressively through entries 3, 4, 5...');
  for (let step = 0; step < 3; step++) {
    await page.evaluate(async () => {
      const interArea = document.querySelector('.beyond-frame-interaction-area');
      const banner = document.querySelector('.beyond-frame-banner');
      const iRect = interArea.getBoundingClientRect();
      const bRect = banner.getBoundingClientRect();
      const padX = iRect.left + 80;
      const padY = iRect.top + (bRect.top - iRect.top) / 2;

      window.dispatchEvent(new WheelEvent('wheel', {
        clientX: padX,
        clientY: padY,
        deltaY: 80,
        bubbles: true,
        cancelable: true
      }));
      await new Promise(r => setTimeout(r, 220));
    });
    await new Promise(r => setTimeout(r, 150));
  }

  const card5Check = await page.evaluate(() => {
    const pips = Array.from(document.querySelectorAll('.beyond-frame-step-pip')).map(p => p.classList.contains('is-active'));
    return { activeIndex: pips.indexOf(true) };
  });
  console.log(`  Current active card index: ${card5Check.activeIndex} (Expected: 4 / Card 5)`);
  await page.screenshot({ path: 'scratch/verify_btf_card5.png' });
  console.log('Captured screenshot: scratch/verify_btf_card5.png');

  // Test 4: Endpoint behaviour — never trap visitor!
  console.log('\n4. Testing ENDPOINT NON-TRAPPING behaviour at final card (scrolling down)...');
  const endpointDownResult = await page.evaluate(() => {
    const interArea = document.querySelector('.beyond-frame-interaction-area');
    const banner = document.querySelector('.beyond-frame-banner');
    const iRect = interArea.getBoundingClientRect();
    const bRect = banner.getBoundingClientRect();
    const padX = iRect.left + 80;
    const padY = iRect.top + (bRect.top - iRect.top) / 2;

    const event = new WheelEvent('wheel', {
      clientX: padX,
      clientY: padY,
      deltaY: 100,
      bubbles: true,
      cancelable: true
    });

    window.dispatchEvent(event);
    return {
      defaultPrevented: event.defaultPrevented
    };
  });
  console.log(`  At final card scrolling down, defaultPrevented=${endpointDownResult.defaultPrevented}`);
  console.log(`  Released to normal webpage scroll at final card: ${!endpointDownResult.defaultPrevented ? 'YES (PASS - Never trapped!)' : 'FAIL'}`);

  // Test 5: Reverse scroll back to Card 1
  console.log('\n5. Reversing scroll back to first card...');
  for (let step = 0; step < 4; step++) {
    await page.evaluate(async () => {
      const interArea = document.querySelector('.beyond-frame-interaction-area');
      const banner = document.querySelector('.beyond-frame-banner');
      const iRect = interArea.getBoundingClientRect();
      const bRect = banner.getBoundingClientRect();
      const padX = iRect.left + 80;
      const padY = iRect.top + (bRect.top - iRect.top) / 2;

      window.dispatchEvent(new WheelEvent('wheel', {
        clientX: padX,
        clientY: padY,
        deltaY: -80,
        bubbles: true,
        cancelable: true
      }));
      await new Promise(r => setTimeout(r, 220));
    });
    await new Promise(r => setTimeout(r, 150));
  }

  const card1Check = await page.evaluate(() => {
    const pips = Array.from(document.querySelectorAll('.beyond-frame-step-pip')).map(p => p.classList.contains('is-active'));
    return { activeIndex: pips.indexOf(true) };
  });
  console.log(`  Current active card index after reversal: ${card1Check.activeIndex} (Expected: 0 / Card 1)`);

  // Test 6: Endpoint behaviour at first card (scrolling up)
  console.log('\n6. Testing ENDPOINT NON-TRAPPING behaviour at first card (scrolling up)...');
  const endpointUpResult = await page.evaluate(() => {
    const interArea = document.querySelector('.beyond-frame-interaction-area');
    const banner = document.querySelector('.beyond-frame-banner');
    const iRect = interArea.getBoundingClientRect();
    const bRect = banner.getBoundingClientRect();
    const padX = iRect.left + 80;
    const padY = iRect.top + (bRect.top - iRect.top) / 2;

    const event = new WheelEvent('wheel', {
      clientX: padX,
      clientY: padY,
      deltaY: -100,
      bubbles: true,
      cancelable: true
    });

    window.dispatchEvent(event);
    return {
      defaultPrevented: event.defaultPrevented
    };
  });
  console.log(`  At first card scrolling up, defaultPrevented=${endpointUpResult.defaultPrevented}`);
  console.log(`  Released to normal webpage scroll at first card: ${!endpointUpResult.defaultPrevented ? 'YES (PASS - Never trapped!)' : 'FAIL'}`);

  // -------------------------------------------------------------------
  // TEST PART C: RESPONSIVE VIEWPORTS & THEME COMPATIBILITY
  // -------------------------------------------------------------------
  console.log('\n--- PART C: RESPONSIVE VIEWPORTS & THEME COMPATIBILITY ---');
  const viewports = [
    { width: 1200, height: 800, name: 'Small Desktop (1200px)' },
    { width: 800, height: 900, name: 'Tablet (800px)' },
    { width: 390, height: 844, name: 'Mobile iPhone (390px)' }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.evaluate(() => {
      const sec = document.querySelector('.beyond-frame-section');
      if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 600));

    const vpMetrics = await page.evaluate(() => {
      const banner = document.querySelector('.beyond-frame-banner');
      const bRect = banner ? banner.getBoundingClientRect() : null;
      const ratio = bRect ? bRect.width / bRect.height : 0;
      return {
        width: bRect ? Math.round(bRect.width * 10) / 10 : 0,
        height: bRect ? Math.round(bRect.height * 10) / 10 : 0,
        ratio: Math.round(ratio * 1000) / 1000,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });

    const is4to1 = Math.abs(vpMetrics.ratio - 4.0) < 0.05;
    const noOverflow = vpMetrics.scrollWidth <= vpMetrics.clientWidth;

    console.log(`Viewport ${vp.name}: ${vpMetrics.width}px × ${vpMetrics.height}px | Ratio: ${vpMetrics.ratio} (Pass 4:1: ${is4to1 ? 'YES' : 'FAIL'}) | Overflow: ${noOverflow ? 'NONE' : 'FAIL'}`);

    if (vp.width === 390) {
      await page.screenshot({ path: 'scratch/verify_btf_mobile_390.png' });
      console.log('Captured mobile screenshot: scratch/verify_btf_mobile_390.png');
    }
  }

  // Light theme test
  console.log('\nTesting Light Theme:');
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    const sec = document.querySelector('.beyond-frame-section');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 600));

  const lightCheck = await page.evaluate(() => {
    const interArea = document.querySelector('.beyond-frame-interaction-area');
    const banner = document.querySelector('.beyond-frame-banner');
    return {
      interBg: window.getComputedStyle(interArea).backgroundColor,
      bannerBg: window.getComputedStyle(banner).backgroundColor
    };
  });
  console.log(`  Light Theme Interaction Area: ${lightCheck.interBg}`);
  console.log(`  Light Theme Banner Background: ${lightCheck.bannerBg}`);
  await page.screenshot({ path: 'scratch/verify_btf_light_theme.png' });
  console.log('Captured light theme screenshot: scratch/verify_btf_light_theme.png');

  // Restore dark theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  console.log('\nErrors detected during run:', errors.length);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }

  await browser.close();
  console.log('\n======================================================================');
  console.log('                  VERIFICATION RUN COMPLETED                          ');
  console.log('======================================================================');
})();
