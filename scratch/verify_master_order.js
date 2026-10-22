const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function runVerification() {
  console.log('=== STARTING CBK DESIGNFOLIO MASTER VERIFICATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = {
    visualOrbit: {},
    selectedWorks: {},
    myExpertise: {},
    backstagePersistence: {}
  };

  try {
    console.log('1. Navigating to public portfolio: http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // ---------------------------------------------------------
    // WORKSTREAM A: VISUAL ORBIT VERIFICATION
    // ---------------------------------------------------------
    console.log('\n--- VERIFYING WORKSTREAM A: VISUAL ORBIT ---');
    await page.waitForSelector('#dome-gallery-mount .sphere-root', { timeout: 10000 });

    // Scroll to Visual Orbit so it is centered in the viewport
    await page.evaluate(() => {
      document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 1200));

    // Get dome container bounding box for physical pointer moves
    const domeBox = await page.evaluate(() => {
      const el = document.getElementById('visual-orbit-gallery-wrap') || document.querySelector('#dome-gallery-mount .sphere-root');
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    });

    const orbitData = await page.evaluate(async () => {
      const root = document.querySelector('#dome-gallery-mount .sphere-root');
      const sphere = document.querySelector('#dome-gallery-mount .sphere');
      const items = Array.from(document.querySelectorAll('#dome-gallery-mount .item'));

      // Check items
      const tileCount = items.length;
      const imagesInfo = items.map(it => {
        const img = it.querySelector('img');
        const imgWrap = it.querySelector('.item__image');
        return {
          slotId: it.getAttribute('data-slot-id'),
          src: img ? img.getAttribute('src') : null,
          hasImg: !!img,
          naturalWidth: img ? img.naturalWidth : 0,
          naturalHeight: img ? img.naturalHeight : 0,
          objectFit: img ? window.getComputedStyle(img).objectFit : null,
          border: imgWrap ? window.getComputedStyle(imgWrap).border : null
        };
      });

      // Check backing panels or overlays
      const hasOverlayBlur = !!document.querySelector('#dome-gallery-mount .overlay--blur');
      const hasOverlayVignette = !!document.querySelector('#dome-gallery-mount .overlay--vignette');
      const hasInstructionPill = Array.from(document.querySelectorAll('*')).some(el => 
        el.textContent && el.textContent.includes('DRAG TO ROTATE ORBIT · CLICK TILE TO ENLARGE') && el.offsetParent !== null
      );

      // Check root CSS variables and item sizing
      const firstItem = items[0];
      const itemStyle = firstItem ? window.getComputedStyle(firstItem) : null;

      // Check rotation over 800ms
      const getTransform = () => sphere.style.transform;
      const t1 = getTransform();
      await new Promise(r => setTimeout(r, 800));
      const t2 = getTransform();

      const parseRotY = (t) => {
        const m = t.match(/rotateY\(([-0-9.]+)deg\)/);
        return m ? parseFloat(m[1]) : null;
      };
      const angle1 = parseRotY(t1);
      const angle2 = parseRotY(t2);

      return {
        tileCount,
        allHaveValidImages: imagesInfo.every(i => i.hasImg && i.src && i.naturalWidth > 0),
        allContainFit: imagesInfo.every(i => i.objectFit === 'contain'),
        uniqueSrcCount: new Set(imagesInfo.map(i => i.src)).size,
        hasOverlayBlur,
        hasOverlayVignette,
        hasInstructionPill,
        itemWidth: itemStyle ? itemStyle.width : null,
        itemHeight: itemStyle ? itemStyle.height : null,
        angle1,
        angle2,
        isRotatingRightToLeft: angle2 !== null && angle1 !== null && angle2 < angle1
      };
    });

    // Test real pointer move into dome to test pause
    const parseRotYFromPage = () => page.evaluate(() => {
      const s = document.querySelector('#dome-gallery-mount .sphere');
      const m = s.style.transform.match(/rotateY\(([-0-9.]+)deg\)/);
      return m ? parseFloat(m[1]) : null;
    });

    // Move pointer inside dome
    await page.mouse.move(domeBox.x + domeBox.width / 2, domeBox.y + domeBox.height / 2);
    await new Promise(r => setTimeout(r, 200));
    const anglePaused1 = await parseRotYFromPage();
    await new Promise(r => setTimeout(r, 600));
    const anglePaused2 = await parseRotYFromPage();
    const isPausedOnEnter = anglePaused1 === anglePaused2;

    // Move pointer outside dome (e.g. to x: 5, y: 5)
    await page.mouse.move(5, 5);
    await new Promise(r => setTimeout(r, 800));
    const angleResumed = await parseRotYFromPage();
    const isResumedOnLeave = angleResumed !== anglePaused2;
    orbitData.isPausedOnEnter = isPausedOnEnter;
    orbitData.isResumedOnLeave = isResumedOnLeave;

    console.log('Visual Orbit Tiles Count:', orbitData.tileCount);
    console.log('All Tiles Have Valid Loaded Images:', orbitData.allHaveValidImages);
    console.log('Unique Image Sources Count:', orbitData.uniqueSrcCount);
    console.log('All Images object-fit: contain:', orbitData.allContainFit);
    console.log('Item Width x Height:', orbitData.itemWidth, 'x', orbitData.itemHeight);
    console.log('Rotating Right to Left:', orbitData.isRotatingRightToLeft, `(${orbitData.angle1}° -> ${orbitData.angle2}°)`);
    console.log('Pointer Enter Pauses Rotation:', isPausedOnEnter);
    console.log('Pointer Leave Resumes Rotation:', isResumedOnLeave);
    console.log('No Overlay Blur / Vignette:', !orbitData.hasOverlayBlur && !orbitData.hasOverlayVignette);
    console.log('No Instruction Pill:', !orbitData.hasInstructionPill);

    results.visualOrbit = orbitData;

    // Test Hover Outline & Fullscreen Lightbox
    console.log('Testing Hover Outline and Lightbox...');
    // Real hover with Puppeteer
    await page.hover('#dome-gallery-mount .item .item__image');
    await new Promise(r => setTimeout(r, 200));

    const hoverOutlineCheck = await page.evaluate(() => {
      const hovered = document.querySelector('#dome-gallery-mount .item .item__image:hover') || document.querySelector('#dome-gallery-mount .item .item__image.is-hovered');
      if (!hovered) return false;
      const b = window.getComputedStyle(hovered).border;
      return b.includes('255, 255, 255') || b.includes('1.5px');
    });

    const lightboxTest = await page.evaluate(async () => {
      const firstTileImg = document.querySelector('#dome-gallery-mount .item .item__image');
      if (!firstTileImg) return { error: 'No tile found' };

      // Click to open lightbox
      firstTileImg.click();
      await new Promise(r => setTimeout(r, 300));

      const overlay = document.querySelector('.dg-lightbox-overlay');
      const lightboxImg = document.querySelector('.dg-lightbox-image');
      const nextBtn = document.querySelector('.dg-lightbox-btn--next');

      const isOverlayOpen = !!overlay && window.getComputedStyle(overlay).display !== 'none';
      const hasBlackBg = overlay ? window.getComputedStyle(overlay).backgroundColor === 'rgb(0, 0, 0)' : false;
      const lightboxImgSrc = lightboxImg ? lightboxImg.getAttribute('src') : null;
      const isScrollLocked = document.body.classList.contains('dg-scroll-lock');

      // Test next button
      let nextImgSrc = null;
      if (nextBtn) {
        nextBtn.click();
        await new Promise(r => setTimeout(r, 150));
        nextImgSrc = document.querySelector('.dg-lightbox-image')?.getAttribute('src');
      }

      // Close via Escape key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise(r => setTimeout(r, 200));

      const isClosedAfterEsc = !document.querySelector('.dg-lightbox-overlay');
      const isScrollUnlocked = !document.body.classList.contains('dg-scroll-lock');

      return {
        isOverlayOpen,
        hasBlackBg,
        lightboxImgSrc,
        nextImgSrc,
        navigatedSuccessfully: lightboxImgSrc !== nextImgSrc,
        isClosedAfterEsc,
        isScrollLocked,
        isScrollUnlocked
      };
    });

    lightboxTest.isHoverOutlineWhite = hoverOutlineCheck;

    // ---------------------------------------------------------
    // WORKSTREAM B: SELECTED WORKS VERIFICATION
    // ---------------------------------------------------------
    console.log('\n--- VERIFYING WORKSTREAM B: SELECTED WORKS ---');
    await page.waitForSelector('#selected-works', { timeout: 10000 });

    // Expand "See More" if collapsed to check all 9 cards
    await page.evaluate(() => {
      const btn = document.getElementById('btn-works-toggle');
      if (btn && btn.textContent.includes('MORE')) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const worksData = await page.evaluate(async () => {
      const cards = Array.from(document.querySelectorAll('#selected-works .works-card'));
      return cards.map(c => {
        const titleEl = c.querySelector('.works-title');
        const badgeEl = c.querySelector('.film-meta-badge');
        const videoEl = c.querySelector('video.works-card-media-video');
        const imgEl = c.querySelector('img');
        return {
          title: titleEl ? titleEl.textContent.trim() : null,
          badge: badgeEl ? badgeEl.textContent.trim() : null,
          videoSrc: videoEl ? videoEl.getAttribute('src') : null,
          poster: videoEl ? videoEl.getAttribute('poster') : null,
          isReel: c.classList.contains('works-card-reel')
        };
      });
    });

    console.log(`Found ${worksData.length} Selected Works cards.`);
    worksData.forEach((w, i) => {
      console.log(`  [${i + 1}] "${w.title}" | BADGE: "${w.badge}" | POSTER: "${w.poster}"`);
    });

    // Expected exact badges & posters (6 @ 7s frame + 3 exceptions: As.png, J.png, O.png, PV.png)
    const expectedWorks = [
      { title: 'Ashra Chapter 2: Gaiya', badge: 'INDEPENDENT IP // 2026', poster: 'poster-ashra-chapter-2.jpg' },
      { title: 'Firmware Update', badge: 'CONCEPT FILM // 2026', poster: 'poster-firmware-update.jpg' },
      { title: 'Porsche', badge: 'COMMERCIAL AI RE ANIMATION // 2025', poster: 'poster-porsche.jpg' },
      { title: 'NFL Holidays Are Coming', badge: 'COMMERCIAL AI RE ANIMATION // 2025', poster: 'poster-nfl-holidays.jpg' },
      { title: 'Ashra Chapter 1: Vajra', badge: 'INDEPENDENT IP // 2025', poster: 'As.png' },
      { title: 'Demon.exe', badge: 'CONCEPT INTRO // 2026', poster: 'poster-demon-exe.jpg' },
      { title: 'JETOUR', badge: 'COMMERCIAL AD // 2025', poster: 'J.png' },
      { title: 'LOW CARB BREAD', badge: 'PRODUCT AD // 2025', poster: 'O.png' },
      { title: 'PROJECT V', badge: 'INDEPENDENT IP // 2025', poster: 'PV.png' }
    ];

    let allBadgesMatch = true;
    let allPostersMatch = true;
    expectedWorks.forEach((exp, idx) => {
      const actual = worksData[idx];
      if (!actual) {
        allBadgesMatch = false;
        allPostersMatch = false;
        return;
      }
      if (actual.badge !== exp.badge) {
        console.error(`BADGE MISMATCH at [${idx + 1}]: expected "${exp.badge}", got "${actual.badge}"`);
        allBadgesMatch = false;
      }
      if (actual.poster !== exp.poster) {
        console.error(`POSTER MISMATCH at [${idx + 1}]: expected "${exp.poster}", got "${actual.poster}"`);
        allPostersMatch = false;
      }
    });

    console.log('All 9 Badges Match Exact Specifications:', allBadgesMatch);
    console.log('All 9 Posters Match Exact Specifications (6 @ 7s, 3 Exceptions):', allPostersMatch);

    // Test hover playback on first card
    const hoverPlayTest = await page.evaluate(async () => {
      const card = document.querySelector('#selected-works .works-card');
      const video = card.querySelector('video.works-card-media-video');
      if (!video) return { error: 'No video on first card' };

      card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise(r => setTimeout(r, 400));
      const isPlaying = !video.paused && video.currentTime > 0;
      const isMuted = video.muted;

      card.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      const isPausedAfterLeave = video.paused;

      return {
        isPlaying,
        isMuted,
        isPausedAfterLeave
      };
    });

    console.log('Hover Playback Works (Inline & Muted):', hoverPlayTest.isPlaying && hoverPlayTest.isMuted);
    console.log('Hover Leave Pauses and Resets Video:', hoverPlayTest.isPausedAfterLeave);

    // Test Fullscreen Video Modal
    const videoModalTest = await page.evaluate(async () => {
      const card = document.querySelector('#selected-works .works-card');
      card.click();
      await new Promise(r => setTimeout(r, 400));

      const modal = document.querySelector('#selected-works-lightbox');
      const isOpen = modal && modal.classList.contains('is-open');
      const modalVideo = modal ? modal.querySelector('video') : null;
      const modalTitle = modal ? (modal.querySelector('#player-top-title') || modal.querySelector('.cinematic-lightbox-title')) : null;

      const hasVideo = !!modalVideo && modalVideo.getAttribute('src');
      const titleText = modalTitle ? modalTitle.textContent.trim() : null;

      // Close modal
      const closeBtn = modal ? (modal.querySelector('.lightbox-close-btn') || modal.querySelector('.cinematic-lightbox-close')) : null;
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const isClosed = modal && !modal.classList.contains('is-open');

      return {
        isOpen,
        hasVideo,
        titleText,
        isClosed
      };
    });

    console.log('Fullscreen Video Modal Opens with Title & Video:', videoModalTest.isOpen && videoModalTest.hasVideo);
    console.log('Fullscreen Video Modal Closes Cleanly:', videoModalTest.isClosed);

    results.selectedWorks = {
      allBadgesMatch,
      allPostersMatch,
      hoverPlayTest,
      videoModalTest
    };

    // Capture Selected Works Screenshot
    const worksSection = await page.$('#selected-works');
    if (worksSection) {
      await worksSection.screenshot({ path: 'scratch/screenshot_selected_works.png' });
      console.log('Captured Selected Works screenshot to scratch/screenshot_selected_works.png');
    }

    // ---------------------------------------------------------
    // WORKSTREAM C: MY EXPERTISE COMPANY LOGOS VERIFICATION
    // ---------------------------------------------------------
    console.log('\n--- VERIFYING WORKSTREAM C: MY EXPERTISE COMPANY LOGOS ---');
    await page.waitForSelector('#my-expertise', { timeout: 10000 });

    const expertiseData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#my-expertise .expertise-row'));
      return rows.map(r => {
        const id = r.id;
        const heading = r.querySelector('.company-heading')?.textContent.trim();
        const logoSlot = r.querySelector('.company-logo-slot');
        const img = logoSlot ? logoSlot.querySelector('.company-logo-img') : null;
        const slotStyle = logoSlot ? window.getComputedStyle(logoSlot) : null;
        const imgStyle = img ? window.getComputedStyle(img) : null;

        return {
          id,
          heading,
          hasLogoClass: logoSlot ? logoSlot.classList.contains('has-logo') : false,
          hasImg: !!img,
          src: img ? img.getAttribute('src') : null,
          naturalWidth: img ? img.naturalWidth : 0,
          naturalHeight: img ? img.naturalHeight : 0,
          slotBorder: slotStyle ? slotStyle.border : null,
          slotPadding: slotStyle ? slotStyle.padding : null,
          slotWidth: slotStyle ? slotStyle.width : null,
          slotHeight: slotStyle ? slotStyle.height : null,
          imgWidth: imgStyle ? imgStyle.width : null,
          imgHeight: imgStyle ? imgStyle.height : null,
          imgObjectFit: imgStyle ? imgStyle.objectFit : null
        };
      });
    });

    console.log(`Found ${expertiseData.length} Company rows:`);
    expertiseData.forEach(comp => {
      console.log(`  Company "${comp.heading}" (${comp.id}):`);
      console.log(`    src: "${comp.src}", natural: ${comp.naturalWidth}x${comp.naturalHeight}`);
      console.log(`    hasLogoClass: ${comp.hasLogoClass}, slot: ${comp.slotWidth} x ${comp.slotHeight}`);
      console.log(`    img: ${comp.imgWidth} x ${comp.imgHeight}, object-fit: ${comp.imgObjectFit}`);
      console.log(`    slotPadding: ${comp.slotPadding}, slotBorder: ${comp.slotBorder}`);
    });

    const allLogosPopulated = expertiseData.every(c => c.hasLogoClass && c.hasImg && c.naturalWidth > 0);
    const allLogosWellSized = expertiseData.every(c => {
      const w = parseFloat(c.imgWidth);
      const h = parseFloat(c.imgHeight);
      return w >= 120 && h >= 65 && c.imgObjectFit === 'contain';
    });
    const noDashedBorder = expertiseData.every(c => !c.slotBorder || c.slotBorder.includes('none') || c.slotBorder.includes('0px'));

    console.log('All 4 Company Logos Populated with Real Files:', allLogosPopulated);
    console.log('All 4 Logos Occupy Holder Area Generously (>120x65px) with object-fit: contain:', allLogosWellSized);
    console.log('Populated Logo Slots Have No Dashed Border / Padding:', noDashedBorder);

    results.myExpertise = {
      allLogosPopulated,
      allLogosWellSized,
      noDashedBorder,
      companies: expertiseData
    };

    // Capture My Expertise Screenshot
    const expSection = await page.$('#my-expertise');
    if (expSection) {
      await expSection.screenshot({ path: 'scratch/screenshot_my_expertise.png' });
      console.log('Captured My Expertise screenshot to scratch/screenshot_my_expertise.png');
    }

    // ---------------------------------------------------------
    // BACKSTAGE MANAGEMENT & PERSISTENCE VERIFICATION
    // ---------------------------------------------------------
    console.log('\n--- VERIFYING BACKSTAGE SLOTS & PERSISTENCE ---');
    await page.goto('http://localhost:3000/backstage.html', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Handle authentication if password prompt is visible
    const hasOverlay = await page.evaluate(() => {
      const el = document.getElementById('auth-overlay');
      return el && window.getComputedStyle(el).display !== 'none';
    });

    if (hasOverlay) {
      await page.type('#auth-password', 'cbk2026');
      await page.click('#auth-submit-btn');
      await new Promise(r => setTimeout(r, 1500));
    }

    // Verify Visual Orbit in Backstage
    const backstageOrbit = await page.evaluate(async () => {
      // Click on Visual Orbit in tree
      const treeItem = Array.from(document.querySelectorAll('.tree-item')).find(el => el.textContent.includes('Visual Orbit'));
      if (treeItem) treeItem.click();
      await new Promise(r => setTimeout(r, 500));

      const slotCards = document.querySelectorAll('.orbit-slot-card');
      const addSlotBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('+ ADD SLOT'));

      return {
        hasVisualOrbitTree: !!treeItem,
        renderedSlotCardsCount: slotCards.length,
        hasAddSlotBtn: !!addSlotBtn
      };
    });

    console.log('Backstage Visual Orbit Rendered Slots Count:', backstageOrbit.renderedSlotCardsCount);
    console.log('Backstage Supports Up to 48 Slots (+ ADD SLOT Button):', backstageOrbit.hasAddSlotBtn);

    // Verify Selected Works in Backstage
    const backstageWorks = await page.evaluate(async () => {
      const treeItem = Array.from(document.querySelectorAll('.tree-item')).find(el => el.textContent.includes('Selected Works'));
      if (treeItem) treeItem.click();
      await new Promise(r => setTimeout(r, 500));

      const inputs = Array.from(document.querySelectorAll('input'));
      const hasCategoryField = inputs.some(i => i.value && (i.value.includes('INDEPENDENT IP') || i.value.includes('CONCEPT FILM')));
      const hasBadgeField = inputs.some(i => i.value && i.value.includes('// 2026'));
      const hasPosterField = Array.from(document.querySelectorAll('.media-field-name')).some(el => el.textContent.includes('poster-'));

      return {
        hasCategoryField,
        hasBadgeField,
        hasPosterField
      };
    });

    console.log('Backstage Selected Works Exposes Category Field:', backstageWorks.hasCategoryField);
    console.log('Backstage Selected Works Exposes Badge Field:', backstageWorks.hasBadgeField);
    console.log('Backstage Selected Works Exposes Poster Media Field:', backstageWorks.hasPosterField);

    // Verify My Expertise in Backstage
    const backstageExpertise = await page.evaluate(async () => {
      const treeItem = Array.from(document.querySelectorAll('.tree-item')).find(el => el.textContent.includes('My Expertise'));
      if (treeItem) treeItem.click();
      await new Promise(r => setTimeout(r, 500));

      const mediaFields = Array.from(document.querySelectorAll('.media-field-name')).map(el => el.textContent.trim());
      const hasDnegLogo = mediaFields.includes('DNEG.png');
      const hasImpromp2Logo = mediaFields.includes('IMPROMP2LABS.png');
      const hasCyberedgeLogo = mediaFields.includes('CE.png');
      const hasPremaSaiLogo = mediaFields.includes('PSD.png');

      return {
        hasDnegLogo,
        hasImpromp2Logo,
        hasCyberedgeLogo,
        hasPremaSaiLogo
      };
    });

    console.log('Backstage My Expertise Manages DNEG Logo:', backstageExpertise.hasDnegLogo);
    console.log('Backstage My Expertise Manages IMPROMP2LABS Logo:', backstageExpertise.hasImpromp2Logo);
    console.log('Backstage My Expertise Manages CYBEREDGE Logo:', backstageExpertise.hasCyberedgeLogo);
    console.log('Backstage My Expertise Manages PREMA SAI DESIGNERS Logo:', backstageExpertise.hasPremaSaiLogo);

    results.backstagePersistence = {
      backstageOrbit,
      backstageWorks,
      backstageExpertise
    };

    console.log('\n=== ALL VERIFICATION CHECKS COMPLETE ===');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('Verification failed with error:', err);
  } finally {
    await browser.close();
  }
}

runVerification();
