const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Test Visual Orbit Pointer-Pause
  console.log('Testing Visual Orbit pointer pause...');
  await page.evaluate(() => {
    document.getElementById('visual-orbit').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const domeBox = await page.evaluate(() => {
    const el = document.getElementById('visual-orbit-gallery-wrap');
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  });

  const parseRotY = () => page.evaluate(() => {
    const s = document.querySelector('#dome-gallery-mount .sphere');
    const m = s.style.transform.match(/rotateY\(([-0-9.]+)deg\)/);
    return m ? parseFloat(m[1]) : null;
  });

  // Pointer inside dome
  await page.mouse.move(domeBox.x + domeBox.width / 2, domeBox.y + domeBox.height / 2);
  await new Promise(r => setTimeout(r, 200));
  const p1 = await parseRotY();
  await new Promise(r => setTimeout(r, 800));
  const p2 = await parseRotY();
  const isPaused = p1 === p2;
  console.log(`Pointer inside dome: p1=${p1}°, p2=${p2}°, isPaused=${isPaused}`);

  // Pointer outside dome
  await page.mouse.move(10, 10);
  await new Promise(r => setTimeout(r, 800));
  const p3 = await parseRotY();
  const isResumed = p3 !== p2;
  console.log(`Pointer outside dome: p2=${p2}°, p3=${p3}°, isResumed=${isResumed}`);

  // 2. Test Hover White Outline on Tile
  console.log('\nTesting hover white outline on tile...');
  const tileBox = await page.evaluate(() => {
    const t = document.querySelector('#dome-gallery-mount .item .item__image');
    const r = t.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  await page.mouse.move(tileBox.x, tileBox.y);
  await new Promise(r => setTimeout(r, 300));

  const hoverOutline = await page.evaluate(() => {
    const t = document.querySelector('#dome-gallery-mount .item .item__image:hover') ||
              document.querySelector('#dome-gallery-mount .item .item__image.is-hovered');
    if (!t) return { found: false };
    const style = window.getComputedStyle(t);
    return {
      found: true,
      border: style.border,
      outline: style.outline,
      boxShadow: style.boxShadow,
      transform: style.transform
    };
  });
  console.log('Hover computed styles:', hoverOutline);

  // 3. Test Selected Works Hover Playback
  console.log('\nTesting Selected Works hover playback...');
  await page.evaluate(() => {
    document.getElementById('selected-works').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const cardBox = await page.evaluate(() => {
    const c = document.querySelector('#selected-works .works-card');
    const r = c.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  await page.mouse.move(cardBox.x, cardBox.y);
  await new Promise(r => setTimeout(r, 1200));

  const hoverVideoState = await page.evaluate(() => {
    const c = document.querySelector('#selected-works .works-card');
    const v = c.querySelector('video.works-card-media-video');
    return {
      paused: v ? v.paused : null,
      currentTime: v ? v.currentTime : null,
      muted: v ? v.muted : null
    };
  });
  console.log('Video state on card hover:', hoverVideoState);

  // Move mouse away
  await page.mouse.move(10, 10);
  await new Promise(r => setTimeout(r, 400));

  const leaveVideoState = await page.evaluate(() => {
    const c = document.querySelector('#selected-works .works-card');
    const v = c.querySelector('video.works-card-media-video');
    return {
      paused: v ? v.paused : null,
      currentTime: v ? v.currentTime : null
    };
  });
  console.log('Video state on card leave:', leaveVideoState);

  await browser.close();
})();
