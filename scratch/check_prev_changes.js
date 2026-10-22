const fs = require('fs');
const c = fs.readFileSync('scratch/apply_implementation_update.js', 'utf8');

['TechText', 'brand-df', 'DESIGNFOLIO', 'brand-techttext', 'glyph'].forEach(term => {
  let idx = 0;
  console.log(`=== In apply_implementation_update.js: ${term} ===`);
  while ((idx = c.indexOf(term, idx)) !== -1) {
    console.log(c.substring(idx - 40, idx + 160));
    idx += term.length;
  }
});
