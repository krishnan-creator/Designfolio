const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

async function captureScene(scenario, outFilename) {
  const url = 'http://localhost:3000';
  const outPath = 'C:/Users/meet2/.gemini/antigravity-ide/brain/5196ad93-1e8a-4258-906f-149c2b867eca/' + outFilename;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_test_' + Math.random().toString(36).substring(7);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--remote-allow-origins=*',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { detached: false });

  chrome.on('error', (err) => console.error('Chrome spawn error:', err));

  try {
    let connected = false;
    for (let i = 0; i < 30; i++) {
      try {
        await fetchJson('http://127.0.0.1:9223/json/version');
        connected = true;
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    if (!connected) throw new Error('Could not connect to Chrome port 9223');

    const pages = await fetchJson('http://127.0.0.1:9223/json/list');
    let target = pages && pages.find(p => p.type === 'page');
    if (!target) {
      target = await fetchJson('http://127.0.0.1:9223/json/new?' + encodeURIComponent(url));
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
    // Wait for initial render and EXR frames
    await new Promise(r => setTimeout(r, 3500));

    if (scenario === 'hero_ferrofluid_hover') {
      // Simulate cursor hovering between line 1 and line 2 of the Hero Name
      await send('Runtime.evaluate', {
        expression: `
          (function() {
            const wrap = document.getElementById('hero-name-wrap');
            if (wrap) {
              const rect = wrap.getBoundingClientRect();
              const hoverX = rect.left + rect.width * 0.38;
              const hoverY = rect.top + rect.height * 0.48; // Between line 1 and line 2
              wrap.dispatchEvent(new MouseEvent('mouseenter', { clientX: hoverX, clientY: hoverY, bubbles: true }));
              wrap.dispatchEvent(new MouseEvent('mousemove', { clientX: hoverX, clientY: hoverY, bubbles: true }));
              window.dispatchEvent(new MouseEvent('mousemove', { clientX: hoverX, clientY: hoverY, bubbles: true }));
            }
          })();
        `
      });
      // Wait for particle displacement loop to run several frames
      await new Promise(r => setTimeout(r, 800));
    } else if (scenario === 'sticky_note_revealed') {
      await send('Runtime.evaluate', {
        expression: `
          (function() {
            const note = document.getElementById('hero-sticky-note');
            if (note) {
              note.classList.add('is-revealed');
              const lines = document.querySelectorAll('#sticky-body-lines .sticky-display-line');
              lines.forEach(l => l.classList.add('is-revealed'));
              // Subtle hover tilt
              note.style.transform = 'perspective(700px) rotateX(-1.5deg) rotateY(1.8deg) scale(1.008)';
            }
          })();
        `
      });
      await new Promise(r => setTimeout(r, 800));
    } else if (scenario === 'geometric_identity_dark') {
      await send('Runtime.evaluate', {
        expression: `
          (function() {
            const el = document.getElementById('geometric-identity');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
            // Simulate mouse hover in center of triangle grid
            const container = document.getElementById('triangle-grid-container');
            if (container) {
              const rect = container.getBoundingClientRect();
              container.dispatchEvent(new MouseEvent('mousemove', { clientX: rect.left + rect.width * 0.5, clientY: rect.top + rect.height * 0.5, bubbles: true }));
            }
          })();
        `
      });
      await new Promise(r => setTimeout(r, 1000));
    } else if (scenario === 'geometric_identity_light') {
      await send('Runtime.evaluate', {
        expression: `
          (function() {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
            const el = document.getElementById('geometric-identity');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
            const container = document.getElementById('triangle-grid-container');
            if (container) {
              const rect = container.getBoundingClientRect();
              container.dispatchEvent(new MouseEvent('mousemove', { clientX: rect.left + rect.width * 0.5, clientY: rect.top + rect.height * 0.5, bubbles: true }));
            }
          })();
        `
      });
      await new Promise(r => setTimeout(r, 1200));
    } else if (scenario === 'cursor_ink_bleed_dark') {
      await send('Runtime.evaluate', {
        expression: `
          (function() {
            const pts = [
              {x: 350, y: 400}, {x: 420, y: 380}, {x: 500, y: 350},
              {x: 600, y: 320}, {x: 720, y: 290}, {x: 860, y: 270}
            ];
            pts.forEach((p) => {
              window.dispatchEvent(new MouseEvent('mousemove', { clientX: p.x, clientY: p.y, bubbles: true }));
            });
          })();
        `
      });
      await new Promise(r => setTimeout(r, 90));
    } else if (scenario === 'cursor_ink_bleed_light') {
      await send('Runtime.evaluate', {
        expression: `
          (function() {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
            const el = document.getElementById('my-journey');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
            const pts = [
              {x: 350, y: 400}, {x: 420, y: 380}, {x: 500, y: 350},
              {x: 600, y: 320}, {x: 720, y: 290}, {x: 860, y: 270}
            ];
            pts.forEach((p) => {
              window.dispatchEvent(new MouseEvent('mousemove', { clientX: p.x, clientY: p.y, bubbles: true }));
            });
          })();
        `
      });
      await new Promise(r => setTimeout(r, 90));
    }

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(outPath, buf);
    console.log(`[${scenario}] Screenshot saved to ${outPath} (${buf.length} bytes)`);

    ws.close();
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

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

async function runAll() {
  const sc = process.argv[2] || 'all';
  if (sc === 'all' || sc === 'hero') {
    await captureScene('hero_ferrofluid_hover', 'screenshot_hero_ferrofluid_v4.png');
  }
  if (sc === 'all' || sc === 'sticky') {
    await captureScene('sticky_note_revealed', 'screenshot_sticky_note_v4.png');
  }
  if (sc === 'all' || sc === 'grid_dark') {
    await captureScene('geometric_identity_dark', 'screenshot_grid_dark_v4.png');
  }
  if (sc === 'all' || sc === 'grid_light') {
    await captureScene('geometric_identity_light', 'screenshot_grid_light_v4.png');
  }
  if (sc === 'all' || sc === 'trail_dark') {
    await captureScene('cursor_ink_bleed_dark', 'screenshot_trail_dark_v4.png');
  }
  if (sc === 'all' || sc === 'trail_light') {
    await captureScene('cursor_ink_bleed_light', 'screenshot_trail_light_v4.png');
  }
}

runAll().catch(console.error);
