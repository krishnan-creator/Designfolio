const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_verif_' + Math.random().toString(36).substring(7);

  console.log('Launching headless Chrome...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--remote-allow-origins=*',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { detached: false });

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
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map(a => a.value || a.description || '').join(' ');
        consoleLogs.push(`[${data.params.type}] ${text}`);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
      mobile: false
    });

    console.log('Navigating to', url);
    await send('Page.navigate', { url });

    // Wait 3.5s for initial assets and scripts to settle
    await new Promise(r => setTimeout(r, 3500));

    // Test Checklist items in DOM
    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const res = {};

        // 1. Header alignment
        const cbk = document.querySelector('.brand-cbk');
        const df = document.getElementById('brand-df');
        if (cbk && df) {
          const r1 = cbk.getBoundingClientRect();
          const r2 = df.getBoundingClientRect();
          res.header = {
            cbkFound: true,
            dfFound: true,
            cbkText: cbk.textContent.trim(),
            dfText: df.textContent.trim(),
            cbkTop: r1.top,
            dfTop: r2.top,
            cbkBottom: r1.bottom,
            dfBottom: r2.bottom,
            cbkHeight: r1.height,
            dfHeight: r2.height,
            dfRightOfCbk: r2.left >= r1.right - 2,
            verticalCenterDiff: Math.abs((r1.top + r1.height/2) - (r2.top + r2.height/2)),
            fontFamily: window.getComputedStyle(df).fontFamily
          };
        } else {
          res.header = { error: 'header elements not found' };
        }

        // 2. Hero Particle Name Canvas
        const pCanvas = document.getElementById('name-particle-canvas');
        res.heroParticles = {
          canvasExists: !!pCanvas,
          canvasWidth: pCanvas ? pCanvas.width : 0,
          canvasHeight: pCanvas ? pCanvas.height : 0,
          particleCount: (window.nameParticles && window.nameParticles.length) || 0
        };

        // 3. Sticky Note & Stamp
        const note = document.getElementById('hero-sticky-note');
        const stamp = document.getElementById('sticky-stamp');
        const resumeBtn = document.getElementById('hero-resume-download');
        res.stickyNote = {
          noteExists: !!note,
          stampExists: !!stamp,
          resumeBtnExists: !!resumeBtn,
          resumeHref: resumeBtn ? resumeBtn.getAttribute('href') : null,
          resumeDownload: resumeBtn ? resumeBtn.getAttribute('download') : null,
          resumeText: resumeBtn ? resumeBtn.textContent.trim() : null
        };

        // 4. Visual Orbit
        const orbitContainer = document.querySelector('.visual-orbit-container');
        const domeMount = document.getElementById('dome-gallery-mount');
        const sphere = document.querySelector('.sphere');
        const items = document.querySelectorAll('.sphere .item img');
        res.visualOrbit = {
          containerExists: !!orbitContainer,
          domeMountExists: !!domeMount,
          sphereExists: !!sphere,
          imageTileCount: items.length,
          sphereTransform: sphere ? sphere.style.transform : null
        };

        // 5. My Journey Company Order
        const expRows = Array.from(document.querySelectorAll('.expertise-list .expertise-row'));
        res.journey = {
          count: expRows.length,
          order: expRows.map(r => {
            const h = r.querySelector('.company-heading');
            return h ? h.textContent.trim() : r.id;
          }),
          dnegProjects: Array.from(document.querySelectorAll('#exp-dneg .project-chip')).map(c => c.textContent.trim())
        };

        // 6. THE CORE section
        const coreSec = document.getElementById('the-core');
        const lanyardMount = document.getElementById('lanyard-profile-mount');
        const lpsSec = document.querySelector('.lanyard-profile-section');
        const techChips = Array.from(document.querySelectorAll('.lanyard-profile-section__tech-chip')).map(c => c.textContent.trim());
        const careerStages = Array.from(document.querySelectorAll('.lanyard-profile-section__career-stage')).map(s => s.textContent.trim());
        res.theCore = {
          coreSectionExists: !!coreSec,
          lanyardMountExists: !!lanyardMount,
          lpsComponentMounted: !!lpsSec,
          techChipCount: techChips.length,
          techChipsSample: techChips.slice(0, 5),
          careerStagesSample: careerStages.slice(0, 6)
        };

        // 7. Background layers
        const bgLayer = document.querySelector('.post-hero-bg-layer');
        const contourCanvas = document.querySelector('.contour-tide__canvas');
        res.backgrounds = {
          bgLayerExists: !!bgLayer,
          contourCanvasExists: !!contourCanvas
        };

        return res;
      })()`,
      returnByValue: true
    });

    console.log('\n=================== VERIFICATION RESULTS ===================');
    console.log(JSON.stringify(evalResult.result.value, null, 2));

    // Capture screenshot of Hero
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/verify_hero_dark.png', Buffer.from(heroShot.data, 'base64'));
    console.log('Saved scratch/verify_hero_dark.png');

    // Scroll to Visual Orbit and capture screenshot
    await send('Runtime.evaluate', {
      expression: `document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await new Promise(r => setTimeout(r, 1000));
    const orbitShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/verify_orbit_update.png', Buffer.from(orbitShot.data, 'base64'));
    console.log('Saved scratch/verify_orbit_update.png');

    // Scroll to My Journey and capture screenshot
    await send('Runtime.evaluate', {
      expression: `document.getElementById('my-expertise').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise(r => setTimeout(r, 800));
    const journeyShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/verify_journey_order.png', Buffer.from(journeyShot.data, 'base64'));
    console.log('Saved scratch/verify_journey_order.png');

    // Scroll to THE CORE and capture screenshot
    await send('Runtime.evaluate', {
      expression: `document.getElementById('the-core').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise(r => setTimeout(r, 1200));
    const coreShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/verify_the_core_update.png', Buffer.from(coreShot.data, 'base64'));
    console.log('Saved scratch/verify_the_core_update.png');

    // Test Light Mode Toggle
    console.log('\nToggling theme to light mode...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('theme-toggle').click();`
    });
    await new Promise(r => setTimeout(r, 1500));
    const lightShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/verify_light_update.png', Buffer.from(lightShot.data, 'base64'));
    console.log('Saved scratch/verify_light_update.png');

    // Check light mode DomeGallery
    await send('Runtime.evaluate', {
      expression: `document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await new Promise(r => setTimeout(r, 1000));
    const lightOrbitShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/verify_07_orbit_light.png', Buffer.from(lightOrbitShot.data, 'base64'));
    console.log('Saved scratch/verify_07_orbit_light.png');

    console.log('\n--- Console Logs ---');
    consoleLogs.forEach(l => console.log(l));

  } catch (e) {
    console.error('Error during verification:', e);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

run();
