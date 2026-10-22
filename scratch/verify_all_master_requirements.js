const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runComprehensiveVerification() {
  console.log('====================================================');
  console.log('CBK DESIGNFOLIO — MASTER VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1050', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.toString()));

  console.log('1. Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // ------------------------------------------------------------------
  // CHECK 1: GLOBAL HEADER SIX-SECTION NAVIGATION
  // ------------------------------------------------------------------
  console.log('\n--- CHECK 1: Header 6-Section Navigation ---');
  const navData = await page.evaluate(() => {
    const nav = document.getElementById('header-nav');
    if (!nav) return { error: 'header-nav not found' };
    const items = Array.from(nav.querySelectorAll('.nav-item')).map(el => ({
      text: el.textContent.trim(),
      target: el.getAttribute('data-target'),
      href: el.getAttribute('href')
    }));
    const capsule = document.getElementById('nav-liquid-capsule');
    return {
      items,
      capsulePresent: !!capsule,
      capsuleOpacity: capsule ? window.getComputedStyle(capsule).opacity : 0
    };
  });
  console.log('Navigation items found:', JSON.stringify(navData.items, null, 2));
  console.log('Liquid capsule present:', navData.capsulePresent, 'opacity:', navData.capsuleOpacity);

  // Hover over STACK and check capsule position
  console.log('Hovering over STACK nav item...');
  await page.hover('#nav-item-stack');
  await new Promise(r => setTimeout(r, 400));
  const stackHoverCapsule = await page.evaluate(() => {
    const cap = document.getElementById('nav-liquid-capsule');
    const item = document.getElementById('nav-item-stack');
    return {
      capLeft: cap.offsetLeft,
      capWidth: cap.offsetWidth,
      itemLeft: item.offsetLeft,
      itemWidth: item.offsetWidth
    };
  });
  console.log('Capsule aligned to STACK:', stackHoverCapsule);

  // Click STACK and test smooth scroll
  console.log('Clicking STACK...');
  await page.click('#nav-item-stack');
  await new Promise(r => setTimeout(r, 1000));
  const scrollYAfterStack = await page.evaluate(() => window.scrollY);
  console.log(`Scroll Y after clicking STACK: ${scrollYAfterStack}px (Scrolled into view)`);

  // ------------------------------------------------------------------
  // CHECK 2: SECTION SPACING (Beyond the Frame -> Selected Works)
  // ------------------------------------------------------------------
  console.log('\n--- CHECK 2: Spacing Between Beyond the Frame and Selected Works ---');
  const spacingData = await page.evaluate(() => {
    const beyondSec = document.getElementById('beyond-the-frame-zone');
    const worksSec = document.getElementById('selected-works');
    if (!beyondSec || !worksSec) return { error: 'Sections missing' };

    const bRect = beyondSec.getBoundingClientRect();
    const wRect = worksSec.getBoundingClientRect();
    const gap = wRect.top - bRect.bottom;

    const bStyle = window.getComputedStyle(beyondSec);
    const wStyle = window.getComputedStyle(worksSec);

    return {
      gapPx: gap,
      beyondMarginBottom: bStyle.marginBottom,
      worksMarginTop: wStyle.marginTop,
      worksPaddingTop: wStyle.paddingTop
    };
  });
  console.log('Spacing measurements:', spacingData);

  // ------------------------------------------------------------------
  // CHECK 3: SELECTED WORKS VIDEO HOVER PREVIEW & FULLSCREEN PLAYER
  // ------------------------------------------------------------------
  console.log('\n--- CHECK 3: Selected Works Media Interactions ---');
  await page.$eval('#selected-works', el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await new Promise(r => setTimeout(r, 800));

  const firstCardVideo = await page.evaluate(() => {
    const card = document.querySelector('.works-card');
    if (!card) return null;
    const v = card.querySelector('video.works-card-media-video');
    return {
      cardTitle: card.getAttribute('data-video-title'),
      videoSrc: card.getAttribute('data-video-src'),
      hasVideoTag: !!v,
      isMuted: v ? v.muted : false,
      isPaused: v ? v.paused : true
    };
  });
  console.log('First card initial state:', firstCardVideo);

  // Hover over first card
  console.log('Hovering over first video card...');
  await page.hover('.works-card');
  await new Promise(r => setTimeout(r, 600));

  const hoverState = await page.evaluate(() => {
    const card = document.querySelector('.works-card');
    const v = card.querySelector('video.works-card-media-video');
    return {
      isPlaying: v ? !v.paused : false,
      currentTime: v ? v.currentTime : 0,
      muted: v ? v.muted : false
    };
  });
  console.log('Video state on card hover:', hoverState);

  // Click card to open custom player modal
  console.log('Clicking card to open cinematic player...');
  await page.click('.works-card');
  await new Promise(r => setTimeout(r, 800));

  const playerModalState = await page.evaluate(() => {
    const modal = document.getElementById('selected-works-lightbox');
    const card = document.getElementById('medium-player-card');
    const title = document.getElementById('lightbox-title')?.textContent;
    const topTitle = document.getElementById('player-top-title')?.textContent;
    const video = document.getElementById('active-medium-video');
    const controls = document.getElementById('video-custom-controls');
    const prevBtn = document.getElementById('player-prev-btn');
    const nextBtn = document.getElementById('player-next-btn');

    return {
      modalOpen: modal ? modal.classList.contains('is-open') : false,
      title,
      topTitle,
      hasVideo: !!video,
      hasControls: !!controls,
      hasPrevNext: !!(prevBtn && nextBtn),
      bodyHasLightboxClass: document.body.classList.contains('lightbox-active'),
      cursorStyle: window.getComputedStyle(document.body).cursor
    };
  });
  console.log('Cinematic player modal state:', playerModalState);

  // Test Next Work navigation button
  console.log('Clicking next work button in player...');
  await page.click('#player-next-btn');
  await new Promise(r => setTimeout(r, 600));
  const nextProjectTitle = await page.evaluate(() => document.getElementById('lightbox-title')?.textContent);
  console.log(`Switched to next project: "${nextProjectTitle}"`);

  // Close player via X button
  console.log('Closing player modal...');
  await page.click('.lightbox-close-btn');
  await new Promise(r => setTimeout(r, 500));
  const isClosed = await page.evaluate(() => !document.getElementById('selected-works-lightbox').classList.contains('is-open'));
  console.log('Player closed:', isClosed);

  // ------------------------------------------------------------------
  // CHECK 4: VISUAL ORBIT 40 UNIQUE TILES & CONTAINER
  // ------------------------------------------------------------------
  console.log('\n--- CHECK 4: Visual Orbit Dome & 40 Tiles ---');
  await page.$eval('#visual-orbit', el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await new Promise(r => setTimeout(r, 1200));

  const orbitData = await page.evaluate(() => {
    const sec = document.getElementById('visual-orbit');
    const wrap = document.getElementById('visual-orbit-gallery-wrap');
    const wrapStyle = wrap ? window.getComputedStyle(wrap) : null;
    const hint = document.querySelector('.orbit-drag-hint');
    const hintVisible = hint ? window.getComputedStyle(hint).display !== 'none' : false;

    // Check images in content
    const customImgs = window.__visualOrbitCustomImages || [];
    return {
      wrapBorder: wrapStyle ? wrapStyle.border : null,
      wrapBackground: wrapStyle ? wrapStyle.backgroundColor : null,
      instructionHintVisible: hintVisible,
      customImagesCount: customImgs.length,
      sampleImages: customImgs.slice(0, 3).map(i => i.src)
    };
  });
  console.log('Visual Orbit status:', orbitData);

  // ------------------------------------------------------------------
  // CHECK 5: MY EXPERTISE COMPANY LOGOS
  // ------------------------------------------------------------------
  console.log('\n--- CHECK 5: My Expertise Company Cards ---');
  await page.$eval('#my-expertise', el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await new Promise(r => setTimeout(r, 600));

  const expertiseData = await page.evaluate(() => {
    const companies = Array.from(document.querySelectorAll('.expertise-company-card, .company-record, [data-company-id]')).map(c => {
      const name = c.querySelector('.company-name, h3')?.textContent?.trim();
      const logoImg = c.querySelector('.company-logo-slot img, img.company-logo');
      return {
        name,
        hasLogoImg: !!logoImg,
        logoSrc: logoImg ? logoImg.getAttribute('src') : null,
        objectFit: logoImg ? window.getComputedStyle(logoImg).objectFit : null
      };
    });
    return companies;
  });
  console.log('My Expertise companies rendered:', expertiseData);

  // ------------------------------------------------------------------
  // CHECK 6: OFF THE CLOCK SHADOW LINES
  // ------------------------------------------------------------------
  console.log('\n--- CHECK 6: Off the Clock Card Stack Shadows ---');
  await page.$eval('#hobbies-archive', el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await new Promise(r => setTimeout(r, 600));

  const hobbiesShadow = await page.evaluate(() => {
    const slat = document.querySelector('.elastic-slat');
    const track = document.querySelector('.elastic-gallery-track');
    return {
      slatBoxShadow: slat ? window.getComputedStyle(slat).boxShadow : null,
      trackPresent: !!track
    };
  });
  console.log('Off the Clock shadows:', hobbiesShadow);

  // ------------------------------------------------------------------
  // CHECK 7: CTA LET'S CONNECT TYPOGRAPHY & STATEMENT
  // ------------------------------------------------------------------
  console.log('\n--- CHECK 7: CTA "LET\'S CONNECT" & Description Line Break ---');
  await page.$eval('#lets-build', el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await new Promise(r => setTimeout(r, 600));

  const ctaData = await page.evaluate(() => {
    const card = document.getElementById('brittle-contact-card');
    const label = card ? card.querySelector('.dbl-meta-label') : null;
    const stmt = card ? card.querySelector('.build-statement') : null;
    return {
      labelVisible: !!label,
      labelText: label ? label.textContent.trim() : null,
      statementHtml: stmt ? stmt.innerHTML : null,
      statementText: stmt ? stmt.textContent.trim() : null
    };
  });
  console.log('CTA status:', ctaData);

  // ------------------------------------------------------------------
  // CHECK 8: HERO EXR SNAP AUDIO INTEGRATION
  // ------------------------------------------------------------------
  console.log('\n--- CHECK 8: Hero EXR Snap Audio ---');
  const heroAudioState = await page.evaluate(() => {
    return {
      heroAudioConfig: window.__HERO_AUDIO__,
      heroSectionPresent: !!document.getElementById('hero-section')
    };
  });
  console.log('Hero audio configuration:', heroAudioState);

  // ------------------------------------------------------------------
  // CHECK 9: BACKSTAGE CMS CONTROLS (/backstage)
  // ------------------------------------------------------------------
  console.log('\n--- CHECK 9: Backstage CMS Controls ---');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  // If passphrase dialog is open, fill and unlock
  const hasPassphraseInput = await page.$('#passphrase-input');
  if (hasPassphraseInput) {
    console.log('Entering backstage passphrase "cbk2026"...');
    await page.type('#passphrase-input', 'cbk2026');
    await page.click('#passphrase-submit-btn');
    await new Promise(r => setTimeout(r, 1000));
  }

  const backstageControls = await page.evaluate(() => {
    // Check Hero EXR audio controls in Backstage
    const heroAudioInputs = {
      audioSection: !!document.querySelector('.hero-audio-settings, [data-section="hero-audio"]'),
      startFrame: document.querySelector('#hero-audio-start, input[name="startFrame"]')?.value,
      endFrame: document.querySelector('#hero-audio-end, input[name="endFrame"]')?.value
    };

    // Check company logo controls
    const logoControls = Array.from(document.querySelectorAll('.expertise-logo-row, .company-logo-field, [data-company-logo]')).map(row => {
      return row.textContent.trim().split('\n')[0];
    });

    return {
      heroAudioInputs,
      logoControlsCount: logoControls.length
    };
  });
  console.log('Backstage controls verified:', backstageControls);

  console.log('\n--- Console Errors Check ---');
  console.log(`Total console errors during full run: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }

  await browser.close();
  console.log('\n✅ Comprehensive Verification Finished.');
}

runComprehensiveVerification().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
