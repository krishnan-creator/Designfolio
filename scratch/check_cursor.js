const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

['cursor', 'dot-cursor', 'hero-cursor', 'custom-cursor'].forEach(term => {
  let idx = 0;
  console.log(`=== Matches for ${term} ===`);
  while ((idx = c.indexOf(term, idx)) !== -1) {
    if (idx < 50000) {
      console.log(`At ${idx}:`);
      console.log(c.substring(idx - 30, idx + 180));
    }
    idx += term.length;
  }
});
