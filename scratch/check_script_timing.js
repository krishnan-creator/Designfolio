const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const idx = c.indexOf('updateBackgroundAndCursor(initialTheme)');
console.log(c.substring(idx - 300, idx + 400));
