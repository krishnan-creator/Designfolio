const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const PROJECTS = [
  {
    id: 'proj-ramayana',
    title: 'ASHRA Chapter 2: GAIYA',
    video: 'AC2_with.mp4',
    posterFile: 'poster-ashra-chapter-2.jpg',
    targetTimestamp: 7.000
  },
  {
    id: 'proj-dune',
    title: 'FIRMWARE UPDATE',
    video: 'Firmware_Update.mp4',
    posterFile: 'poster-firmware-update.jpg',
    targetTimestamp: 7.000
  },
  {
    id: 'proj-veerabhadra',
    title: 'PORSCHE',
    video: 'O.mp4',
    posterFile: 'poster-porsche.jpg',
    targetTimestamp: 0.000 // Exception: preserve initial frame
  },
  {
    id: 'proj-odyssey',
    title: 'NFL Holidays Are Coming',
    video: '2_NFL_Truks___Turkey.mp4',
    posterFile: 'poster-nfl-holidays.jpg',
    targetTimestamp: 0.000 // Exception: preserve initial frame
  },
  {
    id: 'proj-porsche',
    title: 'ASHRA Chapter 1: VAJRA',
    video: '7_Ashra__Chapter_-1___Vajra__.mp4',
    posterFile: 'poster-ashra-chapter-1.jpg',
    targetTimestamp: 7.000
  },
  {
    id: 'proj-motu',
    title: 'Demon.exe',
    video: 'I.mp4',
    posterFile: 'poster-demon-exe.jpg',
    targetTimestamp: 0.000 // Exception: preserve initial frame
  },
  {
    id: 'reel-01',
    title: 'JETOUR',
    video: 'jetour.mp4',
    posterFile: 'poster-jetour.jpg',
    targetTimestamp: 7.000
  },
  {
    id: 'reel-02',
    title: 'LOW CARB BREAD',
    video: 'Rang.mp4',
    posterFile: 'poster-low-carb-bread.jpg',
    targetTimestamp: 7.000
  },
  {
    id: 'reel-03',
    title: 'PROJECT V',
    video: 'Project_V.mp4',
    posterFile: 'poster-project-v.jpg',
    targetTimestamp: 7.000
  }
];

async function extractAllPosters() {
  console.log('--- EXTRACTING ALL SELECTED WORKS POSTERS ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  for (const item of PROJECTS) {
    console.log(`Extracting frame for ${item.title} (${item.video}) at ${item.targetTimestamp}s...`);

    const result = await page.evaluate(async (src, timestamp) => {
      return new Promise((resolve, reject) => {
        const v = document.createElement('video');
        v.src = src;
        v.crossOrigin = 'anonymous';
        v.muted = true;
        v.preload = 'auto';

        const seekAndCapture = () => {
          v.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(v, 0, 0, v.videoWidth, v.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            resolve({
              width: v.videoWidth,
              height: v.videoHeight,
              dataUrl: dataUrl
            });
          };

          if (timestamp === 0) {
            // Wait slightly for first frame to be ready or seek to 0.05
            v.currentTime = 0.05;
          } else {
            v.currentTime = timestamp;
          }
        };

        v.onloadeddata = seekAndCapture;
        v.onerror = (e) => reject(new Error('Failed to load ' + src));
        setTimeout(() => reject(new Error('Timeout loading ' + src)), 15000);
      });
    }, item.video, item.targetTimestamp);

    const base64Data = result.dataUrl.replace(/^data:image\/jpeg;base64,/, '');
    const outPath = path.join(__dirname, '..', item.posterFile);
    fs.writeFileSync(outPath, base64Data, 'base64');
    console.log(`Saved ${item.posterFile} (${result.width}x${result.height}, ${fs.statSync(outPath).size} bytes)`);
  }

  await browser.close();
  console.log('All posters extracted successfully!');
}

extractAllPosters().catch(e => {
  console.error('Extraction error:', e);
  process.exit(1);
});
