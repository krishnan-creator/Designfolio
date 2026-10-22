const fs = require('fs');

['index.html.bak_before_update03', 'index.html.bak_master', 'index.html'].forEach(f => {
  if (fs.existsSync(f)) {
    const c = fs.readFileSync(f, 'utf8');
    console.log(`=== File: ${f} ===`);
    ['exp-dneg', 'exp-impromp2', 'exp-cyberedge', 'exp-premasai'].forEach(id => {
      const idx = c.indexOf(id);
      console.log(`  ${id}: idx = ${idx}`);
      if (idx !== -1) {
        console.log(`    Snippet: ${c.substring(idx - 30, idx + 120).replace(/\n/g, ' ')}`);
      }
    });
  }
});
