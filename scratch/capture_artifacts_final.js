const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function captureArtifacts() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_capture_final_' + Date.now();
  const artifactDir = 'C:/Users/meet2/.gemini/antigravity-ide/brain/756d34ff-427e-4d54-a73d-74ad8325ba5f/';

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--remote-allow-origins=*',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { detached: false });

  try {
    let connected = false;
    for (let i = 0; i < 30; i++) {
      try {
        await fetchJson('http://127.0.0.1:9227/json/version');
        connected = true;
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    if (!connected) throw new Error('Could not connect to port 9227');

    const pages = await fetchJson('http://127.0.0.1:9227/json/list');
    let target = pages && pages.find(p => p.type === 'page');
    if (!target) {
      target = await fetchJson('http://127.0.0.1:9227/json/new?' + encodeURIComponent(url));
    }

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 1;
    const pending = new Map();

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 2500));

    // Capture Hero Dark
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'hero_precision_dark.png', Buffer.from(heroShot.data, 'base64'));
    console.log('Saved hero_precision_dark.png');

    // Scroll to By The Numbers
    await send('Runtime.evaluate', { expression: `document.getElementById('by-the-numbers').scrollIntoView();` });
    await new Promise(r => setTimeout(r, 800));
    const numbersShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'numbers_precision.png', Buffer.from(numbersShot.data, 'base64'));
    console.log('Saved numbers_precision.png');

    // Scroll to DNEG
    await send('Runtime.evaluate', { expression: `document.getElementById('exp-dneg').scrollIntoView();` });
    await new Promise(r => setTimeout(r, 800));
    const dnegShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'dneg_precision.png', Buffer.from(dnegShot.data, 'base64'));
    console.log('Saved dneg_precision.png');

    // Scroll to The Core
    await send('Runtime.evaluate', { expression: `document.getElementById('the-core').scrollIntoView();` });
    await new Promise(r => setTimeout(r, 800));
    const coreShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'core_precision.png', Buffer.from(coreShot.data, 'base64'));
    console.log('Saved core_precision.png');

    // Scroll to Let's Build
    await send('Runtime.evaluate', { expression: `document.getElementById('lets-build').scrollIntoView();` });
    await new Promise(r => setTimeout(r, 800));
    const buildShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'build_precision.png', Buffer.from(buildShot.data, 'base64'));
    console.log('Saved build_precision.png');

    // Toggle Theme to Light and Capture Hero Light
    await send('Runtime.evaluate', { expression: `document.getElementById('theme-toggle').click(); window.scrollTo(0, 0);` });
    await new Promise(r => setTimeout(r, 800));
    const heroLightShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'hero_precision_light.png', Buffer.from(heroLightShot.data, 'base64'));
    console.log('Saved hero_precision_light.png');

    ws.close();
  } catch(e) {
    console.error('Error capturing artifacts:', e);
  } finally {
    chrome.kill();
  }
}

captureArtifacts();
