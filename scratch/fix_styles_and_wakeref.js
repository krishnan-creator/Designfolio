const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove duplicate <style> tag on line 32
html = html.replace(/\s*<style>\s*@font-face\s*{\s*font-family:\s*'Gondens';/i, '\n    @font-face {\n      font-family: \'Gondens\';');

// 2. Fix wakeRef in initLaserFlow
html = html.replace(
  'const defaultOptions = {',
  'const wakeRef = { current: null };\n  const defaultOptions = {'
);

// 3. Ensure .dbl-title-main has Montserrat Bold directly at line 1289
html = html.replace(
  /\.dbl-title-main\s*{\s*font-family:\s*[^;]+;/,
  '.dbl-title-main {\n      font-family: \'Montserrat\', sans-serif !important;'
);

// 4. Ensure .number-val has Pop Warner directly at line 1411
html = html.replace(
  /\.number-val\s*{\s*font-family:\s*[^;]+;/,
  '.number-val {\n  font-family: \'Pop Warner\', sans-serif !important;'
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed index.html!');
