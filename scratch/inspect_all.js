const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

function showSection(name, startPattern, length = 1500) {
  console.log(`\n=================== ${name} ===================`);
  const idx = content.indexOf(startPattern);
  if (idx !== -1) {
    console.log(content.substring(idx - 100, idx + length));
  } else {
    console.log(`NOT FOUND: ${startPattern}`);
  }
}

showSection('HEADER HTML', 'brand-cbk');
showSection('HERO NAME CANVAS HTML', 'name-particle-canvas');
showSection('STICKY NOTE HTML', 'sticky-note');
showSection('VISUAL ORBIT HTML', 'visual-orbit');
showSection('EXPERTISE / JOURNEY HTML', 'expertise-list');
showSection('A BIT ABOUT ME / THE CORE HTML', 'a-bit-about-me');
