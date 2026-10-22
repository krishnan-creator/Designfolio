const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.indexOf('triggerStickyNoteReveal');
console.log(c.substring(idx - 100, idx + 1200));
