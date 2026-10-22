const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

  // Scroll contact section into view immediately so IntersectionObserver triggers start()
  await page.evaluate(() => {
    const el = document.getElementById('lets-build');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });

  // Wait for model-embed to exist
  await page.waitForSelector('#thrine-model-mount model-embed', { timeout: 10000 });

  // Wait for loader to be removed (model rendered)
  console.log('Waiting for dark model 3D canvas to render...');
  await page.waitForFunction(() => {
    const embed = document.querySelector('#thrine-model-mount model-embed');
    if (!embed) return false;
    // Check if canvas exists and loader is gone
    const canvas = embed.querySelector('canvas');
    const divs = Array.from(embed.querySelectorAll('div'));
    const hasLoader = divs.some(d => d.style.borderTopColor || d.style.borderRadius === '50%');
    return canvas && !hasLoader;
  }, { timeout: 20000 }).catch(e => console.log('Wait timeout or completed:', e.message));

  await new Promise(r => setTimeout(r, 2000));

  // --- CHECK 1: DARK THEME ---
  console.log('\n=== DARK THEME INSPECTION ===');
  const darkCardInfo = await page.evaluate(() => {
    const card = document.querySelector('.brittle-contact-card');
    const rect = card.getBoundingClientRect();
    const style = window.getComputedStyle(card);
    const model = document.querySelector('#thrine-model-mount model-embed');
    const wrapper = document.querySelector('.thrine-model-wrapper');
    const container = document.querySelector('.thrine-model-container');
    const wrapperStyle = wrapper ? window.getComputedStyle(wrapper) : null;
    const modelStyle = model ? window.getComputedStyle(model) : null;

    return {
      cardWidth: rect.width,
      cardHeight: rect.height,
      aspectRatio: (rect.width / rect.height).toFixed(2),
      bgImage: style.backgroundImage,
      bgColor: style.backgroundColor,
      borderRadius: style.borderRadius,
      project: model ? model.getAttribute('project') : null,
      restrict: model ? model.getAttribute('restrict') : null,
      modelAspectRatio: model ? model.style.aspectRatio : null,
      wrapperBg: wrapperStyle ? wrapperStyle.backgroundColor : null,
      wrapperBorder: wrapperStyle ? wrapperStyle.border : null,
      wrapperShadow: wrapperStyle ? wrapperStyle.boxShadow : null,
      modelBg: modelStyle ? modelStyle.backgroundColor : null,
      isSphereInsideCard: card.contains(model)
    };
  });
  console.log('Dark Card Info:', JSON.stringify(darkCardInfo, null, 2));

  // Screenshot Dark theme contact card
  const darkCardHandle = await page.$('.brittle-contact-card');
  if (darkCardHandle) {
    await darkCardHandle.screenshot({ path: 'dark_contact_card.png' });
    console.log('Saved dark_contact_card.png');
  }

  // --- CHECK 2: THEME SWITCH TO LIGHT ---
  console.log('\n=== SWITCHING TO LIGHT THEME ===');
  await page.evaluate(() => {
    window.applyTheme('light');
  });
  await new Promise(r => setTimeout(r, 4000));

  const lightCardInfo = await page.evaluate(() => {
    const card = document.querySelector('.brittle-contact-card');
    const rect = card.getBoundingClientRect();
    const style = window.getComputedStyle(card);
    const model = document.querySelector('#thrine-model-mount model-embed');
    const wrapper = document.querySelector('.thrine-model-wrapper');
    const wrapperStyle = wrapper ? window.getComputedStyle(wrapper) : null;

    return {
      cardWidth: rect.width,
      cardHeight: rect.height,
      aspectRatio: (rect.width / rect.height).toFixed(2),
      bgImage: style.backgroundImage,
      bgColor: style.backgroundColor,
      borderRadius: style.borderRadius,
      project: model ? model.getAttribute('project') : null,
      restrict: model ? model.getAttribute('restrict') : null,
      modelAspectRatio: model ? model.style.aspectRatio : null,
      wrapperBg: wrapperStyle ? wrapperStyle.backgroundColor : null,
      wrapperBorder: wrapperStyle ? wrapperStyle.border : null,
      wrapperShadow: wrapperStyle ? wrapperStyle.boxShadow : null,
      isSphereInsideCard: card.contains(model)
    };
  });
  console.log('Light Card Info:', JSON.stringify(lightCardInfo, null, 2));

  // Screenshot Light theme contact card
  const lightCardHandle = await page.$('.brittle-contact-card');
  if (lightCardHandle) {
    await lightCardHandle.screenshot({ path: 'light_contact_card.png' });
    console.log('Saved light_contact_card.png');
  }

  // --- CHECK 3: BUTTON CLICKS & POINTER INTERACTION ---
  console.log('\n=== BUTTON CLICKABILITY TEST ===');
  const buttonsOk = await page.evaluate(() => {
    const actions = Array.from(document.querySelectorAll('.build-action-btn'));
    return actions.map(btn => {
      const rect = btn.getBoundingClientRect();
      const topEl = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return {
        text: btn.innerText.trim().replace(/\n/g, ' '),
        clickable: btn.contains(topEl) || topEl === btn,
        href: btn.getAttribute('href')
      };
    });
  });
  console.log('Buttons:', JSON.stringify(buttonsOk, null, 2));

  // --- CHECK 4: MOBILE VIEW TEST ---
  console.log('\n=== MOBILE VIEW TEST (390x844) ===');
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    const el = document.getElementById('lets-build');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const mobileInfo = await page.evaluate(() => {
    const card = document.querySelector('.brittle-contact-card');
    const rect = card.getBoundingClientRect();
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    return {
      cardWidth: rect.width,
      cardHeight: rect.height,
      hasHorizontalOverflow: scrollWidth > docWidth,
      docWidth,
      scrollWidth
    };
  });
  console.log('Mobile Info:', JSON.stringify(mobileInfo, null, 2));

  const mobileCardHandle = await page.$('.brittle-contact-card');
  if (mobileCardHandle) {
    await mobileCardHandle.screenshot({ path: 'mobile_contact_card.png' });
    console.log('Saved mobile_contact_card.png');
  }

  await browser.close();
  console.log('\nVerification complete!');
})();
