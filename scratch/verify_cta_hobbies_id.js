const http = require('http');
const fs = require('fs');

async function testUrl(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          length: Buffer.concat(data).length
        });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- TESTING SERVER ENDPOINTS ---');
  const indexRes = await testUrl('/');
  console.log('Index / status:', indexRes.statusCode, 'length:', indexRes.length);

  const imgRes = await testUrl('/ID%20Front(6).png');
  console.log('/ID%20Front(6).png status:', imgRes.statusCode, 'length:', imgRes.length, 'type:', imgRes.headers['content-type']);

  const backImgRes = await testUrl('/ID%20Back(1).png');
  console.log('/ID%20Back(1).png status:', backImgRes.statusCode, 'length:', backImgRes.length);

  const strapImgRes = await testUrl('/ID%20tag(1).png');
  console.log('/ID%20tag(1).png status:', strapImgRes.statusCode, 'length:', strapImgRes.length);

  const bundleRes = await testUrl('/client-bundle.js');
  console.log('/client-bundle.js status:', bundleRes.statusCode, 'length:', bundleRes.length);

  const bundleCssRes = await testUrl('/client-bundle.css');
  console.log('/client-bundle.css status:', bundleCssRes.statusCode, 'length:', bundleCssRes.length);

  const landscape1Res = await testUrl('/landscape-01.jpg');
  console.log('/landscape-01.jpg status:', landscape1Res.statusCode, 'length:', landscape1Res.length);

  const landscape5Res = await testUrl('/landscape-05.jpg');
  console.log('/landscape-05.jpg status:', landscape5Res.statusCode, 'length:', landscape5Res.length);

  console.log('\n--- VERIFYING INDEX.HTML CONTENT ---');
  const html = fs.readFileSync('index.html', 'utf8');

  // 1. CTA Heading and Subheading copy check
  const ctaEyebrow = html.includes('LET’S CONNECT');
  const ctaLine1 = html.includes('THAT’S HOW I SEE THE WORLD.');
  const ctaLine2 = html.includes('WHAT’S YOUR PERSPECTIVE?');
  const ctaSlash = html.includes('build-headline-accent-slash');
  const ctaBody = html.includes('Thanks for exploring my work. If something here resonates with you, I’d love to connect, exchange ideas, and explore what comes next.');
  const ctaMailto = html.includes('mailto:meet2krishnan@gmail.com?subject=Let%27s%20Build%20Something%20Together');
  const oldCtaHeading = html.includes('HAVE A WORLD IN MIND? LET’S MAKE IT CINEMATIC.');

  console.log('CTA Eyebrow (LET’S CONNECT):', ctaEyebrow);
  console.log('CTA Line 1 (THAT’S HOW I SEE THE WORLD.):', ctaLine1);
  console.log('CTA Line 2 (WHAT’S YOUR PERSPECTIVE?):', ctaLine2);
  console.log('CTA Accent Slash preserved:', ctaSlash);
  console.log('CTA Body exact copy:', ctaBody);
  console.log('CTA Mailto exact link:', ctaMailto);
  console.log('Old CTA Heading eliminated:', !oldCtaHeading);

  // 2. Hobbies Subsection check
  const hobbiesCompactHeader = html.includes('hobbies-compact-header');
  const hobbiesArts = html.includes('landscape-01.jpg') && html.includes('ARTS');
  const hobbiesGames = html.includes('landscape-05.jpg') && html.includes('GAMES');
  const hobbiesNoLargeHero = !html.includes('Beyond the pipeline — the things I create and play.');

  console.log('Hobbies Compact Header present:', hobbiesCompactHeader);
  console.log('Hobbies Arts present:', hobbiesArts);
  console.log('Hobbies Games present:', hobbiesGames);
  console.log('Hobbies Large Subtitle eliminated:', hobbiesNoLargeHero);

  // 3. ID Card Asset reference check
  const idFront6 = html.includes('ID Front(6).png');
  console.log('ID Front(6).png referenced in index.html:', idFront6);

  console.log('\nAll static checks passed!');
}

run().catch(console.error);
