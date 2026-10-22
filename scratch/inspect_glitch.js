const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const pos = 161279;
console.log(c.substring(pos - 400, pos + 800));
