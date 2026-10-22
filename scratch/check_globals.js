const http = require('http');
const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9225',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  const list = await new Promise(res => {
    http.get('http://127.0.0.1:9225/json/list', r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    });
  });
  const page = list.find(t => t.type === 'page');
  const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `({
          mountLanyard: !!window.mountLanyardProfileSection,
          mountContour: !!window.mountContourTide,
          mountDome: !!window.mountDomeGallery,
          hasCoreEl: !!document.getElementById('the-core'),
          hasMount: !!document.getElementById('lanyard-profile-mount'),
          mountInner: document.getElementById('lanyard-profile-mount') ? document.getElementById('lanyard-profile-mount').innerHTML.length : -1,
          bgMountInner: document.getElementById('post-hero-bg-mount') ? document.getElementById('post-hero-bg-mount').innerHTML.length : -1,
          theme: document.documentElement.getAttribute('data-theme')
        })`,
        returnByValue: true
      }
    }));
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id === 1) {
      console.log('Result:', data.result?.result?.value);
      chrome.kill();
      process.exit(0);
    }
  };
}, 2500);
