const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.indexOf('contact-btn-wa');
console.log(c.substring(idx, idx + 1000));
