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

async function verifyContinuousRotation() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_rot_' + Math.random().toString(36).substring(7);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--remote-allow-origins=*',
    `--user-data-dir=${userDataDir}`,
    url
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const pages = await fetchJson('http://127.0.0.1:9233/json/list');
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

    await new Promise(r => setTimeout(r, 3000));

    // Measure transform at t=0
    const t0 = await send('Runtime.evaluate', {
      expression: `document.querySelector('.sphere').style.transform`,
      returnByValue: true
    });

    // Wait 600ms
    await new Promise(r => setTimeout(r, 600));

    // Measure transform at t=600ms
    const t1 = await send('Runtime.evaluate', {
      expression: `document.querySelector('.sphere').style.transform`,
      returnByValue: true
    });

    console.log('Transform at t=0:    ', t0.result.value);
    console.log('Transform at t=600ms:', t1.result.value);
    console.log('Continuous rotation active:', t0.result.value !== t1.result.value);

  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

verifyContinuousRotation();
