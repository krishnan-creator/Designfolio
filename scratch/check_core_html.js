const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.indexOf('id="a-bit-about-me"');
console.log('id="a-bit-about-me":', idx);
if (idx !== -1) {
  console.log(c.substring(idx - 100, idx + 1000));
}

const idxCore = c.indexOf('id="the-core"');
console.log('id="the-core":', idxCore);
if (idxCore !== -1) {
  console.log(c.substring(idxCore - 100, idxCore + 1000));
}
