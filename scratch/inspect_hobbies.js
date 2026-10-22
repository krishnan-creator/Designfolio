const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

function getChromePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found');
}

async function test() {
  const browser = await puppeteer.launch({
    executablePath: getChromePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2500));

  const info = await page.evaluate(() => {
    const archive = document.getElementById('hobbies-archive');
    const track = document.querySelector('.elastic-gallery-track');
    const slats = Array.from(document.querySelectorAll('.elastic-slat'));
    const populated = document.querySelectorAll('.elastic-slat--populated');
    const trackRect = track ? track.getBoundingClientRect() : null;
    const slatRects = slats.map((s, idx) => {
      const r = s.getBoundingClientRect();
      const img = s.querySelector('img');
      const title = s.querySelector('.elastic-caption-title')?.textContent.trim();
      const id = s.getAttribute('data-id') || s.getAttribute('id');
      const imgStyle = img ? window.getComputedStyle(img) : null;
      return {
        idx: idx + 1,
        id,
        title,
        width: Math.round(r.width),
        height: Math.round(r.height),
        objectFit: imgStyle?.objectFit,
        src: img?.getAttribute('src')
      };
    });

    return {
      hasArchive: !!archive,
      trackDimensions: trackRect ? { width: Math.round(trackRect.width), height: Math.round(trackRect.height) } : null,
      totalSlats: slats.length,
      populatedCount: populated.length,
      dataCount: track?.getAttribute('data-count'),
      slats: slatRects
    };
  });

  console.log('Public Hobbies State:');
  console.log('Track Dimensions:', info.trackDimensions);
  console.log('Total Slats:', info.totalSlats);
  console.log('Data Count attribute:', info.dataCount);
  info.slats.forEach((s) => {
    console.log('  [' + s.idx + '] ID: ' + s.id + ' (' + s.title + '): ' + s.width + 'x' + s.height + 'px, fit: ' + s.objectFit + ', src: ' + s.src);
  });

  await browser.close();
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
