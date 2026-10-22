const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

async function testWebsite() {
  const url = 'http://localhost:3000';
  const artifactDir = 'C:/Users/meet2/.gemini/antigravity-ide/brain/5196ad93-1e8a-4258-906f-149c2b867eca/';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_master_' + Math.random().toString(36).substring(7);

  console.log('Spawning headless Chrome...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
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
        await fetchJson('http://127.0.0.1:9224/json/version');
        connected = true;
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    if (!connected) throw new Error('Could not connect to Chrome port 9224');

    const pages = await fetchJson('http://127.0.0.1:9224/json/list');
    let target = pages && pages.find(p => p.type === 'page');
    if (!target) {
      target = await fetchJson('http://127.0.0.1:9224/json/new?' + encodeURIComponent(url));
    }

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 1;
    const pending = new Map();
    const consoleLogs = [];
    const errors = [];

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
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
        consoleLogs.push(`[${data.params.type}] ${text}`);
      }
      if (data.method === 'Runtime.exceptionThrown') {
        errors.push(data.params.exceptionDetails.text + ' ' + (data.params.exceptionDetails.exception ? data.params.exceptionDetails.exception.description : ''));
      }
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

    console.log('Navigating to', url);
    await send('Page.navigate', { url });

    // Wait for startup glitch and initial renders
    await new Promise(r => setTimeout(r, 3800));

    // Capture 1: Hero & Sticky Note
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const note = document.getElementById('hero-sticky-note');
          if (note) {
            note.classList.add('is-revealed');
            const lines = document.querySelectorAll('#sticky-body-lines .sticky-display-line');
            lines.forEach(l => l.classList.add('is-revealed'));
            note.style.transform = 'perspective(700px) rotateX(-1.5deg) rotateY(1.8deg) scale(1.008)';
          }
        })();
      `
    });
    await new Promise(r => setTimeout(r, 600));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'screenshot_hero_verified.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot_hero_verified.png');

    // Capture 2: By the Numbers Section
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const el = document.getElementById('by-the-numbers');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
          const firstTile = document.querySelector('.number-tile');
          if (firstTile) firstTile.classList.add('is-expanded');
        })();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'screenshot_by_the_numbers_verified.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot_by_the_numbers_verified.png');

    // Capture 3: Disciplines 9-Piece Puzzle
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const el = document.getElementById('disciplines');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        })();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'screenshot_disciplines_puzzle_verified.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot_disciplines_puzzle_verified.png');

    // Capture 4: My Expertise Section
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const el = document.getElementById('my-expertise');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        })();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'screenshot_my_expertise_verified.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot_my_expertise_verified.png');

    // Capture 5: The Pipeline Section
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const el = document.getElementById('the-pipeline');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        })();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'screenshot_pipeline_verified.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot_pipeline_verified.png');

    // Capture 6: Light Theme Cine Casero
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          document.documentElement.setAttribute('data-theme', 'light');
          document.body.classList.add('light-theme');
          document.body.classList.remove('dark-theme');
          const el = document.getElementById('by-the-numbers');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        })();
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'screenshot_light_theme_verified.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot_light_theme_verified.png');

    console.log('\n--- VERIFICATION REPORT ---');
    console.log('Console Logs count:', consoleLogs.length);
    consoleLogs.forEach(l => console.log('LOG:', l));
    console.log('Errors count:', errors.length);
    if (errors.length > 0) {
      console.error('ERRORS FOUND:', errors);
    } else {
      console.log('SUCCESS: Zero runtime JavaScript errors!');
    }

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

testWebsite().catch(console.error);
