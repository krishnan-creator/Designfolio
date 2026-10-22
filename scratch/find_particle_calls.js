const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

let pos = 0;
while ((pos = c.indexOf('initDenseParticleTypography', pos)) !== -1) {
  console.log(`At ${pos}:`);
  console.log(c.substring(pos - 40, pos + 200));
  pos += 25;
}
