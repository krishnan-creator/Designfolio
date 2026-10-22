const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /<(?:section|div)[^>]+id=["']([^"']+)["'][^>]*class=["']([^"']*)["']/g;
let match;
const sections = [];
while ((match = regex.exec(html)) !== null) {
  const id = match[1];
  const cls = match[2];
  if (id.includes('hero') || id.includes('sec') || id.includes('number') || id.includes('beyond') || id.includes('orbit') || id.includes('selected') || id.includes('work') || id.includes('expert') || id.includes('core') || id.includes('build') || id.includes('contact') || id.includes('hobb')) {
    sections.push({ id, cls });
  }
}
console.log('Matching section IDs in index.html:');
console.log(JSON.stringify(sections, null, 2));
