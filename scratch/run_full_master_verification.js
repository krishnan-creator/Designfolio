const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function verifyAll() {
  const url = 'http://localhost:3000';
  const outDir = 'C:/Users/meet2/.gemini/antigravity-ide/brain/756d34ff-427e-4d54-a73d-74ad8325ba5f/';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_verify_master_' + Date.now();

  console.log('Launching Chrome for Master Verification Suite...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--remote-allow-origins=*',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { detached: false });

  const consoleLogs = [];
  const consoleErrors = [];

  try {
    let connected = false;
    for (let i = 0; i < 30; i++) {
      try {
        await fetchJson('http://127.0.0.1:9225/json/version');
        connected = true;
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    if (!connected) throw new Error('Could not connect to Chrome port 9225');

    const pages = await fetchJson('http://127.0.0.1:9225/json/list');
    let target = pages && pages.find(p => p.type === 'page');
    if (!target) {
      target = await fetchJson('http://127.0.0.1:9225/json/new?' + encodeURIComponent(url));
    }

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 1;
    const pending = new Map();

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map(a => a.value || a.description).join(' ');
        if (data.params.type === 'error') consoleErrors.push(text);
        else consoleLogs.push(text);
      }
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to http://localhost:3000...');
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 3500));

    // CHECK 1: HERO PARTICLES & TYPOGRAPHY
    const heroEval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const particles = window.nameParticles || [];
          const canvas = document.getElementById('name-particle-canvas');
          const note = document.getElementById('hero-sticky-note');
          const stamp = document.getElementById('sticky-stamp');
          const bodyLines = document.getElementById('sticky-body-lines');
          const resumeBtn = document.getElementById('hero-resume-download');
          const inBtn = document.querySelector('.contact-btn-in');
          const waBtn = document.querySelector('.contact-btn-wa');

          return {
            particleCount: particles.length,
            canvasWidth: canvas ? canvas.width : 0,
            canvasHeight: canvas ? canvas.height : 0,
            hasStickyNote: !!note,
            hasStamp: !!stamp,
            hasBodyLines: !!bodyLines,
            resumeHref: resumeBtn ? resumeBtn.getAttribute('href') : null,
            resumeDownload: resumeBtn ? resumeBtn.getAttribute('download') : null,
            inHref: inBtn ? inBtn.getAttribute('href') : null,
            waHref: waBtn ? waBtn.getAttribute('href') : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('CHECK 1 — Hero Evaluation:', JSON.stringify(heroEval.result.value, null, 2));

    // Screenshot 1: Hero Section with particles, stamp note, social icons, resume button
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '01_hero_particle_stamp.png', Buffer.from(heroShot.data, 'base64'));
    console.log('Saved 01_hero_particle_stamp.png');

    // CHECK 2: CINEMATIC SHOWCASE (BY THE NUMBERS)
    const showcaseEval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const zone = document.querySelector('.cinematic-showcase-zone');
          const tag = zone ? zone.querySelector('.showcase-tag') : null;
          const scope = zone ? zone.querySelector('.showcase-scope-statement') : null;
          const mount = document.getElementById('morph-slider-mount');
          return {
            hasShowcase: !!zone,
            tagText: tag ? tag.innerText.trim() : null,
            scopeStatement: scope ? scope.innerText.trim() : null,
            hasMorphMount: !!mount
          };
        })()
      `,
      returnByValue: true
    });
    console.log('CHECK 2 — Cinematic Showcase:', JSON.stringify(showcaseEval.result.value, null, 2));

    // CHECK 3: SELECTED WORKS EXPANSION & MEDIUM PLAYER
    const worksInitialEval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const row1 = document.getElementById('works-row-1');
          const expArea = document.getElementById('works-expanded-area');
          const toggleBtn = document.getElementById('works-toggle-btn');
          const toggleText = document.getElementById('works-toggle-text');
          
          return {
            row1Cards: row1 ? row1.querySelectorAll('.works-card').length : 0,
            isCollapsed: expArea ? expArea.classList.contains('is-collapsed') : false,
            btnText: toggleText ? toggleText.innerText.trim() : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('CHECK 3a — Selected Works Initial State:', JSON.stringify(worksInitialEval.result.value, null, 2));

    // Test Expand
    await send('Runtime.evaluate', { expression: `window.toggleSelectedWorksExpand()` });
    await new Promise(r => setTimeout(r, 500));

    const worksExpandedEval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const expArea = document.getElementById('works-expanded-area');
          const toggleText = document.getElementById('works-toggle-text');
          const landscapes = expArea ? expArea.querySelectorAll('.works-card-landscape').length : 0;
          const reels = expArea ? expArea.querySelectorAll('.works-card-reel').length : 0;
          
          return {
            isCollapsed: expArea ? expArea.classList.contains('is-collapsed') : true,
            btnText: toggleText ? toggleText.innerText.trim() : null,
            expandedLandscapes: landscapes,
            expandedReels: reels
          };
        })()
      `,
      returnByValue: true
    });
    console.log('CHECK 3b — Selected Works Expanded State:', JSON.stringify(worksExpandedEval.result.value, null, 2));

    // Scroll to Selected Works and capture screenshot
    await send('Runtime.evaluate', {
      expression: `document.getElementById('selected-works').scrollIntoView({ block: 'start' })`
    });
    await new Promise(r => setTimeout(r, 600));
    const worksShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '02_selected_works_initial_and_expanded.png', Buffer.from(worksShot.data, 'base64'));
    console.log('Saved 02_selected_works_initial_and_expanded.png');

    // Test Medium Video Player open
    await send('Runtime.evaluate', {
      expression: `
        const firstCard = document.querySelector('.works-card');
        if (firstCard) window.openCinematicLightbox(firstCard);
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const playerEval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const modal = document.getElementById('selected-works-lightbox');
          const card = document.getElementById('medium-player-card');
          const playBtn = document.getElementById('player-play-btn');
          const skipBtn = document.getElementById('player-skip-btn');
          const seekBar = document.getElementById('player-seek-bar');
          const timeDisp = document.getElementById('player-time-display');
          const muteBtn = document.getElementById('player-mute-btn');
          const volBar = document.getElementById('player-vol-bar');
          const fsBtn = document.getElementById('player-fs-btn');
          const note = document.querySelector('.player-instruction-note');

          return {
            modalOpen: modal ? modal.classList.contains('is-open') : false,
            hasCard: !!card,
            hasPlayBtn: !!playBtn,
            hasSkipBtn: !!skipBtn,
            hasSeekBar: !!seekBar,
            hasTimeDisp: !!timeDisp,
            hasMuteBtn: !!muteBtn,
            hasVolBar: !!volBar,
            hasFsBtn: !!fsBtn,
            instructionText: note ? note.innerText.trim() : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('CHECK 3c — Medium Video Player Modal:', JSON.stringify(playerEval.result.value, null, 2));

    const playerShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '03_medium_video_player.png', Buffer.from(playerShot.data, 'base64'));
    console.log('Saved 03_medium_video_player.png');

    // Close medium player
    await send('Runtime.evaluate', { expression: `window.closeCinematicLightbox()` });
    await new Promise(r => setTimeout(r, 300));

    // CHECK 4: MY EXPERTISE (DNEG 3-column + STUDIO FILMS subsection)
    await send('Runtime.evaluate', {
      expression: `document.getElementById('my-expertise').scrollIntoView({ block: 'start' })`
    });
    await new Promise(r => setTimeout(r, 600));

    const dnegEval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const dneg = document.getElementById('exp-dneg');
          const infoGrid = dneg ? dneg.querySelector('.expertise-info-grid') : null;
          const blocks = infoGrid ? infoGrid.querySelectorAll('.info-block').length : 0;
          const studioFilms = dneg ? dneg.querySelector('.dneg-studio-films-section') : null;
          const tiles = studioFilms ? studioFilms.querySelectorAll('.studio-film-tile') : [];
          const tileNames = Array.from(tiles).map(t => {
            const b = t.querySelector('.film-tile-badge');
            return b ? b.innerText.trim() : '';
          });

          return {
            hasDneg: !!dneg,
            columnsCount: blocks,
            hasStudioFilms: !!studioFilms,
            tileCount: tiles.length,
            tileNames: tileNames
          };
        })()
      `,
      returnByValue: true
    });
    console.log('CHECK 4 — DNEG & Studio Films Subsection:', JSON.stringify(dnegEval.result.value, null, 2));

    const dnegShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '04_dneg_studio_films.png', Buffer.from(dnegShot.data, 'base64'));
    console.log('Saved 04_dneg_studio_films.png');

    // CHECK 5: THE CORE (Lanyard 3D & MY CURIOSITY STACK)
    await send('Runtime.evaluate', {
      expression: `document.getElementById('the-core').scrollIntoView({ block: 'start' })`
    });
    await new Promise(r => setTimeout(r, 1200));

    const coreEval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const coreWrap = document.querySelector('.lanyard-glass-panel-wrapper');
          const lanyardCanvas = document.querySelector('.lanyard-canvas');
          const curiosityHeading = document.getElementById('curiosity-stack-title');
          const cards = document.querySelectorAll('.curiosity-stack-card');
          const careerRail = document.querySelector('.career-timeline-rail');
          const careerNodes = document.querySelectorAll('.career-node-item');

          return {
            hasCoreGlassPanel: !!coreWrap,
            hasLanyardCanvas: !!lanyardCanvas,
            curiosityTitle: curiosityHeading ? curiosityHeading.innerText.trim() : null,
            curiosityToolsCount: cards.length,
            hasCareerRail: !!careerRail,
            careerNodesCount: careerNodes.length
          };
        })()
      `,
      returnByValue: true
    });
    console.log('CHECK 5 — THE CORE & MY CURIOSITY STACK:', JSON.stringify(coreEval.result.value, null, 2));

    const coreShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '05_the_core_curiosity_stack.png', Buffer.from(coreShot.data, 'base64'));
    console.log('Saved 05_the_core_curiosity_stack.png');

    // CHECK 6: LIGHT THEME BACKGROUND (WaveGridBackground from light.txt)
    console.log('Switching to Light Theme...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('theme-toggle').click()`
    });
    await new Promise(r => setTimeout(r, 1500));

    const lightThemeEval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const theme = document.documentElement.getAttribute('data-theme');
          const bgWrap = document.querySelector('.wave-grid-bg-wrap');
          const waveCanvas = bgWrap ? bgWrap.querySelector('canvas') : null;
          const contactCard = document.getElementById('brittle-contact-card');
          const contactBgImg = contactCard ? window.getComputedStyle(contactCard).backgroundImage : null;
          const startBtn = document.querySelector('.build-btn-primary');

          return {
            currentTheme: theme,
            hasWaveGridBackground: !!waveCanvas,
            contactBgImage: contactBgImg,
            startProjectHref: startBtn ? startBtn.getAttribute('href') : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('CHECK 6 — Light Theme & WaveGridBackground:', JSON.stringify(lightThemeEval.result.value, null, 2));

    const lightShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '06_light_theme_wavegrid.png', Buffer.from(lightShot.data, 'base64'));
    console.log('Saved 06_light_theme_wavegrid.png');

    // CHECK 7: CONTACT CTA & ROUGH TEXTURES
    await send('Runtime.evaluate', {
      expression: `document.getElementById('lets-build').scrollIntoView({ block: 'start' })`
    });
    await new Promise(r => setTimeout(r, 600));

    const contactShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '07_contact_rough_textures.png', Buffer.from(contactShot.data, 'base64'));
    console.log('Saved 07_contact_rough_textures.png');

    // Switch back to Dark Theme and check dark contact card texture
    await send('Runtime.evaluate', {
      expression: `document.getElementById('theme-toggle').click()`
    });
    await new Promise(r => setTimeout(r, 1200));

    const darkContactEval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const contactCard = document.getElementById('brittle-contact-card');
          return {
            darkContactBgImage: contactCard ? window.getComputedStyle(contactCard).backgroundImage : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('CHECK 7b — Dark Theme Contact Card Texture:', JSON.stringify(darkContactEval.result.value, null, 2));

    console.log('\n=== CONSOLE LOGS & ERRORS ===');
    console.log('Console Errors count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }
    console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===\n');

  } catch (err) {
    console.error('Verification failed with error:', err);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

verifyAll();
