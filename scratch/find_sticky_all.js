const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

let pos = 0;
while ((pos = c.indexOf('hero-sticky-note', pos)) !== -1) {
  console.log(`At ${pos}: ${c.substring(pos - 40, pos + 120).replace(/\n/g, ' ')}`);
  pos += 15;
}
