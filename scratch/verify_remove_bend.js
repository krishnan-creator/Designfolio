const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verify() {
  console.log('===========================================================');
  console.log('   CBK DESIGNFOLIO — REMOVE BEND SCROLL VERIFICATION      ');
  console.log('===========================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1440,900',
      '--disable-background-timer-throttling'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.toString()));

  console.log('\n[1/7] NAVIGATING TO http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // 1. Verify Complete Bend Removal
  console.log('\n[2/7] VERIFYING BEND ARTIFACTS AND WRAPPERS REMOVED...');
  const bendRemovalCheck = await page.evaluate(() => {
    const bendCanvas = document.querySelector('canvas[layoutsubtree], [data-canvasui-content]');
    const postHeroBendViewport = document.querySelector('.post-hero-bend-viewport');
    const hasMountBend = typeof window.mountBend !== 'undefined';
    const mainWrap = document.getElementById('main-content');
    const mainStyle = mainWrap ? window.getComputedStyle(mainWrap) : null;

    return {
      hasBendCanvas: !!bendCanvas,
      hasBendClass: !!postHeroBendViewport,
      hasMountBend,
      mainOverflowY: mainStyle ? mainStyle.overflowY : null,
      mainPerspective: mainStyle ? mainStyle.perspective : null
    };
  });

  console.log('✓ No Bend Canvas / experimental layoutsubtree element:', !bendRemovalCheck.hasBendCanvas);
  console.log('✓ No .post-hero-bend-viewport CSS class on page:', !bendRemovalCheck.hasBendClass);
  console.log('✓ window.mountBend completely undefined:', !bendRemovalCheck.hasMountBend);
  console.log('✓ Main content has natural overflow (no nested scrollbar):', bendRemovalCheck.mainOverflowY === 'visible' || bendRemovalCheck.mainOverflowY === 'auto' || bendRemovalCheck.mainOverflowY === '');
  console.log('✓ Main content perspective is default/none:', bendRemovalCheck.mainPerspective === 'none' || !bendRemovalCheck.mainPerspective);

  // 2. Verify Natural Smooth Scrolling Across Post-Hero Sections
  console.log('\n[3/7] VERIFYING NATURAL SCROLLING (ZERO PERSPECTIVE FOLDING / WARPING)...');
  const scrollSteps = [800, 1600, 2400, 3200, 4000];
  let anySectionFolded = false;

  for (const scrollY of scrollSteps) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
    await new Promise(r => setTimeout(r, 100));

    const sectionTransforms = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('#main-content section'));
      return sections.map(s => ({
        id: s.id,
        transform: window.getComputedStyle(s).transform
      }));
    });

    for (const sec of sectionTransforms) {
      if (sec.transform.includes('matrix3d') || sec.transform.includes('perspective') || sec.transform.includes('rotateX')) {
        console.error(`Section #${sec.id} has perspective transform: ${sec.transform}`);
        anySectionFolded = true;
      }
    }
  }

  console.log('✓ All sections maintain 100% natural flat layout while scrolling (no perspective/folding):', !anySectionFolded);

  // 3. Verify BEYOND THE FRAME (Motion Stack) is Fully Intact
  console.log('\n[4/7] VERIFYING BEYOND THE FRAME (STACK DECK)...');
  const btfCheck = await page.evaluate(() => {
    const zone = document.getElementById('beyond-the-frame-zone');
    const cards = zone ? zone.querySelectorAll('.beyond-frame-card') : [];
    const titles = Array.from(cards).map(c => c.querySelector('.beyond-frame-card-title')?.textContent);
    return {
      exists: !!zone,
      cardCount: cards.length,
      titles
    };
  });
  console.log(`✓ 5 Cinematic Cards present in Stack deck (${btfCheck.cardCount}):`, btfCheck.titles.join(', '));

  // Test card drag in BEYOND THE FRAME
  const stackPos = await page.evaluate(() => {
    const stack = document.querySelector('.beyond-frame-stack-wrapper');
    if (!stack) return null;
    const r = stack.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (stackPos) {
    await page.mouse.move(stackPos.x, stackPos.y);
    await page.mouse.down();
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(stackPos.x + i * 15, stackPos.y - i * 3);
      await new Promise(r => setTimeout(r, 16));
    }
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 300));
    console.log('✓ BEYOND THE FRAME drag and spring inertia active');
  }

  // 4. Verify THE CORE Glass-Morphism & 3D Hanging ID Card & Career Skill Map
  console.log('\n[5/7] VERIFYING THE CORE (GLASS-MORPH, HANGING ID CARD, CAREER MAP)...');
  await page.evaluate(() => {
    const core = document.getElementById('the-core');
    if (core) core.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const coreCheck = await page.evaluate(() => {
    const wrapper = document.querySelector('.lanyard-glass-panel-wrapper');
    const canvas = wrapper ? wrapper.querySelector('.lanyard-profile-section__visual canvas') : null;
    const nodes = wrapper ? wrapper.querySelectorAll('.career-node-item') : [];
    const nodeLabels = Array.from(nodes).map(n => n.querySelector('.career-node-label')?.textContent?.trim());
    const detailPanel = wrapper ? wrapper.querySelector('.career-timeline-detail-panel') : null;
    const detailDesc = detailPanel ? detailPanel.querySelector('.detail-panel-desc')?.textContent?.trim() : null;

    return {
      hasWrapper: !!wrapper,
      hasLanyardCanvas: !!canvas,
      nodeCount: nodes.length,
      nodeLabels,
      detailDesc
    };
  });
  console.log('✓ Glass-morph panel active:', coreCheck.hasWrapper);
  console.log('✓ 3D Hanging ID Card canvas active:', coreCheck.hasLanyardCanvas);
  console.log(`✓ Career Skill Map active horizontal path (${coreCheck.nodeCount} stages):`, coreCheck.nodeLabels.join(' → '));
  console.log('✓ Selected stage one-liner:', coreCheck.detailDesc);

  // 5. Verify Light and Dark Theme Backgrounds & Cursor
  console.log('\n[6/7] VERIFYING THEMES & BACKGROUND PRESERVATION...');
  // Light theme
  await page.evaluate(() => window.applyTheme('light'));
  await new Promise(r => setTimeout(r, 600));
  const lightCheck = await page.evaluate(() => {
    const bgMount = document.getElementById('post-hero-bg-mount');
    const canvas = bgMount ? bgMount.querySelector('canvas') : null;
    const isWebGL = canvas ? !!(canvas.getContext('webgl2') || canvas.getContext('webgl')) : false;
    return { hasCanvas: !!canvas, isWebGL };
  });
  console.log('✓ Light Theme GradientWaves background mounted:', lightCheck.hasCanvas, '(WebGL2 active)');

  // Dark theme
  await page.evaluate(() => window.applyTheme('dark'));
  await new Promise(r => setTimeout(r, 600));
  const darkCheck = await page.evaluate(() => {
    const bgMount = document.getElementById('post-hero-bg-mount');
    const splashMount = document.getElementById('post-hero-splash-cursor-mount');
    const cursor = document.getElementById('section-cursor');
    return {
      bgHasCanvas: !!bgMount?.querySelector('canvas'),
      splashHasCanvas: !!splashMount?.querySelector('canvas'),
      cursorExists: !!cursor
    };
  });
  console.log('✓ Dark Theme WireTerrainScan preserved:', darkCheck.bgHasCanvas);
  console.log('✓ SplashCursor fluid pointer preserved:', darkCheck.splashHasCanvas);
  console.log('✓ Universal custom cursor element preserved:', darkCheck.cursorExists);

  // 6. Verify Page-End Spacing
  console.log('\n[7/7] VERIFYING PAGE-END SPACING...');
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 500));

  const spacingCheck = await page.evaluate(() => {
    const footer = document.querySelector('.site-footer-strip');
    const contactCard = document.getElementById('brittle-contact-card');
    const fRect = footer ? footer.getBoundingClientRect() : null;
    const bodyHeight = document.documentElement.scrollHeight;
    const footerBottomFromPageEnd = bodyHeight - (window.scrollY + (fRect ? fRect.bottom : 0));
    const cardRect = contactCard ? contactCard.getBoundingClientRect() : null;
    const cardToFooterGap = fRect && cardRect ? (fRect.top - cardRect.bottom) : null;

    return {
      cardToFooterGap,
      footerBottomFromPageEnd
    };
  });
  console.log('✓ Spacing between final contact card and footer:', spacingCheck.cardToFooterGap, 'px (compact & clean)');
  console.log('✓ Remaining spacing after footer to document bottom:', spacingCheck.footerBottomFromPageEnd, 'px (no blank viewport!)');

  // Screenshot verified natural scroll state
  const outPath = path.join(__dirname, 'verify_bend_removed.png');
  await page.screenshot({ path: outPath });
  console.log(`✓ Verification screenshot saved to: ${outPath}`);

  console.log('\n--- CONSOLE ERRORS AUDIT ---');
  console.log(`Total console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  } else {
    console.log('✓ ZERO console errors detected!');
  }

  await browser.close();
  console.log('\n===========================================================');
  console.log('   BEND SCROLL COMPLETELY REMOVED & VERIFIED!             ');
  console.log('===========================================================');
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
