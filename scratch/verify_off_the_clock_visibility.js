const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

function getChromePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found');
}

async function run() {
  console.log('================================================================');
  console.log('STARTING VERIFICATION: OFF THE CLOCK / BEYOND THE PIPELINE');
  console.log('BACKSTAGE VISIBILITY CONTROLS + FIXED GALLERY FOOTPRINT + REFLOW');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: getChromePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------------------
    // TEST A: INITIAL STATE (12 VISIBLE ITEMS)
    // -------------------------------------------------------------------------
    console.log('\n[TEST A] Verifying Initial State on Public Homepage (12 visible items)...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));

    const stateA = await page.evaluate(() => {
      const track = document.querySelector('.elastic-gallery-track');
      const slats = Array.from(document.querySelectorAll('.elastic-slat'));
      const trackRect = track.getBoundingClientRect();
      const slatMetrics = slats.map((s, i) => {
        const r = s.getBoundingClientRect();
        const img = s.querySelector('img');
        const imgStyle = img ? window.getComputedStyle(img) : null;
        return {
          idx: i + 1,
          id: s.getAttribute('data-id'),
          width: Math.round(r.width),
          height: Math.round(r.height),
          left: Math.round(r.left),
          objectFit: imgStyle?.objectFit,
          src: img?.getAttribute('src')
        };
      });

      return {
        trackWidth: Math.round(trackRect.width),
        trackHeight: Math.round(trackRect.height),
        trackLeft: Math.round(trackRect.left),
        trackTop: Math.round(trackRect.top),
        slatCount: slats.length,
        dataCount: track.getAttribute('data-count'),
        slatMetrics
      };
    });

    console.log(`Track Footprint A: Width=${stateA.trackWidth}px, Height=${stateA.trackHeight}px, Left=${stateA.trackLeft}px`);
    console.log(`Rendered Slats A: ${stateA.slatCount} (Expected: 12)`);
    console.log(`First slat width: ${stateA.slatMetrics[0].width}px, height: ${stateA.slatMetrics[0].height}px, fit: ${stateA.slatMetrics[0].objectFit}`);

    if (stateA.slatCount !== 12) throw new Error(`Expected 12 slats initially, got ${stateA.slatCount}`);
    if (stateA.slatMetrics[0].objectFit !== 'cover') throw new Error(`Expected object-fit: cover, got ${stateA.slatMetrics[0].objectFit}`);

    // Verify hover expansion on slat 1
    console.log('Testing hover expansion on slat 1...');
    await page.hover('.elastic-slat[data-id="hobby-01"]');
    await new Promise(r => setTimeout(r, 400));

    const hoverMetricsA = await page.evaluate(() => {
      const s1 = document.querySelector('.elastic-slat[data-id="hobby-01"]');
      const s2 = document.querySelector('.elastic-slat[data-id="hobby-02"]');
      const track = document.querySelector('.elastic-gallery-track');
      return {
        s1Width: Math.round(s1.getBoundingClientRect().width),
        s2Width: Math.round(s2.getBoundingClientRect().width),
        trackWidth: Math.round(track.getBoundingClientRect().width)
      };
    });

    console.log(`Hovered Slat 1 Width: ${hoverMetricsA.s1Width}px (expanded), Neighbor Slat 2 Width: ${hoverMetricsA.s2Width}px (contracted)`);
    console.log(`Track Width during hover: ${hoverMetricsA.trackWidth}px (Expected constant: ${stateA.trackWidth}px)`);
    if (hoverMetricsA.s1Width <= stateA.slatMetrics[0].width) {
      throw new Error(`Hovered slat width ${hoverMetricsA.s1Width} should exceed resting width ${stateA.slatMetrics[0].width}`);
    }
    if (Math.abs(hoverMetricsA.trackWidth - stateA.trackWidth) > 2) {
      throw new Error(`Track width changed during hover! Before: ${stateA.trackWidth}, During: ${hoverMetricsA.trackWidth}`);
    }

    // Move mouse away and verify return to equal resting distribution
    await page.mouse.move(0, 0);
    await new Promise(r => setTimeout(r, 450));
    const restedWidth = await page.$eval('.elastic-slat[data-id="hobby-01"]', el => Math.round(el.getBoundingClientRect().width));
    console.log(`Rested Slat 1 Width: ${restedWidth}px (Expected return to ~${stateA.slatMetrics[0].width}px)`);

    const archiveSection = await page.$('#hobbies-archive');
    if (archiveSection) {
      await archiveSection.screenshot({ path: 'scratch/verified_hobbies_12_panels.png' });
      console.log('Saved scratch/verified_hobbies_12_panels.png');
    }

    // -------------------------------------------------------------------------
    // TEST B: HIDE 3 ITEMS IN BACKSTAGE -> 9 VISIBLE PANELS (PHASE 2, 3, 4)
    // -------------------------------------------------------------------------
    console.log('\n[TEST B] Authenticating into Backstage to hide 3 items (slots 03, 07, 11)...');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    // Authenticate with passphrase
    const authOverlay = await page.$('#auth-overlay');
    if (authOverlay) {
      const isVisible = await page.evaluate(el => el && window.getComputedStyle(el).display !== 'none', authOverlay);
      if (isVisible) {
        await page.click('#tab-btn-password');
        await new Promise(r => setTimeout(r, 300));
        await page.waitForSelector('#auth-fallback-password', { timeout: 3000 });
        const envContent = fs.readFileSync('.env', 'utf8');
        const pwMatch = envContent.match(/^BACKSTAGE_PASSWORD=(.+)$/m);
        const adminPassword = pwMatch ? pwMatch[1].trim() : '@Krish1602';
        await page.type('#auth-fallback-password', adminPassword);
        await page.click('#auth-password-btn');
        await page.waitForFunction(() => {
          const overlay = document.getElementById('auth-overlay');
          return overlay && overlay.style.display === 'none';
        }, { timeout: 8000 });
        console.log('Backstage authenticated!');
        await new Promise(r => setTimeout(r, 800));
      }
    }

    // Select Hobbies section
    await page.evaluate(() => {
      window.selectSection('sub-hobbies');
    });
    await new Promise(r => setTimeout(r, 800));

    // Verify all 12 cards are exposed in Backstage
    const backstageSlotCount = await page.evaluate(() => {
      return document.querySelectorAll('#props-container .orbit-slot-card[data-hobby-slot]').length;
    });
    console.log(`Backstage Configured Slots: ${backstageSlotCount} (Expected: 12)`);
    if (backstageSlotCount !== 12) throw new Error(`Backstage should have exactly 12 slot cards, got ${backstageSlotCount}`);

    // Hide slots 3 (REM.jpg), 7 (MA.jpg), and 11 (B1.jpg)
    console.log('Toggling visibility for slots 3, 7, and 11...');
    await page.evaluate(() => {
      window.toggleHobbySlotVisibility('sub-hobbies', 2); // idx 2 is slot 3 (hobby-03)
      window.toggleHobbySlotVisibility('sub-hobbies', 6); // idx 6 is slot 7 (hobby-07)
      window.toggleHobbySlotVisibility('sub-hobbies', 10); // idx 10 is slot 11 (hobby-11)
    });
    await new Promise(r => setTimeout(r, 600));

    const backstageMetaAfterHide3 = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('#props-container .orbit-slot-card[data-hobby-slot]'));
      const visCards = cards.filter(c => c.classList.contains('is-visible'));
      const hiddenCards = cards.filter(c => c.classList.contains('is-hidden'));
      return {
        totalCards: cards.length,
        visibleCards: visCards.length,
        hiddenCards: hiddenCards.length
      };
    });
    console.log(`Backstage After Hiding 3: Total=${backstageMetaAfterHide3.totalCards}, Visible=${backstageMetaAfterHide3.visibleCards}, Hidden=${backstageMetaAfterHide3.hiddenCards}`);
    if (backstageMetaAfterHide3.totalCards !== 12) throw new Error('Total Backstage slots mutated!');
    if (backstageMetaAfterHide3.visibleCards !== 9) throw new Error(`Expected 9 visible slots, got ${backstageMetaAfterHide3.visibleCards}`);
    if (backstageMetaAfterHide3.hiddenCards !== 3) throw new Error(`Expected 3 hidden slots, got ${backstageMetaAfterHide3.hiddenCards}`);

    // Publish changes
    console.log('Publishing changes via Backstage saveContent API...');
    await page.evaluate(async () => {
      const token = window.authToken;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/content/save', {
        method: 'POST',
        headers,
        body: JSON.stringify(window.currentDraft)
      });
    });
    await new Promise(r => setTimeout(r, 1200));

    // Reload public homepage and verify exactly 9 panels redistributed across the SAME footprint
    console.log('Reloading public homepage to verify 9 visible panels...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2200));

    const stateB = await page.evaluate(() => {
      const track = document.querySelector('.elastic-gallery-track');
      const slats = Array.from(document.querySelectorAll('.elastic-slat'));
      const trackRect = track.getBoundingClientRect();
      const slatMetrics = slats.map((s, i) => {
        const r = s.getBoundingClientRect();
        return {
          idx: i + 1,
          id: s.getAttribute('data-id'),
          width: Math.round(r.width),
          height: Math.round(r.height)
        };
      });

      return {
        trackWidth: Math.round(trackRect.width),
        trackHeight: Math.round(trackRect.height),
        trackLeft: Math.round(trackRect.left),
        slatCount: slats.length,
        dataCount: track.getAttribute('data-count'),
        slatMetrics
      };
    });

    console.log(`Track Footprint B: Width=${stateB.trackWidth}px (Baseline: ${stateA.trackWidth}px), Height=${stateB.trackHeight}px (Baseline: ${stateA.trackHeight}px)`);
    console.log(`Rendered Slats B: ${stateB.slatCount} (Expected: 9)`);
    console.log(`9-Slat individual width: ${stateB.slatMetrics[0].width}px (vs 12-slat width: ${stateA.slatMetrics[0].width}px)`);

    if (stateB.slatCount !== 9) throw new Error(`Expected exactly 9 public slats, got ${stateB.slatCount}`);
    if (Math.abs(stateB.trackWidth - stateA.trackWidth) > 2) {
      throw new Error(`Gallery outer width shifted! Expected ~${stateA.trackWidth}px, got ${stateB.trackWidth}px`);
    }
    if (stateB.trackHeight !== stateA.trackHeight) {
      throw new Error(`Gallery height shifted! Expected ${stateA.trackHeight}px, got ${stateB.trackHeight}px`);
    }
    if (stateB.slatMetrics[0].width <= stateA.slatMetrics[0].width) {
      throw new Error(`9-panel width (${stateB.slatMetrics[0].width}px) should be wider than 12-panel width (${stateA.slatMetrics[0].width}px)`);
    }

    const archiveSectionB = await page.$('#hobbies-archive');
    if (archiveSectionB) {
      await archiveSectionB.screenshot({ path: 'scratch/verified_hobbies_09_panels.png' });
      console.log('Saved scratch/verified_hobbies_09_panels.png');
    }

    // -------------------------------------------------------------------------
    // TEST C: SIX VISIBLE PANELS (PHASE 4 & 12 TEST C)
    // -------------------------------------------------------------------------
    console.log('\n[TEST C] Setting gallery to exactly 6 visible panels...');
    // Hide slots 1, 2, 4 in addition to 3, 7, 11
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));
    await page.evaluate(async () => {
      window.selectSection('sub-hobbies');
      window.toggleHobbySlotVisibility('sub-hobbies', 0); // hide slot 1
      window.toggleHobbySlotVisibility('sub-hobbies', 1); // hide slot 2
      window.toggleHobbySlotVisibility('sub-hobbies', 3); // hide slot 4
      
      const token = window.authToken;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/content/save', {
        method: 'POST',
        headers,
        body: JSON.stringify(window.currentDraft)
      });
    });
    await new Promise(r => setTimeout(r, 1200));

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    const stateC = await page.evaluate(() => {
      const track = document.querySelector('.elastic-gallery-track');
      const slats = Array.from(document.querySelectorAll('.elastic-slat'));
      const trackRect = track.getBoundingClientRect();
      return {
        trackWidth: Math.round(trackRect.width),
        trackHeight: Math.round(trackRect.height),
        slatCount: slats.length,
        slatWidth: Math.round(slats[0]?.getBoundingClientRect().width || 0)
      };
    });

    console.log(`Track Footprint C: Width=${stateC.trackWidth}px, Height=${stateC.trackHeight}px`);
    console.log(`Rendered Slats C: ${stateC.slatCount} (Expected: 6)`);
    console.log(`6-Slat individual width: ${stateC.slatWidth}px (Expected ~191px)`);

    if (stateC.slatCount !== 6) throw new Error(`Expected 6 public slats, got ${stateC.slatCount}`);
    if (Math.abs(stateC.trackWidth - stateA.trackWidth) > 2) throw new Error('Outer width changed for 6 slats!');
    if (stateC.slatWidth <= stateB.slatMetrics[0].width) {
      throw new Error(`6-panel width (${stateC.slatWidth}px) should be wider than 9-panel width (${stateB.slatMetrics[0].width}px)`);
    }

    const archiveSectionC = await page.$('#hobbies-archive');
    if (archiveSectionC) {
      await archiveSectionC.screenshot({ path: 'scratch/verified_hobbies_06_panels.png' });
      console.log('Saved scratch/verified_hobbies_06_panels.png');
    }

    // -------------------------------------------------------------------------
    // TEST D: TWO VISIBLE PANELS (PHASE 4 & 12 TEST D)
    // -------------------------------------------------------------------------
    console.log('\n[TEST D] Setting gallery to exactly 2 visible panels (50% each minus gap)...');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));
    await page.evaluate(async () => {
      window.selectSection('sub-hobbies');
      // Hide slots 5, 6, 8, 9 (now only slots 10 & 12 remain visible: 2 total)
      window.toggleHobbySlotVisibility('sub-hobbies', 4);
      window.toggleHobbySlotVisibility('sub-hobbies', 5);
      window.toggleHobbySlotVisibility('sub-hobbies', 7);
      window.toggleHobbySlotVisibility('sub-hobbies', 8);

      const token = window.authToken;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/content/save', {
        method: 'POST',
        headers,
        body: JSON.stringify(window.currentDraft)
      });
    });
    await new Promise(r => setTimeout(r, 1200));

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    const stateD = await page.evaluate(() => {
      const track = document.querySelector('.elastic-gallery-track');
      const slats = Array.from(document.querySelectorAll('.elastic-slat'));
      const trackRect = track.getBoundingClientRect();
      const s1 = slats[0]?.getBoundingClientRect();
      const s2 = slats[1]?.getBoundingClientRect();
      return {
        trackWidth: Math.round(trackRect.width),
        trackHeight: Math.round(trackRect.height),
        slatCount: slats.length,
        s1Width: Math.round(s1?.width || 0),
        s2Width: Math.round(s2?.width || 0)
      };
    });

    console.log(`Track Footprint D: Width=${stateD.trackWidth}px, Height=${stateD.trackHeight}px`);
    console.log(`Rendered Slats D: ${stateD.slatCount} (Expected: 2)`);
    console.log(`Panel 1 width: ${stateD.s1Width}px, Panel 2 width: ${stateD.s2Width}px (Expected ~588px each)`);

    if (stateD.slatCount !== 2) throw new Error(`Expected 2 public slats, got ${stateD.slatCount}`);
    if (Math.abs(stateD.trackWidth - stateA.trackWidth) > 2) throw new Error('Outer width changed for 2 slats!');
    if (Math.abs(stateD.s1Width - stateD.s2Width) > 2) throw new Error('2 panels should be equal resting width!');
    if (stateD.s1Width < 500) throw new Error(`2 panels should be broad (~588px), got ${stateD.s1Width}px`);

    const archiveSectionD = await page.$('#hobbies-archive');
    if (archiveSectionD) {
      await archiveSectionD.screenshot({ path: 'scratch/verified_hobbies_02_panels.png' });
      console.log('Saved scratch/verified_hobbies_02_panels.png');
    }

    // -------------------------------------------------------------------------
    // TEST E: ONE VISIBLE PANEL (PHASE 4 & 12 TEST E)
    // -------------------------------------------------------------------------
    console.log('\n[TEST E] Setting gallery to exactly 1 visible panel (fills 100% gallery width)...');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));
    await page.evaluate(async () => {
      window.selectSection('sub-hobbies');
      // Hide slot 10 (idx 9). Now only slot 12 remains visible (1 total)
      window.toggleHobbySlotVisibility('sub-hobbies', 9);

      const token = window.authToken;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/content/save', {
        method: 'POST',
        headers,
        body: JSON.stringify(window.currentDraft)
      });
    });
    await new Promise(r => setTimeout(r, 1200));

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    const stateE = await page.evaluate(() => {
      const track = document.querySelector('.elastic-gallery-track');
      const slats = Array.from(document.querySelectorAll('.elastic-slat'));
      const trackRect = track.getBoundingClientRect();
      const s1 = slats[0]?.getBoundingClientRect();
      const img = slats[0]?.querySelector('img');
      const imgStyle = img ? window.getComputedStyle(img) : null;
      return {
        trackWidth: Math.round(trackRect.width),
        trackHeight: Math.round(trackRect.height),
        slatCount: slats.length,
        s1Width: Math.round(s1?.width || 0),
        objectFit: imgStyle?.objectFit
      };
    });

    console.log(`Track Footprint E: Width=${stateE.trackWidth}px, Height=${stateE.trackHeight}px`);
    console.log(`Rendered Slats E: ${stateE.slatCount} (Expected: 1)`);
    console.log(`Single Panel Width: ${stateE.s1Width}px (Expected full track width: ${stateE.trackWidth}px)`);

    if (stateE.slatCount !== 1) throw new Error(`Expected 1 public slat, got ${stateE.slatCount}`);
    if (Math.abs(stateE.s1Width - stateE.trackWidth) > 2) {
      throw new Error(`Single panel (${stateE.s1Width}px) must occupy 100% of track width (${stateE.trackWidth}px)!`);
    }
    if (stateE.objectFit !== 'cover') throw new Error(`Expected object-fit: cover, got ${stateE.objectFit}`);

    const archiveSectionE = await page.$('#hobbies-archive');
    if (archiveSectionE) {
      await archiveSectionE.screenshot({ path: 'scratch/verified_hobbies_01_panel.png' });
      console.log('Saved scratch/verified_hobbies_01_panel.png');
    }

    // -------------------------------------------------------------------------
    // TEST F: SAFEGUARD ENFORCEMENT (CANNOT HIDE LAST VISIBLE PANEL)
    // -------------------------------------------------------------------------
    console.log('\n[TEST F] Testing minimum 1 visible item safeguard...');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));

    const safeguardCheck = await page.evaluate(() => {
      window.selectSection('sub-hobbies');
      // Attempt to hide the last remaining visible slot (slot 12, idx 11)
      window.toggleHobbySlotVisibility('sub-hobbies', 11);
      const sec = window.findSectionOrChild('sub-hobbies');
      const visibleCount = sec.content.slots.filter(s => s.visible !== false).length;
      return {
        visibleCount,
        toastText: document.getElementById('toast')?.textContent
      };
    });

    console.log(`Safeguard result: visible count remains ${safeguardCheck.visibleCount} (Expected: 1)`);
    console.log(`Toast feedback: "${safeguardCheck.toastText}"`);
    if (safeguardCheck.visibleCount !== 1) {
      throw new Error(`Safeguard failed: visible count was allowed to reach 0!`);
    }

    // -------------------------------------------------------------------------
    // TEST G: RESTORE ALL 12 ITEMS AND VERIFY ASSET RECOVERY (PHASE 2.2, 10, 12)
    // -------------------------------------------------------------------------
    console.log('\n[TEST G] Restoring all 12 items to visible and verifying asset persistence...');
    await page.evaluate(async () => {
      const sec = window.findSectionOrChild('sub-hobbies');
      // Set all 12 slots to visible
      sec.content.slots.forEach(s => s.visible = true);
      sec.content.items = sec.content.slots;
      window.markUnsaved();

      const token = window.authToken;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/content/save', {
        method: 'POST',
        headers,
        body: JSON.stringify(window.currentDraft)
      });
    });
    await new Promise(r => setTimeout(r, 1200));

    // Reload public homepage and confirm all 12 return in original relative order
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2200));

    const stateG = await page.evaluate(() => {
      const track = document.querySelector('.elastic-gallery-track');
      const slats = Array.from(document.querySelectorAll('.elastic-slat'));
      const slotDetails = slats.map((s, idx) => {
        return {
          idx: idx + 1,
          id: s.getAttribute('data-id'),
          src: s.querySelector('img')?.getAttribute('src'),
          title: s.querySelector('.elastic-caption-title')?.textContent.trim()
        };
      });

      return {
        totalSlats: slats.length,
        slotDetails
      };
    });

    console.log(`Restored Slats Count: ${stateG.totalSlats} (Expected: 12)`);
    console.log('Restored Assets:');
    stateG.slotDetails.forEach(s => {
      console.log(`  [${s.idx}] ID: ${s.id} -> ${s.title} (${s.src})`);
    });

    if (stateG.totalSlats !== 12) throw new Error(`Expected exactly 12 restored slats, got ${stateG.totalSlats}`);
    if (stateG.slotDetails[0].src !== 'BM.jpg') throw new Error(`Slot 1 asset mismatch: expected BM.jpg, got ${stateG.slotDetails[0].src}`);
    if (stateG.slotDetails[2].src !== 'REM.jpg') throw new Error(`Slot 3 asset mismatch: expected REM.jpg, got ${stateG.slotDetails[2].src}`);
    if (stateG.slotDetails[6].src !== 'MA.jpg') throw new Error(`Slot 7 asset mismatch: expected MA.jpg, got ${stateG.slotDetails[6].src}`);
    if (stateG.slotDetails[11].src !== 'B3.jpg') throw new Error(`Slot 12 asset mismatch: expected B3.jpg, got ${stateG.slotDetails[11].src}`);

    // Capture screenshot of Backstage Hobbies Editor
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));
    await page.evaluate(() => {
      window.selectSection('sub-hobbies');
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: 'scratch/verified_backstage_hobbies_controls.png' });
    console.log('Saved scratch/verified_backstage_hobbies_controls.png');

    // -------------------------------------------------------------------------
    // TEST H: RESPONSIVE VIEWPORT TESTING (390PX MOBILE)
    // -------------------------------------------------------------------------
    console.log('\n[TEST H] Testing Mobile Viewport (390 x 844)...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 1500));

    const mobileCheck = await page.evaluate(() => {
      const track = document.querySelector('.elastic-gallery-track');
      const slats = document.querySelectorAll('.elastic-slat');
      return {
        hasTrack: !!track,
        slatCount: slats.length,
        trackWidth: Math.round(track.getBoundingClientRect().width),
        trackHeight: Math.round(track.getBoundingClientRect().height)
      };
    });

    console.log(`Mobile Track Width: ${mobileCheck.trackWidth}px, Height: ${mobileCheck.trackHeight}px, Slats: ${mobileCheck.slatCount}`);
    if (mobileCheck.slatCount !== 12) throw new Error(`Mobile should render 12 slats, got ${mobileCheck.slatCount}`);

    await page.screenshot({ path: 'scratch/verified_hobbies_mobile_390.png' });
    console.log('Saved scratch/verified_hobbies_mobile_390.png');

    console.log('\n================================================================');
    console.log('ALL VERIFICATION ASSERTIONS PASSED (100%)!');
    console.log('================================================================');

  } finally {
    await browser.close();
  }
}

run().catch(e => {
  console.error('\nVERIFICATION FAILED:', e.message);
  process.exit(1);
});
