const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const ASSETS = [
  // 10 Landscape Items:
  {
    filename: 'landscape-01.jpg',
    w: 1280, h: 720,
    source: 'dune-dneg.jpg',
    cx: 0.5, cy: 0.5
  },
  {
    filename: 'landscape-02.jpg',
    w: 1280, h: 720,
    source: 'ramayana-output.jpg',
    cx: 0.5, cy: 0.5
  },
  {
    filename: 'landscape-03.jpg',
    w: 1280, h: 720,
    source: 'veerabhadra-output.jpg',
    cx: 0.5, cy: 0.5
  },
  {
    filename: 'landscape-04.jpg',
    w: 1280, h: 720,
    source: 'test_frame_1.jpg',
    cx: 0.5, cy: 0.5
  },
  {
    filename: 'landscape-05.jpg',
    w: 1280, h: 720,
    source: 'landscape-05.jpg',
    cx: 0.5, cy: 0.5
  },
  {
    filename: 'landscape-06.jpg',
    w: 1280, h: 720,
    source: 'landscape-06.jpg',
    cx: 0.5, cy: 0.5
  },
  {
    filename: 'landscape-07.jpg',
    w: 1280, h: 720,
    source: 'landscape-07.jpg',
    cx: 0.5, cy: 0.5
  },
  {
    filename: 'landscape-08.jpg',
    w: 1280, h: 720,
    source: 'dune-dneg.jpg',
    cx: 0.8, cy: 0.4
  },
  {
    filename: 'landscape-09.jpg',
    w: 1280, h: 720,
    source: 'ramayana-output.jpg',
    cx: 0.2, cy: 0.6
  },
  {
    filename: 'landscape-10.jpg',
    w: 1280, h: 720,
    source: 'veerabhadra-output.jpg',
    cx: 0.8, cy: 0.6
  },

  // 10 Portrait Items:
  {
    filename: 'portrait-01.png',
    w: 720, h: 1080,
    source: 'Ramayana.png',
    cx: 0.5, cy: 0.3
  },
  {
    filename: 'portrait-02.png',
    w: 720, h: 1080,
    source: 'VeerBhadra.png',
    cx: 0.5, cy: 0.15
  },
  {
    filename: 'portrait-03.jpg',
    w: 720, h: 1080,
    source: 'veerabhadra-output.jpg',
    cx: 0.75, cy: 0.3
  },
  {
    filename: 'portrait-04.jpg',
    w: 720, h: 1080,
    source: 'Ramayana.png',
    cx: 0.5, cy: 0.2
  },
  {
    filename: 'portrait-05.jpg',
    w: 720, h: 1080,
    source: 'landscape-06.jpg',
    cx: 0.72, cy: 0.5
  },
  {
    filename: 'portrait-06.jpg',
    w: 720, h: 1080,
    source: 'dune-dneg.jpg',
    cx: 0.55, cy: 0.65
  },
  {
    filename: 'portrait-07.jpg',
    w: 720, h: 1080,
    source: 'landscape-05.jpg',
    cx: 0.5, cy: 0.4
  },
  {
    filename: 'portrait-08.jpg',
    w: 720, h: 1080,
    source: 'landscape-07.jpg',
    cx: 0.6, cy: 0.3
  },
  {
    filename: 'portrait-09.jpg',
    w: 720, h: 1080,
    source: 'test_frame_1.jpg',
    cx: 0.5, cy: 0.5
  },
  {
    filename: 'portrait-10.jpg',
    w: 720, h: 1080,
    source: 'ramayana-output.jpg',
    cx: 0.4, cy: 0.35
  }
];

const html = `
<!DOCTYPE html>
<html>
<head><style>body { margin: 0; background: #000; overflow: hidden; }</style></head>
<body>
<canvas id="cvs"></canvas>
<script>
window.renderAsset = function(idx) {
  return new Promise((resolve) => {
    const item = ${JSON.stringify(ASSETS)}[idx];
    const cvs = document.getElementById('cvs');
    cvs.width = item.w;
    cvs.height = item.h;
    const ctx = cvs.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      const targetW = item.w;
      const targetH = item.h;
      const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
      const sw = targetW / scale;
      const sh = targetH / scale;
      const sx = Math.max(0, Math.min(img.naturalWidth - sw, (img.naturalWidth - sw) * item.cx));
      const sy = Math.max(0, Math.min(img.naturalHeight - sh, (img.naturalHeight - sh) * item.cy));
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      resolve(true);
    };
    img.src = '/' + item.source;
  });
};
</script>
</body>
</html>
`;

fs.writeFileSync('scratch/asset_generator.html', html);

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_debug_asset_' + Math.random().toString(36).substring(7);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--remote-allow-origins=*',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { detached: false });

  try {
    for (let i = 0; i < 30; i++) {
      try {
        await fetchJson('http://127.0.0.1:9222/json/version');
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const pages = await fetchJson('http://127.0.0.1:9222/json/list');
    let target = pages && pages.find(p => p.type === 'page');
    if (!target) {
      target = await fetchJson('http://127.0.0.1:9222/json/new');
    }

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

    await send('Page.navigate', { url: 'http://localhost:3000/scratch/asset_generator.html' });
    await new Promise(r => setTimeout(r, 1000));

    for (let i = 0; i < ASSETS.length; i++) {
      const item = ASSETS[i];
      await send('Emulation.setDeviceMetricsOverride', {
        width: item.w,
        height: item.h,
        deviceScaleFactor: 1,
        mobile: false
      });
      await send('Runtime.evaluate', {
        expression: 'window.renderAsset(' + i + ')',
        awaitPromise: true
      });
      await new Promise(r => setTimeout(r, 250));

      const isPng = item.filename.endsWith('.png');
      const shot = await send('Page.captureScreenshot', { 
        format: isPng ? 'png' : 'jpeg', 
        quality: isPng ? undefined : 92 
      });
      const buf = Buffer.from(shot.data, 'base64');
      fs.writeFileSync(item.filename, buf);
      console.log('Saved', item.filename, 'size:', buf.length);
    }

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

main().catch(console.error);
