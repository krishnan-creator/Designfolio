const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const pos = 103684;
console.log(c.substring(pos - 100, pos + 1500));
