const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. REBUILD PARTICLE TYPOGRAPHY & FERROFLUID EXCLUSION HOLE PHYSICS
const oldParticleBlockRegex = /\/\/ ============================================================\s*\n\s*\/\/ 6\. HERO DENSE FERROFLUID PARTICLE TYPOGRAPHY ENGINE[\s\S]*?requestAnimationFrame\(renderDenseFerrofluid\);\s*\n\s*\}\);/;

const newParticleBlock = `// ============================================================
      // 6. HERO DENSE FERROFLUID PARTICLE TYPOGRAPHY ENGINE (REQUIREMENTS 1 & 2)
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
      let nameFormationProgress = 0; // 0 to 1
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

      function initDenseParticleTypography() {
        if (!pCanvas || !pCtx || !nameWrap) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = nameWrap.getBoundingClientRect();
        nameCanvasWidth = Math.round(Math.max(rect.width || 780, 720));

        // 1. Measure and calculate glyph dimensions using bold condensed Anton typography
        const probe = document.createElement('canvas');
        const probeCtx = probe.getContext('2d');

        let availableW = Math.min(nameCanvasWidth - 16, 740);
        let fs1 = Math.round(Math.min(availableW * 0.148, 88));
        let fs2 = Math.round(Math.min(availableW * 0.205, 120));
        // Line 3 (PILLAI): approximately 42-45% of line 2 size, left-aligned with line 2
        let fs3 = Math.round(fs2 * 0.44);

        const fontSpec1 = \`900 \${fs1}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;
        const fontSpec2 = \`900 \${fs2}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;

        probeCtx.font = fontSpec1;
        let w1 = probeCtx.measureText(LINE1_TEXT).width;
        if (w1 > availableW) {
          fs1 = Math.floor(fs1 * (availableW / w1) * 0.98);
        }

        probeCtx.font = fontSpec2;
        let w2 = probeCtx.measureText(LINE2_TEXT).width;
        if (w2 > availableW) {
          fs2 = Math.floor(fs2 * (availableW / w2) * 0.98);
          fs3 = Math.round(fs2 * 0.44);
        }

        probeCtx.font = \`900 \${fs3}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;
        let w3 = probeCtx.measureText(LINE3_TEXT).width;
        if (w3 > availableW) {
          fs3 = Math.floor(fs3 * (availableW / w3) * 0.98);
        }

        // Strict left alignment: start at 2px so strokes don't touch canvas edge
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

        // 2. Offscreen mask canvas rendered with bold, high-contrast, gap-free glyphs
        const off = document.createElement('canvas');
        off.width = Math.round(nameCanvasWidth * dpr);
        off.height = Math.round(nameCanvasHeight * dpr);
        const offCtx = off.getContext('2d');
        offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        offCtx.clearRect(0, 0, nameCanvasWidth, nameCanvasHeight);

        offCtx.fillStyle = '#ffffff';
        offCtx.textBaseline = 'top';

        offCtx.font = \`900 \${fs1}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;
        offCtx.fillText(LINE1_TEXT, paddingX, l1Y);

        offCtx.font = \`900 \${fs2}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;
        offCtx.fillText(LINE2_TEXT, paddingX, l2Y);

        offCtx.font = \`900 \${fs3}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;
        offCtx.fillText(LINE3_TEXT, paddingX, l3Y);

        const imgData = offCtx.getImageData(0, 0, off.width, off.height).data;
        nameParticles = [];

        // Dense, tightly packed particle field: pure white particles only, DPR-aware sampling
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        const stepPx = Math.max(1, Math.round(dpr * (isMobile ? 0.88 : 0.74)));
        const pSize = isMobile ? 1.52 : (isTablet ? 1.44 : 1.38);

        for (let py = 0; py < off.height; py += stepPx) {
          for (let px = 0; px < off.width; px += stepPx) {
            const idx = (py * off.width + px) * 4;
            if (imgData[idx + 3] > 32) {
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
                dispersion: 0.70 + Math.random() * 0.60,
                color: '#FFFFFF'
              });
            }
          }
        }

        particleEngineInitialized = true;
        window.nameParticles = nameParticles;
      }

      function animateFormationStep() {
        if (nameFormationProgress < 1) {
          nameFormationProgress += 0.024;
          if (nameFormationProgress >= 1) {
            nameFormationProgress = 1;
          }
        }
      }

      function renderDenseFerrofluid() {
        if (!particleEngineInitialized || !pCtx) {
          requestAnimationFrame(renderDenseFerrofluid);
          return;
        }

        animateFormationStep();
        pCtx.clearRect(0, 0, nameCanvasWidth, nameCanvasHeight);

        // Smooth name mouse velocity with damping
        nameMouseVx *= 0.86;
        nameMouseVy *= 0.86;
        const mouseSpeed = Math.hypot(nameMouseVx, nameMouseVy);

        // Broad, smooth circular repulsion field with pronounced circular void (Requirement 2)
        const VOID_RADIUS = 66.0;
        const REPULSION_RADIUS = Math.min(240.0, Math.max(190.0, nameCanvasWidth * 0.34));
        const speedBoost = 1.0 + Math.min(mouseSpeed * 0.04, 0.50);
        const SPRING_K = nameFormationProgress < 1 ? 0.088 : 0.078;
        const MAX_DISPLACEMENT = 96.0;

        // 1. Ferrofluid radial repulsion with visible exclusion hole and dense surrounding ring
        if (isMouseOverName && !themeWaveActive && nameMouseX > -500) {
          for (let i = 0; i < nameParticles.length; i++) {
            const p = nameParticles[i];
            const dx = p.x - nameMouseX;
            const dy = p.y - nameMouseY;
            const dist = Math.hypot(dx, dy);

            if (dist < REPULSION_RADIUS && dist > 0.001) {
              const angle = Math.atan2(dy, dx);

              if (dist < VOID_RADIUS) {
                // INSIDE EXCLUSION HOLE: Strong radial clearing force creating distinct circular void
                const voidPush = (1.0 - dist / VOID_RADIUS) * 11.0 + 6.0;
                p.vx += Math.cos(angle) * voidPush * speedBoost;
                p.vy += Math.sin(angle) * voidPush * speedBoost;
              } else {
                // OUTSIDE VOID: Dense ring compression + ripple wave propagation
                const ringDist = dist - VOID_RADIUS;
                const ringSpan = REPULSION_RADIUS - VOID_RADIUS;
                const norm = ringDist / ringSpan;
                const compression = Math.exp(-norm * 2.8) * 4.6;
                const ripple = Math.sin(norm * Math.PI * 2.5) * 0.40;
                const pushForce = (compression + ripple) * speedBoost * p.dispersion;

                p.vx += Math.cos(angle) * pushForce;
                p.vy += Math.sin(angle) * pushForce;

                // Subtle ferrofluid swirl along mouse velocity vector
                if (mouseSpeed > 0.4) {
                  const swirl = Math.sin(norm * Math.PI) * 0.35;
                  p.vx += -Math.sin(angle) * swirl * Math.sign(nameMouseVx || 1);
                  p.vy += Math.cos(angle) * swirl * Math.sign(nameMouseVy || 1);
                }
              }
            }
          }
        }

        // 2. Hero theme ripple wave physics (smooth circular travelling wave across all 3 lines)
        if (themeWaveActive) {
          const elapsed = performance.now() - themeWaveStartTime;
          const WAVE_DURATION = 2100; // 2.1s slow and elegant fluid-glass wavefront
          const progress = elapsed / WAVE_DURATION;

          if (progress >= 1.0) {
            themeWaveActive = false;
          } else {
            const rect = nameWrap.getBoundingClientRect();
            const localOx = themeWaveOriginX - rect.left;
            const localOy = themeWaveOriginY - rect.top;
            const maxDist = Math.hypot(nameCanvasWidth - localOx, nameCanvasHeight - localOy) + 320;
            const waveRadius = Math.pow(progress, 0.94) * maxDist;
            const waveWidth = 160.0;
            const envelopeTime = Math.sin(progress * Math.PI);
            const waveAmp = envelopeTime * 22.0;

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
                const shimmer = Math.sin((dist * 0.035) - (progress * 12.0)) * 0.35;
                p.vx += Math.cos(angle + shimmer) * force * 0.38;
                p.vy += Math.sin(angle + shimmer) * force * 0.38;
              }
            }
          }
        }

        // 3. Particle simulation loop: Hooke's Law spring return and damping
        for (let i = 0; i < nameParticles.length; i++) {
          const p = nameParticles[i];

          // Hooke's Law Spring attraction back to exact home coordinates
          const homeDx = p.homeX - p.x;
          const homeDy = p.homeY - p.y;
          const distToHome = Math.hypot(homeDx, homeDy);

          p.vx += homeDx * SPRING_K;
          p.vy += homeDy * SPRING_K;

          // Natural return with velocity damping and zero jitter
          const damping = distToHome < 3.0 ? 0.74 : 0.84;
          p.vx *= damping;
          p.vy *= damping;
          p.x += p.vx;
          p.y += p.vy;

          if (distToHome < 0.28 && Math.hypot(p.vx, p.vy) < 0.06) {
            // Exact glyph reconstruction: pristine letters
            p.x = p.homeX;
            p.y = p.homeY;
            p.vx = 0;
            p.vy = 0;
          } else {
            // Maximum displacement ceiling to preserve outer letter silhouette
            const curDist = Math.hypot(p.x - p.homeX, p.y - p.homeY);
            if (curDist > MAX_DISPLACEMENT) {
              const ratio = MAX_DISPLACEMENT / curDist;
              p.x = p.homeX + (p.x - p.homeX) * ratio;
              p.y = p.homeY + (p.y - p.homeY) * ratio;
              p.vx *= 0.55;
              p.vy *= 0.55;
            }
          }

          pCtx.fillStyle = '#FFFFFF';
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
      });`;

if (oldParticleBlockRegex.test(html)) {
  html = html.replace(oldParticleBlockRegex, newParticleBlock);
  console.log('1. Updated Hero Particle Typography & Ferrofluid repulsion physics engine.');
} else {
  console.warn('Could not match oldParticleBlockRegex');
}

// 2. REBUILD SELECTED WORKS EXPANSION & MEDIUM VIDEO PLAYER CONTROLS
const oldWorksFunctionsRegex = /window\.toggleSelectedWorksExpand\s*=\s*function\(\)[\s\S]*?document\.addEventListener\('keydown',\s*\(e\)\s*=>\s*\{[\s\S]*?\}\);/;

const newWorksFunctions = `let currentActiveVideo = null;
      let savedScrollPosition = 0;

      window.toggleSelectedWorksExpand = function() {
        const area = document.getElementById('works-expanded-area');
        const btnText = document.getElementById('works-toggle-text');
        const btnIcon = document.getElementById('works-toggle-icon');
        if (!area) return;

        const isCollapsed = area.classList.contains('is-collapsed');
        if (isCollapsed) {
          area.classList.remove('is-collapsed');
          if (btnText) btnText.textContent = 'SHOW LESS';
          if (btnIcon) btnIcon.style.transform = 'rotate(180deg)';
        } else {
          area.classList.add('is-collapsed');
          if (btnText) btnText.textContent = 'SEE MORE (4 LANDSCAPES + 3 REELS)';
          if (btnIcon) btnIcon.style.transform = 'rotate(0deg)';
          const worksSec = document.getElementById('selected-works');
          if (worksSec) {
            worksSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      };

      // Requirement 7.3: Open centered medium player preserving scroll position
      window.openCinematicLightbox = function(cardEl) {
        const modal = document.getElementById('selected-works-lightbox');
        const container = document.getElementById('lightbox-container');
        const titleEl = document.getElementById('lightbox-title');
        const subEl = document.getElementById('lightbox-sub');
        if (!modal || !container) return;

        savedScrollPosition = window.scrollY;

        const src = cardEl.getAttribute('data-video-src') || '';
        const title = cardEl.getAttribute('data-video-title') || 'CINEMATIC SHOWCASE';
        const sub = cardEl.getAttribute('data-video-sub') || 'Studio VFX & GenAI production pipeline';

        if (titleEl) titleEl.textContent = title;
        if (subEl) subEl.textContent = sub;

        // Check if src is video or image
        if (src.endsWith('.mp4') || src.endsWith('.webm')) {
          container.innerHTML = \`<video id="active-medium-video" class="lightbox-video-player" src="\${src}" autoplay playsinline></video>\`;
          const video = document.getElementById('active-medium-video');
          currentActiveVideo = video;
          attachVideoControlListeners(video);
        } else {
          container.innerHTML = \`<img src="\${src}" alt="\${title}" style="width:100%; height:100%; object-fit:contain; display:block;">\`;
          currentActiveVideo = null;
        }

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      };

      function attachVideoControlListeners(video) {
        if (!video) return;
        const playIcon = document.getElementById('play-icon');
        const pauseIcon = document.getElementById('pause-icon');
        const seekSlider = document.getElementById('player-seek-bar');
        const seekFill = document.getElementById('player-seek-fill');
        const timeDisplay = document.getElementById('player-time-display');

        const formatTime = (sec) => {
          const m = Math.floor(sec / 60);
          const s = Math.floor(sec % 60);
          return \`\${m < 10 ? '0' : ''}\${m}:\${s < 10 ? '0' : ''}\${s}\`;
        };

        video.addEventListener('timeupdate', () => {
          if (!video.duration) return;
          const pct = (video.currentTime / video.duration) * 100;
          if (seekSlider) seekSlider.value = pct;
          if (seekFill) seekFill.style.width = \`\${pct}%\`;
          if (timeDisplay) {
            timeDisplay.textContent = \`\${formatTime(video.currentTime)} / \${formatTime(video.duration)}\`;
          }
        });

        video.addEventListener('play', () => {
          if (playIcon) playIcon.style.display = 'none';
          if (pauseIcon) pauseIcon.style.display = 'block';
        });

        video.addEventListener('pause', () => {
          if (playIcon) playIcon.style.display = 'block';
          if (pauseIcon) pauseIcon.style.display = 'none';
        });
      }

      window.togglePlayerPlay = function() {
        if (!currentActiveVideo) return;
        if (currentActiveVideo.paused) {
          currentActiveVideo.play();
        } else {
          currentActiveVideo.pause();
        }
      };

      window.skipPlayer = function(sec) {
        if (!currentActiveVideo) return;
        currentActiveVideo.currentTime = Math.min(currentActiveVideo.duration || 100, currentActiveVideo.currentTime + sec);
      };

      window.handlePlayerSeek = function(val) {
        if (!currentActiveVideo || !currentActiveVideo.duration) return;
        currentActiveVideo.currentTime = (val / 100) * currentActiveVideo.duration;
      };

      window.togglePlayerMute = function() {
        if (!currentActiveVideo) return;
        currentActiveVideo.muted = !currentActiveVideo.muted;
        const on = document.getElementById('vol-icon-on');
        const off = document.getElementById('vol-icon-off');
        if (on && off) {
          on.style.display = currentActiveVideo.muted ? 'none' : 'block';
          off.style.display = currentActiveVideo.muted ? 'block' : 'none';
        }
      };

      window.handlePlayerVolume = function(val) {
        if (!currentActiveVideo) return;
        currentActiveVideo.volume = parseFloat(val);
        currentActiveVideo.muted = false;
        const on = document.getElementById('vol-icon-on');
        const off = document.getElementById('vol-icon-off');
        if (on && off) {
          on.style.display = 'block';
          off.style.display = 'none';
        }
      };

      // Requirement 7.4: True fullscreen mode with clear X button and playback controls
      window.togglePlayerFullscreen = function() {
        const card = document.getElementById('medium-player-card');
        if (!card) return;
        if (!document.fullscreenElement) {
          if (card.requestFullscreen) {
            card.requestFullscreen();
          } else if (card.webkitRequestFullscreen) {
            card.webkitRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      };

      window.handleLightboxBackdropClick = function(event) {
        // Clicking outside video card closes medium player and restores page position
        if (event.target && event.target.id === 'selected-works-lightbox') {
          window.closeCinematicLightbox();
        }
      };

      window.closeCinematicLightbox = function() {
        const modal = document.getElementById('selected-works-lightbox');
        const container = document.getElementById('lightbox-container');
        if (!modal) return;

        if (document.fullscreenElement) {
          try { document.exitFullscreen(); } catch (e) {}
        }

        if (currentActiveVideo) {
          try { currentActiveVideo.pause(); } catch(e) {}
          currentActiveVideo = null;
        }
        if (container) container.innerHTML = '';

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');

        // Restore exact scroll position
        window.scrollTo({ top: savedScrollPosition, behavior: 'auto' });
      };

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            window.closeCinematicLightbox();
          }
        }
      });`;

if (oldWorksFunctionsRegex.test(html)) {
  html = html.replace(oldWorksFunctionsRegex, newWorksFunctions);
  console.log('2. Updated Selected Works expansion logic and Medium Video Player controller.');
} else {
  console.warn('Could not match oldWorksFunctionsRegex');
}

// 3. UPDATE BACKGROUND LIFECYCLE: WaveGridBackground in light theme, WireTerrainScan + SplashCursor in dark theme
const oldBgLifecycleRegex = /\/\/ 2\. Background and Fluid Cursor Lifecycle Manager[\s\S]*?let wireTerrainInstance = null;[\s\S]*?function updateBackgroundAndCursor\(theme\) \{[\s\S]*?\}\s*\}\s*\n\s*\}/;

const newBgLifecycle = `// 2. Background and Fluid Cursor Lifecycle Manager (Post-Hero Only)
  let wireTerrainInstance = null;
  let waveGridInstance = null;
  let splashCursorInstance = null;

  function updateBackgroundAndCursor(theme) {
    const isDark = theme === 'dark';

    if (isDark) {
      // 1. Clean up light theme WaveGridBackground
      if (waveGridInstance) {
        try { waveGridInstance.unmount(); } catch (e) {}
        waveGridInstance = null;
      }

      // 2. Strictly preserve dark theme WireTerrainScan background
      if (bgMount && window.mountWireTerrainScan) {
        if (!wireTerrainInstance) {
          bgMount.innerHTML = '';
          wireTerrainInstance = window.mountWireTerrainScan(bgMount, {
            theme: 'dark',
            background: '#08080A',
            lineColor: '#404046',
            accent: '#85858B',
            sunSize: 0,
            speed: 46,
            density: 98,
            dotSize: 12
          });
        }
      }

      // 3. Strictly preserve dark theme SplashCursor fluid mouse interaction (violet #A855F7)
      if (splashMount && window.mountSplashCursor && !splashCursorInstance) {
        splashMount.innerHTML = '';
        splashCursorInstance = window.mountSplashCursor(splashMount, {
          DENSITY_DISSIPATION: 3.5,
          VELOCITY_DISSIPATION: 2,
          PRESSURE: 0.1,
          CURL: 3,
          SPLAT_RADIUS: 0.2,
          SPLAT_FORCE: 6000,
          COLOR_UPDATE_SPEED: 10,
          SHADING: true,
          RAINBOW_MODE: false,
          COLOR: "#A855F7"
        });
      }
    } else {
      // LIGHT THEME (REQUIREMENT 10):
      // Clean up dark theme background and cursor
      if (wireTerrainInstance) {
        try { wireTerrainInstance.unmount(); } catch (e) {}
        wireTerrainInstance = null;
      }
      if (splashCursorInstance) {
        try { splashCursorInstance.unmount(); } catch (e) {}
        splashCursorInstance = null;
      }
      if (splashMount) splashMount.innerHTML = '';

      // Mount WaveGridBackground from light.txt
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
      }
    }
  }`;

if (oldBgLifecycleRegex.test(html)) {
  html = html.replace(oldBgLifecycleRegex, newBgLifecycle);
  console.log('3. Updated Background Lifecycle: WaveGridBackground in light mode, WireTerrainScan + SplashCursor in dark mode.');
} else {
  console.warn('Could not match oldBgLifecycleRegex');
}

// 4. ADD FLUID GLASS BUTTON HIGHLIGHT TRACKER TO DOMContentLoaded
const fluidGlassInitCode = `
  // Universal FluidGlass button specular refraction tracking (Requirement 12)
  const fgSelector = '.btn, .contact-btn, .build-action-btn, .resume-download-btn, .works-toggle-btn, .works-play-btn, .theme-toggle-btn, .player-btn, .lightbox-close-btn, .career-node-item, .curiosity-stack-card';
  document.addEventListener('pointermove', (e) => {
    const btn = e.target.closest(fgSelector);
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      btn.style.setProperty('--fg-x', \`\${x}px\`);
      btn.style.setProperty('--fg-y', \`\${y}px\`);
    }
  }, { passive: true });
`;

if (!html.includes('Universal FluidGlass button specular refraction tracking')) {
  html = html.replace('if (window.initMasterThemeAndEffects) window.initMasterThemeAndEffects();', 'if (window.initMasterThemeAndEffects) window.initMasterThemeAndEffects();\n' + fluidGlassInitCode);
  console.log('4. Injected universal FluidGlass button pointer tracking.');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Saved index.html stage 2.');
