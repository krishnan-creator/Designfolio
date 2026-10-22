const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const pos = 57160;
console.log(s.substring(pos - 600, pos + 1200));
