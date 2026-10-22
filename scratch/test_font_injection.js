const fs = require('fs');

// Read the original index.html
let html = fs.readFileSync('index.html.bak_before_directive', 'utf8');

console.log('Original length:', html.length);

// 1. Add Montserrat font link and Pop Warner @font-face
const fontLinkTarget = '<link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Barlow+Condensed:wght@800;900&family=Bebas+Neue&family=Caveat:wght@600;700&family=Great+Vibes&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">';
const fontLinkReplacement = '<link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Barlow+Condensed:wght@800;900&family=Bebas+Neue&family=Caveat:wght@600;700&family=Great+Vibes&family=JetBrains+Mono:wght@400;500;600;700&family=Montserrat:wght@700;800;900&family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">\n\n  <style>\n    @font-face {\n      font-family: \'Pop Warner\';\n      src: url(\'pop-warner.ttf\') format(\'truetype\');\n      font-weight: normal;\n      font-style: normal;\n      font-display: swap;\n    }';

if (html.includes(fontLinkTarget)) {
  html = html.replace(fontLinkTarget, fontLinkReplacement);
  console.log('Step 1: Font link updated with Montserrat & Pop Warner @font-face');
} else {
  console.warn('Could not find fontLinkTarget');
}

fs.writeFileSync('scratch/test_out.html', html, 'utf8');
console.log('Test written');
