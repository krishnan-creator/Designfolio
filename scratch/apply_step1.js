const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 0. Backup
fs.writeFileSync(path.join(__dirname, '..', 'index.html.bak_before_latest'), html);
console.log('Backed up index.html to index.html.bak_before_latest');

// =========================================================================
// 1. HEADER: ALIGN DESIGNFOLIO WITH CBK (REQUIREMENT 01)
// =========================================================================
// Find brand-group in HTML
const oldHeaderBrandHtml = `<a href="#hero-section" class="brand-group" aria-label="Home — C. Bala Krishnan">
        <span class="brand-cbk">CBK</span>
        
        <div class="brand-techttext-container" id="header-techttext-mount" aria-label="DESIGNFOLIO"></div>
      </a>`;

const newHeaderBrandHtml = `<a href="#hero-section" class="brand-group" aria-label="Home — C. Bala Krishnan">
        <span class="brand-cbk">CBK</span>
        <span class="designfolio-wordmark" id="brand-df" aria-label="DESIGNFOLIO">
          <span class="df-char" data-orig="D" data-idx="0">D</span><span class="df-char" data-orig="E" data-idx="1">E</span><span class="df-char" data-orig="S" data-idx="2">S</span><span class="df-char" data-orig="I" data-idx="3">I</span><span class="df-char" data-orig="G" data-idx="4">G</span><span class="df-char" data-orig="N" data-idx="5">N</span><span class="df-char" data-orig="F" data-idx="6">F</span><span class="df-char" data-orig="O" data-idx="7">O</span><span class="df-char" data-orig="L" data-idx="8">L</span><span class="df-char" data-orig="I" data-idx="9">I</span><span class="df-char" data-orig="O" data-idx="10">O</span>
        </span>
      </a>`;

if (html.includes(oldHeaderBrandHtml)) {
  html = html.replace(oldHeaderBrandHtml, newHeaderBrandHtml);
  console.log('✅ Requirement 01: Replaced header brand HTML');
} else {
  console.warn('⚠️ Could not find exact oldHeaderBrandHtml');
}

// Ensure CSS for .brand-group and .designfolio-wordmark has perfect baseline and vertical alignment
const oldHeaderCssPattern = `    .brand-group {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }

    .brand-cbk {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 800;
      font-size: 19px;
      letter-spacing: 0.08em;
      color: #ffffff !important;
      text-transform: uppercase;
    }`;

const newHeaderCss = `    .brand-group {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      text-decoration: none;
      vertical-align: middle;
    }

    .brand-cbk {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 800;
      font-size: 19px;
      letter-spacing: 0.08em;
      color: #ffffff !important;
      text-transform: uppercase;
      line-height: 1;
      display: inline-flex;
      align-items: center;
    }

    .designfolio-wordmark {
      font-family: "IBM Plex Mono", monospace;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #9C9CA6 !important;
      display: inline-flex;
      align-items: center;
      line-height: 1;
      position: relative;
      transform: translateY(1px);
    }`;

if (html.includes(oldHeaderCssPattern)) {
  html = html.replace(oldHeaderCssPattern, newHeaderCss);
  console.log('✅ Requirement 01: Updated header brand CSS');
} else {
  console.warn('⚠️ Could not find exact oldHeaderCssPattern');
}

fs.writeFileSync(htmlPath, html);
console.log('Checkpoint 1 written');
