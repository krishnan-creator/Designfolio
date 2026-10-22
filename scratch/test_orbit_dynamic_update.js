const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE_PATH, headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const resultBefore = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#dome-gallery-mount .item__image img'));
    return {
      count: imgs.length,
      srcs: [...new Set(imgs.map(i => i.getAttribute('src')))]
    };
  });
  console.log('Before dynamic update:', resultBefore);

  // Expose and test update
  const updateResult = await page.evaluate(() => {
    const domeMount = document.getElementById('dome-gallery-mount');
    if (!domeMount) return { error: 'No mount' };
    
    // Test mounting with 4 custom images
    const testFourImages = [
      { src: 'landscape-01.jpg', alt: 'Test 01 Landscape' },
      { src: 'VeerBhadra.png', alt: 'Test 02 Veer' },
      { src: 'landscape-02.jpg', alt: 'Test 03 Landscape' },
      { src: 'portrait-01.png', alt: 'Test 04 Portrait' }
    ];

    if (window.mountDomeGallery) {
      const inst = window.mountDomeGallery(domeMount, { images: testFourImages });
      return { success: true, hasUpdate: typeof inst.update === 'function' };
    }
    return { error: 'mountDomeGallery not available' };
  });
  console.log('Mount/Update test call:', updateResult);

  await new Promise(r => setTimeout(r, 1000));

  const resultAfter = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#dome-gallery-mount .item__image img'));
    return {
      count: imgs.length,
      srcs: [...new Set(imgs.map(i => i.getAttribute('src')))]
    };
  });
  console.log('After dynamic update:', resultAfter);

  await browser.close();
})();
