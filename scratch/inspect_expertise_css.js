const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const pos = s.indexOf('expertise-card');
console.log('expertise-card occurrences:');
let curr = pos;
while (curr !== -1) {
  console.log('Pos:', curr);
  console.log(s.substring(curr - 20, curr + 400));
  console.log('-------------------------------------------');
  curr = s.indexOf('expertise-card', curr + 1);
}
