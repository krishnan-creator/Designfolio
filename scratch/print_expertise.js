const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const start = c.indexOf('<div class="expertise-list">');
const end = c.indexOf('</section>', start);
console.log(c.substring(start, end));
