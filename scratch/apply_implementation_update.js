const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add Hero Reveal CSS and Page-End Spacing CSS and Beyond The Frame CSS
const customCss = `
    /* ============================================================
       CBK DESIGNFOLIO — IMPLEMENTATION UPDATE STYLES
       ============================================================ */

    /* 1. HERO REVEAL ANIMATION IMMEDIATELY AFTER GLITCH */
    .hero-cinematic-revealing {
      animation: heroCinematicReveal 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes heroCinematicReveal {
      0% {
        opacity: 0;
        clip-path: polygon(0 2%, 100% 2%, 100% 98%, 0 98%);
        transform: translateY(8px);
      }
      100% {
        opacity: 1;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        transform: translateY(0);
      }
    }

    /* 2. BEYOND THE FRAME: CINEMATIC SHOWCASE REPLACEMENT */
    .beyond-the-frame-zone {
      margin-top: 48px;
      width: 100%;
      border-radius: 16px;
      position: relative;
      background: var(--dbl-surface-matte);
      border: 1px solid var(--dbl-border-base);
      padding: clamp(20px, 3vw, 36px);
      box-sizing: border-box;
      overflow: hidden;
    }
    [data-theme="light"] .beyond-the-frame-zone {
      background: #FFFFFF;
      border-color: rgba(0, 0, 0, 0.12);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .beyond-the-frame-mount-container {
      width: 100%;
      min-height: 420px;
      margin-top: 24px;
      position: relative;
    }

    /* 3. POST-HERO BEND SCROLL: SECTION PERSPECTIVE FOLDING */
    .post-hero-bend-viewport {
      perspective: 850px;
      perspective-origin: 50% 50%;
    }
    .dbl-section-wrap section {
      transform-style: preserve-3d;
      will-change: transform;
    }

    /* 4. CLEAN PAGE-END SPACING: NO BLANK VIEWPORT GAP */
    .closing-build-section {
      margin-bottom: 0 !important;
      padding-bottom: 0 !important;
    }
    .site-footer-strip {
      margin-top: 32px !important;
      padding: 18px 0 24px 0 !important;
    }
    .dbl-content-container {
      padding-bottom: 24px !important;
    }
`;

html = html.replace('</head>', `  <style>${customCss}\n  </style>\n</head>`);

// 2. Replace Cinematic Showcase markup with BEYOND THE FRAME
const oldShowcaseMarkup = `          <!-- CINEMATIC SHOWCASE (MORPHSLIDER: RAMAYANA & VEERABHADRA) -->
          <div class="cinematic-showcase-zone" data-media-slot="IMPACT_VIDEO">
            <div class="showcase-top-bar">
              <div class="showcase-tag">
                <span class="signal-dot"></span>
                <span>CINEMATIC SHOWCASE // 4 SELECTED PROJECT CONTEXTS</span>
              </div>
              <p class="showcase-scope-statement">Selected studio-film visual-development explorations and limited-scope contributions, alongside independent cinematic work. Scope varied by project.</p>
            </div>

            <div id="morph-slider-mount" class="morph-slider-mount-container"></div>
          </div>`;

const newBeyondFrameMarkup = `          <!-- BEYOND THE FRAME (STACK DECK COMPONENT FROM CINE.TXT) -->
          <div class="beyond-the-frame-zone" id="beyond-the-frame-zone" data-media-slot="IMPACT_VIDEO">
            <div class="showcase-top-bar">
              <div class="showcase-tag">
                <span class="signal-dot"></span>
                <span>BEYOND THE FRAME // 5 CINEMATIC ENTRIES</span>
              </div>
              <p class="showcase-scope-statement">Visual explorations, synthetic film pipeline look-dev, and worldbuilding studies. Interactive 3D deck — drag or flick cards.</p>
            </div>

            <div id="beyond-the-frame-mount" class="beyond-the-frame-mount-container"></div>
            <div id="morph-slider-mount" style="display:none;" aria-hidden="true"></div>
          </div>`;

html = html.replace(oldShowcaseMarkup, newBeyondFrameMarkup);

// 3. Update Hero Glitch Finish to trigger Hero Cinematic Reveal
html = html.replace(
  `          // Release EXR playback to advance smoothly 01 -> 38, then pause at frame 38
          if (window.releaseHeroExrPlayback) {
            window.releaseHeroExrPlayback();
          }`,
  `          // Smooth coordinated cinematic reveal of Hero composition immediately after glitch
          const heroEl = document.getElementById('hero-viewport') || document.getElementById('hero-section');
          if (heroEl) {
            heroEl.classList.add('hero-cinematic-revealing');
          }

          // Release EXR playback to advance smoothly 01 -> 38, then pause at frame 38
          if (window.releaseHeroExrPlayback) {
            window.releaseHeroExrPlayback();
          }`
);

// 4. Update Background and BeyondTheFrame in window.initMasterThemeAndEffects
html = html.replace(
  `      // Mount WaveGridBackground from light.txt
      if (bgMount && window.mountWaveGridBackground && !waveGridInstance) {
        bgMount.innerHTML = '';
        waveGridInstance = window.mountWaveGridBackground(bgMount, {
          colorBase: "#F2F1EE",
          colorHigh: "#74767B",
          waveAmplitude: 0.18,
          waveSpeed: 4.2,
          waveFrequency: 1.1,
          waveWidth: 3.0,
          waveMaxHeight: 0.22,
          waveJitter: 0.08,
          gridSize: 40,
          autoAnimate: true,
          vignette: false
        });
      }`,
  `      // Mount GradientWaves from wave.txt for Light Theme
      if (bgMount && window.mountGradientWaves && !waveGridInstance) {
        bgMount.innerHTML = '';
        waveGridInstance = window.mountGradientWaves(bgMount, {
          horizonColor: "#E6E5E1",
          waveColor: "#B8B7B3",
          crestColor: "#FDFDFC",
          speed: 0.32,
          amplitude: 2.0,
          waveScale: 0.65,
          waveRatio: 0.9,
          swell: 24,
          turbulence: 12,
          tilt: 1.11,
          zoom: 1.0,
          height: 5.5,
          fogDepth: 15,
          detail: "medium",
          brightness: 0.78,
          opacity: 0.48,
          mouseInteraction: true,
          parallaxStrength: 0.18,
          grain: false,
          grainIntensity: 0
        });
      }`
);

// 5. Replace MorphSlider init with BeyondTheFrame init
html = html.replace(
  `  // 3. Mount MorphSlider for By the Numbers Cinematic Showcase
  let morphSliderInstance = null;
  function initMorphShowcase() {
    if (morphMount && window.mountMorphSlider && !morphSliderInstance) {
      morphSliderInstance = window.mountMorphSlider(morphMount, {
        items: [
          {
            image: "Ramayana.png",
            caption: "RAMAYANA"
          },
          {
            image: "VeerBhadra.png",
            caption: "VEERABHADRA"
          }
        ],
        startIndex: 0,
        transition: "melt",
        duration: 1.2,
        ease: "power2.inOut",
        intensity: 0.55,
        scale: 2.4,
        aberration: 0.25,
        drift: 0.4,
        autoplay: true,
        autoplayDelay: 6,
        loop: true,
        radius: 12,
        overlayColor: "rgba(0,0,0,0.25)",
        showCaptions: true,
        showControls: true,
        showIndicators: true
      });
    }
  }`,
  `  // 3. Mount BeyondTheFrame (cine.txt Stack component with 5 local cinematic cards)
  let beyondFrameInstance = null;
  function initBeyondTheFrame() {
    const beyondMount = document.getElementById('beyond-the-frame-mount');
    if (beyondMount && window.mountBeyondTheFrame && !beyondFrameInstance) {
      beyondFrameInstance = window.mountBeyondTheFrame(beyondMount, {
        theme: getCurrentTheme()
      });
    }
  }`
);

html = html.replace('initMorphShowcase();', 'initBeyondTheFrame();');

// 6. Add Post-Hero Bend Scroll Controller
const bendScrollScript = `
  // Post-Hero Section 3D Rounded Perspective Folding Scroll Controller
  (() => {
    const mainWrap = document.getElementById('main-content');
    if (!mainWrap) return;

    let ticking = false;
    const zone = 150;
    const maxAngle = 18; // soft, rounded folding without distortion
    const perspective = 850;

    function applyPostHeroBend() {
      ticking = false;
      const sections = mainWrap.querySelectorAll('section');
      const vh = window.innerHeight;

      sections.forEach(sec => {
        // Skip hero
        if (sec.id === 'hero-section') return;
        const rect = sec.getBoundingClientRect();
        
        // Top fold check
        if (rect.top < zone && rect.bottom > 0) {
          const ratio = Math.max(0, Math.min(1, (zone - rect.top) / zone));
          const fold = ratio * maxAngle;
          sec.style.transform = \`perspective(\${perspective}px) rotateX(\${fold}deg)\`;
          sec.style.transformOrigin = '50% 100%';
          sec.style.transition = 'transform 0.12s ease-out';
        } else if (rect.bottom > vh - zone && rect.top < vh) {
          // Bottom fold check
          const ratio = Math.max(0, Math.min(1, (rect.bottom - (vh - zone)) / zone));
          const fold = -ratio * maxAngle;
          sec.style.transform = \`perspective(\${perspective}px) rotateX(\${fold}deg)\`;
          sec.style.transformOrigin = '50% 0%';
          sec.style.transition = 'transform 0.12s ease-out';
        } else {
          sec.style.transform = 'none';
        }
      });
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(applyPostHeroBend);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', applyPostHeroBend, { passive: true });
    setTimeout(applyPostHeroBend, 800);
  })();
`;

html = html.replace('window.initMasterThemeAndEffects();', `window.initMasterThemeAndEffects();\n${bendScrollScript}`);

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html successfully updated with Implementation Update!');
