const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

const executablePath = edgePaths.find(p => fs.existsSync(p));

async function main() {
  console.log('Using browser at:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // 1. Check Section 05: THE CORE & ID Pill
  const pillStyleDark = await page.evaluate(() => {
    const pill = document.querySelector('.lanyard-drag-instruction');
    const text = document.querySelector('.lanyard-drag-text');
    const tag = document.querySelector('.lanyard-profile-section__visual');
    if (!pill) return null;
    const computedPill = window.getComputedStyle(pill);
    const computedText = window.getComputedStyle(text);
    const pillRect = pill.getBoundingClientRect();
    const tagRect = tag ? tag.getBoundingClientRect() : null;
    return {
      text: text?.textContent?.trim(),
      bg: computedPill.backgroundColor,
      textColor: computedText.color,
      top: pillRect.top,
      pillRect,
      tagRect
    };
  });
  console.log('THE CORE ID Pill in Dark Theme:', pillStyleDark);

  // 2. Check Light Theme pill style
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 200));

  const pillStyleLight = await page.evaluate(() => {
    const pill = document.querySelector('.lanyard-drag-instruction');
    const text = document.querySelector('.lanyard-drag-text');
    if (!pill) return null;
    const computedPill = window.getComputedStyle(pill);
    const computedText = window.getComputedStyle(text);
    return {
      bg: computedPill.backgroundColor,
      textColor: computedText.color
    };
  });
  console.log('THE CORE ID Pill in Light Theme:', pillStyleLight);

  // Revert to dark theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await new Promise(r => setTimeout(r, 200));

  // 3. Check Section 06: HOBBIES
  const hobbiesInfo = await page.evaluate(() => {
    const sec = document.querySelector('#hobbies-archive');
    const header = sec?.querySelector('.hobbies-compact-header');
    const cards = sec?.querySelectorAll('.hobby-card');
    const coreSec = document.querySelector('#the-core');
    const gap = sec && coreSec ? (sec.getBoundingClientRect().top - coreSec.getBoundingClientRect().bottom) : null;
    return {
      exists: !!sec,
      headerText: header?.textContent?.replace(/\s+/g, ' ').trim(),
      cardsCount: cards?.length,
      cardTitles: Array.from(cards || []).map(c => c.querySelector('.hobby-card__title')?.textContent?.trim()),
      cardImages: Array.from(cards || []).map(c => c.querySelector('.hobby-card__image')?.getAttribute('src')),
      gapFromCore: gap
    };
  });
  console.log('Hobbies Section info:', hobbiesInfo);

  // 4. Check Section 07: CTA
  const ctaInfo = await page.evaluate(() => {
    const sec = document.querySelector('#lets-build');
    const eyebrow = sec?.querySelector('.dbl-meta-label')?.textContent?.replace(/\s+/g, ' ').trim();
    const h2Lines = Array.from(sec?.querySelectorAll('.build-headline-line') || []).map(l => l.textContent?.trim());
    const accentSlash = !!sec?.querySelector('.build-headline-accent-slash');
    const statement = sec?.querySelector('.build-statement')?.textContent?.trim();
    const mailBtn = sec?.querySelector('.build-btn-primary');
    const mailHref = mailBtn?.getAttribute('href');
    const mailText = mailBtn?.querySelector('span')?.textContent?.trim();
    const mailIcon = !!mailBtn?.querySelector('.build-btn-mail-icon');

    return {
      eyebrow,
      h2Lines,
      accentSlash,
      statement,
      mailHref,
      mailText,
      mailIcon
    };
  });
  console.log('CTA Section info:', ctaInfo);

  // 5. Test Mobile Viewport (400px)
  await page.setViewport({ width: 400, height: 800 });
  await new Promise(r => setTimeout(r, 200));
  const mobileInfo = await page.evaluate(() => {
    const ctaSec = document.querySelector('#lets-build');
    const h2 = ctaSec?.querySelector('.build-headline');
    const pill = document.querySelector('.lanyard-drag-instruction');
    const hobbies = document.querySelector('.hobbies-grid');
    const computedHobbies = hobbies ? window.getComputedStyle(hobbies) : null;

    return {
      h2Width: h2?.offsetWidth,
      pillVisible: pill && pill.offsetWidth > 0,
      hobbiesGridCols: computedHobbies?.gridTemplateColumns
    };
  });
  console.log('Mobile 400px info:', mobileInfo);

  await browser.close();
  console.log('Puppeteer test finished successfully!');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
