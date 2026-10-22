const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\meet2\\.gemini\\antigravity-ide\\brain\\756d34ff-427e-4d54-a73d-74ad8325ba5f';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function captureArtifactScreenshots() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_art_' + Math.random().toString(36).substring(7);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9234',
    '--remote-allow-origins=*',
    `--user-data-dir=${userDataDir}`,
    url
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const pages = await fetchJson('http://127.0.0.1:9234/json/list');
    const target = pages.find(p => p.url.includes('localhost'));
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        ws.send(JSON.stringify({ id: msgId, method, params }));
        const handler = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(d.result);
          }
        };
        ws.addEventListener('message', handler);
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
      mobile: false
    });

    console.log('Waiting for initial animations...');
    await new Promise(r => setTimeout(r, 3500));

    // 1. Hero Dark Screenshot
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, '01_hero_dark.png'), Buffer.from(heroShot.data, 'base64'));
    console.log('Saved 01_hero_dark.png');

    // 2. Visual Orbit Dark Screenshot
    await send('Runtime.evaluate', {
      expression: `document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await new Promise(r => setTimeout(r, 1200));
    const orbitDarkShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, '02_visual_orbit_dark.png'), Buffer.from(orbitDarkShot.data, 'base64'));
    console.log('Saved 02_visual_orbit_dark.png');

    // 3. My Journey Screenshot
    await send('Runtime.evaluate', {
      expression: `document.getElementById('my-expertise').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise(r => setTimeout(r, 1000));
    const journeyShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, '03_my_journey_order.png'), Buffer.from(journeyShot.data, 'base64'));
    console.log('Saved 03_my_journey_order.png');

    // 4. THE CORE Screenshot
    await send('Runtime.evaluate', {
      expression: `document.getElementById('the-core').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise(r => setTimeout(r, 1500));
    const coreShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, '04_the_core_lanyard.png'), Buffer.from(coreShot.data, 'base64'));
    console.log('Saved 04_the_core_lanyard.png');

    // 5. Toggle Light Mode
    console.log('Toggling light mode...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('theme-toggle').click();`
    });
    await new Promise(r => setTimeout(r, 1500));

    // 6. Visual Orbit Light Screenshot
    await send('Runtime.evaluate', {
      expression: `document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await new Promise(r => setTimeout(r, 1200));
    const orbitLightShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, '05_visual_orbit_light.png'), Buffer.from(orbitLightShot.data, 'base64'));
    console.log('Saved 05_visual_orbit_light.png');

    // 7. THE CORE Light Screenshot
    await send('Runtime.evaluate', {
      expression: `document.getElementById('the-core').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise(r => setTimeout(r, 1200));
    const coreLightShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, '06_the_core_light.png'), Buffer.from(coreLightShot.data, 'base64'));
    console.log('Saved 06_the_core_light.png');

    // 8. Hero Light Screenshot
    await send('Runtime.evaluate', {
      expression: `document.getElementById('hero-section').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise(r => setTimeout(r, 1000));
    const heroLightShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, '07_hero_light.png'), Buffer.from(heroLightShot.data, 'base64'));
    console.log('Saved 07_hero_light.png');

    console.log('All artifact screenshots captured successfully!');

  } catch (e) {
    console.error('Error during screenshot capture:', e);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

captureArtifactScreenshots();
