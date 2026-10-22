const http = require('http');
const { spawn } = require('child_process');

async function run() {
  const url = 'http://localhost:3000';
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9229', '--remote-allow-origins=*', '--disable-gpu',
    '--user-data-dir=C:\\temp\\chrome_rule_' + Math.random().toString(36).substring(7),
    url
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const pages = await new Promise((res, rej) => http.get('http://127.0.0.1:9229/json/list', r => {
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
    await send('DOM.enable');
    await send('CSS.enable');

    await new Promise(r => setTimeout(r, 2000));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const heading = document.querySelector('.dbl-title-main');
        // Let's inspect all matching rules from document.styleSheets
        const matched = [];
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.selectorText && heading.matches(rule.selectorText)) {
                matched.push({ selector: rule.selectorText, css: rule.cssText });
              }
            }
          } catch(e) {}
        }
        return matched;
      })()`,
      returnByValue: true
    });

    console.log('Matched rules:', JSON.stringify(evalRes.result.value, null, 2));
    ws.close();
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}
run();
