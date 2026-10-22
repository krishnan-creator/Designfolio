const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Animations/SplashCursor/SplashCursor.jsx';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('scratch/SplashCursor.jsx', data);
    console.log('Saved SplashCursor.jsx, size:', data.length);
  });
}).on('error', (e) => console.error(e));
