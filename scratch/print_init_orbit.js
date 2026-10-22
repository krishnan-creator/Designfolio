const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const pos = c.indexOf('function initVisualOrbitGallery');
console.log(c.substring(pos - 50, pos + 600));
