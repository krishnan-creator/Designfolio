const fs = require('fs');

let html = fs.readFileSync('c:/Users/meet2/Desktop/New folder/index.html', 'utf8');

// 1. Move hero-left-stage slightly downward (~12px)
html = html.replace(
  /\.hero-left-stage\s*\{[\s\S]*?top:\s*36%;/,
  `.hero-left-stage {
      position: absolute;
      left: clamp(28px, 4.5vw, 64px);
      top: calc(36% + 12px);`
);

// 2. Sticky note stamp: replace Gen ai.png with Gen ai.svg
html = html.replace(
  '<img src="Gen ai.png" alt="GEN AI CREATIVE PRODUCER" class="sticky-stamp-img">',
  '<img src="Gen ai.svg" alt="GEN AI CREATIVE PRODUCER" class="sticky-stamp-img">'
);

// 3. EXR Playback: play 1->38, hold 38, qualifying interaction enters continuous loop 38->39->...->291->38
const oldExrAdvance = `        if (exrPlaybackState === 'startup_hold_01') {
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
        }`;

const newExrAdvance = `        if (exrPlaybackState === 'startup_hold_01') {
          // Held at frame 1 during initial 0.5s splash & glitch
          currentFrameNumber = 1;
          return;
        } else if (exrPlaybackState === 'initial_entry') {
          // Play smoothly 1 -> 38, then hold at frame 38
          currentFrameNumber++;
          if (currentFrameNumber >= 38) {
            currentFrameNumber = 38;
            exrPlaybackState = 'hold_38'; // PAUSE PRECISELY ON FRAME 38
          }
        } else if (exrPlaybackState === 'hold_38') {
          // Resting state: freeze on frame 38 waiting for first qualifying Hero interaction
          return;
        } else if (exrPlaybackState === 'looping_continuous') {
          // First qualifying interaction: advance 39 and enter continuous loop 38 -> 39 -> ... -> 291 -> 38
          currentFrameNumber++;
          if (currentFrameNumber > TOTAL_FRAMES) {
            currentFrameNumber = 38; // Loop continuously back to frame 38!
            hasCrossedSnapThresholdThisLoop = false;
          }

          if (prevFrame <= 102 && currentFrameNumber >= 103 && !hasCrossedSnapThresholdThisLoop) {
            hasCrossedSnapThresholdThisLoop = true;
            playExrLoopSnapSound();
          }
          if (currentFrameNumber < 90) {
            hasCrossedSnapThresholdThisLoop = false;
          }
        }`;

if (html.includes(oldExrAdvance)) {
  html = html.replace(oldExrAdvance, newExrAdvance);
  console.log('Replaced advanceExrStep');
} else {
  console.log('advanceExrStep not matched directly, checking CRLF');
  html = html.replace(oldExrAdvance.replace(/\n/g, '\r\n'), newExrAdvance.replace(/\n/g, '\r\n'));
}

// Update handleHeroExrWakeOnAction
const oldWake = `      function handleHeroExrWakeOnAction(e) {
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
      }`;

const newWake = `      function handleHeroExrWakeOnAction(e) {
        const scrollY = window.scrollY || window.pageYOffset;
        const heroEl = document.getElementById('hero-section');
        const heroHeight = heroEl ? heroEl.offsetHeight : window.innerHeight;
        if (scrollY > heroHeight * 0.95) return; // Outside Hero

        // Ignore header interaction
        if (e && e.clientY !== undefined && e.clientY < 64) return;

        if (exrPlaybackState === 'hold_38') {
          // First qualifying interaction: advance to 39 and enter continuous loop!
          exrPlaybackState = 'looping_continuous';
        }
      }`;

if (html.includes(oldWake)) {
  html = html.replace(oldWake, newWake);
  console.log('Replaced handleHeroExrWakeOnAction');
} else {
  html = html.replace(oldWake.replace(/\n/g, '\r\n'), newWake.replace(/\n/g, '\r\n'));
}

// 4. Hero Name Particle Typography: wide display font, independent line masks, solid ferro-cubes
const oldInitParticles = `      function initDenseParticleTypography() {
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
      }`;

const newInitParticles = `      function initDenseParticleTypography() {
        if (!pCanvas || !pCtx || !nameWrap) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = nameWrap.getBoundingClientRect();
        nameCanvasWidth = Math.round(Math.max(rect.width || 780, 720));

        const probe = document.createElement('canvas');
        const probeCtx = probe.getContext('2d');

        let availableW = Math.min(nameCanvasWidth - 16, 760);

        // Bold display font with wide characters, open counters, and crisp letter separation
        const FONT_FAMILY = "'Space Grotesk', 'Montserrat', 'Syne', sans-serif";
        let fs1 = Math.round(Math.min(availableW * 0.118, 76));
        let fs2 = Math.round(Math.min(availableW * 0.116, 76));
        // Line 3 (PILLAI): slightly smaller (~62% of fs2) but bold and completely readable on one line
        let fs3 = Math.round(fs2 * 0.62);

        const track1 = Math.round(fs1 * 0.08); // +6px tracking between letters
        const track2 = Math.round(fs2 * 0.08); // +6px tracking between letters
        const track3 = Math.round(fs3 * 0.12); // +6px tracking so L-L never merge

        probeCtx.font = \`900 \${fs1}px \${FONT_FAMILY}\`;
        let w1 = 0;
        for (let c of LINE1_TEXT) w1 += probeCtx.measureText(c).width + track1;
        if (w1 > availableW) {
          fs1 = Math.floor(fs1 * (availableW / w1) * 0.98);
        }

        probeCtx.font = \`900 \${fs2}px \${FONT_FAMILY}\`;
        let w2 = 0;
        for (let c of LINE2_TEXT) w2 += probeCtx.measureText(c).width + track2;
        if (w2 > availableW) {
          fs2 = Math.floor(fs2 * (availableW / w2) * 0.98);
          fs3 = Math.round(fs2 * 0.62);
        }

        probeCtx.font = \`900 \${fs3}px \${FONT_FAMILY}\`;
        let w3 = 0;
        for (let c of LINE3_TEXT) w3 += probeCtx.measureText(c).width + track3;
        if (w3 > availableW) {
          fs3 = Math.floor(fs3 * (availableW / w3) * 0.98);
        }

        // Strict left alignment
        const paddingX = 2;
        const l1Y = 2;
        const l2Y = fs1 + 10;
        const l3Y = fs1 + fs2 + 18;
        const totalHeight = Math.round(fs1 + fs2 + fs3 + 30);
        nameCanvasHeight = totalHeight;
        nameWrap.style.minHeight = \`\${nameCanvasHeight}px\`;

        pCanvas.width = Math.round(nameCanvasWidth * dpr);
        pCanvas.height = Math.round(nameCanvasHeight * dpr);
        pCanvas.style.width = \`\${nameCanvasWidth}px\`;
        pCanvas.style.height = \`\${nameCanvasHeight}px\`;
        pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Independent glyph masks for each line to eliminate overlap & distortion
        const off = document.createElement('canvas');
        off.width = Math.round(nameCanvasWidth * dpr);
        off.height = Math.round(nameCanvasHeight * dpr);
        const offCtx = off.getContext('2d');
        offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        offCtx.clearRect(0, 0, nameCanvasWidth, nameCanvasHeight);
        offCtx.fillStyle = '#ffffff';
        offCtx.textBaseline = 'top';

        // Render line 1: CHITHAMBARAM
        offCtx.font = \`900 \${fs1}px \${FONT_FAMILY}\`;
        renderTrackedGlyphs(offCtx, LINE1_TEXT, paddingX, l1Y, track1);

        // Render line 2: BALA KRISHNAN
        offCtx.font = \`900 \${fs2}px \${FONT_FAMILY}\`;
        renderTrackedGlyphs(offCtx, LINE2_TEXT, paddingX, l2Y, track2);

        // Render line 3: PILLAI
        offCtx.font = \`900 \${fs3}px \${FONT_FAMILY}\`;
        renderTrackedGlyphs(offCtx, LINE3_TEXT, paddingX, l3Y, track3);

        const imgData = offCtx.getImageData(0, 0, off.width, off.height).data;
        nameParticles = [];

        // Dense, tightly packed ferro-cubes sampling: step 1.4px, particle size 1.6px
        // Requires alpha > 120 so antialiased blur is discarded, keeping counters open and strokes crisp
        const stepPx = Math.max(1, Math.round(dpr * 0.88));
        const pSize = 1.62;

        for (let py = 0; py < off.height; py += stepPx) {
          for (let px = 0; px < off.width; px += stepPx) {
            const idx = (py * off.width + px) * 4;
            if (imgData[idx + 3] > 120) {
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
                dispersion: 0.82 + Math.random() * 0.36
              });
            }
          }
        }

        particleEngineInitialized = true;
        window.nameParticles = nameParticles;
      }`;

if (html.includes(oldInitParticles)) {
  html = html.replace(oldInitParticles, newInitParticles);
  console.log('Replaced initDenseParticleTypography');
} else {
  html = html.replace(oldInitParticles.replace(/\n/g, '\r\n'), newInitParticles.replace(/\n/g, '\r\n'));
}

// 5. Update DNEG title and media slots in My Expertise
// Change DNEG heading
html = html.replace(
  '<h3 class="company-heading">DNEG</h3>',
  '<h3 class="company-heading">DNEG — DOUBLE NEGATIVE</h3>'
);

// Remove .dneg-film-credits-list from .expertise-logo-col
const oldDnegLogoCol = `                <!-- FEATURE FILM CREDITS DIRECTLY BELOW DNEG LOGO ONLY -->
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
                </div>`;

if (html.includes(oldDnegLogoCol)) {
  html = html.replace(oldDnegLogoCol, '');
  console.log('Removed dneg-film-credits-list from logo column');
} else {
  html = html.replace(oldDnegLogoCol.replace(/\n/g, '\r\n'), '');
}

// Add 3 media slots to DNEG card under info-grid
const dnegInfoGridEnd = `                      <span class="tool-tag" tabIndex="0">Brahma</span>
                    </div>
                  </div>
                </div>`;

const dnegMediaSlots = `                      <span class="tool-tag" tabIndex="0">Brahma</span>
                    </div>
                  </div>
                </div>

                <!-- DNEG 3 LANDSCAPE MEDIA SLOTS -->
                <div class="expertise-media-row expertise-media-row--3">
                  <div class="expertise-media-slot" tabindex="0">
                    <div class="expertise-media-frame">
                      <img src="Ramayana.png" alt="Ramayana Production Look-Dev" class="expertise-media-img">
                      <div class="expertise-media-overlay">
                        <span class="expertise-media-badge">[◈] 01 / RAMAYANA</span>
                      </div>
                    </div>
                    <div class="expertise-media-caption">
                      <span class="expertise-media-title">RAMAYANA</span>
                      <span class="expertise-media-meta">Epic Cinema Look-Dev</span>
                    </div>
                  </div>
                  <div class="expertise-media-slot" tabindex="0">
                    <div class="expertise-media-frame">
                      <img src="media_1791962972986.png" alt="Masters of the Universe Look-Dev" class="expertise-media-img">
                      <div class="expertise-media-overlay">
                        <span class="expertise-media-badge">[◈] 02 / MASTERS OF THE UNIVERSE</span>
                      </div>
                    </div>
                    <div class="expertise-media-caption">
                      <span class="expertise-media-title">MASTERS OF THE UNIVERSE</span>
                      <span class="expertise-media-meta">Digital Humans & Face Ingest</span>
                    </div>
                  </div>
                  <div class="expertise-media-slot" tabindex="0">
                    <div class="expertise-media-frame">
                      <img src="media_1791962972992.jpg" alt="The Odyssey VFX Integration" class="expertise-media-img">
                      <div class="expertise-media-overlay">
                        <span class="expertise-media-badge">[◈] 03 / THE ODYSSEY</span>
                      </div>
                    </div>
                    <div class="expertise-media-caption">
                      <span class="expertise-media-title">THE ODYSSEY</span>
                      <span class="expertise-media-meta">VFX Performance Transfer</span>
                    </div>
                  </div>
                </div>`;

if (html.includes(dnegInfoGridEnd)) {
  html = html.replace(dnegInfoGridEnd, dnegMediaSlots);
  console.log('Added DNEG media slots');
} else {
  html = html.replace(dnegInfoGridEnd.replace(/\n/g, '\r\n'), dnegMediaSlots.replace(/\n/g, '\r\n'));
}

// Add 2 media slots to IMPROMP2LABS card under info-grid
const impromp2InfoGridEnd = `                      <span class="tool-tag">ElevenLabs</span>
                    </div>
                  </div>
                </div>`;

const impromp2MediaSlots = `                      <span class="tool-tag">ElevenLabs</span>
                    </div>
                  </div>
                </div>

                <!-- IMPROMP2LABS 2 LANDSCAPE MEDIA SLOTS -->
                <div class="expertise-media-row expertise-media-row--2">
                  <div class="expertise-media-slot" tabindex="0">
                    <div class="expertise-media-frame">
                      <img src="dune-dneg.jpg" alt="Original Cinematic IP & World Persistence" class="expertise-media-img">
                      <div class="expertise-media-overlay">
                        <span class="expertise-media-badge">[◈] 01 / ORIGINAL CINEMATIC IP</span>
                      </div>
                    </div>
                    <div class="expertise-media-caption">
                      <span class="expertise-media-title">ORIGINAL CINEMATIC IP</span>
                      <span class="expertise-media-meta">Character & World Persistence</span>
                    </div>
                  </div>
                  <div class="expertise-media-slot" tabindex="0">
                    <div class="expertise-media-frame">
                      <img src="media_1791977571390.png" alt="Multi-Shot Sequence Workflows" class="expertise-media-img">
                      <div class="expertise-media-overlay">
                        <span class="expertise-media-badge">[◈] 02 / MULTI-SHOT PIPELINES</span>
                      </div>
                    </div>
                    <div class="expertise-media-caption">
                      <span class="expertise-media-title">MULTI-SHOT PIPELINES</span>
                      <span class="expertise-media-meta">Diffusion & Video Model Integration</span>
                    </div>
                  </div>
                </div>`;

if (html.includes(impromp2InfoGridEnd)) {
  html = html.replace(impromp2InfoGridEnd, impromp2MediaSlots);
  console.log('Added IMPROMP2LABS media slots');
} else {
  html = html.replace(impromp2InfoGridEnd.replace(/\n/g, '\r\n'), impromp2MediaSlots.replace(/\n/g, '\r\n'));
}

// 6. Update initLanyardProfile props in index.html
html = html.replace(
  /frontImage:\s*['"]card-front\.png['"],\s*backImage:\s*['"]card-back\.png['"],\s*strapImage:\s*['"]band\.png['"]/,
  "frontImage: 'ID Front(1).png', backImage: 'ID Back(1).png', strapImage: 'ID tag(1).png'"
);

// 7. Add CSS for expertise media slots and theme inversion
const expertiseCss = `
    /* EXPERTISE MEDIA SLOTS (DNEG 3-SLOT & IMPROMP2LABS 2-SLOT) */
    .expertise-media-row {
      display: grid;
      gap: 12px;
      margin-top: 18px;
      width: 100%;
    }
    .expertise-media-row--3 {
      grid-template-columns: repeat(3, 1fr);
    }
    .expertise-media-row--2 {
      grid-template-columns: repeat(2, 1fr);
    }
    @media (max-width: 768px) {
      .expertise-media-row--3, .expertise-media-row--2 {
        grid-template-columns: 1fr;
      }
    }
    .expertise-media-slot {
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .expertise-media-frame {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: #0D0E12;
    }
    .expertise-media-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
      display: block;
    }
    .expertise-media-slot:hover .expertise-media-img {
      transform: scale(1.04);
    }
    .expertise-media-overlay {
      position: absolute;
      top: 6px;
      left: 6px;
      z-index: 2;
    }
    .expertise-media-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5px;
      font-weight: 700;
      color: #FFFFFF;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      padding: 2px 6px;
      border-radius: 3px;
      letter-spacing: 0.05em;
    }
    .expertise-media-caption {
      padding: 7px 9px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .expertise-media-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: inherit;
      text-transform: uppercase;
    }
    .expertise-media-meta {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: var(--dbl-muted);
      letter-spacing: 0.02em;
    }

    /* THEME-AWARE HOVER COLOR INVERSION FOR COMPANY CARDS */
    [data-theme="dark"] .expertise-row,
    body:not([data-theme="light"]) .expertise-row {
      background: rgba(18, 18, 22, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #EDEDED;
      transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    [data-theme="dark"] .expertise-row:hover,
    body:not([data-theme="light"]) .expertise-row:hover {
      background: #F3F4F6 !important;
      border-color: rgba(0, 0, 0, 0.25) !important;
      color: #0C0D10 !important;
    }
    [data-theme="dark"] .expertise-row:hover .company-heading,
    body:not([data-theme="light"]) .expertise-row:hover .company-heading {
      color: #0A0A0C !important;
    }
    [data-theme="dark"] .expertise-row:hover .company-role-tag,
    body:not([data-theme="light"]) .expertise-row:hover .company-role-tag {
      color: var(--dbl-crimson) !important;
    }
    [data-theme="dark"] .expertise-row:hover .info-block-label,
    body:not([data-theme="light"]) .expertise-row:hover .info-block-label {
      color: #555562 !important;
    }
    [data-theme="dark"] .expertise-row:hover .info-block-intro,
    [data-theme="dark"] .expertise-row:hover .info-bullets li,
    body:not([data-theme="light"]) .expertise-row:hover .info-block-intro,
    body:not([data-theme="light"]) .expertise-row:hover .info-bullets li {
      color: #222228 !important;
    }
    [data-theme="dark"] .expertise-row:hover .skill-tag,
    [data-theme="dark"] .expertise-row:hover .tool-tag,
    body:not([data-theme="light"]) .expertise-row:hover .skill-tag,
    body:not([data-theme="light"]) .expertise-row:hover .tool-tag {
      background: #E5E7EB !important;
      border-color: #D1D5DB !important;
      color: #111827 !important;
    }
    [data-theme="dark"] .expertise-row:hover .expertise-media-slot,
    body:not([data-theme="light"]) .expertise-row:hover .expertise-media-slot {
      background: #FFFFFF !important;
      border-color: #D1D5DB !important;
      color: #111827 !important;
    }

    [data-theme="light"] .expertise-row {
      background: rgba(245, 245, 248, 0.85);
      border: 1px solid rgba(0, 0, 0, 0.08);
      color: #111114;
      transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    [data-theme="light"] .expertise-row:hover {
      background: #1C1D22 !important;
      border-color: rgba(255, 255, 255, 0.22) !important;
      color: #FFFFFF !important;
    }
    [data-theme="light"] .expertise-row:hover .company-heading {
      color: #FFFFFF !important;
    }
    [data-theme="light"] .expertise-row:hover .company-role-tag {
      color: #FF4D58 !important;
    }
    [data-theme="light"] .expertise-row:hover .info-block-label {
      color: #9E9EA8 !important;
    }
    [data-theme="light"] .expertise-row:hover .info-block-intro,
    [data-theme="light"] .expertise-row:hover .info-bullets li {
      color: #E2E2E8 !important;
    }
    [data-theme="light"] .expertise-row:hover .skill-tag,
    [data-theme="light"] .expertise-row:hover .tool-tag {
      background: #2A2B32 !important;
      border-color: #3C3D46 !important;
      color: #F3F4F6 !important;
    }
    [data-theme="light"] .expertise-row:hover .expertise-media-slot {
      background: #25262D !important;
      border-color: #3C3D46 !important;
      color: #F3F4F6 !important;
    }
`;

html = html.replace('</style>', expertiseCss + '\n  </style>');

fs.writeFileSync('c:/Users/meet2/Desktop/New folder/index.html', html, 'utf8');
console.log('index.html updated successfully with all critical corrections.');
