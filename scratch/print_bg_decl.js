const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const pos = c.indexOf('post-hero-bg-mount', 300000);
console.log(c.substring(pos - 100, pos + 500));
