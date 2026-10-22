const http = require('http');
const { spawn } = require('child_process');
const fs = require('path');
const fsPromises = require('fs').promises;

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--window-size=1200,800',
  '--hide-scrollbars',
  '--allow-file-access-from-files',
  'http://localhost:3000/scratch/generate_lanyard_assets.html'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPageWsUrl() {
  for (let i = 0; i < 25; i++) {
    try {
      const list = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9223/json/list', resp => {
          let data = '';
          resp.on('data', chunk => data += chunk);
          resp.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch(e) {}
    await sleep(300);
  }
  throw new Error('Could not find page target');
}

async function run() {
  console.log('Connecting to Chrome on port 9223...');
  const wsUrl = await getPageWsUrl();
  const WebSocket = globalThis.WebSocket || require('ws');
  const ws = new WebSocket(wsUrl);

  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(resolve => ws.onopen = resolve);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await sleep(1500);

  async function captureElement(selector, outputFile) {
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector('${selector}');
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left, y: r.top, width: r.width, height: r.height };
        })()
      `,
      returnByValue: true
    });

    const rect = evalRes.result.value;
    if (!rect) {
      console.error('Element not found:', selector);
      return;
    }

    const snap = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        scale: 1
      }
    });

    await fsPromises.writeFile(outputFile, Buffer.from(snap.data, 'base64'));
    console.log(`Saved ${outputFile} (${rect.width}x${rect.height})`);
  }

  await captureElement('#card-front', 'card-front.png');
  await captureElement('#card-back', 'card-back.png');
  await captureElement('#band', 'band.png');

  ws.close();
  chrome.kill();
  console.log('Done generating assets!');
}

run().catch(err => {
  console.error(err);
  chrome.kill();
  process.exit(1);
});
