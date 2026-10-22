const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const pos = s.indexOf('.expertise-timeline-item');
console.log('expertise-timeline-item pos:', pos);
if (pos !== -1) {
  console.log(s.substring(pos, pos + 1500));
}
