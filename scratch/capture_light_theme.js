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

async function captureHeroLight() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_capture_light_' + Date.now();
  const artifactDir = 'C:/Users/meet2/.gemini/antigravity-ide/brain/756d34ff-427e-4d54-a73d-74ad8325ba5f/';

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--remote-allow-origins=*',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { detached: false });

  try {
    let connected = false;
    for (let i = 0; i < 30; i++) {
      try {
        await fetchJson('http://127.0.0.1:9228/json/version');
        connected = true;
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    if (!connected) throw new Error('Port 9228 connection failed');

    const pages = await fetchJson('http://127.0.0.1:9228/json/list');
    let target = pages && pages.find(p => p.type === 'page');
    if (!target) {
      target = await fetchJson('http://127.0.0.1:9228/json/new?' + encodeURIComponent(url));
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

    // Click theme toggle to switch to light theme while remaining at top (Hero)
    await send('Runtime.evaluate', { expression: `document.getElementById('theme-toggle').click();` });
    await new Promise(r => setTimeout(r, 1200));

    const lightHeroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'hero_precision_light_verified.png', Buffer.from(lightHeroShot.data, 'base64'));
    console.log('Saved hero_precision_light_verified.png');

    // Scroll to Let's Build in Light Theme to verify rough dark card
    await send('Runtime.evaluate', { expression: `document.getElementById('lets-build').scrollIntoView();` });
    await new Promise(r => setTimeout(r, 800));
    const buildLightShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'build_precision_light.png', Buffer.from(buildLightShot.data, 'base64'));
    console.log('Saved build_precision_light.png');

    // Toggle back to dark theme
    await send('Runtime.evaluate', { expression: `document.getElementById('theme-toggle').click();` });
    await new Promise(r => setTimeout(r, 400));

    ws.close();
  } catch(e) {
    console.error('Error:', e);
  } finally {
    chrome.kill();
  }
}

captureHeroLight();
