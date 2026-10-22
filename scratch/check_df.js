const fs = require('fs');

['index.html', 'index.html.bak', 'index.html.bak_master', 'index.html.bak_before_update03'].forEach(file => {
  if (fs.existsSync(file)) {
    const c = fs.readFileSync(file, 'utf8');
    const idx = c.indexOf('brand-designfolio');
    console.log(`\n=== In ${file} (brand-designfolio: ${idx}) ===`);
    if (idx !== -1) {
      console.log(c.substring(idx - 100, idx + 400));
    }
    const idxGlitch = c.indexOf('designfolio-wordmark');
    console.log(`=== In ${file} (designfolio-wordmark: ${idxGlitch}) ===`);
    if (idxGlitch !== -1) {
      console.log(c.substring(idxGlitch - 100, idxGlitch + 400));
    }
  }
});
