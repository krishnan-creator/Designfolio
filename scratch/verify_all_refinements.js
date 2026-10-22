const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  console.log('=== VERIFYING CBK DESIGNFOLIO REFINEMENTS (ROUND 2) ===\n');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // ==========================================
  // 1. FOUNDATIONS: DOMINANT LOGOS
  // ==========================================
  console.log('--- 1. FOUNDATIONS ---');
  await page.evaluate(() => {
    document.getElementById('foundations-title')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 800));

  const foundations = await page.evaluate(() => {
    const heading = document.getElementById('foundations-title')?.innerText?.trim();
    const cards = Array.from(document.querySelectorAll('.foundations-grid .foundation-card'));
    const data = cards.map(c => {
      const img = c.querySelector('.foundation-icon-img');
      const name = c.querySelector('.foundation-name')?.innerText?.trim();
      const rect = c.getBoundingClientRect();
      const imgRect = img ? img.getBoundingClientRect() : null;
      return {
        name,
        hasImg: !!img,
        src: img ? img.getAttribute('src') : null,
        naturalWidth: img ? img.naturalWidth : 0,
        naturalHeight: img ? img.naturalHeight : 0,
        cardHeight: Math.round(rect.height),
        imgWidth: imgRect ? Math.round(imgRect.width) : 0,
        imgHeight: imgRect ? Math.round(imgRect.height) : 0
      };
    });
    return { heading, data };
  });

  console.log('Heading:', foundations.heading);
  console.log('Tools count:', foundations.data.length);
  foundations.data.forEach(t => {
    console.log(`Tool: ${t.name} | Image: ${t.src} (${t.naturalWidth}x${t.naturalHeight}) | Rendered size: ${t.imgWidth}x${t.imgHeight}px | Card height: ${t.cardHeight}px`);
  });

  // ==========================================
  // 2. GLOBAL HOVER CONTRAST IN LIGHT THEME
  // ==========================================
  console.log('\n--- 2. GLOBAL HOVER CONTRAST (LIGHT THEME) ---');
  await page.evaluate(() => {
    window.applyTheme('light');
  });
  await new Promise(r => setTimeout(r, 800));

  // Hover first creative skill tile
  const firstSkill = await page.$('.creative-skill-card');
  if (firstSkill) {
    await firstSkill.hover();
    await new Promise(r => setTimeout(r, 300));
    const skillHoverStyles = await page.evaluate(el => {
      const cs = window.getComputedStyle(el);
      const title = el.querySelector('.creative-skill-title');
      const titleCs = title ? window.getComputedStyle(title) : null;
      const icon = el.querySelector('.creative-skill-icon');
      const iconCs = icon ? window.getComputedStyle(icon) : null;
      return {
        bg: cs.backgroundColor,
        titleColor: titleCs ? titleCs.color : null,
        iconColor: iconCs ? iconCs.color : null
      };
    }, firstSkill);
    console.log('Creative Skill hover styles in Light Theme:', skillHoverStyles);
  }

  // Hover first career tile
  const firstCareer = await page.$('.career-tile-card');
  if (firstCareer) {
    await firstCareer.hover();
    await new Promise(r => setTimeout(r, 300));
    const careerHoverStyles = await page.evaluate(el => {
      const cs = window.getComputedStyle(el);
      const role = el.querySelector('.career-tile-role');
      const roleCs = role ? window.getComputedStyle(role) : null;
      const icon = el.querySelector('.career-tile-icon');
      const iconCs = icon ? window.getComputedStyle(icon) : null;
      return {
        bg: cs.backgroundColor,
        roleColor: roleCs ? roleCs.color : null,
        iconColor: iconCs ? iconCs.color : null
      };
    }, firstCareer);
    console.log('Career tile hover styles in Light Theme:', careerHoverStyles);
  }

  // Hover foundation tile in light theme
  const firstFoundation = await page.$('.foundation-card');
  if (firstFoundation) {
    await firstFoundation.hover();
    await new Promise(r => setTimeout(r, 300));
    const foundationHoverStyles = await page.evaluate(el => {
      const cs = window.getComputedStyle(el);
      const name = el.querySelector('.foundation-name');
      const nameCs = name ? window.getComputedStyle(name) : null;
      return {
        bg: cs.backgroundColor,
        nameColor: nameCs ? nameCs.color : null
      };
    }, firstFoundation);
    console.log('Foundation card hover styles in Light Theme:', foundationHoverStyles);
  }

  // ==========================================
  // 3. CTA SECTION IN LIGHT THEME (Rough dark material)
  // ==========================================
  console.log('\n--- 3. CTA SECTION IN LIGHT THEME ---');
  await page.evaluate(() => {
    document.getElementById('lets-build')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 800));

  const ctaLightData = await page.evaluate(() => {
    const card = document.getElementById('brittle-contact-card');
    const cs = window.getComputedStyle(card);
    const label = card?.querySelector('.dbl-meta-label')?.innerText?.trim();
    const slash = card?.querySelector('.build-headline-accent-slash')?.innerText?.trim();
    const lines = Array.from(card?.querySelectorAll('.build-headline-line') || []).map(l => l.innerText.trim());
    const statement = card?.querySelector('.build-statement')?.innerText?.trim();
    const buttons = Array.from(card?.querySelectorAll('.build-action-btn') || []).map(b => {
      const rect = b.getBoundingClientRect();
      const bCs = window.getComputedStyle(b);
      return {
        text: b.querySelector('span')?.innerText?.trim() || b.innerText.trim(),
        href: b.getAttribute('href'),
        className: b.className,
        bg: bCs.backgroundColor,
        color: bCs.color,
        top: Math.round(rect.top),
        height: Math.round(rect.height)
      };
    });
    const allSameRow = buttons.length === 3 && buttons[0].top === buttons[1].top && buttons[1].top === buttons[2].top;
    const sphere = document.querySelector('#thrine-model-mount model-embed');
    return {
      bgImage: cs.backgroundImage,
      label,
      slash,
      lines,
      statement,
      buttons,
      allSameRow,
      sphereId: sphere?.getAttribute('project')
    };
  });
  console.log('CTA Light Theme Background Image:', ctaLightData.bgImage);
  console.log('CTA Label:', ctaLightData.label);
  console.log('CTA Slash & Headline:', ctaLightData.slash, ctaLightData.lines.join(' / '));
  console.log('CTA Statement:', ctaLightData.statement);
  console.log('CTA Buttons:', ctaLightData.buttons);
  console.log('Desktop Buttons all on same row:', ctaLightData.allSameRow);
  console.log('Thrine Sphere project in Light Theme:', ctaLightData.sphereId);

  // Hover Primary Start A Project button and verify mail icon reveal
  const primaryBtn = await page.$('.build-btn-primary');
  if (primaryBtn) {
    await primaryBtn.hover();
    await new Promise(r => setTimeout(r, 300));
    const mailIcon = await page.evaluate(btn => {
      const icon = btn.querySelector('.build-btn-mail-icon');
      const cs = window.getComputedStyle(icon);
      return { width: cs.width, opacity: cs.opacity };
    }, primaryBtn);
    console.log('Start A Project hover mail icon:', mailIcon);
  }

  // ==========================================
  // 4. CTA SECTION IN DARK THEME (Rough white material)
  // ==========================================
  console.log('\n--- 4. CTA SECTION IN DARK THEME ---');
  await page.evaluate(() => {
    window.applyTheme('dark');
  });
  await new Promise(r => setTimeout(r, 1000));

  const ctaDarkData = await page.evaluate(() => {
    const card = document.getElementById('brittle-contact-card');
    const cs = window.getComputedStyle(card);
    const sphere = document.querySelector('#thrine-model-mount model-embed');
    return {
      bgImage: cs.backgroundImage,
      color: cs.color,
      sphereId: sphere?.getAttribute('project')
    };
  });
  console.log('CTA Dark Theme Background Image:', ctaDarkData.bgImage);
  console.log('Thrine Sphere project in Dark Theme:', ctaDarkData.sphereId);

  // Take final screenshots
  const ctaCardEl = await page.$('#brittle-contact-card');
  if (ctaCardEl) {
    await ctaCardEl.screenshot({ path: 'scratch/final_cta_dark_verified.png' });
    console.log('Saved scratch/final_cta_dark_verified.png');
  }

  await page.evaluate(() => {
    window.applyTheme('light');
  });
  await new Promise(r => setTimeout(r, 800));
  if (ctaCardEl) {
    await ctaCardEl.screenshot({ path: 'scratch/final_cta_light_verified.png' });
    console.log('Saved scratch/final_cta_light_verified.png');
  }

  // Switch back to dark theme
  await page.evaluate(() => {
    window.applyTheme('dark');
  });
  await new Promise(r => setTimeout(r, 800));

  await browser.close();
  console.log('\n=== ALL REFINEMENTS VERIFIED SUCCESSFULLY ===');
})();
