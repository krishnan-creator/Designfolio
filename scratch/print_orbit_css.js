const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const pos = c.indexOf('.visual-orbit-section');
console.log(c.substring(pos, pos + 2200));
