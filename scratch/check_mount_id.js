const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

console.log('Includes lanyard-profile-mount in index.html?', c.includes('lanyard-profile-mount'));
let pos = 0;
while ((pos = c.indexOf('lanyard-profile-mount', pos)) !== -1) {
  console.log(`At ${pos}: ${c.substring(pos - 20, pos + 60).replace(/\n/g, ' ')}`);
  pos += 15;
}
