const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const lines = s.split('\n');
lines.forEach((l, i) => {
  if (l.includes('[data-theme="light"]') && (l.includes('body') || l.includes('html') || l.includes('main') || l.includes('--dbl-bg') || l.includes('#main-content') || l.includes('.dbl-section-wrap'))) {
    console.log(i + 1, l);
  }
});
