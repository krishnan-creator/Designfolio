const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

async function shotDrawing() {
  const url = 'http://localhost:3000';
  const artifactDir = 'C:/Users/meet2/.gemini/antigravity-ide/brain/5196ad93-1e8a-4258-906f-149c2b867eca/';
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9233', '--remote-allow-origins=*', '--disable-gpu',
    '--user-data-dir=C:\\temp\\chrome_draw_' + Math.random().toString(36).substring(7),
    url
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const pages = await new Promise((res, rej) => http.get('http://127.0.0.1:9233/json/list', r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    }));

    const target = pages.find(p => p.type === 'page' && p.url.includes('localhost:3000')) || pages[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    await new Promise(r => setTimeout(r, 2000));

    // Scroll directly to .about-drawing-card
    await send('Runtime.evaluate', {
      expression: `(() => {
        const drawCard = document.querySelector('.about-drawing-card');
        if (drawCard) drawCard.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    });

    await new Promise(r => setTimeout(r, 800));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(artifactDir + 'final_screenshot_10_drawing_artist_panel.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved final_screenshot_10_drawing_artist_panel.png');

    ws.close();
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}
shotDrawing().catch(console.error);
