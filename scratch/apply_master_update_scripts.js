const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Update font and glyph rendering in initDenseParticleTypography()
html = html.replace(
  "const fontSpec1 = `900 ${fs1}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;\n        const fontSpec2 = `900 ${fs2}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;",
  "const fontSpec1 = `900 ${fs1}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;\n        const fontSpec2 = `900 ${fs2}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;"
);

html = html.replace(
  "probeCtx.font = `900 ${fs3}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;",
  "probeCtx.font = `900 ${fs3}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;"
);

html = html.replace(
  "offCtx.font = `900 ${fs1}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;",
  "offCtx.font = `900 ${fs1}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;"
);

html = html.replace(
  "offCtx.font = `900 ${fs2}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;",
  "offCtx.font = `900 ${fs2}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;"
);

html = html.replace(
  "offCtx.font = `900 ${fs3}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;",
  "offCtx.font = `900 ${fs3}px 'Anton', 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif`;"
);

// High-density sampling without gaps, preserving counters
html = html.replace(
  "const stepPx = Math.max(1, Math.round(dpr * (isMobile ? 1.0 : 0.85)));\n        const pSize = isMobile ? 1.45 : (isTablet ? 1.38 : 1.34);",
  "const stepPx = Math.max(1, Math.round(dpr * (isMobile ? 0.88 : 0.76)));\n        const pSize = isMobile ? 1.48 : (isTablet ? 1.40 : 1.36);"
);

// Font-load guarantee for Anton
html = html.replace(
  "initDenseParticleTypography();",
  "if (document.fonts && document.fonts.load) {\n        document.fonts.load(\"900 120px Anton\").then(() => initDenseParticleTypography()).catch(() => initDenseParticleTypography());\n      } else {\n        initDenseParticleTypography();\n      }"
);
console.log('1. Updated Anton font loading and ultra-dense particle sampling');

// 2. Add 10-Second Periodic Spider-Verse Glitch Trigger
const spiderGlitchScript = `
      // Periodic Spider-Verse-inspired CBK Header Glitch (every 10 seconds)
      const cbkWordmark = document.querySelector('.brand-cbk');
      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (cbkWordmark && !prefersReducedMotion) {
        function triggerCbkSpiderGlitch() {
          cbkWordmark.classList.remove('cbk-spider-glitch');
          void cbkWordmark.offsetWidth;
          cbkWordmark.classList.add('cbk-spider-glitch');
          setTimeout(() => {
            cbkWordmark.classList.remove('cbk-spider-glitch');
          }, 220);
        }
        setInterval(triggerCbkSpiderGlitch, 10000);
      }
`;

html = html.replace(
  "window.runGlyphLotteryOnChars = runGlyphLotteryOnChars;",
  "window.runGlyphLotteryOnChars = runGlyphLotteryOnChars;\n" + spiderGlitchScript
);
console.log('2. Injected 10-second Spider-Verse CBK glitch trigger');

// 3. Add Selected Works Expand/Collapse & Fullscreen Cinematic Lightbox functions
const selectedWorksScript = `
      // ============================================================
      // SELECTED WORKS: EXPANSION & CINEMATIC FULLSCREEN LIGHTBOX
      // ============================================================
      window.toggleSelectedWorksExpand = function() {
        const area = document.getElementById('works-expanded-area');
        const btnText = document.getElementById('works-toggle-text');
        const btnIcon = document.getElementById('works-toggle-icon');
        if (!area) return;

        const isCurrentlyExpanded = area.classList.contains('is-expanded');
        if (isCurrentlyExpanded) {
          area.classList.remove('is-expanded');
          area.classList.add('is-collapsed');
          if (btnText) btnText.textContent = 'SEE MORE (4 LANDSCAPES + 3 REELS)';
          if (btnIcon) btnIcon.style.transform = 'rotate(0deg)';
          const sec = document.getElementById('selected-works');
          if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          area.classList.remove('is-collapsed');
          area.classList.add('is-expanded');
          if (btnText) btnText.textContent = 'SHOW LESS';
          if (btnIcon) btnIcon.style.transform = 'rotate(180deg)';
        }
      };

      window.openCinematicLightbox = function(cardEl) {
        const modal = document.getElementById('selected-works-lightbox');
        const container = document.getElementById('lightbox-container');
        const titleEl = document.getElementById('lightbox-title');
        const subEl = document.getElementById('lightbox-sub');
        if (!modal || !container) return;

        const src = cardEl.getAttribute('data-video-src') || '';
        const title = cardEl.getAttribute('data-video-title') || 'CINEMATIC SHOWCASE';
        const sub = cardEl.getAttribute('data-video-sub') || 'Direct studio VFX & GenAI production pipeline';

        if (titleEl) titleEl.textContent = title;
        if (subEl) subEl.textContent = sub;

        // Check if src is video or image
        if (src.endsWith('.mp4') || src.endsWith('.webm')) {
          container.innerHTML = \`<video class="lightbox-video-player" src="\${src}" controls autoplay playsinline></video>\`;
        } else {
          container.innerHTML = \`<img src="\${src}" alt="\${title}" style="width:100%; max-height:78vh; object-fit:contain; display:block;">\`;
        }

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      };

      window.closeCinematicLightbox = function() {
        const modal = document.getElementById('selected-works-lightbox');
        const container = document.getElementById('lightbox-container');
        if (!modal) return;

        const video = container ? container.querySelector('video') : null;
        if (video) {
          try { video.pause(); } catch(e) {}
        }
        if (container) container.innerHTML = '';

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      };

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          window.closeCinematicLightbox();
        }
      });
`;

html = html.replace(
  "window.initMasterThemeAndEffects = function() {",
  selectedWorksScript + "\n\nwindow.initMasterThemeAndEffects = function() {"
);
console.log('3. Injected Selected Works expansion and cinematic lightbox modal logic');

// 4. Update Background Manager to WireTerrainScan (Dark and Light brittle terrain)
const oldBgManagerRegex = /let darkWavesInstance = null;[\s\S]*?\/\/ Mount Light Theme Hyperspeed[\s\S]*?if \(bgMount && window\.mountHyperspeed && !lightSpeedInstance\) {[\s\S]*?}\s*}\s*}/;
const newBgManager = `let wireTerrainInstance = null;
  let splashCursorInstance = null;

  function updateBackgroundAndCursor(theme) {
    const isDark = theme === 'dark';

    // Mount/update WireTerrainScan for Post-Hero Brittle Technical Terrain (Dark) or Porcelain Mineral (Light)
    if (bgMount && window.mountWireTerrainScan) {
      if (!wireTerrainInstance) {
        bgMount.innerHTML = '';
        wireTerrainInstance = window.mountWireTerrainScan(bgMount, {
          theme: isDark ? 'dark' : 'light',
          background: isDark ? '#08080A' : '#F6F5F2',
          lineColor: isDark ? '#404046' : '#C6C5C1',
          accent: isDark ? '#85858B' : '#A9A8A3',
          sunSize: 0,
          speed: isDark ? 46 : 32,
          density: isDark ? 98 : 85,
          dotSize: isDark ? 12 : 8
        });
      } else {
        wireTerrainInstance.update({
          theme: isDark ? 'dark' : 'light',
          background: isDark ? '#08080A' : '#F6F5F2',
          lineColor: isDark ? '#404046' : '#C6C5C1',
          accent: isDark ? '#85858B' : '#A9A8A3',
          sunSize: 0,
          speed: isDark ? 46 : 32,
          density: isDark ? 98 : 85,
          dotSize: isDark ? 12 : 8
        });
      }
    }

    // Post-Hero Dark Theme Fluid Mouse Interaction (SplashCursor preserved, violet #A855F7)
    if (isDark) {
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
      if (splashCursorInstance) {
        try { splashCursorInstance.unmount(); } catch (e) {}
        splashCursorInstance = null;
      }
      if (splashMount) splashMount.innerHTML = '';
    }
  }`;

if (oldBgManagerRegex.test(html)) {
  html = html.replace(oldBgManagerRegex, newBgManager);
  console.log('4. Updated Background Manager to WireTerrainScan for dark & light brittle terrain');
} else {
  console.warn('Could not match oldBgManagerRegex');
}

// 5. Update Adaptive Cursor in mousemove handler
const oldCursorMoveRegex = /cursorEl\.style\.transform = `translate3d\(\$\{mouseX\}px, \$\{mouseY\}px, 0\);[\s\S]*?const target = document\.elementFromPoint\(e\.clientX, e\.clientY\);/;
const newCursorMove = `cursorEl.style.transform = \`translate3d(\${mouseX}px, \${mouseY}px, 0)\`;

      // Mandatory White Pointer in Hero
      const heroSec = document.getElementById('hero-section');
      const inHero = heroSec && e.clientY <= heroSec.getBoundingClientRect().bottom;
      if (inHero) {
        cursorEl.classList.add('is-in-hero');
        cursorEl.classList.remove('cursor-fill-dark', 'cursor-fill-light');
      } else {
        cursorEl.classList.remove('is-in-hero');
      }

      const target = document.elementFromPoint(e.clientX, e.clientY);

      // TRUE ADAPTIVE CURSOR: Sample local element contrast and set full fill color
      if (!inHero && target) {
        let cur = target;
        let bgRgb = null;
        while (cur && cur !== document.documentElement) {
          const c = window.getComputedStyle(cur).backgroundColor;
          const match = c.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
          if (match) {
            const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
            if (alpha > 0.15) {
              bgRgb = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
              break;
            }
          }
          cur = cur.parentElement;
        }
        if (!bgRgb) {
          const curTheme = getCurrentTheme();
          bgRgb = curTheme === 'light' ? [244, 242, 238] : [11, 11, 13];
        }
        const lum = (0.2126 * bgRgb[0] + 0.7152 * bgRgb[1] + 0.0722 * bgRgb[2]) / 255;
        if (lum > 0.48) {
          cursorEl.classList.add('cursor-fill-dark');
          cursorEl.classList.remove('cursor-fill-light');
        } else {
          cursorEl.classList.add('cursor-fill-light');
          cursorEl.classList.remove('cursor-fill-dark');
        }
      }`;

if (oldCursorMoveRegex.test(html)) {
  html = html.replace(oldCursorMoveRegex, newCursorMove);
  console.log('5. Updated True Adaptive Cursor contrast sampling');
} else {
  console.warn('Could not match oldCursorMoveRegex');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully applied all master update scripts to index.html!');
