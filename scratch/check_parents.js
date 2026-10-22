const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const secIds = [
  'hero-section',
  'by-the-numbers',
  'beyond-the-frame-zone',
  'selected-works',
  'visual-orbit',
  'my-expertise',
  'the-core',
  'hobbies-archive',
  'lets-build'
];

for (const id of secIds) {
  const idx = html.indexOf(`id="${id}"`);
  console.log(id, 'found at index:', idx);
}
