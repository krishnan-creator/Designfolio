const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Update Beyond The Frame CSS
const oldCssTarget = `    /* 2. BEYOND THE FRAME: CINEMATIC SHOWCASE REPLACEMENT */
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
    }`;

const newCssReplacement = `    /* 2. BEYOND THE FRAME: SCROLL STACK CINEMATIC ARCHIVE */
    .beyond-the-frame-zone {
      margin-top: 48px;
      width: 100%;
      border-radius: 20px;
      position: relative;
      background: var(--dbl-surface-matte);
      border: 1px solid var(--dbl-border-base);
      padding: clamp(24px, 4vw, 44px);
      box-sizing: border-box;
      overflow: visible;
    }`;

if (html.includes(oldCssTarget)) {
  html = html.replace(oldCssTarget, newCssReplacement);
  console.log('Updated .beyond-the-frame-zone CSS');
} else {
  console.log('WARNING: oldCssTarget not found');
}

// Update .beyond-the-frame-mount-container and .btf-stream-item
const oldBtfStyles = `    .btf-stream-item {
      font-family: var(--font-gondens, 'Barlow Condensed', 'Space Grotesk', sans-serif);
      font-size: clamp(26px, 3.4vw, 40px);
      font-weight: 900;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--dbl-text-primary);
      white-space: nowrap;
    }
    .btf-stream-sep {
      color: var(--dbl-crimson, #FF3038);
      font-size: 15px;
      opacity: 0.85;
    }
    @media (prefers-reduced-motion: reduce) {
      .btf-wordmark-stream {
        animation: none;
      }
    }
    .beyond-the-frame-mount-container {
      width: 100%;
      min-height: 500px;
      margin-top: 48px;
      margin-bottom: 24px;
      position: relative;
    }`;

const newBtfStyles = `    .btf-stream-item {
      font-family: var(--font-gondens, 'Barlow Condensed', 'Space Grotesk', sans-serif);
      font-size: clamp(12px, 1.3vw, 15px);
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--dbl-text-secondary);
      white-space: nowrap;
    }
    .btf-stream-sep {
      color: var(--dbl-crimson, #FF3038);
      font-size: 12px;
      opacity: 0.7;
    }
    @media (prefers-reduced-motion: reduce) {
      .btf-wordmark-stream {
        animation: none;
      }
    }
    .beyond-the-frame-mount-container {
      width: 100%;
      position: relative;
      margin-top: 14px;
      margin-bottom: 0;
      overflow: visible;
    }`;

if (html.includes(oldBtfStyles)) {
  html = html.replace(oldBtfStyles, newBtfStyles);
  console.log('Updated btf stream & mount container CSS');
} else {
  console.log('WARNING: oldBtfStyles not found');
}

// 2. Update Beyond The Frame Markup in HTML
const oldMarkupTarget = `          <!-- BEYOND THE FRAME (STACK DECK COMPONENT FROM CINE.TXT) -->
          <div class="beyond-the-frame-zone" id="beyond-the-frame-zone" data-media-slot="IMPACT_VIDEO">
            <div class="showcase-top-bar">
              <div class="showcase-tag">
                <span class="signal-dot"></span>
                <span>BEYOND THE FRAME // 5 CINEMATIC ENTRIES</span>
              </div>
              
              <!-- RESTRAINED SEAMLESS LOOPING SECTION WORDMARK -->
              <div class="btf-wordmark-stream-wrap" aria-label="BEYOND THE FRAME">
                <div class="btf-wordmark-stream">
                  <span class="btf-stream-item">BEYOND THE FRAME</span>
                  <span class="btf-stream-sep">✦</span>
                  <span class="btf-stream-item">BEYOND THE FRAME</span>
                  <span class="btf-stream-sep">✦</span>
                  <span class="btf-stream-item">BEYOND THE FRAME</span>
                  <span class="btf-stream-sep">✦</span>
                  <span class="btf-stream-item">BEYOND THE FRAME</span>
                  <span class="btf-stream-sep">✦</span>
                </div>
              </div>

              <p class="showcase-scope-statement">Visual explorations, synthetic film pipeline look-dev, and worldbuilding studies. Interactive 3D deck — drag or flick cards.</p>
            </div>

            <div id="beyond-the-frame-mount" class="beyond-the-frame-mount-container"></div>
            <div id="morph-slider-mount" style="display:none;" aria-hidden="true"></div>
          </div>`;

const newMarkupReplacement = `          <!-- BEYOND THE FRAME (SCROLL STACK CINEMATIC ARCHIVE) -->
          <div class="beyond-the-frame-zone" id="beyond-the-frame-zone" data-media-slot="IMPACT_VIDEO">
            <div class="btf-section-header-block">
              <div class="dbl-meta-label">
                <span class="dbl-meta-dot"></span>
                <span>BEYOND THE FRAME // 5 CINEMATIC ENTRIES</span>
              </div>
              <h2 class="dbl-title-main" style="margin-top: 4px; margin-bottom: 12px;">BEYOND THE FRAME</h2>
              <p class="dbl-subtitle-desc" style="max-width: 740px; margin-top: 0; margin-bottom: 18px;">
                Cinematic visual development, worldbuilding, character exploration, and synthetic production work across feature film pipelines.
              </p>

              <!-- RESTRAINED SECONDARY ANIMATED LOOPING WORDMARK -->
              <div class="btf-wordmark-stream-wrap" aria-label="BEYOND THE FRAME" style="opacity: 0.45; margin: 0 0 20px 0;">
                <div class="btf-wordmark-stream">
                  <span class="btf-stream-item">BEYOND THE FRAME</span>
                  <span class="btf-stream-sep">✦</span>
                  <span class="btf-stream-item">CINEMATIC ARCHIVE</span>
                  <span class="btf-stream-sep">✦</span>
                  <span class="btf-stream-item">WORLD BUILDING</span>
                  <span class="btf-stream-sep">✦</span>
                  <span class="btf-stream-item">LOOK-DEV</span>
                  <span class="btf-stream-sep">✦</span>
                  <span class="btf-stream-item">BEYOND THE FRAME</span>
                  <span class="btf-stream-sep">✦</span>
                  <span class="btf-stream-item">CINEMATIC ARCHIVE</span>
                  <span class="btf-stream-sep">✦</span>
                  <span class="btf-stream-item">WORLD BUILDING</span>
                  <span class="btf-stream-sep">✦</span>
                  <span class="btf-stream-item">LOOK-DEV</span>
                  <span class="btf-stream-sep">✦</span>
                </div>
              </div>
            </div>

            <div id="beyond-the-frame-mount" class="beyond-the-frame-mount-container"></div>
            <div id="morph-slider-mount" style="display:none;" aria-hidden="true"></div>
          </div>`;

if (html.includes(oldMarkupTarget)) {
  html = html.replace(oldMarkupTarget, newMarkupReplacement);
  console.log('Updated Beyond The Frame section markup');
} else {
  console.log('WARNING: oldMarkupTarget not found');
}

// 3. Update Hero Typography in initDenseParticleTypography()
const oldTypoTarget = `        // Bold display font with wide characters, open counters, and crisp letter separation
        const FONT_FAMILY = "'Space Grotesk', 'Montserrat', 'Syne', sans-serif";
        let fs1 = Math.round(Math.min(availableW * 0.118, 76));
        let fs2 = Math.round(Math.min(availableW * 0.116, 76));
        // Line 3 (PILLAI): slightly smaller (~62% of fs2) but bold and completely readable on one line
        let fs3 = Math.round(fs2 * 0.62);

        // Glyph thickness expansion factor: +30% apparent stroke weight via controlled contour stroke
        const strokeW1 = Math.max(2.2, Math.round(fs1 * 0.054));
        const strokeW2 = Math.max(2.2, Math.round(fs2 * 0.054));
        const strokeW3 = Math.max(2.0, Math.round(fs3 * 0.052));

        const track1 = Math.round(fs1 * 0.092); // Generous tracking so counters & gaps remain clear
        const track2 = Math.round(fs2 * 0.092);
        const track3 = Math.round(fs3 * 0.135); // Extra tracking for PILLAI so L-L never merge`;

const newTypoReplacement = `        // Modern bold sans-serif with unmistakable glyph shapes (Montserrat Black 900)
        const FONT_FAMILY = "'Montserrat', sans-serif";
        let fs1 = Math.round(Math.min(availableW * 0.114, 76));
        let fs2 = Math.round(Math.min(availableW * 0.112, 76));
        // Line 3 (PILLAI): unmistakable bold letters, proportional and clear (~74% of fs2)
        let fs3 = Math.round(fs2 * 0.74);

        // Clean contour definition: Montserrat 900 already provides strong, confident glyph weight.
        // Controlled 1.0px contour ensures counters in A, B, R, P remain open and crisp.
        const strokeW1 = 1.0;
        const strokeW2 = 1.0;
        const strokeW3 = 0.9;

        const track1 = Math.round(fs1 * 0.075);
        const track2 = Math.round(fs2 * 0.075);
        const track3 = Math.round(fs3 * 0.115);`;

if (html.includes(oldTypoTarget)) {
  html = html.replace(oldTypoTarget, newTypoReplacement);
  console.log('Updated Hero Typography font settings');
} else {
  console.log('WARNING: oldTypoTarget not found');
}

// Space character handling in renderTrackedGlyphs
const oldRenderTracked = `      function renderTrackedGlyphs(ctx, text, startX, y, extraSpacing, strokeW) {
        let curX = startX;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (strokeW && strokeW > 0) {
            ctx.lineWidth = strokeW;
            ctx.strokeStyle = '#ffffff';
            ctx.lineJoin = 'round';
            ctx.strokeText(char, curX, y);
          }
          ctx.fillText(char, curX, y);
          curX += ctx.measureText(char).width + extraSpacing;
        }
        return curX;
      }`;

const newRenderTracked = `      function renderTrackedGlyphs(ctx, text, startX, y, extraSpacing, strokeW) {
        let curX = startX;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === ' ') {
            curX += ctx.measureText(' ').width * 1.35 + extraSpacing;
            continue;
          }
          if (strokeW && strokeW > 0) {
            ctx.lineWidth = strokeW;
            ctx.strokeStyle = '#ffffff';
            ctx.lineJoin = 'round';
            ctx.strokeText(char, curX, y);
          }
          ctx.fillText(char, curX, y);
          curX += ctx.measureText(char).width + extraSpacing;
        }
        return curX;
      }`;

if (html.includes(oldRenderTracked)) {
  html = html.replace(oldRenderTracked, newRenderTracked);
  console.log('Updated renderTrackedGlyphs with space character spacing');
} else {
  console.log('WARNING: oldRenderTracked not found');
}

// 4. Update Background mounting in updateBackgroundAndCursor()
const oldBgTarget = `      // Mount GradientWaves from wave(1).txt for Light Theme
      if (bgMountLight && window.mountGradientWaves && !waveGridInstance) {
        waveGridInstance = window.mountGradientWaves(bgMountLight, {
          horizonColor: "#E7E5E1",
          waveColor: "#B8B7B3",
          crestColor: "#F7F6F3",
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
          mouseInteraction: false,
          parallaxStrength: 0,
          grain: false,
          grainIntensity: 0
        });
      }`;

const newBgReplacement = `      // Mount BackgroundCubesGrid for Light Theme (Nothing-inspired monochromatic cube grid)
      if (bgMountLight && window.mountBackgroundCubesGrid && !cubesGridInstance) {
        cubesGridInstance = window.mountBackgroundCubesGrid(bgMountLight, {
          cellSize: 120,
          gap: 0.03,
          topColor: "#F4F3F0",
          leftColor: "#E5E4E0",
          rightColor: "#D6D5D1",
          glowColor: "#A9A8A3",
          glow: 0.3,
          amplitude: 0.6,
          speed: 6.5,
          damping: 0.08,
          idleRipples: true,
          idleDelay: 2.0
        });
      }`;

if (html.includes(oldBgTarget)) {
  html = html.replace(oldBgTarget, newBgReplacement);
  console.log('Updated Light Theme background mounting to BackgroundCubesGrid');
} else {
  console.log('WARNING: oldBgTarget not found');
}

// Also replace waveGridInstance variable declaration with cubesGridInstance
html = html.replace('let waveGridInstance = null;', 'let cubesGridInstance = null;');

// 5. Remove window.initPostHeroParticleScroll() call from initAllMountedComponents()
const oldParticleInit = `    if (window.initPostHeroParticleScroll) {
      window.initPostHeroParticleScroll();
    }`;

if (html.includes(oldParticleInit)) {
  html = html.replace(oldParticleInit, '// Global Particle Scroll removed per Requirement 02');
  console.log('Removed post-hero particle scroll init call');
} else {
  console.log('WARNING: oldParticleInit not found');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('index.html updated successfully!');
