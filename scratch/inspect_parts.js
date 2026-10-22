const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

function printRange(title, startTerm, endTerm) {
  console.log(`\n=================== ${title} ===================`);
  const start = content.indexOf(startTerm);
  if (start === -1) {
    console.log('START NOT FOUND:', startTerm);
    return;
  }
  const end = content.indexOf(endTerm, start);
  if (end === -1) {
    console.log('END NOT FOUND:', endTerm);
    console.log(content.substring(start, start + 2000));
    return;
  }
  console.log(content.substring(start, end + endTerm.length));
}

// 1. Header brand area HTML
printRange('1. HEADER BRAND AREA', '<a href="#hero-section" class="brand-group"', '</a>');

// 2. Sticky note HTML
printRange('2. STICKY NOTE HTML', '<div class="sticky-note"', '<!-- HERO SOCIAL DESTINATIONS');

// 3. Social buttons & Resume HTML
printRange('3. SOCIALS & RESUME HTML', '<div class="hero-social-strip"', '</div>\n      </div>\n    </div>');

// 4. Expertise / Journey HTML
printRange('4. EXPERTISE HTML', '<div class="expertise-list">', '<!-- ===================================================\n           04. MY WORK');

// 5. About me section HTML
printRange('5. ABOUT ME SECTION HTML', '<section class="about-me-section" id="a-bit-about-me">', '<!-- ===================================================\n           06. CLOSING CALL');
