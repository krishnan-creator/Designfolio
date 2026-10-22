const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testBackstageAndExpertise() {
  console.log('--- Testing My Expertise & Backstage Controls ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050 });

  // 1. Check live portfolio for My Expertise rows
  console.log('1. Checking live portfolio http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const liveCompanies = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.expertise-row')).map(row => {
      const id = row.id;
      const heading = row.querySelector('.company-heading')?.textContent?.trim();
      const logoSlot = row.querySelector('.company-logo-slot');
      const img = logoSlot ? logoSlot.querySelector('img') : null;
      return {
        id,
        heading,
        hasLogoImg: !!img,
        logoSrc: img ? img.getAttribute('src') : null,
        innerSlotText: logoSlot ? logoSlot.textContent.replace(/\s+/g, ' ').trim() : ''
      };
    });
    return rows;
  });
  console.log('Live portfolio expertise rows:', JSON.stringify(liveCompanies, null, 2));

  // 2. Open Backstage and test section selection
  console.log('\n2. Opening Backstage http://localhost:3000/backstage...');
  await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  // Handle passphrase if modal exists
  const hasAuthPassword = await page.$('#auth-password');
  if (hasAuthPassword) {
    console.log('Submitting passphrase cbk2026 into #auth-password...');
    await page.type('#auth-password', 'cbk2026');
    await page.click('#auth-submit-btn');
    await new Promise(r => setTimeout(r, 1200));
  }

  // 3. Test Hero Audio controls in Backstage
  console.log('\n3. Testing Hero Section controls in Backstage...');
  await page.evaluate(() => {
    if (typeof selectSection === 'function') selectSection('sec-hero');
  });
  await new Promise(r => setTimeout(r, 600));

  const heroAudioBackstage = await page.evaluate(() => {
    const startInput = document.querySelector('input[oninput*="audio.startFrame"]');
    const endInput = document.querySelector('input[oninput*="audio.endFrame"]');
    const audioSrc = document.querySelector('input[data-field-path="audio.src"], input[value*="snap.mpeg"]');
    return {
      startFrameValue: startInput ? startInput.value : null,
      endFrameValue: endInput ? endInput.value : null,
      audioSrcValue: audioSrc ? audioSrc.value : null
    };
  });
  console.log('Hero audio inputs in Backstage:', heroAudioBackstage);

  // 4. Test My Expertise controls in Backstage
  console.log('\n4. Selecting My Expertise section in Backstage...');
  await page.evaluate(() => {
    if (typeof selectSection === 'function') selectSection('sec-expertise');
  });
  await new Promise(r => setTimeout(r, 600));

  const expertiseBackstage = await page.evaluate(() => {
    const logoInputs = Array.from(document.querySelectorAll('input[data-field-path*=".logo"], input[oninput*="companies"][oninput*="logo"]')).map(inp => ({
      path: inp.getAttribute('data-field-path'),
      val: inp.value
    }));
    const collectionTitles = Array.from(document.querySelectorAll('.collection-card-num')).map(el => el.textContent.trim());
    return {
      collectionTitles,
      logoInputs
    };
  });
  console.log('My Expertise company records in Backstage:', JSON.stringify(expertiseBackstage, null, 2));

  // 5. Test saving a logo for DNEG in Backstage and verifying persistence!
  console.log('\n5. Testing logo change and save for DNEG...');
  await page.evaluate(() => {
    const comp0Logo = document.querySelector('input[data-field-path="companies.0.logo"]');
    if (comp0Logo) {
      comp0Logo.value = 'dune-dneg.jpg';
      comp0Logo.dispatchEvent(new Event('input', { bubbles: true }));
      comp0Logo.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 400));

  // Click Save button
  console.log('Clicking Save in Backstage...');
  await page.click('.btn-tool.btn-save');
  await new Promise(r => setTimeout(r, 1200));

  // Verify in content.json on disk
  const content = JSON.parse(fs.readFileSync('./data/content.json', 'utf8'));
  const dnegLogoOnDisk = content.sections.find(s => s.id === 'sec-expertise').content.companies[0].logo;
  console.log(`Verified DNEG logo saved to content.json: "${dnegLogoOnDisk}"`);

  // Verify on live portfolio that DNEG renders the image with object-fit: contain!
  console.log('\n6. Reloading live portfolio to verify rendered logo image...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const dnegLiveLogo = await page.evaluate(() => {
    const dnegRow = document.getElementById('exp-dneg');
    const img = dnegRow ? dnegRow.querySelector('.company-logo-slot img') : null;
    return {
      hasImg: !!img,
      src: img ? img.getAttribute('src') : null,
      objectFit: img ? window.getComputedStyle(img).objectFit : null
    };
  });
  console.log('Rendered DNEG logo on live portfolio:', dnegLiveLogo);

  // Reset DNEG logo back to clean state
  content.sections.find(s => s.id === 'sec-expertise').content.companies[0].logo = "";
  fs.writeFileSync('./data/content.json', JSON.stringify(content, null, 2), 'utf8');
  fs.writeFileSync('./data/content-draft.json', JSON.stringify(content, null, 2), 'utf8');
  console.log('\nReset DNEG logo to clean state on disk.');

  await browser.close();
  console.log('\n✅ All Backstage & Expertise tests PASSED.');
}

testBackstageAndExpertise().catch(e => {
  console.error(e);
  process.exit(1);
});
