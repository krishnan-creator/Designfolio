const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const pos = s.indexOf('closing-build-section');
console.log('closing-build-section occurrences:');
let curr = pos;
while (curr !== -1) {
  console.log('Pos:', curr);
  console.log(s.substring(curr - 50, curr + 1200));
  console.log('-------------------------------------------');
  curr = s.indexOf('closing-build-section', curr + 1);
}
