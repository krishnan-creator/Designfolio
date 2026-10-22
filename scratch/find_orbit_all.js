const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

let pos = 0;
while ((pos = c.indexOf('visual-orbit', pos)) !== -1) {
  console.log(`At ${pos}: ${c.substring(pos - 20, pos + 80).replace(/\n/g, ' ')}`);
  pos += 15;
}
