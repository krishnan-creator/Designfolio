const fs = require('fs');
const path = require('path');

function search(dir, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (!['node_modules', '.git', 'AppData', 'Local Settings'].includes(ent.name)) {
          search(full, maxDepth, currentDepth + 1);
        }
      } else if (ent.isFile()) {
        const lower = ent.name.toLowerCase();
        if (lower.includes('id front') || (lower.endsWith('.png') && fs.statSync(full).mtimeMs > Date.now() - 3600000 * 2)) {
          console.log(full, fs.statSync(full).size, new Date(fs.statSync(full).mtime).toISOString());
        }
      }
    }
  } catch (e) {}
}

console.log('--- Searching Desktop ---');
search('C:\\Users\\meet2\\Desktop', 3);
console.log('--- Searching tempmediaStorage ---');
search('C:\\Users\\meet2\\.gemini\\antigravity-ide\\brain\\756d34ff-427e-4d54-a73d-74ad8325ba5f\\.tempmediaStorage', 2);
console.log('--- Searching Downloads ---');
search('C:\\Users\\meet2\\Downloads', 2);
