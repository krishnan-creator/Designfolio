const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /<section[^>]*id=["']([^"']+)["'][^>]*>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log('section:', match[1]);
}

const mainDivs = html.match(/class=["'][^"']*(?:section|container|zone|wrap|mount)[^"']*["']/g) || [];
console.log('Class matches:', mainDivs.slice(0, 30));
