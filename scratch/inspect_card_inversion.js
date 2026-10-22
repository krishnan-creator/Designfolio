const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
console.log(s.substring(153000, 155500));
