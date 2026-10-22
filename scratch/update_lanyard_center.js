const fs = require('fs');

let code = fs.readFileSync('LanyardProfileSection.jsx', 'utf8');

code = code.replace('anchor="left"', 'anchor="center"');
code = code.replace('size={0.62}', 'size={0.72}');
code = code.replace('strapLength={0.22}', 'strapLength={0.30}');
code = code.replace('breeze={0.15}', 'breeze={0.08}');

fs.writeFileSync('LanyardProfileSection.jsx', code);
console.log('LanyardProfileSection.jsx updated with anchor="center" and optimal framing!');
