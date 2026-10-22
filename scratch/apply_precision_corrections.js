const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// ============================================================
// 1. REQUIREMENT 09: CHANGE LAST TILE VALUE FROM 2 TO 02
// ============================================================
html = html.replace(
  /<div class="number-tile number-tile-featured"[\s\S]*?<div class="number-val">2<\/div>/,
  (match) => match.replace('<div class="number-val">2</div>', '<div class="number-val">02</div>')
);

// ============================================================
// 2. REQUIREMENT 05: DNEG FILM CREDITS RELOCATION
//    Remove bottom .dneg-studio-films-section,
//    Add vertical film credits directly beneath DNEG logo in left col
// ============================================================
// First remove the old .dneg-studio-films-section from DNEG row
html = html.replace(
  /\s*<!-- NEW STUDIO FILMS SUBSECTION: Positioned BELOW Skills & Tools in exact requested order -->\s*<div class="dneg-studio-films-section"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<!-- 2\. IMPROMP2LABS -->/,
  `
              </div>
            </div>

            <!-- 2. IMPROMP2LABS -->`
);

// Now add the vertical film credits directly below the DNEG logo in .expertise-logo-col
const dnegLogoColOld = `<div class="expertise-row" id="exp-dneg">
              <div class="expertise-logo-col">
                <div class="company-logo-slot" aria-label="Logo: DNEG">
                  <div class="logo-slot-inner">
                    <span class="logo-slot-badge">LOGO</span>
                    <span class="logo-slot-name">DNEG</span>
                  </div>
                </div>
              </div>`;

const dnegLogoColNew = `<div class="expertise-row" id="exp-dneg">
              <div class="expertise-logo-col">
                <div class="company-logo-slot" aria-label="Logo: DNEG">
                  <div class="logo-slot-inner">
                    <span class="logo-slot-badge">LOGO</span>
                    <span class="logo-slot-name">DNEG</span>
                  </div>
                </div>

                <!-- FEATURE FILM CREDITS DIRECTLY BELOW DNEG LOGO ONLY -->
                <div class="dneg-film-credits-list" aria-label="Feature film visual development credits">
                  <div class="dneg-credit-item" tabindex="0">
                    <div class="dneg-credit-header">
                      <span class="dneg-credit-dot"></span>
                      <span class="dneg-credit-title">RAMAYANA</span>
                    </div>
                    <span class="dneg-credit-meta">Epic Cinema · Generative AI Look-Dev</span>
                  </div>

                  <div class="dneg-credit-item" tabindex="0">
                    <div class="dneg-credit-header">
                      <span class="dneg-credit-dot"></span>
                      <span class="dneg-credit-title">MASTERS OF THE UNIVERSE</span>
                    </div>
                    <span class="dneg-credit-meta">Digital Humans · Face Ingest & Transfer</span>
                  </div>

                  <div class="dneg-credit-item" tabindex="0">
                    <div class="dneg-credit-header">
                      <span class="dneg-credit-dot"></span>
                      <span class="dneg-credit-title">THE ODYSSEY</span>
                    </div>
                    <span class="dneg-credit-meta">VFX Integration · Shot Validation</span>
                  </div>
                </div>
              </div>`;

html = html.replace(dnegLogoColOld, dnegLogoColNew);

// ============================================================
// 3. CSS ENHANCEMENTS:
//    - Hero Theme Independence & Download Resume Button Stacking Context
//    - By The Numbers Invert Tile Colours on Hover (Dark: dark->light; Light: light->dark)
//    - Post-Hero Alignment Grid & Visual Orbit Overflow Containment
//    - DNEG Film Credits Refined Styling
//    - Let's Build Wide Rectangular Contact Card
// ============================================================
const PRECISION_CSS = `
    /* ============================================================
       CBK PRECISION CORRECTION PASS — MASTER CSS ENHANCEMENTS
       ============================================================ */

    /* 02. HERO THEME INDEPENDENCE: RESUME BUTTON & STACKING CONTEXT */
    #hero-section {
      position: relative;
      background: #0B0B0D !important;
      color: #FFFFFF !important;
    }

    .hero-left-stage .contact-links-row {
      position: relative;
      z-index: 35;
    }

    .resume-download-btn,
    #hero-resume-download {
      display: inline-flex !important;
      align-items: center !important;
      gap: 8px !important;
      height: 38px !important;
      padding: 0 16px !important;
      border-radius: 6px !important;
      background: rgba(255, 255, 255, 0.12) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.28) !important;
      color: #FFFFFF !important;
      font-family: 'Space Grotesk', sans-serif !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      letter-spacing: 0.10em !important;
      text-transform: uppercase !important;
      text-decoration: none !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;
      position: relative !important;
      z-index: 35 !important;
      opacity: 1 !important;
      visibility: visible !important;
      cursor: pointer !important;
      transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease !important;
    }

    .resume-download-btn:hover,
    .resume-download-btn:focus-visible,
    #hero-resume-download:hover,
    #hero-resume-download:focus-visible {
      background: #FFFFFF !important;
      color: #0B0B0D !important;
      border-color: #FFFFFF !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 24px rgba(255, 255, 255, 0.35) !important;
    }

    /* Prevent global light/dark theme overrides from altering Hero elements */
    [data-theme="light"] #hero-section .resume-download-btn,
    [data-theme="dark"] #hero-section .resume-download-btn {
      background: rgba(255, 255, 255, 0.12) !important;
      border-color: rgba(255, 255, 255, 0.28) !important;
      color: #FFFFFF !important;
    }

    [data-theme="light"] #hero-section .resume-download-btn:hover,
    [data-theme="light"] #hero-section .resume-download-btn:focus-visible,
    [data-theme="dark"] #hero-section .resume-download-btn:hover,
    [data-theme="dark"] #hero-section .resume-download-btn:focus-visible {
      background: #FFFFFF !important;
      color: #0B0B0D !important;
      border-color: #FFFFFF !important;
    }

    /* Lock Hero quote and sticky note to consistent styling in both themes */
    #hero-section .quote-bracket { color: #E62929 !important; }
    #hero-section .quote-text-reveal { color: #F0EDE6 !important; }
    #hero-section .quote-guide-bar { background: #333333 !important; }

    /* 04. REPAIR SECTION ALIGNMENT & CONTENT CONTAINER GRID */
    .dbl-content-container {
      max-width: 1280px !important;
      margin: 0 auto !important;
      padding: clamp(60px, 7vh, 100px) clamp(20px, 4vw, 48px) !important;
      position: relative !important;
      z-index: 2 !important;
      box-sizing: border-box !important;
      width: 100% !important;
    }

    /* Prevent any horizontal spillage */
    html, body {
      overflow-x: clip !important;
      max-width: 100vw !important;
    }

    /* Consistent post-hero section containers */
    .selected-works-section,
    .visual-orbit-section,
    .expertise-section,
    .the-core-section,
    .closing-build-section {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      margin-bottom: clamp(64px, 8vw, 108px) !important;
    }

    /* Visual Orbit: Contained within section without horizontal overflow */
    .visual-orbit-container {
      position: relative !important;
      width: 100% !important;
      max-width: 100% !important;
      height: clamp(500px, 62vh, 720px) !important;
      border-radius: 16px !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    /* 05. DNEG FILM CREDITS STYLING (DIRECTLY BELOW LOGO) */
    .dneg-film-credits-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 14px;
      width: 100%;
      box-sizing: border-box;
    }

    .dneg-credit-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 9px 12px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--dbl-border-subtle);
      transition: background-color 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
      cursor: default;
      outline: none;
    }

    .dneg-credit-item:hover,
    .dneg-credit-item:focus-visible {
      background: rgba(255, 48, 56, 0.08) !important;
      border-color: rgba(255, 48, 56, 0.35) !important;
      transform: translateX(3px);
    }

    [data-theme="light"] .dneg-credit-item {
      background: rgba(0, 0, 0, 0.02);
      border-color: rgba(0, 0, 0, 0.08);
    }

    [data-theme="light"] .dneg-credit-item:hover,
    [data-theme="light"] .dneg-credit-item:focus-visible {
      background: rgba(220, 38, 38, 0.06) !important;
      border-color: rgba(220, 38, 38, 0.30) !important;
    }

    .dneg-credit-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dneg-credit-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--dbl-crimson);
      flex-shrink: 0;
    }

    .dneg-credit-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--dbl-text-primary);
    }

    .dneg-credit-meta {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      font-weight: 500;
      color: var(--dbl-text-tertiary);
      letter-spacing: 0.02em;
      padding-left: 10px;
    }

    /* Skills and Tools tags hover without layout shift */
    .skill-tag, .tool-tag {
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease !important;
      outline: none;
    }
    .skill-tag:hover, .skill-tag:focus-visible,
    .tool-tag:hover, .tool-tag:focus-visible {
      background: var(--dbl-text-primary) !important;
      color: var(--dbl-bg-root) !important;
      border-color: var(--dbl-text-primary) !important;
    }

    /* 09. BY THE NUMBERS: INVERT TILE COLOURS ON HOVER */
    .number-tile {
      transition: background-color 0.26s cubic-bezier(0.16, 1, 0.3, 1),
                  color 0.26s ease,
                  border-color 0.26s ease,
                  transform 0.24s ease,
                  box-shadow 0.26s ease !important;
    }

    .number-tile .number-val,
    .number-tile .number-label,
    .number-tile .number-cat,
    .number-tile .number-expand-desc p {
      transition: color 0.26s ease !important;
    }

    /* Dark Theme: Default Dark Tile -> Hover: Crisp Light Surface with Dark Text */
    [data-theme="dark"] .number-tile {
      background: #151519 !important;
      border-color: rgba(255, 255, 255, 0.09) !important;
      color: #F3F3F1 !important;
    }
    [data-theme="dark"] .number-tile:hover,
    [data-theme="dark"] .number-tile:focus-visible {
      background: #FFFFFF !important;
      border-color: #FFFFFF !important;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6) !important;
      transform: translateY(-3px) !important;
    }
    [data-theme="dark"] .number-tile:hover .number-val,
    [data-theme="dark"] .number-tile:focus-visible .number-val {
      color: #0E0E12 !important;
    }
    [data-theme="dark"] .number-tile:hover .number-label,
    [data-theme="dark"] .number-tile:focus-visible .number-label {
      color: #24242A !important;
    }
    [data-theme="dark"] .number-tile:hover .number-cat,
    [data-theme="dark"] .number-tile:focus-visible .number-cat {
      color: #555560 !important;
    }
    [data-theme="dark"] .number-tile:hover .number-expand-desc p,
    [data-theme="dark"] .number-tile:focus-visible .number-expand-desc p {
      color: #3A3A42 !important;
    }
    [data-theme="dark"] .number-tile:hover .number-accent-dot,
    [data-theme="dark"] .number-tile:focus-visible .number-accent-dot {
      background: #E62929 !important;
      box-shadow: 0 0 8px rgba(230, 41, 41, 0.4) !important;
    }

    /* Light Theme: Default Light Tile -> Hover: Dark Surface with Light Text */
    [data-theme="light"] .number-tile {
      background: #FFFFFF !important;
      border-color: rgba(0, 0, 0, 0.12) !important;
      color: #111115 !important;
    }
    [data-theme="light"] .number-tile:hover,
    [data-theme="light"] .number-tile:focus-visible {
      background: #101014 !important;
      border-color: #101014 !important;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28) !important;
      transform: translateY(-3px) !important;
    }
    [data-theme="light"] .number-tile:hover .number-val,
    [data-theme="light"] .number-tile:focus-visible .number-val {
      color: #FFFFFF !important;
    }
    [data-theme="light"] .number-tile:hover .number-label,
    [data-theme="light"] .number-tile:focus-visible .number-label {
      color: #E2E2E6 !important;
    }
    [data-theme="light"] .number-tile:hover .number-cat,
    [data-theme="light"] .number-tile:focus-visible .number-cat {
      color: #9A9AA4 !important;
    }
    [data-theme="light"] .number-tile:hover .number-expand-desc p,
    [data-theme="light"] .number-tile:focus-visible .number-expand-desc p {
      color: #CCCCCC !important;
    }
    [data-theme="light"] .number-tile:hover .number-accent-dot,
    [data-theme="light"] .number-tile:focus-visible .number-accent-dot {
      background: #E62929 !important;
      box-shadow: 0 0 8px rgba(230, 41, 41, 0.4) !important;
    }

    /* 10. LET'S BUILD: WIDE RECTANGULAR CONTACT CARD */
    .brittle-contact-card {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 0 3rem 0 !important;
      padding: clamp(2.5rem, 5vw, 4.5rem) clamp(2rem, 5vw, 4.5rem) !important;
      box-sizing: border-box !important;
      border-radius: 16px !important;
      position: relative !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      min-height: 380px !important;
    }

    .build-headline {
      font-size: clamp(2rem, 4.2vw, 3.8rem) !important;
      line-height: 1.05 !important;
      margin: 1.2rem 0 !important;
    }

    .build-contact-actions {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 14px !important;
      margin-top: 2rem !important;
    }
`;

// Inject PRECISION_CSS right before </style>
html = html.replace('</style>', PRECISION_CSS + '\n  </style>');

// ============================================================
// 4. HERO EXR PLAY–PAUSE–ACTION–PLAY SEQUENCE RECONSTRUCTION
// ============================================================
const OLD_EXR_ENGINE_START = `      // ============================================================
      // 5. HIGH-PRECISION TIME-BASED EXR ENGINE & IDLE WAKE ARCHITECTURE`;

const OLD_EXR_ENGINE_END = `      initializeHeroFrames();`;

const NEW_EXR_ENGINE = `      // ============================================================
      // 5. HIGH-PRECISION TIME-BASED EXR ENGINE & IDLE WAKE ARCHITECTURE
      //    (PLAY - PAUSE - ACTION - PLAY APPROVED INTERACTION SEQUENCE)
      //    - Initial entry: 001 -> 039 smooth playback, pauses at frame 39
      //    - Action: User pointer interaction inside Hero resumes playback
      //    - Idle: Pauses at current frame when user stops interacting
      //    - Subsequent Action: Resumes forward from current paused frame
      //    - Loop: Seamless forward continuous wrap through frame 291 -> 001
      // ============================================================
      const canvas = document.getElementById('canvas');
      const ctx = canvas ? canvas.getContext('2d') : null;
      const TOTAL_FRAMES = 291;
      const frameCache = new Map();
      let currentFrameNumber = 1;
      let lastRenderedImg = null;

      // EXR States: 'startup_hold_01' | 'initial_entry' | 'hold_39' | 'playing_action' | 'paused_idle'
      let exrPlaybackState = 'startup_hold_01';
      let heroExrIdleTimer = null;

      const TARGET_FPS = 28;
      const FRAME_DURATION = 1000 / TARGET_FPS; // ~35.71ms
      let lastTimestamp = performance.now();
      let timeAccumulator = 0;

      function getFramePath(frameNum) {
        return \`frames/frame_\${String(frameNum).padStart(5, '0')}.jpg\`;
      }

      function loadSingleFrame(frameNum) {
        if (frameCache.has(frameNum)) {
          return Promise.resolve(frameCache.get(frameNum));
        }
        return new Promise((resolve) => {
          const img = new Image();
          img.src = getFramePath(frameNum);
          img.onload = () => {
            frameCache.set(frameNum, img);
            if (img.decode) {
              img.decode().then(() => resolve(img)).catch(() => resolve(img));
            } else {
              resolve(img);
            }
          };
          img.onerror = () => resolve(null);
        });
      }

      function resizeHeroCanvas() {
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
        drawFrameByNumber(currentFrameNumber);
      }
      resizeHeroCanvas();
      window.addEventListener('resize', resizeHeroCanvas, { passive: true });

      function drawFrameByNumber(frameNum) {
        if (!ctx || !canvas) return;
        const img = frameCache.get(frameNum) || lastRenderedImg;
        if (!img) {
          loadSingleFrame(frameNum).then((loaded) => {
            if (loaded && currentFrameNumber === frameNum) {
              lastRenderedImg = loaded;
              drawFrameByNumber(frameNum);
            }
          });
          return;
        }

        lastRenderedImg = img;
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const screenRatio = w / h;
        let dw, dh, dx, dy;

        if (screenRatio > imgRatio) {
          dw = w;
          dh = w / imgRatio;
          dx = 0;
          dy = (h - dh) * 0.5;
        } else {
          dh = h;
          dw = h * imgRatio;
          dx = (w - dw) * 0.5;
          dy = 0;
        }

        ctx.drawImage(img, dx, dy, dw, dh);
      }

      let exrAudioCtx = null;
      let hasCrossedSnapThresholdThisLoop = false;

      function playExrLoopSnapSound() {
        try {
          if (!exrAudioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) exrAudioCtx = new AC();
          }
          if (!exrAudioCtx) return;
          if (exrAudioCtx.state === 'suspended') {
            exrAudioCtx.resume().catch(() => {});
          }
          const t = exrAudioCtx.currentTime;
          const osc = exrAudioCtx.createOscillator();
          const gain = exrAudioCtx.createGain();
          const filter = exrAudioCtx.createBiquadFilter();

          filter.type = 'highpass';
          filter.frequency.setValueAtTime(1400, t);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.exponentialRampToValueAtTime(70, t + 0.022);

          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.020);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(exrAudioCtx.destination);

          osc.start(t);
          osc.stop(t + 0.025);
        } catch(e) {}
      }

      function advanceExrStep() {
        const prevFrame = currentFrameNumber;

        if (exrPlaybackState === 'startup_hold_01') {
          // Held at frame 1 during initial 0.5s splash & glitch
          currentFrameNumber = 1;
          return;
        } else if (exrPlaybackState === 'initial_entry') {
          // Play smoothly 1 -> 39, then pause at frame 39
          currentFrameNumber++;
          if (currentFrameNumber >= 39) {
            currentFrameNumber = 39;
            exrPlaybackState = 'hold_39'; // PAUSE AT INTENDED RESTING FRAME 39
          }
        } else if (exrPlaybackState === 'hold_39' || exrPlaybackState === 'paused_idle') {
          // Resting state: hold position without advancing or restarting
          return;
        } else if (exrPlaybackState === 'playing_action') {
          // User action drives smooth forward playback from current frame
          currentFrameNumber++;
          if (currentFrameNumber > TOTAL_FRAMES) {
            currentFrameNumber = 1;
            hasCrossedSnapThresholdThisLoop = false;
          }

          if (prevFrame <= 102 && currentFrameNumber >= 103 && !hasCrossedSnapThresholdThisLoop) {
            hasCrossedSnapThresholdThisLoop = true;
            playExrLoopSnapSound();
          }
          if (currentFrameNumber < 90) {
            hasCrossedSnapThresholdThisLoop = false;
          }
        }
      }

      function runHeroPlayback(now) {
        const delta = Math.min(now - lastTimestamp, 120);
        lastTimestamp = now;
        timeAccumulator += delta;

        let advanced = false;
        while (timeAccumulator >= FRAME_DURATION) {
          advanceExrStep();
          timeAccumulator -= FRAME_DURATION;
          advanced = true;
        }

        if (advanced) {
          drawFrameByNumber(currentFrameNumber);

          // Rolling frame preloader buffer ahead
          for (let offset = 1; offset <= 14; offset++) {
            let nextNum = currentFrameNumber + offset;
            if (nextNum > TOTAL_FRAMES) nextNum -= TOTAL_FRAMES;
            if (!frameCache.has(nextNum)) loadSingleFrame(nextNum);
          }
          for (let offset = 1; offset <= 4; offset++) {
            let prevNum = currentFrameNumber - offset;
            if (prevNum < 1) prevNum += TOTAL_FRAMES;
            if (!frameCache.has(prevNum)) loadSingleFrame(prevNum);
          }
        }

        requestAnimationFrame(runHeroPlayback);
      }

      // Qualifying user interaction in Hero: play -> pause -> action -> play
      function handleHeroExrWakeOnAction(e) {
        // Check if pointer or action is inside Hero or scroll is in hero
        const scrollY = window.scrollY || window.pageYOffset;
        const heroEl = document.getElementById('hero-section');
        const heroHeight = heroEl ? heroEl.offsetHeight : window.innerHeight;

        if (scrollY > heroHeight * 0.95) return; // Outside Hero

        if (exrPlaybackState === 'hold_39' || exrPlaybackState === 'paused_idle') {
          // Resume forward from current frame index
          exrPlaybackState = 'playing_action';
        }

        // Reset idle timer: if user pauses movement for 1.6s, pause playback cleanly at current frame
        if (heroExrIdleTimer) clearTimeout(heroExrIdleTimer);
        heroExrIdleTimer = setTimeout(() => {
          if (exrPlaybackState === 'playing_action') {
            exrPlaybackState = 'paused_idle';
          }
        }, 1600);
      }

      window.releaseHeroExrPlayback = function() {
        if (exrPlaybackState === 'startup_hold_01') {
          exrPlaybackState = 'initial_entry';
        }
      };

      const heroSection = document.getElementById('hero-section');
      if (heroSection) {
        heroSection.addEventListener('mousemove', handleHeroExrWakeOnAction, { passive: true });
        heroSection.addEventListener('pointermove', handleHeroExrWakeOnAction, { passive: true });
        heroSection.addEventListener('touchstart', handleHeroExrWakeOnAction, { passive: true });
      }
      window.addEventListener('mousemove', handleHeroExrWakeOnAction, { passive: true });
      window.addEventListener('touchstart', handleHeroExrWakeOnAction, { passive: true });

      async function initializeHeroFrames() {
        await loadSingleFrame(1);
        drawFrameByNumber(1);

        for (let i = 1; i <= 45; i++) {
          loadSingleFrame(i);
        }
        for (let i = 280; i <= 291; i++) {
          loadSingleFrame(i);
        }

        lastTimestamp = performance.now();
        timeAccumulator = 0;
        requestAnimationFrame(runHeroPlayback);

        let streamIdx = 46;
        function streamNextBatch() {
          if (streamIdx >= 280) return;
          loadSingleFrame(streamIdx).then(() => {
            streamIdx++;
            setTimeout(streamNextBatch, 10);
          });
        }
        streamNextBatch();
      }
      initializeHeroFrames();`;

const exrStartIdx = html.indexOf(OLD_EXR_ENGINE_START);
const exrEndIdx = html.indexOf(OLD_EXR_ENGINE_END);

if (exrStartIdx !== -1 && exrEndIdx !== -1) {
  html = html.substring(0, exrStartIdx) + NEW_EXR_ENGINE + html.substring(exrEndIdx + OLD_EXR_ENGINE_END.length);
  console.log('EXR engine successfully replaced with Play-Pause-Action-Play sequence!');
} else {
  console.error('Could not locate EXR engine boundaries in index.html!');
}

// ============================================================
// 5. HERO NAME: DENSE FERRO-CUBES, CRISP TRACKING & 90% REPULSION
// ============================================================
const OLD_PARTICLES_START = `      // ============================================================
      // 6. HERO NAME: DENSE FERROFLUID PARTICLES WITH GLITCH FORMATION`;

const OLD_PARTICLES_END = `      // ============================================================
      // 7. PINNED YELLOW STICKY NOTE & TACTILE TYPEWRITER`;

const NEW_PARTICLES_BLOCK = `      // ============================================================
      // 6. HERO NAME: PERFECTLY LEGIBLE, DENSE FERROFLUID LETTERS
      //    - Font: Bold display typography with explicit character tracking
      //    - Exact lines: CHITHAMBARAM / BALA KRISHNAN / PILLAI
      //    - PILLAI slightly smaller (~44%), strictly left-aligned
      //    - Densely packed ferro-cubes (small square particles, crisp contours)
      //    - Pointer repulsion: 90% strength, localized radius, spring recovery
      //    - Theme ripple: 80% strength across all 3 lines
      // ============================================================
      const nameWrap = document.getElementById('hero-name-wrap');
      const pCanvas = document.getElementById('name-particle-canvas');
      const pCtx = pCanvas ? pCanvas.getContext('2d') : null;

      let nameParticles = [];
      let isMouseOverName = false;
      let nameMouseX = -10000;
      let nameMouseY = -10000;
      let nameCanvasWidth = 0;
      let nameCanvasHeight = 0;
      let particleEngineInitialized = false;
      let nameFormationProgress = 0;
      let prevNameMouseX = -10000;
      let prevNameMouseY = -10000;
      let nameMouseVx = 0;
      let nameMouseVy = 0;

      const LINE1_TEXT = "CHITHAMBARAM";
      const LINE2_TEXT = "BALA KRISHNAN";
      const LINE3_TEXT = "PILLAI";

      let themeWaveActive = false;
      let themeWaveStartTime = 0;
      let themeWaveOriginX = 0;
      let themeWaveOriginY = 0;

      window.triggerHeroNameWave = function(originX, originY) {
        themeWaveActive = true;
        themeWaveStartTime = performance.now();
        themeWaveOriginX = originX || (window.innerWidth - 48);
        themeWaveOriginY = originY || 36;
      };

      // Helper to render text with explicit letter tracking so glyphs never merge
      function renderTrackedGlyphs(ctx, text, startX, y, extraSpacing) {
        let curX = startX;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          ctx.fillText(char, curX, y);
          curX += ctx.measureText(char).width + extraSpacing;
        }
        return curX;
      }

      function initDenseParticleTypography() {
        if (!pCanvas || !pCtx || !nameWrap) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = nameWrap.getBoundingClientRect();
        nameCanvasWidth = Math.round(Math.max(rect.width || 780, 720));

        const probe = document.createElement('canvas');
        const probeCtx = probe.getContext('2d');

        let availableW = Math.min(nameCanvasWidth - 16, 760);
        let fs1 = Math.round(Math.min(availableW * 0.140, 84));
        let fs2 = Math.round(Math.min(availableW * 0.188, 114));
        // Line 3 (PILLAI): slightly smaller (~44%) but fully readable, strictly left-aligned
        let fs3 = Math.round(fs2 * 0.44);

        const track1 = Math.round(fs1 * 0.08); // +6-7px tracking
        const track2 = Math.round(fs2 * 0.08); // +8-9px tracking
        const track3 = Math.round(fs3 * 0.09); // +4-5px tracking

        // Check bounds with tracked width
        probeCtx.font = \`900 \${fs1}px 'Anton', 'Space Grotesk', 'Montserrat', Impact, sans-serif\`;
        let w1 = 0;
        for (let c of LINE1_TEXT) w1 += probeCtx.measureText(c).width + track1;
        if (w1 > availableW) {
          fs1 = Math.floor(fs1 * (availableW / w1) * 0.98);
        }

        probeCtx.font = \`900 \${fs2}px 'Anton', 'Space Grotesk', 'Montserrat', Impact, sans-serif\`;
        let w2 = 0;
        for (let c of LINE2_TEXT) w2 += probeCtx.measureText(c).width + track2;
        if (w2 > availableW) {
          fs2 = Math.floor(fs2 * (availableW / w2) * 0.98);
          fs3 = Math.round(fs2 * 0.44);
        }

        probeCtx.font = \`900 \${fs3}px 'Anton', 'Space Grotesk', 'Montserrat', Impact, sans-serif\`;
        let w3 = 0;
        for (let c of LINE3_TEXT) w3 += probeCtx.measureText(c).width + track3;
        if (w3 > availableW) {
          fs3 = Math.floor(fs3 * (availableW / w3) * 0.98);
        }

        // Strict left alignment: start at 2px so letters never touch canvas boundary
        const paddingX = 2;
        const l1Y = 2;
        const l2Y = fs1 + 6;
        const l3Y = fs1 + fs2 + 12;
        const totalHeight = Math.round(fs1 + fs2 + fs3 + 26);
        nameCanvasHeight = totalHeight;
        nameWrap.style.minHeight = \`\${nameCanvasHeight}px\`;

        pCanvas.width = Math.round(nameCanvasWidth * dpr);
        pCanvas.height = Math.round(nameCanvasHeight * dpr);
        pCanvas.style.width = \`\${nameCanvasWidth}px\`;
        pCanvas.style.height = \`\${nameCanvasHeight}px\`;
        pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Render high-contrast offscreen glyph mask with tracked characters
        const off = document.createElement('canvas');
        off.width = Math.round(nameCanvasWidth * dpr);
        off.height = Math.round(nameCanvasHeight * dpr);
        const offCtx = off.getContext('2d');
        offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        offCtx.clearRect(0, 0, nameCanvasWidth, nameCanvasHeight);
        offCtx.fillStyle = '#ffffff';
        offCtx.textBaseline = 'top';

        // Render line 1: CHITHAMBARAM
        offCtx.font = \`900 \${fs1}px 'Anton', 'Space Grotesk', 'Montserrat', Impact, sans-serif\`;
        renderTrackedGlyphs(offCtx, LINE1_TEXT, paddingX, l1Y, track1);

        // Render line 2: BALA KRISHNAN
        offCtx.font = \`900 \${fs2}px 'Anton', 'Space Grotesk', 'Montserrat', Impact, sans-serif\`;
        renderTrackedGlyphs(offCtx, LINE2_TEXT, paddingX, l2Y, track2);

        // Render line 3: PILLAI
        offCtx.font = \`900 \${fs3}px 'Anton', 'Space Grotesk', 'Montserrat', Impact, sans-serif\`;
        renderTrackedGlyphs(offCtx, LINE3_TEXT, paddingX, l3Y, track3);

        const imgData = offCtx.getImageData(0, 0, off.width, off.height).data;
        nameParticles = [];

        // Dense, tightly packed ferro-cubes sampling
        const stepPx = Math.max(1, Math.round(dpr * 0.82));
        const pSize = 1.35; // Small square cubes for accurate curves and diagonals

        for (let py = 0; py < off.height; py += stepPx) {
          for (let px = 0; px < off.width; px += stepPx) {
            const idx = (py * off.width + px) * 4;
            if (imgData[idx + 3] > 40) {
              const x = px / dpr;
              const y = py / dpr;
              nameParticles.push({
                originX: x,
                originY: y,
                homeX: x,
                homeY: y,
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                size: pSize,
                dispersion: 0.80 + Math.random() * 0.40
              });
            }
          }
        }

        particleEngineInitialized = true;
        window.nameParticles = nameParticles;
      }

      function renderDenseFerrofluid() {
        if (!particleEngineInitialized || !pCtx) {
          requestAnimationFrame(renderDenseFerrofluid);
          return;
        }

        pCtx.clearRect(0, 0, nameCanvasWidth, nameCanvasHeight);

        // Pointer velocity damping
        nameMouseVx *= 0.84;
        nameMouseVy *= 0.84;
        const mouseSpeed = Math.hypot(nameMouseVx, nameMouseVy);

        // 90% strength pointer repulsion: strong localized repulsion
        // Repulsion radius localized to ~92px so untouched letters remain completely rigid!
        const REPULSION_RADIUS = 92.0;
        const BASE_REPULSION = 10.8; // 90% of system max (12.0)
        const SPRING_K = 0.082; // Hooke's spring constant
        const MAX_DISPLACEMENT = 68.0;

        // 1. Strong localized pointer repulsion
        if (isMouseOverName && !themeWaveActive && nameMouseX > -500) {
          for (let i = 0; i < nameParticles.length; i++) {
            const p = nameParticles[i];
            const dx = p.x - nameMouseX;
            const dy = p.y - nameMouseY;
            const dist = Math.hypot(dx, dy);

            if (dist < REPULSION_RADIUS && dist > 0.001) {
              const norm = dist / REPULSION_RADIUS;
              // Strong repulsion gradient
              const force = (1.0 - norm) * BASE_REPULSION * p.dispersion;
              const angle = Math.atan2(dy, dx);

              // Decisive push away from pointer
              p.vx += Math.cos(angle) * force;
              p.vy += Math.sin(angle) * force;

              // Directional velocity push from pointer motion
              if (mouseSpeed > 0.2) {
                p.vx += nameMouseVx * 0.45 * (1.0 - norm);
                p.vy += nameMouseVy * 0.45 * (1.0 - norm);
              }
            }
          }
        }

        // 2. Hero theme ripple wave (80% strength across all 3 lines)
        if (themeWaveActive) {
          const elapsed = performance.now() - themeWaveStartTime;
          const WAVE_DURATION = 1900;
          const progress = elapsed / WAVE_DURATION;

          if (progress >= 1.0) {
            themeWaveActive = false;
          } else {
            const rect = nameWrap.getBoundingClientRect();
            const localOx = themeWaveOriginX - rect.left;
            const localOy = themeWaveOriginY - rect.top;
            const maxDist = Math.hypot(nameCanvasWidth - localOx, nameCanvasHeight - localOy) + 360;
            const waveRadius = Math.pow(progress, 0.94) * maxDist;
            const waveWidth = 140.0;
            const envelopeTime = Math.sin(progress * Math.PI);
            // 80% strength ripple interaction
            const waveAmp = envelopeTime * 17.6; // 80% of 22.0

            for (let i = 0; i < nameParticles.length; i++) {
              const p = nameParticles[i];
              const dx = p.homeX - localOx;
              const dy = p.homeY - localOy;
              const dist = Math.hypot(dx, dy);
              const diff = Math.abs(dist - waveRadius);

              if (diff < waveWidth) {
                const bell = 0.5 * (1.0 + Math.cos((diff / waveWidth) * Math.PI));
                const force = bell * waveAmp;
                const angle = Math.atan2(dy, dx);
                p.vx += Math.cos(angle) * force * 0.32;
                p.vy += Math.sin(angle) * force * 0.32;
              }
            }
          }
        }

        // 3. Particle update loop: Hooke's spring return, viscosity, velocity damping
        pCtx.fillStyle = '#FFFFFF';
        for (let i = 0; i < nameParticles.length; i++) {
          const p = nameParticles[i];

          // Hooke's Law spring return to exact home font-mask coordinates
          const homeDx = p.homeX - p.x;
          const homeDy = p.homeY - p.y;
          const distToHome = Math.hypot(homeDx, homeDy);

          p.vx += homeDx * SPRING_K;
          p.vy += homeDy * SPRING_K;

          // Viscosity and velocity damping (smooth return without snapping)
          const damping = distToHome < 3.0 ? 0.78 : 0.84;
          p.vx *= damping;
          p.vy *= damping;
          p.x += p.vx;
          p.y += p.vy;

          if (distToHome < 0.22 && Math.hypot(p.vx, p.vy) < 0.05) {
            p.x = p.homeX;
            p.y = p.homeY;
            p.vx = 0;
            p.vy = 0;
          } else {
            const curDist = Math.hypot(p.x - p.homeX, p.y - p.homeY);
            if (curDist > MAX_DISPLACEMENT) {
              const ratio = MAX_DISPLACEMENT / curDist;
              p.x = p.homeX + (p.x - p.homeX) * ratio;
              p.y = p.homeY + (p.y - p.homeY) * ratio;
              p.vx *= 0.6;
              p.vy *= 0.6;
            }
          }

          // Densely packed ferro-cubes (small square particles)
          pCtx.fillRect(p.x, p.y, p.size, p.size);
        }

        requestAnimationFrame(renderDenseFerrofluid);
      }

      if (nameWrap) {
        nameWrap.addEventListener('mouseenter', (e) => {
          isMouseOverName = true;
          const rect = nameWrap.getBoundingClientRect();
          nameMouseX = e.clientX - rect.left;
          nameMouseY = e.clientY - rect.top;
          prevNameMouseX = nameMouseX;
          prevNameMouseY = nameMouseY;
        });

        nameWrap.addEventListener('mousemove', (e) => {
          isMouseOverName = true;
          const rect = nameWrap.getBoundingClientRect();
          const currentX = e.clientX - rect.left;
          const currentY = e.clientY - rect.top;
          nameMouseVx = currentX - prevNameMouseX;
          nameMouseVy = currentY - prevNameMouseY;
          prevNameMouseX = currentX;
          prevNameMouseY = currentY;
          nameMouseX = currentX;
          nameMouseY = currentY;
        });

        nameWrap.addEventListener('mouseleave', () => {
          isMouseOverName = false;
          nameMouseX = -10000;
          nameMouseY = -10000;
          prevNameMouseX = -10000;
          prevNameMouseY = -10000;
          nameMouseVx = 0;
          nameMouseVy = 0;
        });
      }

      document.fonts.ready.then(() => {
        if (document.fonts && document.fonts.load) {
          document.fonts.load("900 120px Anton").then(() => initDenseParticleTypography()).catch(() => initDenseParticleTypography());
        } else {
          initDenseParticleTypography();
        }
        requestAnimationFrame(renderDenseFerrofluid);
      });

      window.addEventListener('resize', () => {
        if (document.fonts.status === 'loaded') {
          initDenseParticleTypography();
        }
      }, { passive: true });
`;

const partStartIdx = html.indexOf(OLD_PARTICLES_START);
const partEndIdx = html.indexOf(OLD_PARTICLES_END);

if (partStartIdx !== -1 && partEndIdx !== -1) {
  html = html.substring(0, partStartIdx) + NEW_PARTICLES_BLOCK + '\n\n' + html.substring(partEndIdx);
  console.log('Hero Name ferrofluid particle simulation successfully updated!');
} else {
  console.error('Could not locate particle block boundaries in index.html!');
}

fs.writeFileSync('index.html', html);
console.log('index.html updated successfully with all precision corrections!');
