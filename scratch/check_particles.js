const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.indexOf('name-particle-canvas');
console.log('=== name-particle-canvas usage in index.html ===');
let pos = 0;
while ((pos = c.indexOf('name-particle-canvas', pos)) !== -1) {
  console.log(`At pos ${pos}:`);
  console.log(c.substring(pos - 100, pos + 400));
  pos += 20;
}
