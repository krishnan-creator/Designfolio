const http = require('http');
const { spawn } = require('child_process');

async function debugHeading() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_debug_' + Math.random().toString(36).substring(7);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--remote-allow-origins=*',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { detached: false });

  try {
    for (let i = 0; i < 30; i++) {
      try {
        await fetchJson('http://127.0.0.1:9226/json/version');
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const pages = await fetchJson('http://127.0.0.1:9226/json/list');
    let target = pages && pages.find(p => p.type === 'page');

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
    await send('Page.navigate', { url });

    await new Promise(r => setTimeout(r, 2500));

    const res = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const el = document.querySelector('.dbl-title-main');
          const num = document.querySelector('.number-val');
          return {
            elExists: !!el,
            numExists: !!num,
            elFont: el ? window.getComputedStyle(el).getPropertyValue('font-family') : null,
            numFont: num ? window.getComputedStyle(num).getPropertyValue('font-family') : null,
            styleSheetsCount: document.styleSheets.length,
            titleRule: Array.from(document.styleSheets).flatMap(s => {
              try { return Array.from(s.cssRules); } catch(e) { return []; }
            }).filter(r => r.selectorText && r.selectorText.includes('.dbl-title-main')).map(r => r.cssText)
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Debug result:', JSON.stringify(res.result.value, null, 2));
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

debugHeading().catch(console.error);
