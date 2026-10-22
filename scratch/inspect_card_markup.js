const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const pos = 209247;
console.log(s.substring(pos - 400, pos + 400));
