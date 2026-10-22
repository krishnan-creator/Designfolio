const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('id="by-the-numbers"');
const before = html.slice(idx - 500, idx);
console.log('Snippet before by-the-numbers:\n', before);
