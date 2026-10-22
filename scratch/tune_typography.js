const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldChunk = `        const strokeW1 = 1.0;
        const strokeW2 = 1.0;
        const strokeW3 = 0.9;

        const track1 = Math.round(fs1 * 0.075);
        const track2 = Math.round(fs2 * 0.075);
        const track3 = Math.round(fs3 * 0.115);`;

const newChunk = `        // Pure font-derived glyph shapes without extra contour stroke to keep all counters (A, B, R, P) crisp & open
        const strokeW1 = 0;
        const strokeW2 = 0;
        const strokeW3 = 0;

        const track1 = Math.round(fs1 * 0.088);
        const track2 = Math.round(fs2 * 0.088);
        const track3 = Math.round(fs3 * 0.135);`;

if (html.includes(oldChunk)) {
  html = html.replace(oldChunk, newChunk);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Hero typography contour stroke removed for crisp open counters');
} else {
  console.log('oldChunk not found');
}
