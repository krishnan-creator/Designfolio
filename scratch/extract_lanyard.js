const fs = require('fs');
const raw = fs.readFileSync('C:/Users/meet2/.gemini/antigravity-ide/brain/756d34ff-427e-4d54-a73d-74ad8325ba5f/.user_uploaded/media_1791903178293.txt', 'utf8');
const lines = raw.split('\n');

const jsLines = lines.slice(26, 1322);
let jsCode = jsLines.join('\n');
if (!jsCode.includes("import React")) {
  jsCode = "import React from 'react';\n" + jsCode;
}

fs.writeFileSync('Lanyard.jsx', jsCode, 'utf8');

const cssLines = lines.slice(1323);
fs.writeFileSync('Lanyard.css', cssLines.join('\n'), 'utf8');

console.log('Successfully wrote Lanyard.jsx and Lanyard.css');
