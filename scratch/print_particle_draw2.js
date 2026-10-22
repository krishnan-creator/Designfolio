const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const pos = 172236 + 9000;
console.log(c.substring(pos, pos + 2500));
