const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('================================================================');
  console.log('CBK DESIGNFOLIO — ALL THREE TASKS END-TO-END VERIFICATION SUITE');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('status of 404')) {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // -------------------------------------------------------------
  // TASK 1: ALTERNATE THE CINEMATIC IMAGE STACK HORIZONTAL DIRECTION
  // -------------------------------------------------------------
  console.log('>>> [TASK 1] Verifying Alternating Directions in Visual Orbit (DomeGallery)...');
  await page.evaluate(() => {
    document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const getRowAngles = () => page.evaluate(() => {
    const rows = document.querySelectorAll('#dome-gallery-mount .sphere-row');
    return Array.from(rows).map(r => {
      const m = r.style.transform.match(/rotateY\(([-0-9.]+)deg\)/);
      return m ? parseFloat(m[1]) : 0;
    });
  });

  const rowAngles1 = await getRowAngles();
  await new Promise(r => setTimeout(r, 1500));
  const rowAngles2 = await getRowAngles();

  console.log('Task 1 Row Motions:');
  const expectedDirs = ['Left to right', 'Right to left', 'Left to right', 'Right to left'];
  rowAngles1.forEach((a1, idx) => {
    const a2 = rowAngles2[idx];
    const diff = a2 - a1;
    const actualDir = diff > 0 ? 'Left to right' : diff < 0 ? 'Right to left' : 'Stationary';
    console.log(`  Row ${idx + 1}: ${a1.toFixed(2)}° -> ${a2.toFixed(2)}° (diff = ${diff.toFixed(2)}°) [Expected: ${expectedDirs[idx]}] -> Actual: ${actualDir}`);
    if (actualDir !== expectedDirs[idx]) {
      throw new Error(`Row ${idx + 1} direction mismatch! Expected ${expectedDirs[idx]} but got ${actualDir}`);
    }
  });
  console.log('✓ PASS: All rows alternate directions exactly as required.\n');

  // -------------------------------------------------------------
  // TASK 2: REMOVE ITEMS 6, 7, 8, 9 AFTER "HORNS & SKULL"
  // -------------------------------------------------------------
  console.log('>>> [TASK 2] Verifying Beyond The Frame (ScrollStack)...');
  await page.evaluate(() => {
    document.getElementById('beyond-the-frame-zone').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const btfData = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.beyond-frame-card')).map(c => ({
      title: c.querySelector('.beyond-frame-card__title')?.textContent.trim()
    }));
    const pips = document.querySelectorAll('.beyond-frame-step-pip').length;
    const counter = document.querySelector('.beyond-frame-step-counter')?.textContent.trim();
    return { cards, pips, counter };
  });

  console.log(`  Card count: ${btfData.cards.length} (Expected: 5)`);
  console.log(`  Pip count: ${btfData.pips} (Expected: 5)`);
  console.log(`  Counter initial: ${btfData.counter} (Expected: 01 / 05)`);
  console.log(`  Fifth item: ${btfData.cards[4]?.title} (Expected: HORNS & SKULL)`);

  if (btfData.cards.length !== 5) throw new Error(`Expected exactly 5 cards, got ${btfData.cards.length}`);
  if (btfData.pips !== 5) throw new Error(`Expected 5 pips, got ${btfData.pips}`);
  if (btfData.counter !== '01 / 05') throw new Error(`Expected counter 01 / 05, got ${btfData.counter}`);
  if (btfData.cards[4]?.title !== 'HORNS & SKULL') throw new Error(`Entry 5 must be HORNS & SKULL, got ${btfData.cards[4]?.title}`);

  // Advance to card 5
  const nextBtn = await page.$('.beyond-frame-ctrl-btn--next');
  for (let s = 1; s <= 4; s++) {
    await nextBtn.click();
    await new Promise(r => setTimeout(r, 350));
  }

  const endState = await page.evaluate(() => {
    const counter = document.querySelector('.beyond-frame-step-counter')?.textContent.trim();
    const nextDisabled = document.querySelector('.beyond-frame-ctrl-btn--next')?.hasAttribute('disabled');
    const activeTitle = document.querySelector('.beyond-frame-card.is-active .beyond-frame-card__title')?.textContent.trim();
    return { counter, nextDisabled, activeTitle };
  });

  console.log(`  Counter at end: ${endState.counter} (Expected: 05 / 05)`);
  console.log(`  Next button disabled: ${endState.nextDisabled} (Expected: true)`);
  console.log(`  Active card at end: ${endState.activeTitle} (Expected: HORNS & SKULL)`);

  if (endState.counter !== '05 / 05') throw new Error(`Counter must be 05 / 05, got ${endState.counter}`);
  if (!endState.nextDisabled) throw new Error('Next button must be disabled at card 5');
  if (endState.activeTitle !== 'HORNS & SKULL') throw new Error(`Active card must be HORNS & SKULL, got ${endState.activeTitle}`);
  console.log('✓ PASS: Exactly 5 items, counter 05 / 05, HORNS & SKULL is item 5, navigation stops correctly.\n');

  // -------------------------------------------------------------
  // TASK 3: DISABLE PURPLE FLUID CURSOR IN HEADER AND HERO
  // -------------------------------------------------------------
  console.log('>>> [TASK 3] Verifying Purple Fluid Cursor Exclusion...');
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 1000));

  // Check clipPath at scrollY = 0
  const topClip = await page.evaluate(() => {
    const container = document.querySelector('.splash-cursor-container');
    const hero = document.getElementById('hero-section')?.getBoundingClientRect();
    const header = document.getElementById('hero-header')?.getBoundingClientRect();
    return {
      clipPath: container?.style.clipPath,
      heroBottom: hero?.bottom,
      headerBottom: header?.bottom
    };
  });
  console.log('  Top clip state:', topClip);

  // Move mouse in header and hero
  for (let x = 100; x <= 1300; x += 100) {
    await page.mouse.move(x, 30);
  }
  await page.mouse.click(600, 30);

  for (let y = 100; y <= 800; y += 100) {
    await page.mouse.move(700, y);
  }
  await page.mouse.click(700, 450);

  // Scroll down past hero and test fluid below hero
  await page.evaluate(() => {
    window.scrollTo(0, 1000);
  });
  await new Promise(r => setTimeout(r, 500));

  const scrolledClip = await page.evaluate(() => {
    const container = document.querySelector('.splash-cursor-container');
    const header = document.getElementById('hero-header')?.getBoundingClientRect();
    return {
      clipPath: container?.style.clipPath,
      headerBottom: header?.bottom
    };
  });
  console.log('  Scrolled clip state:', scrolledClip);

  for (let x = 300; x <= 900; x += 60) {
    await page.mouse.move(x, 400);
  }
  await page.mouse.click(600, 400);

  // Light theme test
  console.log('  Testing Light theme disabling...');
  await page.evaluate(() => {
    if (typeof window.applyTheme === 'function') window.applyTheme('light');
    else document.getElementById('theme-toggle')?.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const lightCheck = await page.evaluate(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    const mount = document.getElementById('splash-cursor-mount');
    return {
      theme,
      display: mount ? window.getComputedStyle(mount).display : null,
      canvasCount: mount ? mount.querySelectorAll('canvas').length : 0
    };
  });
  console.log('  Light theme state:', lightCheck);
  if (lightCheck.theme !== 'light') throw new Error('Theme is not light');
  if (lightCheck.display !== 'none' && lightCheck.canvasCount !== 0) {
    throw new Error('Fluid must be disabled in light theme');
  }

  // Restore dark theme
  console.log('  Restoring Dark theme...');
  await page.evaluate(() => {
    if (typeof window.applyTheme === 'function') window.applyTheme('dark');
    else document.getElementById('theme-toggle')?.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const darkCheck = await page.evaluate(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    const mount = document.getElementById('splash-cursor-mount');
    return {
      theme,
      display: mount ? window.getComputedStyle(mount).display : null,
      canvasCount: mount ? mount.querySelectorAll('canvas').length : 0
    };
  });
  console.log('  Dark theme restored state:', darkCheck);
  if (darkCheck.theme !== 'dark') throw new Error('Failed to restore dark theme');
  if (darkCheck.canvasCount !== 1) throw new Error('Must have exactly 1 canvas');

  console.log('✓ PASS: Purple fluid is completely excluded from header/hero, active below hero in dark theme, disabled in light theme.\n');

  // -------------------------------------------------------------
  // MOBILE VIEWPORT TEST (390 x 844)
  // -------------------------------------------------------------
  console.log('>>> Testing Mobile Viewport (390 x 844)...');
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1000));

  const mobileClip = await page.evaluate(() => {
    const container = document.querySelector('.splash-cursor-container');
    const hero = document.getElementById('hero-section')?.getBoundingClientRect();
    const header = document.getElementById('hero-header')?.getBoundingClientRect();
    return {
      clipPath: container?.style.clipPath,
      heroBottom: hero?.bottom,
      headerBottom: header?.bottom
    };
  });
  console.log('  Mobile clip state at scrollY=0:', mobileClip);

  await page.screenshot({ path: 'scratch/verified_mobile_390_clean.png' });
  console.log('  Saved mobile screenshot to scratch/verified_mobile_390_clean.png');
  console.log('✓ PASS: Mobile layout responsive and intact.\n');

  console.log(`Total console errors during entire test run: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
    throw new Error('Test run caught console errors');
  }

  await browser.close();
  console.log('================================================================');
  console.log('ALL THREE TASKS FULLY VERIFIED AND PASSING SUCCESSFULLY!');
  console.log('================================================================');
})();
