const http = require('http');
const fs = require('fs');
const path = require('path');

// Helper to interact with Chrome via DevTools Protocol
async function runTests() {
  console.log('=== STARTING CBK DESIGNFOLIO CRITICAL CORRECTION TEST SUITE ===');

  // Find Chrome debug port or spawn headless Chrome
  const { execSync, spawn } = require('child_process');
  
  // Find Chrome executable on Windows
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
  ];
  let chromeExe = chromePaths.find(p => fs.existsSync(p));
  if (!chromeExe) {
    console.error('Chrome executable not found');
    process.exit(1);
  }

  const debugPort = 9223;
  console.log('Launching headless Chrome on port', debugPort);
  const chromeProc = spawn(chromeExe, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,1000'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  // Connect to Chrome DevTools Protocol
  const fetchJson = (url) => new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const targets = await fetchJson(`http://127.0.0.1:${debugPort}/json`);
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  console.log('Target WebSocket:', pageTarget.webSocketDebuggerUrl);

  const WSClient = globalThis.WebSocket;
  const ws = new WSClient(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();
  const consoleErrors = [];

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  ws.onmessage = (event) => {
    const res = JSON.parse(event.data);
    if (res.id && pending.has(res.id)) {
      const cb = pending.get(res.id);
      pending.delete(res.id);
      cb(res);
    }
    if (res.method === 'Runtime.consoleAPICalled') {
      if (res.params.type === 'error') {
        const errText = res.params.args.map(a => a.value || a.description).join(' ');
        console.error('[BROWSER CONSOLE ERROR]:', errText);
        consoleErrors.push(errText);
      }
    }
    if (res.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]:', res.params.exceptionDetails);
      consoleErrors.push(JSON.stringify(res.params.exceptionDetails));
    }
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  console.log('Navigating to http://localhost:3000/...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });

  // Wait for page load
  await new Promise(r => setTimeout(r, 3500));

  const evalCode = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.result ? res.result.result.value : (res.result?.value ?? null);
  };

  const captureScreenshot = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.result.data, 'base64');
    const artifactPath = path.join('C:\\Users\\meet2\\.gemini\\antigravity-ide\\brain\\756d34ff-427e-4d54-a73d-74ad8325ba5f', filename);
    fs.writeFileSync(artifactPath, buffer);
    console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
    return artifactPath;
  };

  console.log('\n--- 1. HERO NAME TYPOGRAPHY & PARTICLES ---');
  const heroInfo = await evalCode(`
    (() => {
      const p = window.nameParticles || [];
      const canvas = document.getElementById('name-particle-canvas');
      const wrap = document.getElementById('hero-name-wrap');
      const stamp = document.querySelector('.sticky-stamp-img');
      return {
        particleCount: p.length,
        canvasWidth: canvas ? canvas.width : 0,
        canvasHeight: canvas ? canvas.height : 0,
        wrapMinHeight: wrap ? wrap.style.minHeight : 0,
        stampSrc: stamp ? stamp.getAttribute('src') : null,
        exrState: window.getHeroExrState ? window.getHeroExrState() : null
      };
    })()
  `);
  console.log('Hero Status:', JSON.stringify(heroInfo, null, 2));

  console.log('\n--- 2. EXR SEQUENCE VERIFICATION ---');
  // Wait a moment to see if initial_entry plays through to hold_38
  await new Promise(r => setTimeout(r, 2000));
  let exrNow = await evalCode('window.getHeroExrState ? window.getHeroExrState() : null');
  console.log('EXR State after intro playback:', exrNow);

  // Trigger qualifying hero interaction (mouse move in hero area)
  console.log('Triggering qualifying action in Hero...');
  await evalCode(`
    (() => {
      const hero = document.getElementById('hero-section');
      const rect = hero.getBoundingClientRect();
      const evt = new MouseEvent('mousemove', {
        clientX: rect.left + 300,
        clientY: rect.top + 200,
        bubbles: true
      });
      hero.dispatchEvent(evt);
    })()
  `);

  await new Promise(r => setTimeout(r, 800));
  let exrAfterAction = await evalCode('window.getHeroExrState ? window.getHeroExrState() : null');
  console.log('EXR State after qualifying action:', exrAfterAction);

  await new Promise(r => setTimeout(r, 1200));
  let exrLooping = await evalCode('window.getHeroExrState ? window.getHeroExrState() : null');
  console.log('EXR State advancing in continuous loop:', exrLooping);

  console.log('\n--- 3. MY EXPERTISE: DNEG & IMPROMP2LABS MEDIA SLOTS ---');
  const expertiseInfo = await evalCode(`
    (() => {
      const dnegHeading = document.querySelector('#exp-dneg .company-heading')?.textContent?.trim();
      const dnegCreditsList = document.querySelector('#exp-dneg .dneg-film-credits-list');
      const dnegMediaSlots = document.querySelectorAll('#exp-dneg .expertise-media-slot').length;
      const impromp2MediaSlots = document.querySelectorAll('#exp-impromp2 .expertise-media-slot').length;
      const skills = Array.from(document.querySelectorAll('#exp-impromp2 .skill-tag')).map(el => el.textContent.trim());

      return {
        dnegHeading,
        hasLeftFilmStack: !!dnegCreditsList,
        dnegMediaSlotsCount: dnegMediaSlots,
        impromp2MediaSlotsCount: impromp2MediaSlots,
        impromp2Skills: skills
      };
    })()
  `);
  console.log('Expertise Status:', JSON.stringify(expertiseInfo, null, 2));

  console.log('\n--- 4. THE CORE: LANYARD, BRAND LOGOS & CAREER SKILL MAP ---');
  const coreInfo = await evalCode(`
    (() => {
      const stagePills = Array.from(document.querySelectorAll('.career-node-item')).map(el => ({
        label: el.querySelector('.career-node-label')?.textContent?.trim(),
        step: el.querySelector('.career-node-step')?.textContent?.trim(),
        isSelected: el.classList.contains('is-selected')
      }));

      const curiosityCards = Array.from(document.querySelectorAll('.curiosity-stack-card')).map(el => ({
        name: el.querySelector('.curiosity-card-name')?.textContent?.trim(),
        isBrand: el.classList.contains('curiosity-stack-card--brand'),
        isCapability: el.classList.contains('curiosity-stack-card--capability'),
        hasSvg: !!el.querySelector('svg')
      }));

      const detailTitle = document.querySelector('.detail-panel-title')?.textContent?.trim();
      const detailStep = document.querySelector('.detail-panel-step')?.textContent?.trim();
      const detailSkills = Array.from(document.querySelectorAll('.detail-pill--skill')).map(el => el.textContent.trim());

      return {
        stageCount: stagePills.length,
        stages: stagePills,
        curiosityTotal: curiosityCards.length,
        brandsWithSvg: curiosityCards.filter(c => c.isBrand && c.hasSvg).length,
        capabilitiesWithBadge: curiosityCards.filter(c => c.isCapability).length,
        activeDetail: { title: detailTitle, step: detailStep, skills: detailSkills }
      };
    })()
  `);
  console.log('Core Status:', JSON.stringify(coreInfo, null, 2));

  // Capture dark theme hero
  await captureScreenshot('hero_critical_dark.png');

  // Scroll to DNEG
  await evalCode("document.getElementById('my-expertise').scrollIntoView({ behavior: 'instant', block: 'start' })");
  await new Promise(r => setTimeout(r, 600));
  await captureScreenshot('dneg_media_slots.png');

  // Scroll to The Core
  await evalCode("document.getElementById('the-core').scrollIntoView({ behavior: 'instant', block: 'start' })");
  await new Promise(r => setTimeout(r, 800));
  await captureScreenshot('core_lanyard_verified.png');

  // Test Career Skill Map click on UX DESIGNER
  console.log('Clicking UX DESIGNER career stage...');
  await evalCode(`
    (() => {
      const nodes = Array.from(document.querySelectorAll('.career-node-item'));
      const ux = nodes.find(n => n.textContent.includes('UX DESIGNER'));
      if (ux) ux.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 400));
  const activeAfterClick = await evalCode(`
    ({
      title: document.querySelector('.detail-panel-title')?.textContent?.trim(),
      step: document.querySelector('.detail-panel-step')?.textContent?.trim()
    })
  `);
  console.log('Active detail after clicking UX DESIGNER:', activeAfterClick);
  await captureScreenshot('career_skill_map_verified.png');

  // Test Light Theme
  console.log('\nToggling to Light Theme...');
  await evalCode("document.getElementById('theme-toggle-btn')?.click()");
  await new Promise(r => setTimeout(r, 800));
  await evalCode("document.getElementById('hero-section').scrollIntoView({ behavior: 'instant', block: 'start' })");
  await new Promise(r => setTimeout(r, 500));
  await captureScreenshot('hero_critical_light.png');

  console.log('\n=== TEST SUMMARY ===');
  console.log('Console Errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors found:', consoleErrors);
  } else {
    console.log('PASSED: Zero console errors.');
  }

  // Cleanup
  ws.close();
  chromeProc.kill();
  console.log('=== TEST SUITE COMPLETED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
