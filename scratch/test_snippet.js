const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Check header brand group
const bgIdx = html.indexOf('class="brand-group"');
console.log('brand-group snippet:');
console.log(html.substring(bgIdx - 50, bgIdx + 300));
