const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

function searchMatches(str) {
  let pos = 0;
  console.log(`=== Matches for: ${str} ===`);
  while ((pos = c.indexOf(str, pos)) !== -1) {
    console.log(`At ${pos}:`);
    console.log(c.substring(pos - 50, pos + 250));
    pos += str.length;
  }
}

searchMatches('header-techttext-mount');
searchMatches('mountTechText');
searchMatches('df-char');
