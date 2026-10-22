const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\meet2\\.gemini\\antigravity-ide\\brain\\5196ad93-1e8a-4258-906f-149c2b867eca\\scratch\\chrome-temp',
  '--window-size=1440,900',
  '--hide-scrollbars',
  'http://localhost:3000/'
]);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  for (let i = 0; i < 20; i++) {
    try {
      const list = await new Promise((res, rej) => {
        http.get('http://127.0.0.1:9222/json/list', r => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => res(JSON.parse(d)));
        }).on('error', rej);
      });
      const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) {
        const WebSocket = globalThis.WebSocket || require('ws');
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        let id = 1;
        const pending = new Map();
        ws.onmessage = e => {
          const m = JSON.parse(e.data);
          if (m.id && pending.has(m.id)) {
            pending.get(m.id).resolve(m.result);
            pending.delete(m.id);
          }
        };
        await new Promise(r => ws.onopen = r);
        function send(method, params = {}) {
          return new Promise(resolve => {
            const msgId = id++;
            pending.set(msgId, { resolve });
            ws.send(JSON.stringify({ id: msgId, method, params }));
          });
        }
        await send('Runtime.enable');
        await send('Page.enable');
        await sleep(2000);
        await send('Runtime.evaluate', {
          expression: 'document.querySelector(".about-drawing-card").scrollIntoView({ behavior: "instant", block: "center" })'
        });
        await sleep(1000);
        const ss = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('scratch/verify_fan_artist_card.png', Buffer.from(ss.data, 'base64'));
        console.log('Saved scratch/verify_fan_artist_card.png');
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    } catch(e) {}
    await sleep(400);
  }
  chrome.kill();
  process.exit(1);
})();
