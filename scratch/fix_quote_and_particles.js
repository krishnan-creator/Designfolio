const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Declare quoteRevealed and ensure handleHeroExrWakeOnMouse alias exists
html = html.replace(
  'let stickyNoteRevealed = false;',
  'let stickyNoteRevealed = false;\n      let quoteRevealed = false;'
);

html = html.replace(
  'function handleHeroExrWakeOnAction(e) {',
  `function handleHeroExrWakeOnAction(e) {`
);

// Add alias:
if (!html.includes('const handleHeroExrWakeOnMouse = handleHeroExrWakeOnAction;')) {
  html = html.replace(
    'window.releaseHeroExrPlayback = function() {',
    `const handleHeroExrWakeOnMouse = handleHeroExrWakeOnAction;
      window.handleHeroExrWakeOnMouse = handleHeroExrWakeOnAction;
      window.releaseHeroExrPlayback = function() {`
  );
}

// 2. Call initDenseParticleTypography() immediately as well as on fonts.ready
html = html.replace(
  `document.fonts.ready.then(() => {
        if (document.fonts && document.fonts.load) {
          document.fonts.load("900 120px Anton").then(() => initDenseParticleTypography()).catch(() => initDenseParticleTypography());
        } else {
          initDenseParticleTypography();
        }
        requestAnimationFrame(renderDenseFerrofluid);
      });`,
  `// Synchronous initial generation so particles are immediately active
      initDenseParticleTypography();
      requestAnimationFrame(renderDenseFerrofluid);

      // Re-sample once web fonts finish loading for pixel-perfect font contours
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (document.fonts.load) {
            document.fonts.load("900 120px Anton").then(() => initDenseParticleTypography()).catch(() => initDenseParticleTypography());
          } else {
            initDenseParticleTypography();
          }
        });
      }`
);

fs.writeFileSync('index.html', html);
console.log('Fixed quoteRevealed declaration, handleHeroExrWakeOnMouse alias, and synchronous particle initialization!');
