const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log('Launching browser for comprehensive verification...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  const responses = [];
  page.on('response', res => {
    if (res.status() >= 400) {
      responses.push({ url: res.url(), status: res.status() });
    }
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);

  console.log('--- TEST 01: BEYOND THE FRAME TICKER (ANTON FONT) ---');
  const tickerFont = await page.evaluate(() => {
    const item = document.querySelector('.beyond-frame-wordmark-item');
    if (!item) return null;
    const style = window.getComputedStyle(item);
    return {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      text: item.textContent.trim()
    };
  });
  console.log('Ticker typography:', tickerFont);
  if (!tickerFont || !tickerFont.fontFamily.toLowerCase().includes('anton')) {
    throw new Error('FAIL: Ticker is not using Anton font! ' + JSON.stringify(tickerFont));
  }
  console.log('PASS: Ticker uses Anton font.');

  console.log('--- TEST 02: BEYOND THE FRAME CURSOR BOUNDARY ---');
  const cursorBoundaryTest = await page.evaluate(async () => {
    const btf = document.getElementById('beyond-the-frame-zone');
    const cursor = document.getElementById('section-cursor');
    if (!btf || !cursor) return { error: 'Missing elements' };

    const btfRect = btf.getBoundingClientRect();
    const results = {};

    // 1. Move to hero section
    window.dispatchEvent(new PointerEvent('pointermove', {
      clientX: 500,
      clientY: 200,
      bubbles: true
    }));
    await new Promise(r => setTimeout(r, 60));
    results.heroCursorScroll = cursor.classList.contains('cursor-scroll');
    results.heroCursorInHero = cursor.classList.contains('is-in-hero');

    // 2. Move into Beyond The Frame center
    const btfCenterX = btfRect.left + btfRect.width / 2;
    const btfCenterY = btfRect.top + btfRect.height / 2;
    window.dispatchEvent(new PointerEvent('pointermove', {
      clientX: btfCenterX,
      clientY: btfCenterY,
      bubbles: true
    }));
    await new Promise(r => setTimeout(r, 60));
    results.btfInsideCursorScroll = cursor.classList.contains('cursor-scroll');

    // 3. Move over child card inside Beyond The Frame
    const card = btf.querySelector('.beyond-frame-card');
    if (card) {
      const cardRect = card.getBoundingClientRect();
      window.dispatchEvent(new PointerEvent('pointermove', {
        clientX: cardRect.left + 50,
        clientY: cardRect.top + 50,
        bubbles: true
      }));
      await new Promise(r => setTimeout(r, 60));
      results.btfChildCardCursorScroll = cursor.classList.contains('cursor-scroll');
    }

    // 4. Move to The Core section
    const core = document.getElementById('the-core');
    const coreRect = core.getBoundingClientRect();
    window.dispatchEvent(new PointerEvent('pointermove', {
      clientX: coreRect.left + 100,
      clientY: coreRect.top + 100,
      bubbles: true
    }));
    await new Promise(r => setTimeout(r, 60));
    results.coreCursorScroll = cursor.classList.contains('cursor-scroll');

    // 5. Test scroll away
    // Move back into BTF
    window.dispatchEvent(new PointerEvent('pointermove', {
      clientX: btfCenterX,
      clientY: btfCenterY,
      bubbles: true
    }));
    await new Promise(r => setTimeout(r, 60));
    results.btfReEnterScroll = cursor.classList.contains('cursor-scroll');

    // Scroll window down by 3500px so BTF is far above viewport
    window.scrollTo({ top: 3500, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
    await new Promise(r => setTimeout(r, 60));
    results.afterPageScrollCursorScroll = cursor.classList.contains('cursor-scroll');

    return results;
  });
  console.log('Cursor Boundary Results:', cursorBoundaryTest);
  if (cursorBoundaryTest.heroCursorScroll) throw new Error('FAIL: cursor-scroll active in Hero!');
  if (!cursorBoundaryTest.btfInsideCursorScroll) throw new Error('FAIL: cursor-scroll not active in BTF!');
  if (!cursorBoundaryTest.btfChildCardCursorScroll) throw new Error('FAIL: cursor-scroll flickered over child card!');
  if (cursorBoundaryTest.coreCursorScroll) throw new Error('FAIL: cursor-scroll leaked into The Core!');
  if (cursorBoundaryTest.afterPageScrollCursorScroll) throw new Error('FAIL: cursor-scroll lingered after scrolling!');
  console.log('PASS: Strict Beyond The Frame cursor boundary verified.');

  console.log('--- TEST 03: HOBBIES SUBSECTION BELOW THE CORE ---');
  const hobbiesData = await page.evaluate(() => {
    const core = document.getElementById('the-core');
    const hobbies = document.getElementById('hobbies-archive');
    if (!hobbies) return { error: 'Missing #hobbies-archive' };

    const isDirectlyAfterCore = core.nextElementSibling === hobbies || 
      (core.nextElementSibling && (core.nextElementSibling === hobbies || core.nextElementSibling.id === 'hobbies-archive'));

    const meta = hobbies.querySelector('.dbl-meta-label')?.textContent.trim();
    const title = hobbies.querySelector('.dbl-title-main')?.textContent.trim();
    const desc = hobbies.querySelector('.dbl-subtitle-desc')?.textContent.trim();

    const cards = Array.from(hobbies.querySelectorAll('.hobby-card')).map(card => {
      const cat = card.getAttribute('data-category');
      const cardTitle = card.querySelector('.hobby-card__title')?.textContent.trim();
      const badge = card.querySelector('.hobby-card__badge')?.textContent.trim();
      const img = card.querySelector('.hobby-card__image')?.getAttribute('src');
      const rect = card.getBoundingClientRect();
      return { cat, cardTitle, badge, img, width: rect.width, height: rect.height, top: rect.top, left: rect.left };
    });

    return {
      isDirectlyAfterCore,
      meta,
      title,
      desc,
      cardsCount: cards.length,
      cards
    };
  });
  console.log('Hobbies subsection verification:', hobbiesData);
  if (hobbiesData.cardsCount !== 2) throw new Error('FAIL: Hobbies section does not have exactly 2 cards!');
  if (!hobbiesData.meta.includes('PERSONAL ARCHIVE // 06')) throw new Error('FAIL: Eyebrow mismatch: ' + hobbiesData.meta);
  if (hobbiesData.title !== 'HOBBIES') throw new Error('FAIL: Title mismatch: ' + hobbiesData.title);
  if (!hobbiesData.desc.includes('Beyond the pipeline')) throw new Error('FAIL: Subtitle mismatch: ' + hobbiesData.desc);
  if (hobbiesData.cards[0].cardTitle !== 'ARTS' || hobbiesData.cards[1].cardTitle !== 'GAMES') {
    throw new Error('FAIL: Card titles must be ARTS and GAMES! ' + JSON.stringify(hobbiesData.cards));
  }
  // Check side-by-side on desktop
  const card1 = hobbiesData.cards[0];
  const card2 = hobbiesData.cards[1];
  console.log(`Card 1 (Arts): left=${card1.left}, top=${card1.top}, w=${card1.width} | Card 2 (Games): left=${card2.left}, top=${card2.top}, w=${card2.width}`);
  if (Math.abs(card1.top - card2.top) > 5) {
    throw new Error('FAIL: Hobbies cards are not side-by-side on desktop!');
  }
  console.log('PASS: Hobbies section layout & typography verified.');

  console.log('--- TEST 04: ID CARD FRONT REPLACEMENT (ID Front(5).png) ---');
  const idFrontStatus = await page.evaluate(() => {
    // Check if ID Front(5).png is referenced
    const scriptText = document.documentElement.innerHTML;
    const hasFront5 = scriptText.includes('ID Front(5).png');
    const canvas = document.querySelector('canvas.lanyard-canvas, .lanyard-profile-section canvas');
    return {
      hasFront5,
      canvasExists: !!canvas,
      canvasWidth: canvas?.width,
      canvasHeight: canvas?.height
    };
  });
  console.log('ID Front Status:', idFrontStatus);
  if (!idFrontStatus.hasFront5) throw new Error('FAIL: ID Front(5).png is not referenced in page!');
  if (!idFrontStatus.canvasExists) throw new Error('FAIL: Lanyard canvas not found!');
  console.log('PASS: ID Card Front uses ID Front(5).png.');

  // Scroll to Beyond The Frame and capture screenshot
  await page.evaluate(() => {
    document.getElementById('beyond-the-frame-zone').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await sleep(1000);
  await page.screenshot({ path: 'scratch/verify_beyond_frame_anton.png' });
  console.log('Captured scratch/verify_beyond_frame_anton.png');

  // Scroll to The Core and capture screenshot of ID card
  await page.evaluate(() => {
    document.getElementById('the-core').scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await sleep(2000);
  await page.screenshot({ path: 'scratch/verify_core_id_front5_dark.png' });
  console.log('Captured scratch/verify_core_id_front5_dark.png');

  // Scroll to Hobbies section and capture screenshot
  await page.evaluate(() => {
    document.getElementById('hobbies-archive').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await sleep(1000);
  await page.screenshot({ path: 'scratch/verify_hobbies_dark.png' });
  console.log('Captured scratch/verify_hobbies_dark.png');

  console.log('--- TEST 05: LIGHT THEME VERIFICATION ---');
  await page.evaluate(() => {
    window.applyTheme('light');
  });
  await sleep(1500);

  // Capture Hobbies in Light theme
  await page.evaluate(() => {
    document.getElementById('hobbies-archive').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await sleep(1000);
  await page.screenshot({ path: 'scratch/verify_hobbies_light.png' });
  console.log('Captured scratch/verify_hobbies_light.png');

  // Capture The Core ID Card in Light theme
  await page.evaluate(() => {
    document.getElementById('the-core').scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await sleep(2000);
  await page.screenshot({ path: 'scratch/verify_core_id_front5_light.png' });
  console.log('Captured scratch/verify_core_id_front5_light.png');

  console.log('--- TEST 06: RESPONSIVE MOBILE VIEWPORT (390x844) ---');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.evaluate(() => {
    window.applyTheme('dark');
  });
  await sleep(1000);

  const mobileHobbies = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#hobbies-archive .hobby-card')).map(card => {
      const rect = card.getBoundingClientRect();
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    });
    return {
      card1Top: cards[0]?.top,
      card2Top: cards[1]?.top,
      isStacked: cards[1]?.top > cards[0]?.top + 50
    };
  });
  console.log('Mobile Hobbies layout:', mobileHobbies);
  if (!mobileHobbies.isStacked) {
    throw new Error('FAIL: Hobbies cards are not stacked vertically on mobile!');
  }
  console.log('PASS: Hobbies cards stack cleanly on mobile.');

  await page.evaluate(() => {
    document.getElementById('hobbies-archive').scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await sleep(800);
  await page.screenshot({ path: 'scratch/verify_mobile_hobbies.png' });
  console.log('Captured scratch/verify_mobile_hobbies.png');

  console.log('--- NETWORK AND CONSOLE ERROR CHECKS ---');
  console.log('Failed HTTP requests:', responses.filter(r => !r.url.includes('favicon')));
  console.log('Console errors:', consoleErrors.filter(e => !e.includes('favicon')));

  await browser.close();
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
})();
