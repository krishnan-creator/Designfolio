const fs = require('fs');
const path = require('path');

function search(dir, depth=0) {
  if (depth > 4) return;
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        search(full, depth + 1);
      } else {
        if (item.name.includes('ID Front') || item.name.includes('ID_Front') || item.name.includes('airtel')) {
          console.log('Match:', full, fs.statSync(full).size);
        }
      }
    }
  } catch(e) {}
}

search('C:\\Users\\meet2\\.gemini');
search('C:\\Users\\meet2\\AppData\\Local\\Temp');
