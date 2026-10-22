const fs = require('fs');

const content = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));

// Restore BTF canonical
const btf = content.sections.find(s => s.id === 'sec-beyond-frame');
btf.content.entries[0].image = 'Ramayana.png';
btf.content.entries[0].title = 'MYTHIC WORLDS';
btf.content.entries[1].image = 'dune-dneg.jpg';

// Restore SW canonical
const sw = content.sections.find(s => s.id === 'sec-selected-works');
sw.content.landscapeProjects[0].image = 'Ramayana.png';
sw.content.landscapeProjects[0].title = "NAMIT MALHOTRA'S RAMAYANA";

// Restore EXP canonical
const exp = content.sections.find(s => s.id === 'sec-expertise');
exp.content.companies[0].mediaSlots[0].image = 'dune-dneg.jpg';
exp.content.companies[0].mediaSlots[0].title = 'DUNE: PART THREE';
exp.content.companies[2].mediaSlots = []; // Cyberedge

fs.writeFileSync('data/content.json', JSON.stringify(content, null, 2), 'utf8');
fs.writeFileSync('data/content-draft.json', JSON.stringify(content, null, 2), 'utf8');

// Also remove scratch test files if they exist
['test_btf_asset.png', 'test_works_asset.png', 'test_exp_asset.png', 'test_upload_art.png'].forEach(f => {
  if (fs.existsSync(f)) fs.unlinkSync(f);
});

console.log('Restored canonical portfolio assets successfully');
