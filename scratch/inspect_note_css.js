const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

function findCss(selector) {
  const idx = c.indexOf(selector);
  if (idx !== -1) {
    console.log(`=== CSS for ${selector} ===`);
    console.log(c.substring(idx - 40, idx + 600));
  }
}

findCss('.sticky-note');
findCss('.sticky-stamp-wrap');
findCss('.contact-btn-in');
findCss('.contact-btn-wa');
findCss('.resume-download-btn');
