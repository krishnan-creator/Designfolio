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

async function runVerification() {
  const url = 'http://localhost:3000';
  const outDir = 'C:/Users/meet2/.gemini/antigravity-ide/brain/756d34ff-427e-4d54-a73d-74ad8325ba5f/';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_verify_' + Date.now();

  console.log('Launching headless Chrome for verification...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
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
        await fetchJson('http://127.0.0.1:9225/json/version');
        connected = true;
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    if (!connected) throw new Error('Could not connect to Chrome port 9225');

    const pages = await fetchJson('http://127.0.0.1:9225/json/list');
    let target = pages && pages.find(p => p.type === 'page');
    if (!target) {
      target = await fetchJson('http://127.0.0.1:9225/json/new?' + encodeURIComponent(url));
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

    console.log('Navigating to http://localhost:3000...');
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 3000));

    // Capture 1: Hero Section
    console.log('Capturing Hero Section...');
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          window.scrollTo(0, 0);
          const note = document.getElementById('hero-sticky-note');
          if (note) {
            note.classList.add('is-revealed');
            const stamp = document.getElementById('sticky-stamp');
            if (stamp) stamp.classList.add('is-stamped');
            document.querySelectorAll('#sticky-body-lines .sticky-display-line').forEach(l => l.classList.add('is-revealed'));
          }
        })();
      `
    });
    await new Promise(r => setTimeout(r, 600));
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '01_hero_update.png', Buffer.from(shot.data, 'base64'));

    // Capture 2: Selected Works Initial State
    console.log('Capturing Selected Works (Initial 2 Videos)...');
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const sec = document.getElementById('selected-works');
          if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
        })();
      `
    });
    await new Promise(r => setTimeout(r, 600));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '02_selected_works_initial.png', Buffer.from(shot.data, 'base64'));

    // Capture 3: Selected Works Expanded
    console.log('Expanding Selected Works...');
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          if (window.toggleSelectedWorksExpand) window.toggleSelectedWorksExpand();
        })();
      `
    });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '03_selected_works_expanded.png', Buffer.from(shot.data, 'base64'));

    // Capture 4: My Expertise (DNEG 3-column + Editorial Film Credits)
    console.log('Capturing My Expertise / DNEG...');
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const sec = document.getElementById('my-expertise');
          if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
        })();
      `
    });
    await new Promise(r => setTimeout(r, 600));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '04_dneg_expertise.png', Buffer.from(shot.data, 'base64'));

    // Capture 5: THE CORE (Glassmorphism & Lanyard)
    console.log('Capturing THE CORE...');
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const sec = document.getElementById('the-core');
          if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
        })();
      `
    });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '05_the_core_lanyard.png', Buffer.from(shot.data, 'base64'));

    // Capture 6: Contact Section Dark
    console.log('Capturing Contact Section Dark...');
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const sec = document.getElementById('lets-build');
          if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
        })();
      `
    });
    await new Promise(r => setTimeout(r, 600));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '06_contact_dark.png', Buffer.from(shot.data, 'base64'));

    // Capture 7: Light Theme Toggle & Contact Section Light
    console.log('Switching to Light Theme & Capturing...');
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          document.documentElement.setAttribute('data-theme', 'light');
          document.body.classList.add('light-theme');
          document.body.classList.remove('dark-theme');
          if (window.initMasterThemeAndEffects) {
            const btn = document.getElementById('theme-toggle');
            if (btn) btn.click();
          }
        })();
      `
    });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outDir + '07_contact_light.png', Buffer.from(shot.data, 'base64'));

    // Check Console Errors & Status
    const evalResult = await send('Runtime.evaluate', {
      expression: `
        ({
          theme: document.documentElement.getAttribute('data-theme'),
          nameCanvas: !!document.getElementById('name-particle-canvas'),
          selectedWorks: !!document.getElementById('selected-works'),
          dnegCredits: !!document.querySelector('.dneg-film-credits-editorial'),
          theCore: !!document.getElementById('the-core'),
          brittleCard: !!document.getElementById('brittle-contact-card'),
          particleCount: window.nameParticles ? window.nameParticles.length : 0
        })
      `,
      returnByValue: true
    });

    console.log('Page State Verification Result:', evalResult.result.value);

    ws.close();
    chrome.kill();
    console.log('Verification completed successfully!');
  } catch (err) {
    console.error('Verification error:', err);
    try { chrome.kill(); } catch (e) {}
  }
}

runVerification();
