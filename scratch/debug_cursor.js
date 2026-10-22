const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  const result = await page.evaluate(async () => {
    const btf = document.getElementById('beyond-the-frame-zone');
    const cursor = document.getElementById('section-cursor');
    btf.scrollIntoView({ behavior: 'instant', block: 'center' });
    await new Promise(r => setTimeout(r, 100));

    const rect = btf.getBoundingClientRect();
    console.log('BTF rect in view:', rect.left, rect.top, rect.right, rect.bottom);

    // Mouse in center of BTF on screen
    const mx = 720;
    const my = rect.top + 100;
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: mx, clientY: my, bubbles: true }));
    await new Promise(r => setTimeout(r, 100));

    const state1 = {
      isScroll: cursor.classList.contains('cursor-scroll'),
      mx, my,
      rectTop: rect.top, rectBottom: rect.bottom
    };

    // Scroll away down by 3000px
    window.scrollBy(0, 3000);
    window.dispatchEvent(new Event('scroll'));
    await new Promise(r => setTimeout(r, 100));

    const rectAfter = btf.getBoundingClientRect();
    const state2 = {
      isScroll: cursor.classList.contains('cursor-scroll'),
      rectAfterTop: rectAfter.top, rectAfterBottom: rectAfter.bottom
    };

    return { state1, state2 };
  });

  console.log('Debug result:', result);
  await browser.close();
})();
