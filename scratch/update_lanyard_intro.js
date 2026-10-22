const fs = require('fs');

let code = fs.readFileSync('LanyardProfileSection.jsx', 'utf8');

code = code.replace('intro\n          />', 'intro={false}\n          />');
code = code.replace('intro />', 'intro={false} />');

fs.writeFileSync('LanyardProfileSection.jsx', code);
console.log('LanyardProfileSection.jsx updated with intro={false} for instant settled upright posture!');
