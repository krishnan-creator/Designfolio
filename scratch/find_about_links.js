const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

let pos = 0;
while ((pos = c.indexOf('a-bit-about-me', pos)) !== -1) {
  console.log(`At ${pos}: ${c.substring(pos - 30, pos + 60).replace(/\n/g, ' ')}`);
  pos += 14;
}
