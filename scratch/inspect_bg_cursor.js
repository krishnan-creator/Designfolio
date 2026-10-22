const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.indexOf('function updateBackgroundAndCursor');
console.log(c.substring(idx - 50, idx + 2500));
