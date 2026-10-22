const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

[
  '.theme-toggle-btn',
  '.resume-download-btn',
  '.contact-btn',
  '.orbit-pill',
  '.closing-cta',
  '.cta-btn',
  '.btn'
].forEach(sel => {
  let pos = 0;
  console.log(`=== Matches for ${sel} ===`);
  while ((pos = c.indexOf(sel, pos)) !== -1) {
    if (pos < 50000 || pos > 80000 && pos < 110000) {
      console.log(`At ${pos}: ${c.substring(pos - 20, pos + 250)}`);
    }
    pos += sel.length;
  }
});
