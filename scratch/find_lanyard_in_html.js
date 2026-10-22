const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

['Lanyard', 'lanyard', 'mountLanyardProfileSection', 'the-core'].forEach(term => {
  let pos = 0;
  console.log(`=== Matches for ${term} ===`);
  while ((pos = c.indexOf(term, pos)) !== -1) {
    console.log(`At ${pos}: ${c.substring(pos - 20, pos + 100).replace(/\n/g, ' ')}`);
    pos += term.length;
  }
});
