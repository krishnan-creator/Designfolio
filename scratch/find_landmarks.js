const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);

const keywords = [
  'id="hero-section"',
  'name-particle-canvas',
  'exrPlaybackState',
  'Download My Resume',
  'selected-works',
  'visual-orbit',
  'expertise-section',
  'the-core',
  'by-the-numbers',
  'closing-build',
  'DNEG',
  'RAMAYANA',
  'handleHeroExrWake',
  'initDenseParticleTypography',
  'renderDenseFerrofluid',
  'theme-toggle'
];

keywords.forEach(kw => {
  const matches = [];
  lines.forEach((l, i) => {
    if (l.toLowerCase().includes(kw.toLowerCase())) matches.push(i + 1);
  });
  console.log(kw, '-> lines:', matches.slice(0, 10));
});
