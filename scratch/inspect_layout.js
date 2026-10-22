const fs = require('fs');
const c = fs.readFileSync('TechText.jsx', 'utf8');

const idx = c.indexOf('const ensureLayout');
console.log(c.substring(idx, idx + 800));
