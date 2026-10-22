const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.lastIndexOf('resume-download-btn');
console.log(c.substring(idx - 100, idx + 600));
