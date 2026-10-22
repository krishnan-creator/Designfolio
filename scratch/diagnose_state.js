const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleMessages.push(`[PAGEERROR] ${err.message}`));

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('--- Initial State (Dark) ---');
  const initState = await page.evaluate(() => {
    const bgMount = document.getElementById('post-hero-bg-mount');
    const hero = document.getElementById('hero-section');
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      bgMountExists: !!bgMount,
      bgMountChildren: bgMount ? bgMount.children.length : 0,
      bgMountHtml: bgMount ? bgMount.innerHTML.slice(0, 150) : '',
      bgMountRect: bgMount ? bgMount.getBoundingClientRect() : null,
      heroRect: hero ? hero.getBoundingClientRect() : null,
      wireTerrain: !!window.mountWireTerrainScan,
      gradientWaves: !!window.mountGradientWaves,
      clientBundleReady: window.clientBundleReady
    };
  });
  console.log(JSON.stringify(initState, null, 2));

  console.log('--- Switching to Light Theme ---');
  await page.evaluate(() => {
    if (window.applyTheme) window.applyTheme('light');
    else document.documentElement.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 1500));

  const lightState = await page.evaluate(() => {
    const bgMount = document.getElementById('post-hero-bg-mount');
    const canvas = bgMount ? bgMount.querySelector('canvas') : null;
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      bgMountChildren: bgMount ? bgMount.children.length : 0,
      canvasFound: !!canvas,
      canvasWidth: canvas ? canvas.width : 0,
      canvasHeight: canvas ? canvas.height : 0,
      canvasClientWidth: canvas ? canvas.clientWidth : 0,
      canvasClientHeight: canvas ? canvas.clientHeight : 0,
      canvasDisplay: canvas ? window.getComputedStyle(canvas).display : null,
      canvasOpacity: canvas ? window.getComputedStyle(canvas).opacity : null,
      bgMountComputedStyle: bgMount ? {
        display: window.getComputedStyle(bgMount).display,
        clipPath: window.getComputedStyle(bgMount).clipPath,
        width: window.getComputedStyle(bgMount).width,
        height: window.getComputedStyle(bgMount).height,
        opacity: window.getComputedStyle(bgMount).opacity,
        zIndex: window.getComputedStyle(bgMount).zIndex
      } : null
    };
  });
  console.log('Light State:', JSON.stringify(lightState, null, 2));

  console.log('--- Console Messages ---');
  consoleMessages.slice(-20).forEach(m => console.log(m));

  await browser.close();
})();
