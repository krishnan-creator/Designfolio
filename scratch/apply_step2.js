const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const oldInitMethod = `      function initDenseParticleTypography() {
        if (!pCanvas || !pCtx || !nameWrap) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = nameWrap.getBoundingClientRect();
        nameCanvasWidth = Math.round(Math.max(rect.width || 780, 720));

        // 1. Measure and calculate glyph dimensions first using temporary probe canvas
        const probe = document.createElement('canvas');
        const probeCtx = probe.getContext('2d');

        // Available width ensuring no clipping on any line
        let availableW = Math.min(nameCanvasWidth - 16, 700);
        let fs1 = Math.round(Math.min(availableW * 0.154, 88));
        let fs2 = Math.round(Math.min(availableW * 0.208, 118));
        // Line 3 (PILLAI): approximately 42-45% of line 2 size, left-aligned with line 2
        let fs3 = Math.round(fs2 * 0.44);

        const fontSpec1 = \`900 \${fs1}px 'Barlow Condensed', 'Gondens', 'Bebas Neue', Impact, sans-serif\`;
        const fontSpec2 = \`900 \${fs2}px 'Barlow Condensed', 'Gondens', 'Bebas Neue', Impact, sans-serif\`;

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

        probeCtx.font = \`900 \${fs3}px 'Barlow Condensed', 'Gondens', 'Bebas Neue', Impact, sans-serif\`;
        let w3 = probeCtx.measureText(LINE3_TEXT).width;
        if (w3 > availableW) {
          fs3 = Math.floor(fs3 * (availableW / w3) * 0.98);
        }

        // Strict left alignment: start at 2px so stroke doesn't touch canvas boundary
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

        // 2. Offscreen canvas initialized ONCE with exact final height
        const off = document.createElement('canvas');
        off.width = Math.round(nameCanvasWidth * dpr);
        off.height = Math.round(nameCanvasHeight * dpr);
        const offCtx = off.getContext('2d');
        offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        offCtx.clearRect(0, 0, nameCanvasWidth, nameCanvasHeight);

        offCtx.fillStyle = '#ffffff';
        offCtx.textBaseline = 'top';

        // Draw bold condensed display glyphs: Line 1, Line 2, and Line 3 (PILLAI)
        offCtx.font = \`900 \${fs1}px 'Barlow Condensed', 'Gondens', 'Bebas Neue', Impact, sans-serif\`;
        offCtx.fillText(LINE1_TEXT, paddingX, l1Y);

        offCtx.font = \`900 \${fs2}px 'Barlow Condensed', 'Gondens', 'Bebas Neue', Impact, sans-serif\`;
        offCtx.fillText(LINE2_TEXT, paddingX, l2Y);

        offCtx.font = \`900 \${fs3}px 'Barlow Condensed', 'Gondens', 'Bebas Neue', Impact, sans-serif\`;
        offCtx.fillText(LINE3_TEXT, paddingX, l3Y);

        const imgData = offCtx.getImageData(0, 0, off.width, off.height).data;
        nameParticles = [];

        // Dense particle field: pure white, solid silhouette
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        const sampleStep = isMobile ? 1.05 : (isTablet ? 0.95 : 0.88);
        const pSize = isMobile ? 1.45 : (isTablet ? 1.38 : 1.32);

        for (let y = 0; y < nameCanvasHeight; y += sampleStep) {
          for (let x = 0; x < nameCanvasWidth; x += sampleStep) {
            const pxX = Math.round(x * dpr);
            const pxY = Math.round(y * dpr);
            const idx = (pxY * off.width + pxX) * 4;

            if (idx < imgData.length && imgData[idx + 3] > 20) {
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
                dispersion: 0.65 + Math.random() * 0.70,
                color: '#FFFFFF'
              });
            }
          }
        }

        particleEngineInitialized = true;
        window.nameParticles = nameParticles;
      }`;

const newInitMethod = `      function initDenseParticleTypography() {
        if (!pCanvas || !pCtx || !nameWrap) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = nameWrap.getBoundingClientRect();
        nameCanvasWidth = Math.round(Math.max(rect.width || 780, 720));

        // 1. Measure and calculate glyph dimensions using bold condensed display typography
        const probe = document.createElement('canvas');
        const probeCtx = probe.getContext('2d');

        let availableW = Math.min(nameCanvasWidth - 16, 740);
        let fs1 = Math.round(Math.min(availableW * 0.148, 88));
        let fs2 = Math.round(Math.min(availableW * 0.205, 120));
        // Line 3 (PILLAI): approximately 42-45% of line 2 size, left-aligned with line 2
        let fs3 = Math.round(fs2 * 0.44);

        const fontSpec1 = \`900 \${fs1}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;
        const fontSpec2 = \`900 \${fs2}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;

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

        probeCtx.font = \`900 \${fs3}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;
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

        offCtx.font = \`900 \${fs1}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;
        offCtx.fillText(LINE1_TEXT, paddingX, l1Y);

        offCtx.font = \`900 \${fs2}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;
        offCtx.fillText(LINE2_TEXT, paddingX, l2Y);

        offCtx.font = \`900 \${fs3}px 'Barlow Condensed', 'Bebas Neue', Impact, sans-serif\`;
        offCtx.fillText(LINE3_TEXT, paddingX, l3Y);

        const imgData = offCtx.getImageData(0, 0, off.width, off.height).data;
        nameParticles = [];

        // Dense, tightly packed particle field: loops every device pixel step so zero rows are skipped
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        const stepPx = Math.max(1, Math.round(dpr * (isMobile ? 1.0 : 0.85)));
        const pSize = isMobile ? 1.45 : (isTablet ? 1.38 : 1.34);

        for (let py = 0; py < off.height; py += stepPx) {
          for (let px = 0; px < off.width; px += stepPx) {
            const idx = (py * off.width + px) * 4;
            if (imgData[idx + 3] > 30) {
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
                dispersion: 0.65 + Math.random() * 0.70,
                color: '#FFFFFF'
              });
            }
          }
        }

        particleEngineInitialized = true;
        window.nameParticles = nameParticles;
      }`;

if (html.includes(oldInitMethod)) {
  html = html.replace(oldInitMethod, newInitMethod);
  console.log('✅ Requirement 02: Updated initDenseParticleTypography with gap-free particle packing');
  fs.writeFileSync(htmlPath, html);
} else {
  console.warn('⚠️ Could not find exact oldInitMethod');
}
