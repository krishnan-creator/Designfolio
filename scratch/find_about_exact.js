const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.indexOf('a-bit-about-me');
console.log('Index of a-bit-about-me:', idx);
if (idx !== -1) {
  console.log(c.substring(idx - 100, idx + 400));
}
