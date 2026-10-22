const fs = require('fs');

const origHtml = fs.readFileSync('index.html.bak_master', 'utf8');

const byTheNumbersHTML = fs.readFileSync('scratch/by_the_numbers.html', 'utf8');
const disciplinesHTML = fs.readFileSync('scratch/disciplines.html', 'utf8');
const myExpertiseHTML = fs.readFileSync('scratch/my_expertise.html', 'utf8');
const newCSS = fs.readFileSync('scratch/new_sections.css', 'utf8');
const newJS = fs.readFileSync('scratch/new_sections.js', 'utf8');

// Step 1: Replace CSS
const cssStartMarker = '/* ============================================================\n       07. SECTION 02 — IMPACT';
const cssEndMarker = '/* ============================================================\n       09. SECTION 04 — MY WORK';

const cssStartIdx = origHtml.indexOf(cssStartMarker);
const cssEndIdx = origHtml.indexOf(cssEndMarker);

if (cssStartIdx === -1 || cssEndIdx === -1) {
  console.error('Could not find CSS markers:', { cssStartIdx, cssEndIdx });
  process.exit(1);
}

let modifiedHtml = origHtml.substring(0, cssStartIdx) + newCSS + '\n    ' + origHtml.substring(cssEndIdx);

// Also remove old Section 06 Disciplines CSS
const css06Start = '/* ============================================================\n       11. SECTION 06 — DISCIPLINES';
const css06End = '/* ============================================================\n       12. SECTION 07 — LET\'S BUILD';
const idx06Start = modifiedHtml.indexOf(css06Start);
const idx06End = modifiedHtml.indexOf(css06End);
if (idx06Start !== -1 && idx06End !== -1) {
  modifiedHtml = modifiedHtml.substring(0, idx06Start) + modifiedHtml.substring(idx06End);
  console.log('Removed old section 06 CSS.');
}

// Step 2: Replace HTML sections 02, 02.5, 03
const htmlStartMarker = '<!-- ============================================================\n           SECTION 02 — IMPACT METRICS';
const htmlEndMarker = '<!-- ============================================================\n           SECTION 04 — MY WORK';

const htmlStartIdx = modifiedHtml.indexOf(htmlStartMarker);
const htmlEndIdx = modifiedHtml.indexOf(htmlEndMarker);

if (htmlStartIdx === -1 || htmlEndIdx === -1) {
  console.error('Could not find HTML markers:', { htmlStartIdx, htmlEndIdx });
  process.exit(1);
}

const combinedNewSectionsHTML = byTheNumbersHTML + '\n' + disciplinesHTML + '\n' + myExpertiseHTML + '\n      ';
modifiedHtml = modifiedHtml.substring(0, htmlStartIdx) + combinedNewSectionsHTML + modifiedHtml.substring(htmlEndIdx);

// Also remove old duplicate Section 06 HTML:
const html06Start = '<!-- ============================================================\n           SECTION 06 — DISCIPLINES';
const html06End = '<!-- ============================================================\n           SECTION 07 — LET\'S BUILD';
const idxH06Start = modifiedHtml.indexOf(html06Start);
const idxH06End = modifiedHtml.indexOf(html06End);
if (idxH06Start !== -1 && idxH06End !== -1) {
  modifiedHtml = modifiedHtml.substring(0, idxH06Start) + modifiedHtml.substring(idxH06End);
  console.log('Removed old duplicate section 06 HTML.');
}

// Step 3: Replace JS
const jsStartMarker = '// 9. 10s VISUAL ROTATION (RAMAYANA & VEERABHADRA)';
const jsEndMarker = '// 13. SECTION 05 — THE PIPELINE:';

const jsStartIdx = modifiedHtml.indexOf(jsStartMarker);
const jsEndIdx = modifiedHtml.indexOf(jsEndMarker);

if (jsStartIdx === -1 || jsEndIdx === -1) {
  console.error('Could not find JS markers:', { jsStartIdx, jsEndIdx });
  process.exit(1);
}

// Also find old Section 06 JS & Triangle Grid JS to remove:
const js06StartMarker = '// 13B. SECTION 06 — DISCIPLINES: ASTRAL SHELL';
const js06EndMarker = '// 14. REUSABLE VIDEO & MEDIA COMPONENT ARCHITECTURE';
const js06Start = modifiedHtml.indexOf(js06StartMarker);
const js06End = modifiedHtml.indexOf(js06EndMarker);

if (js06Start !== -1 && js06End !== -1) {
  modifiedHtml = modifiedHtml.substring(0, js06Start) + modifiedHtml.substring(js06End);
  console.log('Removed old astral universe JS.');
}

// Remove old initMonochromeTriangleGrid() call/function at bottom if present
const triGridStart = '// MONOCHROME GEOMETRIC IDENTITY — ISOMETRIC TRIANGLE LATTICE';
const triGridIdx = modifiedHtml.indexOf(triGridStart);
if (triGridIdx !== -1) {
  const scriptEnd = modifiedHtml.indexOf('</script>', triGridIdx);
  if (scriptEnd !== -1) {
    modifiedHtml = modifiedHtml.substring(0, triGridIdx) + '    })();\n  ' + modifiedHtml.substring(scriptEnd);
    console.log('Removed old triangle lattice JS and closed IIFE.');
  }
}

// Now replace the main JS chunk:
const finalJsStart = modifiedHtml.indexOf(jsStartMarker);
const finalJsEnd = modifiedHtml.indexOf(jsEndMarker);

modifiedHtml = modifiedHtml.substring(0, finalJsStart) + newJS + '\n\n      // ============================================================\n      ' + modifiedHtml.substring(finalJsEnd);

fs.writeFileSync('index.html', modifiedHtml);
console.log('Successfully updated index.html with all new sections! New size:', modifiedHtml.length);
