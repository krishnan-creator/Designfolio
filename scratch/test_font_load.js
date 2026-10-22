const http = require('http');
const { spawn } = require('child_process');

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9231', '--remote-allow-origins=*', '--disable-gpu',
    '--user-data-dir=C:\\temp\\chrome_net_' + Math.random().toString(36).substring(7), 'http://localhost:3000'
  ]);
  try {
    await new Promise(r => setTimeout(r, 2000));
    const pages = await new Promise((res, rej) => http.get('http://127.0.0.1:9231/json/list', r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    }));
    const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `(async () => {
          try {
            const res = await document.fonts.load('800 16px Montserrat');
            const resPop = await document.fonts.load('16px "Pop Warner"');
            return {
              montserratLoaded: res.map(f => f.family),
              montserratCheck: document.fonts.check('800 16px Montserrat'),
              popWarnerLoaded: resPop.map(f => f.family),
              popWarnerCheck: document.fonts.check('16px "Pop Warner"')
            };
          } catch(e) {
            return { err: e.message };
          }
        })()`,
        awaitPromise: true,
        returnByValue: true
      }
    }));
    ws.onmessage = e => {
      const d = JSON.parse(e.data);
      if (d.id === 1) {
        console.log('Result:', d.result.result.value);
        chrome.kill();
        process.exit(0);
      }
    };
  } catch(e) {
    console.error(e);
    chrome.kill();
  }
}
run();
