const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
let pos = s.indexOf('.expertise-row');
while (pos !== -1) {
  console.log('Pos:', pos);
  console.log(s.substring(pos, pos + 500));
  console.log('-------------------------------------------');
  pos = s.indexOf('.expertise-row', pos + 1);
}
