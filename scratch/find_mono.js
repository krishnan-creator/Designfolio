const fs = require('fs');
const path = require('path');

fs.readdirSync('scratch').forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
    const full = path.join('scratch', file);
    try {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes('designfolio-wordmark') || c.includes('IBM Plex Mono')) {
        console.log(`Found in scratch/${file}`);
      }
    } catch (e) {}
  }
});
