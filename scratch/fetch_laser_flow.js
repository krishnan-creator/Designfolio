const https = require('https');
const fs = require('fs');

const urls = [
  'https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Animations/LaserFlow/LaserFlow.jsx',
  'https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Backgrounds/LaserFlow/LaserFlow.jsx',
  'https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Components/LaserFlow/LaserFlow.jsx'
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(url, 'status:', res.statusCode);
    if (res.statusCode === 200) {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.writeFileSync('scratch/LaserFlow.jsx', data);
        console.log('Saved LaserFlow.jsx, size:', data.length);
      });
    }
  }).on('error', console.error);
});
