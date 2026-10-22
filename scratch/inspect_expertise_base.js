const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const pos = s.indexOf('.expertise-row {');
console.log('.expertise-row { pos:', pos);
if (pos !== -1) {
  console.log(s.substring(pos, pos + 2000));
}
