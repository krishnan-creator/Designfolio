const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.indexOf('// Initial mounts');
console.log(c.substring(idx - 100, idx + 1500));
