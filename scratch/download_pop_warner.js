const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const url = 'https://dl.dafont.com/dl/?f=pop_warner';
const zipPath = path.join(__dirname, 'pop_warner.zip');

console.log('Downloading Pop Warner from DaFont...');

const file = fs.createWriteStream(zipPath);
const req = https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.dafont.com/pop-warner.font'
  }
}, (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    console.log('Redirecting to:', res.headers.location);
    https.get(res.headers.location, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res2) => {
      res2.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Download complete, file size:', fs.statSync(zipPath).size);
        extractZip();
      });
    });
  } else {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download complete, file size:', fs.statSync(zipPath).size);
      extractZip();
    });
  }
});

req.on('error', (err) => console.error('Download error:', err));

function extractZip() {
  try {
    // In PowerShell / Windows, we can use tar or Expand-Archive to extract
    console.log('Extracting zip...');
    execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${__dirname}/pop_warner' -Force"`);
    console.log('Extracted files:');
    const files = fs.readdirSync(path.join(__dirname, 'pop_warner'));
    files.forEach(f => console.log(' - ' + f));
    
    // Copy font files to project root
    files.forEach(f => {
      if (f.endsWith('.ttf') || f.endsWith('.otf') || f.endsWith('.txt')) {
        fs.copyFileSync(path.join(__dirname, 'pop_warner', f), path.join(__dirname, '..', f));
        console.log(`Copied ${f} to project root.`);
      }
    });
  } catch (err) {
    console.error('Extraction error:', err.message);
  }
}
