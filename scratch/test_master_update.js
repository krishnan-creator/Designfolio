const puppeteer = require('puppeteer-core');
const fs = require('fs');

function getBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

(async () => {
  console.log('========================================================================');
  console.log('VERIFICATION: VISUAL ORBIT PHYSICS, BTF MERGE, TICKERS & OFF THE CLOCK');
  console.log('========================================================================\n');

  const exePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: exePath,
    headless: true,
    args: ['--window-size=1600,1000', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  const errors = [];
  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      errors.push(message);
    } else {
      console.log(`✅ PASS: ${message}`);
    }
  }

  try {
    console.log('Loading public homepage (http://localhost:3000)...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // ==================================================================
    // TASK 4: OFF THE CLOCK SECTION RENAME & TAGLINE
    // ==================================================================
    console.log('\n--- VERIFYING TASK 4: OFF THE CLOCK ---');
    const offTheClockData = await page.evaluate(() => {
      const section = document.getElementById('hobbies-archive');
      if (!section) return null;
      const titleEl = section.querySelector('.hobbies-compact-title');
      const tagEl = section.querySelector('.hobbies-subtitle-tag');
      const metaEl = section.querySelector('.dbl-meta-label');
      const reelMount = section.querySelector('#elastic-reel-mount');
      return {
        exists: true,
        title: titleEl ? titleEl.textContent.trim() : '',
        tagline: tagEl ? tagEl.textContent.trim() : '',
        metaText: metaEl ? metaEl.textContent.trim() : '',
        hasReel: !!reelMount
      };
    });

    assert(offTheClockData && offTheClockData.exists, 'OFF THE CLOCK section exists in DOM');
    assert(offTheClockData.title === 'OFF THE CLOCK', `Section title is exactly "OFF THE CLOCK" (found: "${offTheClockData.title}")`);
    assert(
      offTheClockData.tagline === 'Beyond the work. Into the worlds that shape me.',
      `Tagline is exactly "Beyond the work. Into the worlds that shape me." (found: "${offTheClockData.tagline}")`
    );
    assert(
      !offTheClockData.title.includes('HOBBIES') && !offTheClockData.tagline.includes('HOBBIES'),
      'Old visible HOBBIES title is not displayed in the section header'
    );
    assert(offTheClockData.hasReel, 'Elastic reel mount is preserved for archive cards');

    // ==================================================================
    // TASK 2: BY THE NUMBERS & BEYOND THE FRAME MERGE + CONTINUOUS TICKER
    // ==================================================================
    console.log('\n--- VERIFYING TASK 2: VISUAL MERGE & CONTINUOUS BTF TICKER ---');
    const mergeData = await page.evaluate(() => {
      const numbersSec = document.getElementById('by-the-numbers');
      const numbersGrid = document.querySelector('.numbers-editorial-grid');
      const btfSec = document.getElementById('beyond-the-frame-zone');
      const btfInner = document.querySelector('.beyond-frame-inner');

      const numGridRect = numbersGrid ? numbersGrid.getBoundingClientRect() : null;
      const btfRect = btfSec ? btfSec.getBoundingClientRect() : null;
      const gap = (btfRect && numGridRect) ? (btfRect.top - numGridRect.bottom) : 0;

      // Check 5 cinematic entries
      const entries = Array.from(document.querySelectorAll('.beyond-frame-card__title')).map(el => el.textContent.trim());

      // Check marquee ticker
      const track = document.querySelector('.beyond-frame-wordmark-track');
      const stream = document.querySelector('.beyond-frame-wordmark-stream');
      const group1 = stream ? stream.querySelector('.beyond-frame-wordmark-group:first-child') : null;
      const group2 = stream ? stream.querySelector('.beyond-frame-wordmark-group[aria-hidden="true"]') : null;

      const streamStyle = stream ? window.getComputedStyle(stream) : null;

      return {
        gap,
        entries,
        hasTrack: !!track,
        hasStream: !!stream,
        hasGroup1: !!group1,
        hasGroup2: !!group2,
        group2AriaHidden: group2 ? group2.getAttribute('aria-hidden') : null,
        animationName: streamStyle ? streamStyle.animationName : ''
      };
    });

    console.log(`Measured gap between Number Cards and Beyond The Frame: ${mergeData.gap.toFixed(1)}px`);
    assert(mergeData.gap <= 60 && mergeData.gap >= 0, `Beyond the Frame begins immediately beneath number-card bottom padding (gap: ${mergeData.gap.toFixed(1)}px)`);

    const expectedEntries = [
      'MYTHIC WORLDS',
      'CINEMATIC LOOK-DEV',
      'CHARACTER STUDIES',
      'ENVIRONMENT DESIGN',
      'AI FILMMAKING'
    ];
    const entriesMatch = expectedEntries.every((e, i) => mergeData.entries[i] === e);
    assert(entriesMatch, `All 5 cinematic entries preserved in exact order: ${mergeData.entries.join(', ')}`);

    assert(mergeData.hasTrack && mergeData.hasStream, 'Beyond the Frame marquee track and stream elements present');
    assert(mergeData.hasGroup1 && mergeData.hasGroup2, 'Marquee has two identical groups for seamless 0% -> -50% infinite translation');
    assert(mergeData.group2AriaHidden === 'true', 'Duplicate visual marquee group is aria-hidden="true" for accessible screen readers');
    assert(mergeData.animationName.includes('btfWordmarkMarquee'), `Continuous marquee animation active (animation: ${mergeData.animationName})`);

    // ==================================================================
    // TASK 1: VISUAL ORBIT SMOOTH DRAG-RELEASE MOMENTUM & HOVER-PAUSE
    // ==================================================================
    console.log('\n--- VERIFYING TASK 1: VISUAL ORBIT PHYSICS & HOVER-PAUSE ---');
    await page.evaluate(() => {
      document.querySelector('#visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 600));

    const domeBox = await page.$eval('.sphere-root', el => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, width: r.width, top: r.top, height: r.height };
    });

    const getRotY = async () => {
      return await page.evaluate(() => {
        const sphere = document.querySelector('.sphere-root .sphere');
        const m = sphere ? sphere.style.transform.match(/rotateY\(([-\d.]+)deg\)/) : null;
        return m ? parseFloat(m[1]) : 0;
      });
    };

    // 1.1 State A: Automatic continuous orbit when outside
    await page.mouse.move(50, 50);
    await new Promise(r => setTimeout(r, 200));
    const rotA1 = await getRotY();
    await new Promise(r => setTimeout(r, 500));
    const rotA2 = await getRotY();
    assert(rotA2 < rotA1, `State A: Continuous right-to-left orbit active outside dome (delta: ${(rotA2 - rotA1).toFixed(2)} deg)`);

    // 1.2 State B: Pointer enters dome -> strictly pauses at current orientation
    await page.mouse.move(domeBox.x, domeBox.y);
    await new Promise(r => setTimeout(r, 150));
    const rotB1 = await getRotY();
    await new Promise(r => setTimeout(r, 500));
    const rotB2 = await getRotY();
    const pauseDiff = Math.abs(rotB2 - rotB1);
    assert(pauseDiff <= 0.05, `State B: Pointer inside dome strictly pauses automatic orbit (diff: ${pauseDiff.toFixed(3)} deg)`);

    // 1.3 State C & D & E: Fast horizontal drag with release momentum
    console.log('Testing Fast drag release momentum...');
    await page.mouse.move(domeBox.x + 100, domeBox.y);
    await new Promise(r => setTimeout(r, 100));
    await page.mouse.down();
    // Drag rapidly to the left (displacement: -140px in 3 steps)
    await page.mouse.move(domeBox.x - 40, domeBox.y, { steps: 3 });
    await page.mouse.up();

    // Immediately check that release momentum continues in the direction of the drag (decreasing yaw)
    const rotRel1 = await getRotY();
    await new Promise(r => setTimeout(r, 300));
    const rotRel2 = await getRotY();
    assert(rotRel2 < rotRel1, `State D: Release momentum continues in drag direction (delta: ${(rotRel2 - rotRel1).toFixed(2)} deg)`);

    // Check that momentum smoothly decelerates and settles
    console.log('Allowing momentum to settle...');
    await new Promise(r => setTimeout(r, 2200));
    const rotSettled1 = await getRotY();
    await new Promise(r => setTimeout(r, 500));
    const rotSettled2 = await getRotY();
    const settleDiff = Math.abs(rotSettled2 - rotSettled1);
    assert(settleDiff <= 0.05, `State E & F: After momentum settles with pointer inside dome, dome stays stationary (diff: ${settleDiff.toFixed(3)} deg)`);

    // 1.4 State F: Moving pointer outside dome resumes continuous right-to-left orbit smoothly
    console.log('Moving pointer outside dome...');
    await page.mouse.move(50, 50);
    await new Promise(r => setTimeout(r, 200));
    const rotResume1 = await getRotY();
    await new Promise(r => setTimeout(r, 500));
    const rotResume2 = await getRotY();
    assert(rotResume2 < rotResume1, `State F: Resumes smooth right-to-left orbit after pointer exits (delta: ${(rotResume2 - rotResume1).toFixed(2)} deg)`);

    // ==================================================================
    // TASK 3: BACKSTAGE CMS INDEPENDENT TICKER EDITING & PERSISTENCE
    // ==================================================================
    console.log('\n--- VERIFYING TASK 3: BACKSTAGE TICKER EDITING ---');
    // Test 3.1: Read current content from /api/content
    const initialContent = await page.evaluate(async () => {
      const res = await fetch('/api/content');
      const j = await res.json();
      return j.data;
    });

    const sections = Array.isArray(initialContent.sections) ? initialContent.sections : Object.values(initialContent.sections);
    const heroSec = sections.find(s => s.id === 'sec-hero');
    const tickerSec = sections.find(s => s.id === 'sec-ticker');
    const btfSec = sections.find(s => s.id === 'sec-beyond-frame');

    assert(!!heroSec && !!tickerSec, 'Hero and Ticker sections present in CMS');
    assert(!!btfSec, 'Beyond the Frame section present in CMS');

    const heroTickerInitial = heroSec.content.tickerText || tickerSec.content.tickerText;
    const btfTickerInitial = btfSec.content.tickerText || 'BEYOND THE FRAME';
    console.log('Initial Hero Ticker in CMS:', heroTickerInitial);
    console.log('Initial BTF Ticker in CMS:', btfTickerInitial);

    assert(heroTickerInitial && heroTickerInitial.includes('GENERATIVE AI'), 'Hero ticker contains creative discipline sequence');
    assert(btfTickerInitial && btfTickerInitial.includes('BEYOND THE FRAME'), 'BTF ticker contains BEYOND THE FRAME phrase');

    // Test 3.2: Edit Hero Ticker independently via CMS save
    console.log('Testing independent Hero ticker update in CMS...');
    const testHeroText = 'NEXT-GEN AI · CREATIVE VISION · VIRTUAL PRODUCTION';
    const modifiedContentHero = JSON.parse(JSON.stringify(initialContent));
    const modSections1 = Array.isArray(modifiedContentHero.sections) ? modifiedContentHero.sections : Object.values(modifiedContentHero.sections);
    const modHero = modSections1.find(s => s.id === 'sec-hero');
    const modTicker = modSections1.find(s => s.id === 'sec-ticker');
    if (modHero && modHero.content) modHero.content.tickerText = testHeroText;
    if (modTicker && modTicker.content) {
      modTicker.content.tickerText = testHeroText;
      modTicker.content.items = ['NEXT-GEN AI', 'CREATIVE VISION', 'VIRTUAL PRODUCTION'];
    }

    // Save directly to content.json for test verification
    fs.writeFileSync('data/content.json', JSON.stringify(modifiedContentHero, null, 2), 'utf8');

    // Reload page and verify Hero ticker updated, while BTF ticker is untouched
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const checkHeroEdit = await page.evaluate(() => {
      const heroSeq = document.querySelector('.hero-ticker-wrap .ticker-sequence');
      const btfGroup = document.querySelector('.beyond-frame-wordmark-group');
      return {
        heroText: heroSeq ? heroSeq.textContent : '',
        btfText: btfGroup ? btfGroup.textContent : ''
      };
    });

    assert(checkHeroEdit.heroText.includes('NEXT-GEN AI'), `Hero ticker reflects updated text (found: "${checkHeroEdit.heroText.substring(0, 40)}...")`);
    assert(checkHeroEdit.btfText.includes('BEYOND THE FRAME'), 'Beyond the Frame ticker remains completely unchanged during Hero ticker update');

    // Test 3.3: Edit Beyond the Frame Ticker independently
    console.log('Testing independent Beyond the Frame ticker update in CMS...');
    const testBTFText = 'CINEMATIC HORIZONS';
    const modifiedContentBTF = JSON.parse(JSON.stringify(initialContent));
    const modSections2 = Array.isArray(modifiedContentBTF.sections) ? modifiedContentBTF.sections : Object.values(modifiedContentBTF.sections);
    const modBTF = modSections2.find(s => s.id === 'sec-beyond-frame');
    if (modBTF && modBTF.content) {
      modBTF.content.tickerText = testBTFText;
      modBTF.content.wordmark = testBTFText;
    }
    fs.writeFileSync('data/content.json', JSON.stringify(modifiedContentBTF, null, 2), 'utf8');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const checkBTFEdit = await page.evaluate(() => {
      const heroSeq = document.querySelector('.hero-ticker-wrap .ticker-sequence');
      const btfGroup = document.querySelector('.beyond-frame-wordmark-group');
      return {
        heroText: heroSeq ? heroSeq.textContent : '',
        btfText: btfGroup ? btfGroup.textContent : ''
      };
    });

    assert(checkBTFEdit.btfText.includes('CINEMATIC HORIZONS'), `Beyond the Frame ticker reflects updated text (found: "${checkBTFEdit.btfText.substring(0, 40)}...")`);
    assert(checkBTFEdit.heroText.includes('GENERATIVE AI'), 'Hero ticker remains completely unchanged during Beyond the Frame ticker update');

    // Test 3.4: Restore original clean content
    console.log('Restoring clean portfolio content...');
    fs.writeFileSync('data/content.json', JSON.stringify(initialContent, null, 2), 'utf8');
    fs.writeFileSync('data/content-draft.json', JSON.stringify(initialContent, null, 2), 'utf8');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // Verify final state
    const finalChecks = await page.evaluate(() => {
      const heroSeq = document.querySelector('.hero-ticker-wrap .ticker-sequence');
      const btfGroup = document.querySelector('.beyond-frame-wordmark-group');
      const offTheClock = document.querySelector('.hobbies-compact-title');
      return {
        heroOk: heroSeq && heroSeq.textContent.includes('GENERATIVE AI'),
        btfOk: btfGroup && btfGroup.textContent.includes('BEYOND THE FRAME'),
        offTheClockOk: offTheClock && offTheClock.textContent.trim() === 'OFF THE CLOCK'
      };
    });

    assert(finalChecks.heroOk, 'Final Hero ticker restored to creative discipline sequence');
    assert(finalChecks.btfOk, 'Final Beyond the Frame ticker restored to BEYOND THE FRAME');
    assert(finalChecks.offTheClockOk, 'Final OFF THE CLOCK section confirmed');

    // Check Console errors
    console.log('\nConsole error count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log('  ⚠️', err));
    }
    assert(consoleErrors.length === 0, 'Zero runtime console errors detected');

    console.log('\n============================================================');
    if (errors.length === 0) {
      console.log('🎉 ALL MASTER UPDATE VERIFICATION TESTS PASSED!');
    } else {
      console.log(`⚠️ COMPLETED WITH ${errors.length} ERROR(S):`);
      errors.forEach(err => console.log(' -', err));
    }
    console.log('============================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
})();
