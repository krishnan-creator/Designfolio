const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const secIds = [
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
  const tag = html.slice(idx - 100, idx + 40);
  console.log(`=== ${id} ===\n`, tag);
}
