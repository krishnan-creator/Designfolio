const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

['glitch', 'triggerStartupGlitch', 'startup', 'scatter'].forEach(term => {
  let idx = 0;
  console.log(`=== Matches for ${term} ===`);
  while ((idx = c.indexOf(term, idx)) !== -1) {
    if (idx > 170000 && idx < 200000) {
      console.log(`At ${idx}:`);
      console.log(c.substring(idx - 40, idx + 200));
    }
    idx += term.length;
  }
});
