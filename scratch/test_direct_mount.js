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

async function testMountDirectly() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_tdir_' + Math.random().toString(36).substring(7);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--remote-allow-origins=*',
    `--user-data-dir=${userDataDir}`,
    url
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const pages = await fetchJson('http://127.0.0.1:9230/json/list');
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

    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const res = {};
        try {
          const dm = document.getElementById('dome-gallery-mount');
          res.dmExists = !!dm;
          res.fnExists = typeof window.mountDomeGallery;
          const inst = window.mountDomeGallery(dm, { theme: 'dark' });
          res.instResult = !!inst;
        } catch (e) {
          res.domeError = e.message + '\\n' + e.stack;
        }

        try {
          const bgm = document.getElementById('post-hero-bg-mount');
          res.bgmExists = !!bgm;
          res.bgFnExists = typeof window.mountContourTide;
          const bgInst = window.mountContourTide(bgm);
          res.bgInstResult = !!bgInst;
        } catch (e) {
          res.bgError = e.message + '\\n' + e.stack;
        }

        return res;
      })()`,
      returnByValue: true
    });

    console.log('Direct mount result:', evalResult.result.value);

    await new Promise(r => setTimeout(r, 1000));

    const checkDom = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          sphere: !!document.querySelector('.sphere'),
          contourCanvas: !!document.querySelector('.contour-tide__canvas')
        };
      })()`,
      returnByValue: true
    });
    console.log('After direct mount DOM check:', checkDom.result.value);

  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

testMountDirectly();
