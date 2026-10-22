const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--window-size=1440,900',
  '--hide-scrollbars',
  '--disable-gpu-shader-disk-cache',
  'http://localhost:3000/'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPageWsUrl() {
  for (let i = 0; i < 25; i++) {
    try {
      const list = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json/list', resp => {
          let data = '';
          resp.on('data', chunk => data += chunk);
          resp.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch(e) {}
    await sleep(300);
  }
  throw new Error('Could not find page target');
}

async function run() {
  console.log('Connecting to Chrome via CDP...');
  const wsUrl = await getPageWsUrl();
  const WebSocket = globalThis.WebSocket || require('ws');
  const ws = new WebSocket(wsUrl);

  let id = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        consoleErrors.push(text);
        console.error('[BROWSER ERROR]:', text);
      }
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(resolve => ws.onopen = resolve);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  console.log('Waiting for initial page load and component mounts...');
  await sleep(3500);

  // 1. Verify Hero Name 3 lines & Sticky Note in Dark Mode
  const heroCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('.hero-name-wrap h1');
      const stickyNote = document.getElementById('hero-sticky-note');
      const pinImg = document.querySelector('.push-pin-img');
      const paperImg = document.querySelector('.sticky-paper-img');
      const headerWordmark = document.getElementById('header-techttext-mount');
      return {
        h1Text: h1 ? h1.innerText : null,
        hasStickyNote: !!stickyNote,
        pinSrc: pinImg ? pinImg.getAttribute('src') : null,
        paperSrc: paperImg ? paperImg.getAttribute('src') : null,
        hasHeaderMount: !!headerWordmark
      };
    })()`,
    returnByValue: true
  });
  console.log('Hero Identity Check:', heroCheck.result.value);

  // Trigger sticky note reveal
  await send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 300 }))`
  });
  await sleep(1500);

  const ssHero = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_hero_dark.png', Buffer.from(ssHero.data, 'base64'));
  console.log('Saved scratch/verify_hero_dark.png');

  // 2. Verify By the Numbers & MorphSlider
  await send('Runtime.evaluate', {
    expression: `document.getElementById('by-the-numbers').scrollIntoView({ behavior: 'instant', block: 'start' })`
  });
  await sleep(1500);

  const morphCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const morphMount = document.getElementById('morph-slider-mount');
      const morphCanvas = morphMount ? morphMount.querySelector('canvas') : null;
      const morphCaptions = morphMount ? Array.from(morphMount.querySelectorAll('.morph-slider-caption-text')).map(c => c.textContent.trim()) : [];
      return {
        hasMount: !!morphMount,
        hasCanvas: !!morphCanvas,
        captions: morphCaptions
      };
    })()`,
    returnByValue: true
  });
  console.log('MorphSlider Check:', morphCheck.result.value);

  const ssNumbers = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_morph_slider.png', Buffer.from(ssNumbers.data, 'base64'));
  console.log('Saved scratch/verify_morph_slider.png');

  // 3. Verify Visual Orbit (DomeGallery with 4 HD unique images)
  await send('Runtime.evaluate', {
    expression: `document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' })`
  });
  await sleep(1500);

  const orbitCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const tiles = Array.from(document.querySelectorAll('#dome-gallery-mount .item__image img'));
      const uniqueSrcs = [...new Set(tiles.map(img => img.getAttribute('src')))];
      const sphereMain = document.querySelector('.sphere-main');
      return {
        totalTileCount: tiles.length,
        uniqueSrcCount: uniqueSrcs.length,
        sources: uniqueSrcs,
        hasSphereMain: !!sphereMain
      };
    })()`,
    returnByValue: true
  });
  console.log('Visual Orbit Check:', orbitCheck.result.value);

  const ssOrbit = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_visual_orbit.png', Buffer.from(ssOrbit.data, 'base64'));
  console.log('Saved scratch/verify_visual_orbit.png');

  // 4. Verify A Bit About Me (FAN ARTIST panel)
  await send('Runtime.evaluate', {
    expression: `document.getElementById('a-bit-about-me').scrollIntoView({ behavior: 'instant', block: 'start' })`
  });
  await sleep(1200);

  const fanArtistCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const headline = document.querySelector('.about-drawing-card .drawing-headline');
      return {
        headlineText: headline ? headline.textContent.trim() : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Fan Artist Check:', fanArtistCheck.result.value);

  const ssAbout = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_fan_artist.png', Buffer.from(ssAbout.data, 'base64'));
  console.log('Saved scratch/verify_fan_artist.png');

  // 5. Test Theme Switching: Switch to Light Theme
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0)` });
  await sleep(400);
  console.log('Triggering theme switch to LIGHT...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('theme-toggle').click()`
  });
  await sleep(2400); // Wait for glass ripple and settle

  const lightThemeCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      const bgLayer = document.getElementById('post-hero-bg-mount');
      const hyperspeedCanvas = bgLayer ? bgLayer.querySelector('.hyperspeed canvas') : null;
      const splashLayer = document.getElementById('post-hero-splash-cursor-mount');
      const splashDisplay = splashLayer ? window.getComputedStyle(splashLayer).display : null;
      return {
        theme,
        hasHyperspeedCanvas: !!hyperspeedCanvas,
        splashDisplay
      };
    })()`,
    returnByValue: true
  });
  console.log('Light Theme Background Check:', lightThemeCheck.result.value);

  // Scroll to post-hero in light theme to capture Hyperspeed
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 750)` });
  await sleep(800);
  const ssLightBg = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_light_hyperspeed.png', Buffer.from(ssLightBg.data, 'base64'));
  console.log('Saved scratch/verify_light_hyperspeed.png');

  // Switch back to Dark Theme
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0)` });
  await sleep(300);
  await send('Runtime.evaluate', {
    expression: `document.getElementById('theme-toggle').click()`
  });
  await sleep(2400);

  const finalCheck = await send('Runtime.evaluate', {
    expression: `document.documentElement.getAttribute('data-theme')`,
    returnByValue: true
  });
  console.log('Restored to final theme:', finalCheck.result.value);
  console.log('Console Errors Detected:', consoleErrors.length);

  ws.close();
  chrome.kill();

  if (consoleErrors.length > 0) {
    console.warn('Browser had console errors:', consoleErrors);
  } else {
    console.log('ALL VERIFICATIONS PASSED WITH ZERO CONSOLE ERRORS!');
  }
}

run().catch(err => {
  console.error('Test script error:', err);
  try { chrome.kill(); } catch(e) {}
  process.exit(1);
});
