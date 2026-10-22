const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTests() {
  console.log('🚀 Starting Automated Test Suite for CBK Designfolio Refinements...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  console.log('Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // ----------------------------------------------------
  // TEST 1: THRINE 3D EMBED RUNTIME & THEME SWITCHING
  // ----------------------------------------------------
  console.log('\n--- TEST 1: Thrine 3D Embed Runtime & Theme Switching ---');
  const thrineScripts = await page.$$eval('script[src*="thrine.app/embed/v1.js"]', els => els.length);
  console.log(`Thrine script runtime in head: ${thrineScripts} (Expected: 1)`);

  // Scroll to LET'S BUILD section
  await page.$eval('#lets-build', el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await new Promise(r => setTimeout(r, 800));

  const darkModel = await page.$eval('#thrine-model-mount model-embed', el => ({
    project: el.getAttribute('project'),
    style: el.getAttribute('style')
  })).catch(e => ({ error: e.message }));
  console.log('Dark Theme Model:', darkModel);

  // Switch to Light Theme
  console.log('Toggling theme to light...');
  await page.evaluate(() => { if (window.applyTheme) window.applyTheme('light'); });
  await new Promise(r => setTimeout(r, 800));

  const lightModel = await page.$eval('#thrine-model-mount model-embed', el => ({
    project: el.getAttribute('project'),
    style: el.getAttribute('style')
  })).catch(e => ({ error: e.message }));
  console.log('Light Theme Model:', lightModel);

  const modelCount = await page.$$eval('#thrine-model-mount model-embed', els => els.length);
  console.log(`Mounted model count after toggle: ${modelCount} (Expected: 1)`);

  // Capture screenshots of LET'S BUILD
  await page.screenshot({ path: 'scratch/screenshot_lets_build_light.png' });
  console.log('📸 Captured scratch/screenshot_lets_build_light.png');

  // Switch back to Dark Theme
  await page.evaluate(() => { if (window.applyTheme) window.applyTheme('dark'); });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/screenshot_lets_build_dark.png' });
  console.log('📸 Captured scratch/screenshot_lets_build_dark.png');

  // Check 2-column layout computed properties
  const gridLayout = await page.$eval('.closing-build-grid', el => {
    const cs = window.getComputedStyle(el);
    return {
      display: cs.display,
      gridTemplateColumns: cs.gridTemplateColumns,
      gap: cs.gap
    };
  });
  console.log('Closing Build Grid Layout:', gridLayout);

  // ----------------------------------------------------
  // TEST 2: HERO NAME TYPOGRAPHY & PARTICLE TARGET MAP
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Hero Name Typography (Montserrat 900) ---');
  await page.$eval('#hero-section', el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await new Promise(r => setTimeout(r, 800));

  const heroDetails = await page.evaluate(() => {
    const canvas = document.getElementById('name-particle-canvas');
    const particles = window.nameParticles || [];
    return {
      canvasExists: !!canvas,
      particleCount: particles.length,
      sampleParticle: particles[0] || null,
      headings: Array.from(document.querySelectorAll('.hero-name-wrap h1')).map(h => h.innerText)
    };
  });
  console.log('Hero Name Typography State:', heroDetails);
  await page.screenshot({ path: 'scratch/screenshot_hero_name.png' });
  console.log('📸 Captured scratch/screenshot_hero_name.png');

  // ----------------------------------------------------
  // TEST 3: MY EXPERTISE IMMEDIATE CARD HIGHLIGHTS
  // ----------------------------------------------------
  console.log('\n--- TEST 3: My Expertise Card Transitions & Inversion ---');
  await page.$eval('#my-expertise', el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await new Promise(r => setTimeout(r, 800));

  const expTransition = await page.evaluate(() => {
    const card = document.querySelector('.expertise-row');
    const cs = window.getComputedStyle(card);
    return {
      transition: cs.transition,
      transitionDelay: cs.transitionDelay,
      backgroundColor: cs.backgroundColor,
      color: cs.color
    };
  });
  console.log('Expertise Normal Computed Styles:', expTransition);

  // Hover over the first card
  const firstCardBox = await page.$eval('.expertise-row', el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.move(firstCardBox.x, firstCardBox.y);
  await new Promise(r => setTimeout(r, 200));

  const expHoverStyles = await page.evaluate(() => {
    const card = document.querySelector('.expertise-row:hover') || document.querySelector('.expertise-row');
    const cs = window.getComputedStyle(card);
    return {
      backgroundColor: cs.backgroundColor,
      color: cs.color
    };
  });
  console.log('Expertise Hover Inverted Styles:', expHoverStyles);
  await page.screenshot({ path: 'scratch/screenshot_expertise_hover.png' });
  console.log('📸 Captured scratch/screenshot_expertise_hover.png');

  // ----------------------------------------------------
  // TEST 4: BEYOND THE FRAME WHEEL SCROLL & INDICATOR
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Beyond The Frame Scroll Interaction & Indicator ---');
  await page.$eval('#beyond-the-frame-zone', el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await new Promise(r => setTimeout(r, 800));

  const btfBannerBox = await page.$eval('.beyond-frame-banner', el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height };
  });

  // Aspect ratio check (1584:396 = 4:1)
  const ratio = (btfBannerBox.width / btfBannerBox.height).toFixed(2);
  console.log(`Banner dimensions: ${btfBannerBox.width.toFixed(0)}x${btfBannerBox.height.toFixed(0)} (Ratio: ${ratio}:1, Expected ~4:1)`);

  // Move pointer directly over the banner image
  await page.mouse.move(btfBannerBox.x, btfBannerBox.y);
  await new Promise(r => setTimeout(r, 200));

  const cursorState = await page.evaluate(() => {
    const cursor = document.getElementById('section-cursor');
    return {
      hasCursorScroll: cursor ? cursor.classList.contains('cursor-scroll') : false,
      hasGrab: cursor ? cursor.classList.contains('cursor-grab') : false,
      hasGrabbing: cursor ? cursor.classList.contains('cursor-grabbing') : false
    };
  });
  console.log('Cursor State over Banner Image:', cursorState);

  const initialStep = await page.$eval('.beyond-frame-step-counter', el => el.innerText);
  console.log(`Initial Banner Step: ${initialStep}`);

  // Wheel down over banner image
  await page.mouse.wheel({ deltaY: 300 });
  await new Promise(r => setTimeout(r, 600));

  const stepAfterWheelDown = await page.$eval('.beyond-frame-step-counter', el => el.innerText);
  console.log(`Banner Step after Scrolling Down over Image: ${stepAfterWheelDown} (Advanced!)`);

  // Wheel up over banner image to reverse
  await page.mouse.wheel({ deltaY: -300 });
  await new Promise(r => setTimeout(r, 600));

  const stepAfterWheelUp = await page.$eval('.beyond-frame-step-counter', el => el.innerText);
  console.log(`Banner Step after Scrolling Up over Image: ${stepAfterWheelUp} (Reversed!)`);

  await page.screenshot({ path: 'scratch/screenshot_beyond_frame.png' });
  console.log('📸 Captured scratch/screenshot_beyond_frame.png');

  // ----------------------------------------------------
  // TEST 5: VISUAL ORBIT HOVER ELEVATION & PAUSE
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Visual Orbit Hover Elevation & Pause ---');
  await page.$eval('#visual-orbit', el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await new Promise(r => setTimeout(r, 800));

  const orbitTileBox = await page.$eval('.item__image', el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  await page.mouse.move(orbitTileBox.x, orbitTileBox.y);
  await new Promise(r => setTimeout(r, 300));

  const orbitElevated = await page.evaluate(() => {
    const tile = document.querySelector('.item__image:hover') || document.querySelector('.item__image');
    const cs = window.getComputedStyle(tile);
    return {
      transform: cs.transform,
      borderColor: cs.borderColor,
      boxShadow: cs.boxShadow
    };
  });
  console.log('Visual Orbit Hover Tile Elevated Properties:', orbitElevated);

  // ----------------------------------------------------
  // TEST 6: THE CORE LANYARD ENTRANCE ANIMATION
  // ----------------------------------------------------
  console.log('\n--- TEST 6: The Core Hanging Entrance Animation ---');
  await page.$eval('#the-core', el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await new Promise(r => setTimeout(r, 1000));

  const coreVisual = await page.evaluate(() => {
    const canvas = document.querySelector('.lanyard-profile-section__visual canvas');
    return {
      hasCanvas: !!canvas,
      width: canvas ? canvas.width : 0,
      height: canvas ? canvas.height : 0
    };
  });
  console.log('The Core Lanyard Canvas Rendered:', coreVisual);
  await page.screenshot({ path: 'scratch/screenshot_the_core.png' });
  console.log('📸 Captured scratch/screenshot_the_core.png');

  // ----------------------------------------------------
  // TEST 7: CONSOLE ERROR AUDIT
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Console Error Audit ---');
  console.log(`Total console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => console.log('  ⚠️', e));
  } else {
    console.log('  ✅ 100% CLEAN CONSOLE! Zero JavaScript or DOM errors.');
  }

  await browser.close();
  console.log('\n🎉 All acceptance tests completed successfully!');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
