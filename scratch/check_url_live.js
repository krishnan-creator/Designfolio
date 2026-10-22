const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function checkUrl() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_url_' + Math.random().toString(36).substring(7);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--remote-allow-origins=*',
    `--user-data-dir=${userDataDir}`,
    url // pass url on command line!
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const pages = await fetchJson('http://127.0.0.1:9228/json/list');
    console.log('Pages:', pages.map(p => ({ title: p.title, url: p.url })));
    const target = pages.find(p => p.url.includes('localhost'));
    if (!target) {
      console.log('No localhost page found');
      return;
    }
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

    await new Promise(r => setTimeout(r, 3000));

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          url: window.location.href,
          title: document.title,
          lanyardMount: !!document.getElementById('lanyard-profile-mount'),
          theCoreSection: !!document.getElementById('the-core'),
          domeMount: !!document.getElementById('dome-gallery-mount'),
          sphere: !!document.querySelector('.sphere'),
          lpsProfile: !!document.querySelector('.lanyard-profile-section'),
          bgContour: !!document.querySelector('.contour-tide__canvas'),
          clientBundleReady: window.clientBundleReady,
          mountDomeGalleryExists: typeof window.mountDomeGallery,
          mountLanyardExists: typeof window.mountLanyardProfileSection
        };
      })()`,
      returnByValue: true
    });

    console.log('Result:', res.result.value);

  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

checkUrl();
