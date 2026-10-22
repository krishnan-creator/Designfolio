const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const start = c.indexOf('function initDenseParticleTypography()');
const end = c.indexOf('function animateFormationStep()', start);
console.log(c.substring(start, end));
