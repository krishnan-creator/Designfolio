const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  console.log('=== VERIFYING CTA REDESIGN & CREATIVE SKILLS REFINEMENT ===\n');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // ==========================================
  // 1. VERIFY FINAL CTA: LET'S BUILD
  // ==========================================
  console.log('--- 1. FINAL CTA (LET\'S BUILD) ---');
  await page.evaluate(() => {
    document.getElementById('lets-build')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const ctaData = await page.evaluate(() => {
    const card = document.getElementById('brittle-contact-card');
    const label = card?.querySelector('.dbl-meta-label')?.innerText?.trim();
    const slash = card?.querySelector('.build-headline-accent-slash')?.innerText?.trim();
    const headlineLines = Array.from(card?.querySelectorAll('.build-headline-line') || []).map(el => el.innerText.trim());
    const statement = card?.querySelector('.build-statement')?.innerText?.trim();
    
    const actions = Array.from(card?.querySelectorAll('.build-action-btn') || []).map(btn => ({
      text: btn.innerText.trim(),
      href: btn.getAttribute('href'),
      isPrimary: btn.classList.contains('build-btn-primary'),
      isSecondary: btn.classList.contains('build-btn-secondary')
    }));

    const cardStyles = window.getComputedStyle(card);
    const bgImage = cardStyles.backgroundImage;
    const sphere = document.getElementById('thrine-model-mount');
    const modelEmbed = sphere?.querySelector('model-embed');

    return {
      label,
      slash,
      headlineLines,
      statement,
      actions,
      bgImage,
      hasSphere: !!sphere,
      hasModelEmbed: !!modelEmbed,
      embedProject: modelEmbed?.getAttribute('project')
    };
  });

  console.log('CTA Section Label:', ctaData.label);
  console.log('CTA Accent Slash:', ctaData.slash);
  console.log('CTA Headline Lines:', ctaData.headlineLines);
  console.log('CTA Description:', ctaData.statement);
  console.log('CTA Background Image (Must be none):', ctaData.bgImage);
  console.log('CTA Buttons Count:', ctaData.actions.length);
  ctaData.actions.forEach((a, i) => console.log(`  Button ${i+1}: "${a.text}" -> ${a.href} (primary: ${a.isPrimary}, secondary: ${a.isSecondary})`));
  console.log('Sphere mounted & project ID:', ctaData.hasSphere, ctaData.embedProject);

  // Take CTA Dark Screenshot
  await page.screenshot({ path: 'scratch/verify_cta_dark.png' });
  console.log('Saved scratch/verify_cta_dark.png');

  // ==========================================
  // 2. VERIFY FOUNDATIONS
  // ==========================================
  console.log('\n--- 2. FOUNDATIONS ---');
  await page.evaluate(() => {
    document.getElementById('lanyard-profile-mount')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const foundations = await page.evaluate(() => {
    const heading = document.getElementById('foundations-title')?.innerText?.trim();
    const cards = Array.from(document.querySelectorAll('.foundations-grid .foundation-card'));
    const names = cards.map(c => c.querySelector('.foundation-name')?.innerText?.trim());
    return { heading, names };
  });
  console.log('Foundations heading:', foundations.heading);
  console.log('Foundations tools (5 in exact order):', foundations.names);

  // ==========================================
  // 3. VERIFY CREATIVE SKILLS
  // ==========================================
  console.log('\n--- 3. CREATIVE SKILLS (Clean Tiles & Hover) ---');
  const creativeSkills = await page.evaluate(() => {
    const heading = document.getElementById('creative-skills-title')?.innerText?.trim();
    const cards = Array.from(document.querySelectorAll('.creative-skills-grid .creative-skill-card'));
    const data = cards.map(c => ({
      title: c.querySelector('.creative-skill-title')?.innerText?.trim(),
      hasIcon: !!c.querySelector('.creative-skill-icon svg'),
      hasSubtitle: !!c.querySelector('.creative-skill-sub'),
      hasNum: !!c.querySelector('.creative-skill-num')
    }));
    return { heading, cards: data, count: data.length };
  });

  console.log('Creative Skills Heading:', creativeSkills.heading);
  console.log('Creative Skills Count:', creativeSkills.count);
  creativeSkills.cards.forEach(c => {
    console.log(`  Tile: "${c.title}" | hasIcon: ${c.hasIcon} | hasSubtitle: ${c.hasSubtitle} (MUST BE FALSE) | hasNum: ${c.hasNum} (MUST BE FALSE)`);
  });

  // Test Hover Reveal on Creative Skills
  const primaryCards = await page.$$('.creative-skills-grid .creative-skill-card');
  for (let i = 0; i < primaryCards.length; i++) {
    await primaryCards[i].hover();
    await new Promise(r => setTimeout(r, 250));
    const subskills = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.creative-subskill-chip')).map(el => el.innerText.trim());
    });
    console.log(`  Hovered Tile ${i+1} revealed sub-skills:`, subskills);
  }

  // ==========================================
  // 4. VERIFY CAREER SKILL MAP
  // ==========================================
  console.log('\n--- 4. CAREER SKILL MAP (Bigger Icons, Titles Below, No Numbers) ---');
  const careerData = await page.evaluate(() => {
    const heading = document.getElementById('career-map-title')?.innerText?.trim();
    const cards = Array.from(document.querySelectorAll('.career-tiles-grid .career-tile-card'));
    const stages = cards.map(c => {
      const icon = c.querySelector('.career-tile-icon svg');
      return {
        role: c.querySelector('.career-tile-role')?.innerText?.trim(),
        hasStep: !!c.querySelector('.career-tile-step'),
        hasDesc: !!c.querySelector('.career-tile-desc'),
        iconWidth: icon?.getAttribute('width'),
        iconHeight: icon?.getAttribute('height')
      };
    });
    return { heading, stages, count: stages.length };
  });

  console.log('Career heading:', careerData.heading);
  console.log('Career stages count:', careerData.count);
  careerData.stages.forEach(s => {
    console.log(`  Stage: "${s.role}" | Icon size: ${s.iconWidth}x${s.iconHeight} | hasStep: ${s.hasStep} (MUST BE FALSE) | hasDesc: ${s.hasDesc} (MUST BE FALSE)`);
  });

  // Verify selecting stage updates detail panel
  const careerCards = await page.$$('.career-tiles-grid .career-tile-card');
  await careerCards[0].click();
  await new Promise(r => setTimeout(r, 150));
  const detailPanel0 = await page.evaluate(() => document.querySelector('.detail-panel-role')?.innerText?.trim());
  console.log('Clicked Stage 1 -> Detail panel:', detailPanel0);

  // Take Core Dark Screenshot
  await page.screenshot({ path: 'scratch/verify_core_refined_dark.png' });
  console.log('Saved scratch/verify_core_refined_dark.png');

  // ==========================================
  // 5. TEST LIGHT THEME
  // ==========================================
  console.log('\n--- 5. LIGHT THEME VERIFICATION ---');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    if (window.handleThemeChange) window.handleThemeChange('light');
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    document.getElementById('lets-build')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/verify_cta_light.png' });
  console.log('Saved scratch/verify_cta_light.png');

  await page.evaluate(() => {
    document.getElementById('lanyard-profile-mount')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/verify_core_refined_light.png' });
  console.log('Saved scratch/verify_core_refined_light.png');

  // Revert to dark
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (window.handleThemeChange) window.handleThemeChange('dark');
  });
  await new Promise(r => setTimeout(r, 300));

  await browser.close();
  console.log('\n=== VERIFICATION SUITE FINISHED SUCCESSFULLY ===');
})();
