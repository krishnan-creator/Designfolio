const fs = require('fs');

['SplashCursor.jsx', 'MorphSlider.jsx', 'Hyperspeed.jsx'].forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  console.log(`${f} imports React?`, c.includes('import React'));
  if (!c.includes('import React')) {
    console.log(`  First line of ${f}:`, c.substring(0, 100));
  }
});
