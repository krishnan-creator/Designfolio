const fs = require('fs');
const path = require('path');

function searchAll(dir, depth = 0) {
  if (depth > 5) return;
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (!['AppData', 'Local Settings', 'node_modules', '.git'].includes(item.name)) {
          searchAll(full, depth + 1);
        }
      } else {
        if (item.name.toLowerCase().includes('id front')) {
          console.log('Found:', full, fs.statSync(full).size, fs.statSync(full).mtime);
        }
      }
    }
  } catch(e) {}
}

searchAll('C:\\Users\\meet2');
