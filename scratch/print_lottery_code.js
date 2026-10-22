const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const pos = 167184;
console.log(c.substring(pos - 50, pos + 1200));
