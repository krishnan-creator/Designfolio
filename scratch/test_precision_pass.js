const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

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

async function runPrecisionTest() {
  const url = 'http://localhost:3000';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_verify_precision_' + Date.now();

  console.log('Launching Chrome for Precision Correction Pass Verification...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--remote-allow-origins=*',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { detached: false });

  const consoleLogs = [];
  const consoleErrors = [];

  try {
    let connected = false;
    for (let i = 0; i < 30; i++) {
      try {
        await fetchJson('http://127.0.0.1:9226/json/version');
        connected = true;
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    if (!connected) throw new Error('Could not connect to Chrome port 9226');

    const pages = await fetchJson('http://127.0.0.1:9226/json/list');
    let target = pages && pages.find(p => p.type === 'page');
    if (!target) {
      target = await fetchJson('http://127.0.0.1:9226/json/new?' + encodeURIComponent(url));
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
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map(a => a.value || a.description).join(' ');
        if (data.params.type === 'error') consoleErrors.push(text);
        else consoleLogs.push(text);
      }
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to http://localhost:3000...');
    await send('Page.navigate', { url });

    // Wait for startup splash (0.5s) and EXR intro (1 -> 39, ~1.4s)
    await new Promise(r => setTimeout(r, 3000));

    // Evaluate in page
    const evalResult = async (expression) => {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return res.result?.value;
    };

    console.log('\n--- 1. HERO PARTICLES & TYPOGRAPHY ---');
    const heroInfo = await evalResult(`(() => {
      const p = window.nameParticles || [];
      const wrap = document.getElementById('hero-name-wrap');
      const rect = wrap ? wrap.getBoundingClientRect() : null;
      return {
        particleCount: p.length,
        wrapHeight: rect ? rect.height : 0,
        sampleParticle: p[0] ? { x: p[0].x, y: p[0].y, size: p[0].size } : null
      };
    })()`);
    console.log('Hero particle stats:', heroInfo);

    console.log('\n--- 2. HERO THEME INDEPENDENCE & RESUME BUTTON ---');
    const resumeBtnInfo = await evalResult(`(() => {
      const btn = document.getElementById('hero-resume-download');
      if (!btn) return { found: false };
      const cs = window.getComputedStyle(btn);
      const rect = btn.getBoundingClientRect();
      return {
        found: true,
        text: btn.innerText.trim(),
        download: btn.getAttribute('download'),
        href: btn.getAttribute('href'),
        visibility: cs.visibility,
        display: cs.display,
        opacity: cs.opacity,
        zIndex: cs.zIndex,
        color: cs.color,
        background: cs.backgroundColor,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      };
    })()`);
    console.log('Resume button dark theme:', resumeBtnInfo);

    console.log('\n--- 3. EXR PLAY-PAUSE-ACTION-PLAY SEQUENCE ---');
    const exrInitialState = await evalResult(`window.getHeroExrState ? window.getHeroExrState() : null`);
    console.log('EXR after initial play (resting at frame 39):', exrInitialState);

    // Simulate pointer movement in hero
    await evalResult(`(() => {
      const hero = document.getElementById('hero-section');
      const evt = new MouseEvent('mousemove', { clientX: 400, clientY: 300, bubbles: true });
      window.dispatchEvent(evt);
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const exrPlayingState = await evalResult(`window.getHeroExrState ? window.getHeroExrState() : null`);
    console.log('EXR after mouse movement (should be playing_action > 39):', exrPlayingState);

    // Wait for idle pause (~1.9s)
    await new Promise(r => setTimeout(r, 1900));
    const exrIdleState = await evalResult(`window.getHeroExrState ? window.getHeroExrState() : null`);
    console.log('EXR after idle (should be paused_idle at current frame):', exrIdleState);

    // Simulate action again
    await evalResult(`(() => {
      const evt = new MouseEvent('mousemove', { clientX: 420, clientY: 320, bubbles: true });
      window.dispatchEvent(evt);
    })()`);
    await new Promise(r => setTimeout(r, 500));
    const exrResumeState = await evalResult(`window.getHeroExrState ? window.getHeroExrState() : null`);
    console.log('EXR after second action (should resume forward from paused frame):', exrResumeState);

    console.log('\n--- 4. POST-HERO SECTIONS GRID ALIGNMENT ---');
    const sectionsGrid = await evalResult(`(() => {
      const ids = ['by-the-numbers', 'selected-works', 'visual-orbit', 'my-expertise', 'the-core', 'lets-build'];
      return ids.map(id => {
        const el = document.getElementById(id);
        if (!el) return { id, found: false };
        const rect = el.getBoundingClientRect();
        return {
          id,
          width: Math.round(rect.width),
          top: Math.round(rect.top),
          left: Math.round(rect.left)
        };
      });
    })()`);
    console.log('Post-Hero sections grid:', sectionsGrid);

    console.log('\n--- 5. DNEG CREDITS & CAREER GRID ---');
    const dnegInfo = await evalResult(`(() => {
      const dnegRow = document.getElementById('exp-dneg');
      if (!dnegRow) return { found: false };
      const credits = Array.from(dnegRow.querySelectorAll('.dneg-credit-item')).map(c => ({
        title: c.querySelector('.dneg-credit-title')?.innerText.trim(),
        meta: c.querySelector('.dneg-credit-meta')?.innerText.trim()
      }));
      const columns = Array.from(dnegRow.querySelectorAll('.info-block-label')).map(l => l.innerText.trim());
      const hasOldSubsection = !!dnegRow.querySelector('.dneg-studio-films-section');
      return {
        found: true,
        credits,
        columns,
        hasOldSubsection
      };
    })()`);
    console.log('DNEG info:', dnegInfo);

    console.log('\n--- 6. THE CORE ID CARD & CURIOSITY STACK ---');
    const coreInfo = await evalResult(`(() => {
      const core = document.getElementById('the-core');
      const glass = core ? core.querySelector('.lanyard-glass-panel-wrapper') : null;
      const cards = Array.from(core ? core.querySelectorAll('.curiosity-stack-card') : []).map(c => ({
        name: c.querySelector('.curiosity-card-name')?.innerText.trim(),
        hasSvg: !!c.querySelector('svg')
      }));
      const cs = glass ? window.getComputedStyle(glass) : null;
      return {
        found: !!core,
        hasGlassWrapper: !!glass,
        backdropFilter: cs ? cs.backdropFilter || cs.webkitBackdropFilter : 'none',
        toolCount: cards.length,
        firstThreeTools: cards.slice(0, 5)
      };
    })()`);
    console.log('Core info:', coreInfo);

    console.log('\n--- 7. BY THE NUMBERS TILE 8 & HOVER INVERSION ---');
    const tile8Info = await evalResult(`(() => {
      const tiles = document.querySelectorAll('.number-tile');
      const last = tiles[tiles.length - 1];
      return {
        count: tiles.length,
        lastVal: last ? last.querySelector('.number-val')?.innerText.trim() : null
      };
    })()`);
    console.log('Metric tiles:', tile8Info);

    console.log('\n--- 8. LET\'S BUILD CONTACT CARD ---');
    const contactCardInfo = await evalResult(`(() => {
      const card = document.getElementById('brittle-contact-card');
      if (!card) return { found: false };
      const rect = card.getBoundingClientRect();
      const parentRect = card.parentElement.getBoundingClientRect();
      return {
        found: true,
        cardWidth: Math.round(rect.width),
        parentWidth: Math.round(parentRect.width),
        widthRatio: (rect.width / parentRect.width).toFixed(2),
        links: Array.from(card.querySelectorAll('a')).map(a => a.href)
      };
    })()`);
    console.log('Contact card info:', contactCardInfo);

    console.log('\n--- 9. THEME TOGGLE & HERO PALETTE CHECK ---');
    await evalResult(`(() => {
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const themeLightCheck = await evalResult(`(() => {
      const docTheme = document.documentElement.getAttribute('data-theme');
      const hero = document.getElementById('hero-section');
      const heroBg = hero ? window.getComputedStyle(hero).backgroundColor : null;
      const resumeBtn = document.getElementById('hero-resume-download');
      const resumeCs = resumeBtn ? window.getComputedStyle(resumeBtn) : null;
      return {
        docTheme,
        heroBg,
        resumeBtnColor: resumeCs ? resumeCs.color : null,
        resumeBtnBg: resumeCs ? resumeCs.backgroundColor : null,
        resumeBtnVisible: resumeCs ? resumeCs.visibility : null
      };
    })()`);
    console.log('Light theme check:', themeLightCheck);

    // Switch back to dark theme
    await evalResult(`(() => {
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 500));

    console.log('\n--- 10. CONSOLE LOGS & ERRORS ---');
    console.log('Console Errors count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }

    // Capture screenshot of Hero and Sections
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/verify_precision_hero.png', Buffer.from(heroShot.data, 'base64'));

    console.log('\nVerification suite completed successfully!');
    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    chrome.kill();
  }
}

runPrecisionTest();
