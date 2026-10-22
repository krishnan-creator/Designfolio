const fs = require('fs');
const c = fs.readFileSync('TechText.jsx', 'utf8');

const idx = c.indexOf('fillText');
console.log(c.substring(idx - 200, idx + 400));

const idxCanvas = c.indexOf('<canvas');
console.log(c.substring(idxCanvas - 100, idxCanvas + 300));
