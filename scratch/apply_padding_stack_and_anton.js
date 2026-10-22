const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Update Beyond The Frame Header Markup in index.html
const oldHeaderBlock = `        <div class="beyond-frame-header">
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
        </div>`;

const newHeaderBlock = `        <div class="beyond-frame-header">
          <!-- A. SMALL TECHNICAL METADATA -->
          <div class="beyond-frame-meta">
            <span class="dbl-meta-dot"></span>
            <span>BEYOND THE FRAME // 5 CINEMATIC ENTRIES</span>
          </div>

          <!-- MAIN HEADING -->
          <h2 class="beyond-frame-title">BEYOND THE FRAME</h2>

          <!-- B. SUBTLE ANIMATED SECTION WORDMARK -->
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

          <!-- C. CONCISE DESCRIPTION -->
          <p class="beyond-frame-description">
            Visual explorations, cinematic look-development, character studies and worldbuilding.
          </p>
        </div>`;

if (html.includes(oldHeaderBlock)) {
  html = html.replace(oldHeaderBlock, newHeaderBlock);
  console.log('Successfully updated Beyond The Frame header markup with main heading');
} else {
  console.log('Warning: oldHeaderBlock not found');
}

// 2. Update Hero Name Particle Typography to use Anton font and Anton glyph geometry
const oldParticleBlock = `        // Modern bold sans-serif with unmistakable glyph shapes (Montserrat Black 900)
        const FONT_FAMILY = "'Montserrat', sans-serif";
        let fs1 = Math.round(Math.min(availableW * 0.114, 76));
        let fs2 = Math.round(Math.min(availableW * 0.112, 76));
        // Line 3 (PILLAI): unmistakable bold letters, proportional and clear (~74% of fs2)
        let fs3 = Math.round(fs2 * 0.74);

        // Clean contour definition: Montserrat 900 already provides strong, confident glyph weight.
        // Controlled 1.0px contour ensures counters in A, B, R, P remain open and crisp.
        // Pure font-derived glyph shapes without extra contour stroke to keep all counters (A, B, R, P) crisp & open
        const strokeW1 = 0;
        const strokeW2 = 0;
        const strokeW3 = 0;

        const track1 = Math.round(fs1 * 0.088);
        const track2 = Math.round(fs2 * 0.088);
        const track3 = Math.round(fs3 * 0.135);

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

        // Render line 1: CHITHAMBARAM (30% thicker glyph structure)
        offCtx.font = \`900 \${fs1}px \${FONT_FAMILY}\`;
        renderTrackedGlyphs(offCtx, LINE1_TEXT, paddingX, l1Y, track1, strokeW1);

        // Render line 2: BALA KRISHNAN (30% thicker glyph structure)
        offCtx.font = \`900 \${fs2}px \${FONT_FAMILY}\`;
        renderTrackedGlyphs(offCtx, LINE2_TEXT, paddingX, l2Y, track2, strokeW2);

        // Render line 3: PILLAI (30% thicker glyph structure, fully readable)
        offCtx.font = \`900 \${fs3}px \${FONT_FAMILY}\`;
        renderTrackedGlyphs(offCtx, LINE3_TEXT, paddingX, l3Y, track3, strokeW3);`;

const newParticleBlock = `        // Authentic Anton Display Typeface: clean, strong, immediately readable uppercase glyphs
        const FONT_FAMILY = "'Anton', sans-serif";
        let fs1 = Math.round(Math.min(availableW * 0.128, 86));
        let fs2 = Math.round(Math.min(availableW * 0.128, 86));
        // Line 3 (PILLAI): unmistakably bold, left-aligned, fully readable on one single line (~76% of fs2)
        let fs3 = Math.round(fs2 * 0.76);

        // Pure font-derived Anton glyph shapes without artificial distortion
        const strokeW1 = 0;
        const strokeW2 = 0;
        const strokeW3 = 0;

        // Controlled letter tracking so Anton glyphs breathe and counters (A, B, R, P) stay open & crisp
        const track1 = Math.round(fs1 * 0.082);
        const track2 = Math.round(fs2 * 0.082);
        const track3 = Math.round(fs3 * 0.125);

        probeCtx.font = \`400 \${fs1}px \${FONT_FAMILY}\`;
        let w1 = 0;
        for (let c of LINE1_TEXT) w1 += probeCtx.measureText(c).width + track1;
        if (w1 > availableW) {
          fs1 = Math.floor(fs1 * (availableW / w1) * 0.96);
        }

        probeCtx.font = \`400 \${fs2}px \${FONT_FAMILY}\`;
        let w2 = 0;
        for (let c of LINE2_TEXT) w2 += probeCtx.measureText(c).width + track2;
        if (w2 > availableW) {
          fs2 = Math.floor(fs2 * (availableW / w2) * 0.96);
          fs3 = Math.round(fs2 * 0.76);
        }

        probeCtx.font = \`400 \${fs3}px \${FONT_FAMILY}\`;
        let w3 = 0;
        for (let c of LINE3_TEXT) w3 += probeCtx.measureText(c).width + track3;
        if (w3 > availableW) {
          fs3 = Math.floor(fs3 * (availableW / w3) * 0.96);
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

        // High-resolution offscreen text mask sampled from Anton's real glyph contours
        const off = document.createElement('canvas');
        off.width = Math.round(nameCanvasWidth * dpr);
        off.height = Math.round(nameCanvasHeight * dpr);
        const offCtx = off.getContext('2d');
        offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        offCtx.clearRect(0, 0, nameCanvasWidth, nameCanvasHeight);
        offCtx.fillStyle = '#ffffff';
        offCtx.textBaseline = 'top';

        // Render line 1: CHITHAMBARAM in Anton
        offCtx.font = \`400 \${fs1}px \${FONT_FAMILY}\`;
        renderTrackedGlyphs(offCtx, LINE1_TEXT, paddingX, l1Y, track1, strokeW1);

        // Render line 2: BALA KRISHNAN in Anton
        offCtx.font = \`400 \${fs2}px \${FONT_FAMILY}\`;
        renderTrackedGlyphs(offCtx, LINE2_TEXT, paddingX, l2Y, track2, strokeW2);

        // Render line 3: PILLAI in Anton (strictly visible on one single line)
        offCtx.font = \`400 \${fs3}px \${FONT_FAMILY}\`;
        renderTrackedGlyphs(offCtx, LINE3_TEXT, paddingX, l3Y, track3, strokeW3);`;

if (html.includes(oldParticleBlock)) {
  html = html.replace(oldParticleBlock, newParticleBlock);
  console.log('Successfully updated Hero name particle typography to Anton');
} else {
  console.log('Warning: oldParticleBlock not found');
}

// 3. Update Font Loading for Anton in index.html
const oldFontLoad = `      // Re-sample once web fonts finish loading for pixel-perfect font contours
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (document.fonts.load) {
            document.fonts.load("900 120px Anton").then(() => initDenseParticleTypography()).catch(() => initDenseParticleTypography());
          } else {
            initDenseParticleTypography();
          }
        });
      }`;

const newFontLoad = `      // Re-sample once real Anton web font finishes loading for pixel-perfect glyph contours
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (document.fonts.load) {
            document.fonts.load("72px 'Anton'").then(() => {
              initDenseParticleTypography();
            }).catch(() => {
              initDenseParticleTypography();
            });
          } else {
            initDenseParticleTypography();
          }
        });
      }`;

if (html.includes(oldFontLoad)) {
  html = html.replace(oldFontLoad, newFontLoad);
  console.log('Successfully updated font loader to load Anton 72px');
} else {
  console.log('Warning: oldFontLoad not found');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('index.html saved successfully.');
