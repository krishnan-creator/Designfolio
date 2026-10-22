const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.indexOf('a-bit-about-me');
const endIdx = c.indexOf('</section>', idx);
console.log('End of a-bit-about-me at:', endIdx);
console.log(c.substring(endIdx - 100, endIdx + 200));
