const fs = require('fs');

['scratch/new_master_styles.css', 'scratch/new_master_scripts.js', 'scratch/apply_full_refinement.js'].forEach(file => {
  if (fs.existsSync(file)) {
    const c = fs.readFileSync(file, 'utf8');
    const idx = c.indexOf('designfolio-wordmark');
    console.log(`=== In ${file} (designfolio-wordmark: ${idx}) ===`);
    if (idx !== -1) {
      console.log(c.substring(idx - 50, idx + 400));
    }
  }
});
