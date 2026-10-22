const fs = require('fs');
const c = fs.readFileSync('index.html.bak_before_update03', 'utf8');

const start = c.indexOf('id="exp-dneg"');
const rowStart = c.lastIndexOf('<div class="expertise-row"', start);
const next = c.indexOf('</div>\n          </div>', start);
console.log(c.substring(rowStart, next));
