const fs = require('fs');
const c = fs.readFileSync('index.html.bak_master', 'utf8');

const pos = c.indexOf('brand-df');
console.log('brand-df in bak_master:');
console.log(c.substring(pos - 100, pos + 500));
