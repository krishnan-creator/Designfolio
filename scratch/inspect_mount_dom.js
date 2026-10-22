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

async function inspectMount() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_insp_' + Math.random().toString(36).substring(7);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--remote-allow-origins=*',
    `--user-data-dir=${userDataDir}`,
    url
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const pages = await fetchJson('http://127.0.0.1:9229/json/list');
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

    await new Promise(r => setTimeout(r, 2500));

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const diag = {};
        try {
          const dm = document.getElementById('dome-gallery-mount');
          diag.domeMountChildren = dm ? dm.children.length : 'no mount';
          diag.domeMountHtml = dm ? dm.innerHTML.substring(0, 300) : '';
        } catch (e) {
          diag.domeErr = e.message;
        }

        try {
          const bgm = document.getElementById('post-hero-bg-mount');
          diag.bgMountChildren = bgm ? bgm.children.length : 'no bg mount';
          diag.bgMountHtml = bgm ? bgm.innerHTML.substring(0, 300) : '';
        } catch (e) {
          diag.bgErr = e.message;
        }

        try {
          const core = document.querySelector('.lanyard-profile-section');
          diag.coreLpsFound = !!core;
          diag.coreHtml = core ? core.innerHTML.substring(0, 300) : '';
        } catch (e) {
          diag.coreErr = e.message;
        }

        return diag;
      })()`,
      returnByValue: true
    });

    console.log('DOM diagnostics:', res.result.value);

  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

inspectMount();
