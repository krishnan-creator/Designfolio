const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const pos = 226471;
console.log(s.substring(pos, pos + 2200));
