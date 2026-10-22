const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.indexOf('runGlyphLotteryOnChars');
console.log('runGlyphLotteryOnChars in index.html:', idx);
if (idx !== -1) {
  console.log(c.substring(idx - 100, idx + 500));
}
