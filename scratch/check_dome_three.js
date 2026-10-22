const fs = require('fs');
const c = fs.readFileSync('DomeGallery.jsx', 'utf8');

console.log('Includes THREE import?', c.includes('import * as THREE') || c.includes("import THREE"));
let pos = 0;
while ((pos = c.indexOf('THREE', pos)) !== -1) {
  console.log(`At ${pos}: ${c.substring(pos - 20, pos + 40)}`);
  pos += 10;
}
