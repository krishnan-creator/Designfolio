const fs = require('fs');
const c = fs.readFileSync('index.html.bak_before_update03', 'utf8');

function extractRow(id) {
  const start = c.indexOf(`id="${id}"`);
  const rowStart = c.lastIndexOf('<div class="expertise-row"', start);
  // find next expertise-row or end of list
  let next = c.indexOf('<div class="expertise-row"', start + 20);
  if (next === -1) next = c.indexOf('</div>\n          </div>', start);
  console.log(`\n=================== ROW: ${id} ===================`);
  console.log(c.substring(rowStart, next));
}

extractRow('exp-dneg');
extractRow('exp-impromp2');
extractRow('exp-cyberedge');
extractRow('exp-premasai');
