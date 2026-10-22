const fs = require('fs');

// 1. Extract SplashCursor.jsx
const cursorLines = fs.readFileSync('cursor dark.txt', 'utf8').split(/\r?\n/);
let splashJsx = cursorLines.slice(17, 1103).join('\n');
splashJsx = splashJsx.replace(
  'function handleMouseDown(e) {',
  `function handleMouseDown(e) {
      const hero = document.getElementById('hero-section');
      if (hero && e.clientY <= hero.getBoundingClientRect().bottom) return;`
);
splashJsx = splashJsx.replace(
  'function handleMouseMove(e) {',
  `function handleMouseMove(e) {
      const hero = document.getElementById('hero-section');
      if (hero && e.clientY <= hero.getBoundingClientRect().bottom) return;`
);
// Adapt container style to post-hero
splashJsx = splashJsx.replace(
  "position: 'fixed',\n        top: 0,\n        left: 0,\n        zIndex: 50,\n        pointerEvents: 'none',\n        width: '100%',\n        height: '100%'",
  "position: 'absolute',\n        inset: 0,\n        zIndex: 1,\n        pointerEvents: 'none',\n        width: '100%',\n        height: '100%',\n        overflow: 'hidden'"
);
splashJsx = splashJsx.replace(
  "width: '100vw',\n          height: '100vh',",
  "width: '100%',\n          height: '100%',"
);
fs.writeFileSync('SplashCursor.jsx', splashJsx);
console.log('SplashCursor.jsx extracted:', fs.statSync('SplashCursor.jsx').size);

// 2. Extract MorphSlider.jsx and MorphSlider.css from Movies.txt
const movieLines = fs.readFileSync('Movies.txt', 'utf8').split(/\r?\n/);
const morphJsx = movieLines.slice(31, 716).join('\n');
const morphCss = movieLines.slice(717).join('\n');
fs.writeFileSync('MorphSlider.jsx', morphJsx);
fs.writeFileSync('MorphSlider.css', morphCss);
console.log('MorphSlider.jsx extracted:', fs.statSync('MorphSlider.jsx').size);
console.log('MorphSlider.css extracted:', fs.statSync('MorphSlider.css').size);
