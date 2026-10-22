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

async function debugErrors() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_err_' + Math.random().toString(36).substring(7);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--remote-allow-origins=*',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const pages = await fetchJson('http://127.0.0.1:9225/json/list');
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
    const errors = [];
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id).resolve(data.result);
      }
      if (data.method === 'Runtime.exceptionThrown') {
        errors.push(data.params.exceptionDetails);
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map(a => a.value || a.description || '').join(' ');
        if (data.params.type === 'error') {
          errors.push({ consoleError: text });
        }
      }
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url });

    await new Promise(r => setTimeout(r, 4000));

    console.log('--- CAPTURED ERRORS ---');
    console.log(JSON.stringify(errors, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

debugErrors();
