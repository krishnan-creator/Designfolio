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

async function testWithGpu() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_gpu_' + Math.random().toString(36).substring(7);

  console.log('Spawning Chrome without disable-gpu...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--remote-allow-origins=*',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const pages = await fetchJson('http://127.0.0.1:9227/json/list');
    const ws = new WebSocket(pages[0].webSocketDebuggerUrl);

    let id = 1;
    const pending = new Map();
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise(r => ws.onopen = r);

    const logs = [];
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id).resolve(data.result);
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        logs.push(`[${data.params.type}] ${text}`);
      }
      if (data.method === 'Runtime.exceptionThrown') {
        logs.push(`[EXCEPTION] ${JSON.stringify(data.params.exceptionDetails)}`);
      }
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url });

    await new Promise(r => setTimeout(r, 4500));

    console.log('\n--- BROWSER CONSOLE LOGS ---');
    logs.forEach(l => console.log(l));

    const checkState = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          contourCanvas: !!document.querySelector('.contour-tide__canvas'),
          splashCanvas: !!document.querySelector('.post-hero-splash-layer canvas'),
          domeSphere: !!document.querySelector('.sphere'),
          lanyardMount: !!document.getElementById('lanyard-profile-mount'),
          lpsComponent: !!document.querySelector('.lanyard-profile-section')
        };
      })()`,
      returnByValue: true
    });
    console.log('\n--- RENDERED COMPONENT STATE ---');
    console.log(checkState.result.value);

  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

testWithGpu();
