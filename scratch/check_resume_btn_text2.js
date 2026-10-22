const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.indexOf('hero-resume-download');
console.log(c.substring(idx + 200, idx + 600));
