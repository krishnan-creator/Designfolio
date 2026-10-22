const http = require('http');

http.get('http://localhost:3000', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Includes brand-df:', body.includes('id="brand-df"'));
    console.log('Includes the-core:', body.includes('id="the-core"'));
    console.log('Includes DOWNLOAD MY RESUME:', body.includes('DOWNLOAD MY RESUME'));
    console.log('Includes RAMAYANA:', body.includes('RAMAYANA'));
    console.log('Includes MASTERS OF THE UNIVERSE:', body.includes('MASTERS OF THE UNIVERSE'));
    console.log('Includes THE ODYSSEY:', body.includes('THE ODYSSEY'));
    process.exit(0);
  });
}).on('error', (e) => {
  console.error('Error fetching live server:', e.message);
  process.exit(1);
});
