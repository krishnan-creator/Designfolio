const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const startMarker = '<div class="sticky-note" id="hero-sticky-note">';
const endMarker = '<!-- CONTACT LINKS ROW';

const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);

if (start !== -1 && end !== -1) {
  const currentBlock = html.substring(start, end);
  console.log('Replacing block:\n', currentBlock);

  const cleanSticky = `<div class="sticky-note" id="hero-sticky-note">
        <!-- REAL CONVENTIONAL RED PUSH PIN (PIERCING UPPER RIGHT) -->
        <div class="push-pin-wrapper" id="hero-push-pin" aria-hidden="true">
          <img src="push-pin-clean.png" alt="" class="push-pin-img">
        </div>
        <!-- REAL PHYSICAL WARM PALE YELLOW STICKY PAPER -->
        <div class="sticky-paper-bg" aria-hidden="true">
          <img src="sticky-note-clean.png" alt="" class="sticky-paper-img">
        </div>
        <!-- STICKY NOTE STAMP ARTWORK ONLY (REQUIREMENT 3) -->
        <div class="sticky-content-wrap">
          <div class="sticky-stamp-wrap" id="sticky-stamp" aria-label="GEN AI CREATIVE PRODUCER">
            <img src="Gen ai.png" alt="GEN AI CREATIVE PRODUCER" class="sticky-stamp-img">
          </div>
        </div>
      </div>

      `;

  html = html.substring(0, start) + cleanSticky + html.substring(end);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Successfully replaced with pristine, clean sticky note without dangling body lines!');
} else {
  console.error('Could not find start/end markers for sticky note');
}
