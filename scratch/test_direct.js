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
  console.log('Connecting to Chrome page target...');
  const wsUrl = await getPageWsUrl();
  console.log('Page ws URL:', wsUrl);

  const WebSocket = globalThis.WebSocket || require('ws');
  const ws = new WebSocket(wsUrl);

  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
      console.log(`[BROWSER ${msg.params.type}]:`, text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]:', msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails);
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

  console.log('Waiting for components to mount and render...');
  await sleep(4000);

  // Evaluate DOM
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const techTextCanvas = document.querySelector('#header-techttext-mount canvas');
      const darkBgCanvas = document.querySelector('#dark-background-mount canvas');
      const domeSphere = document.querySelector('#dome-gallery-mount .sphere');
      const heroNameCanvas = document.querySelector('#name-particle-canvas');
      const laserFlowCanvas = document.querySelector('#laser-flow-canvas');
      const theme = document.documentElement.getAttribute('data-theme');
      const title = document.querySelector('.visual-orbit-section h2')?.textContent;
      const tileImages = Array.from(document.querySelectorAll('#dome-gallery-mount .item img')).map(img => img.src.split('/').pop());

      return {
        hasTechTextCanvas: !!techTextCanvas,
        techTextCanvasWidth: techTextCanvas ? techTextCanvas.width : 0,
        hasDarkBgCanvas: !!darkBgCanvas,
        darkBgCanvasWidth: darkBgCanvas ? darkBgCanvas.width : 0,
        hasDomeSphere: !!domeSphere,
        hasHeroNameCanvas: !!heroNameCanvas,
        hasLaserFlowCanvas: !!laserFlowCanvas,
        currentTheme: theme,
        sectionTitle: title,
        domeTileCount: document.querySelectorAll('#dome-gallery-mount .item').length,
        sampleTileImages: tileImages.slice(0, 5)
      };
    })()`,
    returnByValue: true
  });

  console.log('DOM Evaluation Result:', evalResult.result.value);

  // Capture screenshot 1: Hero view (Hero name, header, and boundary)
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_hero.png', Buffer.from(ss1.data, 'base64'));
  console.log('Screenshot 1 saved: scratch/screenshot_hero.png');

  // Scroll to Hero/Ticker boundary to verify absence of white reverse-T artifact
  await send('Runtime.evaluate', {
    expression: `window.scrollTo(0, 500)`
  });
  await sleep(1000);
  const ssBoundary = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_boundary.png', Buffer.from(ssBoundary.data, 'base64'));
  console.log('Screenshot Boundary saved: scratch/screenshot_boundary.png');

  // Scroll to VISUAL ORBIT section
  await send('Runtime.evaluate', {
    expression: `(() => {
      const vo = document.getElementById('visual-orbit');
      if (vo) vo.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`
  });
  await sleep(1500);
  const ssOrbit = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_visual_orbit.png', Buffer.from(ssOrbit.data, 'base64'));
  console.log('Screenshot Visual Orbit saved: scratch/screenshot_visual_orbit.png');

  // Test theme button click & particle wave
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, 0);
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.click();
    })()`
  });
  console.log('Clicked theme toggle button...');
  await sleep(800);
  const ssRipple = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_ripple.png', Buffer.from(ssRipple.data, 'base64'));
  console.log('Screenshot Ripple saved: scratch/screenshot_ripple.png');

  await sleep(1600);
  const themeAfter = await send('Runtime.evaluate', {
    expression: `document.documentElement.getAttribute('data-theme')`,
    returnByValue: true
  });
  console.log('Theme after ripple:', themeAfter.result.value);

  ws.close();
  chrome.kill();
  console.log('Direct test complete!');
}

run().catch(err => {
  console.error('Error:', err);
  try { chrome.kill(); } catch(e) {}
  process.exit(1);
});
