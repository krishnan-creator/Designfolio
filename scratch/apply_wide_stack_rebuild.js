const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Replace CSS block for Beyond The Frame
const oldCssBlock = `    /* 2. BEYOND THE FRAME: SCROLL STACK CINEMATIC ARCHIVE */
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
    }
    [data-theme="light"] .beyond-the-frame-zone {
      background: #FFFFFF;
      border-color: rgba(0, 0, 0, 0.12);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .btf-wordmark-stream-wrap {
      width: 100%;
      overflow: hidden;
      margin: 14px 0 10px 0;
      position: relative;
      mask-image: linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%);
    }
    .btf-wordmark-stream {
      display: flex;
      align-items: center;
      gap: 28px;
      width: max-content;
      animation: btfStreamLoop 24s linear infinite;
      will-change: transform;
    }
    @keyframes btfStreamLoop {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(-50%, 0, 0); }
    }
    .btf-stream-item {
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

const newCssBlock = `    /* ============================================================
       BEYOND THE FRAME — WIDE CINEMATIC SCROLL STACK (1584 × 396)
       ============================================================ */
    .beyond-frame-section {
      width: 100%;
      max-width: none;
      box-sizing: border-box;
      position: relative;
      margin-top: clamp(48px, 6.5vh, 72px);
      margin-bottom: clamp(48px, 6.5vh, 72px);
      overflow: visible;
    }

    .beyond-frame-inner {
      width: min(100% - 64px, 1584px);
      margin-inline: auto;
      box-sizing: border-box;
    }

    @media (max-width: 768px) {
      .beyond-frame-inner {
        width: min(100% - 32px, 1584px);
      }
    }

    .beyond-frame-header {
      margin-bottom: 28px;
    }

    .beyond-frame-meta {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--dbl-text-tertiary, #888892);
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 8px;
    }

    .beyond-frame-meta .dbl-meta-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--dbl-crimson, #FF3038);
      box-shadow: 0 0 6px var(--dbl-crimson, #FF3038);
    }

    .beyond-frame-wordmark-track {
      width: 100%;
      overflow: hidden;
      position: relative;
      padding: 4px 0;
      margin: 6px 0 10px 0;
      mask-image: linear-gradient(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%);
    }

    .beyond-frame-wordmark-stream {
      display: flex;
      align-items: center;
      gap: clamp(24px, 3.5vw, 48px);
      width: max-content;
      animation: btfWordmarkMarquee 24s linear infinite;
      will-change: transform;
    }

    @keyframes btfWordmarkMarquee {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(-50%, 0, 0); }
    }

    .beyond-frame-wordmark-item {
      font-family: 'Montserrat', sans-serif;
      font-size: clamp(28px, 4.4vw, 56px);
      font-weight: 900;
      letter-spacing: -0.01em;
      text-transform: uppercase;
      color: var(--dbl-text-primary, #ffffff);
      white-space: nowrap;
      line-height: 1.15;
    }

    .beyond-frame-wordmark-sep {
      color: var(--dbl-crimson, #FF3038);
      font-size: clamp(16px, 2vw, 24px);
      opacity: 0.85;
    }

    @media (prefers-reduced-motion: reduce) {
      .beyond-frame-wordmark-stream {
        animation: none;
      }
    }

    .beyond-frame-description {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(15px, 1.25vw, 18px);
      color: var(--dbl-text-secondary, #A0A0A8);
      line-height: 1.5;
      margin: 8px 0 0 0;
      max-width: 820px;
    }

    .beyond-frame-stack {
      width: 100%;
      max-width: 1584px;
      margin-inline: auto;
      min-width: 0;
      position: relative;
    }`;

if (html.includes(oldCssBlock)) {
  html = html.replace(oldCssBlock, newCssBlock);
  console.log('Replaced old Beyond The Frame CSS with 1584px wide layout CSS');
} else {
  console.log('WARNING: oldCssBlock not found');
}

// 2. Replace HTML markup for Beyond The Frame
const oldMarkupBlock = `          <!-- BEYOND THE FRAME (SCROLL STACK CINEMATIC ARCHIVE) -->
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
          </div>

        </div>
      </section>`;

const newMarkupBlock = `        </div>
      </section>
    </div>

    <!-- ============================================================
         SECTION — BEYOND THE FRAME (WIDE 1584px CINEMATIC SCROLL STACK)
         ============================================================ -->
    <section class="beyond-frame-section" id="beyond-the-frame-zone" data-media-slot="IMPACT_VIDEO">
      <div class="beyond-frame-inner">
        <div class="beyond-frame-header">
          <!-- A. SMALL METADATA -->
          <div class="beyond-frame-meta">
            <span class="dbl-meta-dot"></span>
            <span>BEYOND THE FRAME // 5 CINEMATIC ENTRIES</span>
          </div>

          <!-- B. ANIMATED SECTION WORDMARK -->
          <div class="beyond-frame-wordmark-track" aria-label="BEYOND THE FRAME">
            <div class="beyond-frame-wordmark-stream">
              <span class="beyond-frame-wordmark-item">BEYOND THE FRAME</span>
              <span class="beyond-frame-wordmark-sep">✦</span>
              <span class="beyond-frame-wordmark-item">BEYOND THE FRAME</span>
              <span class="beyond-frame-wordmark-sep">✦</span>
              <span class="beyond-frame-wordmark-item">BEYOND THE FRAME</span>
              <span class="beyond-frame-wordmark-sep">✦</span>
              <span class="beyond-frame-wordmark-item">BEYOND THE FRAME</span>
              <span class="beyond-frame-wordmark-sep">✦</span>
            </div>
          </div>

          <!-- C. DESCRIPTION -->
          <p class="beyond-frame-description">
            Visual explorations, cinematic look-development, character studies and worldbuilding.
          </p>
        </div>

        <!-- D. CINEMATIC SCROLLSTACK MOUNT (24-32px beneath description) -->
        <div id="beyond-the-frame-mount" class="beyond-frame-stack"></div>
        <div id="morph-slider-mount" style="display:none;" aria-hidden="true"></div>
      </div>
    </section>

    <div class="dbl-content-container">`;

if (html.includes(oldMarkupBlock)) {
  html = html.replace(oldMarkupBlock, newMarkupBlock);
  console.log('Replaced Beyond The Frame markup to standalone wide 1584px section');
} else {
  console.log('WARNING: oldMarkupBlock not found');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('index.html updated successfully with wide layout!');
