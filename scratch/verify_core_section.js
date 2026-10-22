const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  console.log('=== RUNNING CBK DESIGNFOLIO CORE SECTION VERIFICATION ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to THE CORE section
  await page.evaluate(() => {
    const el = document.getElementById('lanyard-profile-mount');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Verify 01 / FOUNDATIONS
  const foundationsData = await page.evaluate(() => {
    const heading = document.getElementById('foundations-title')?.innerText?.trim();
    const cards = Array.from(document.querySelectorAll('.foundations-grid .foundation-card'));
    const names = cards.map(c => c.querySelector('.foundation-name')?.innerText?.trim());
    const hasIcons = cards.map(c => !!c.querySelector('.foundation-icon img, .foundation-icon svg'));
    return { heading, names, count: names.length, hasIcons };
  });

  console.log('\n--- 1. FOUNDATIONS ---');
  console.log('Foundations heading:', foundationsData.heading);
  console.log('Foundations tools:', foundationsData.names);
  console.log('Tool count:', foundationsData.count);
  console.log('All have icons:', foundationsData.hasIcons.every(Boolean));

  const expectedTools = ['ComfyUI', 'Antigravity', 'Qwen', 'Higgsfield', 'ElevenLabs'];
  const foundationsMatch = JSON.stringify(foundationsData.names) === JSON.stringify(expectedTools);
  console.log('Foundations order matches exactly:', foundationsMatch);

  // 2. Verify 02 / CREATIVE SKILLS
  const creativeSkillsData = await page.evaluate(() => {
    const heading = document.getElementById('creative-skills-title')?.innerText?.trim();
    const cards = Array.from(document.querySelectorAll('.creative-skills-grid .creative-skill-card'));
    const skills = cards.map(c => ({
      num: c.querySelector('.creative-skill-num')?.innerText?.trim(),
      title: c.querySelector('.creative-skill-title')?.innerText?.trim(),
      sub: c.querySelector('.creative-skill-sub')?.innerText?.trim(),
      hasIcon: !!c.querySelector('.creative-skill-icon svg')
    }));
    return { heading, skills, count: skills.length };
  });

  console.log('\n--- 2. CREATIVE SKILLS (Primary Tiles) ---');
  console.log('Heading:', creativeSkillsData.heading);
  console.log('Tile count:', creativeSkillsData.count);
  creativeSkillsData.skills.forEach(s => console.log(`  Tile ${s.num}: ${s.title} | ${s.sub} (hasIcon: ${s.hasIcon})`));

  // Test Hover on each of the 5 Creative Skill tiles & inspect revealed sub-skills
  console.log('\n--- 3. CREATIVE SKILLS (Sub-skills Hover Reveal) ---');
  const primaryCards = await page.$$('.creative-skills-grid .creative-skill-card');

  for (let i = 0; i < primaryCards.length; i++) {
    await primaryCards[i].hover();
    await new Promise(r => setTimeout(r, 300));

    const revealed = await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('.creative-subskill-chip'));
      return chips.map(c => c.innerText.trim());
    });

    console.log(`Tile ${i + 1} revealed sub-skills (${revealed.length}):`, revealed);
  }

  // Test moving from primary tile to revealed sub-skill chip (interaction boundary check)
  console.log('\n--- 4. CONTINUOUS HOVER BOUNDARY CHECK ---');
  await primaryCards[0].hover();
  await new Promise(r => setTimeout(r, 200));

  const chipBefore = await page.$('.creative-subskill-chip');
  if (chipBefore) {
    await chipBefore.hover();
    await new Promise(r => setTimeout(r, 250));
    const stillOpen = await page.evaluate(() => {
      return document.querySelectorAll('.creative-subskill-chip').length === 5;
    });
    console.log('Moving into revealed chips maintains state (no flicker/premature close):', stillOpen);
  }

  // Moving outside interaction zone
  await page.mouse.move(10, 10);
  await new Promise(r => setTimeout(r, 300));
  const closedAfterLeave = await page.evaluate(() => {
    return document.querySelectorAll('.creative-subskill-chip').length === 0;
  });
  console.log('Leaving zone closes revealed sub-skills smoothly:', closedAfterLeave);

  // 5. Verify 03 / CAREER SKILL MAP
  console.log('\n--- 5. CAREER SKILL MAP ---');
  const careerData = await page.evaluate(() => {
    const heading = document.getElementById('career-map-title')?.innerText?.trim();
    const cards = Array.from(document.querySelectorAll('.career-tiles-grid .career-tile-card'));
    const stages = cards.map(c => ({
      step: c.querySelector('.career-tile-step')?.innerText?.trim(),
      role: c.querySelector('.career-tile-role')?.innerText?.trim(),
      hasDesc: !!c.querySelector('.career-tile-desc'),
      hasIcon: !!c.querySelector('.career-tile-icon svg')
    }));
    return { heading, stages, count: stages.length };
  });

  console.log('Career heading:', careerData.heading);
  console.log('Career stage count:', careerData.count);
  careerData.stages.forEach(s => {
    console.log(`  Stage ${s.step}: ${s.role} | hasDesc: ${s.hasDesc} (MUST BE FALSE) | hasIcon: ${s.hasIcon} (MUST BE TRUE)`);
  });

  // Verify selecting career stages updates detail panel
  console.log('\n--- 6. CAREER DETAIL PANEL SELECTION ---');
  const careerCards = await page.$$('.career-tiles-grid .career-tile-card');
  for (let i = 0; i < careerCards.length; i++) {
    await careerCards[i].click();
    await new Promise(r => setTimeout(r, 150));
    const panelText = await page.evaluate(() => {
      const title = document.querySelector('.detail-panel-title')?.innerText?.trim();
      const step = document.querySelector('.detail-panel-step')?.innerText?.trim();
      const sub = document.querySelector('.detail-panel-sub')?.innerText?.trim();
      const desc = document.querySelector('.detail-panel-desc')?.innerText?.trim();
      return `${step} ${title} · ${sub} -> ${desc.slice(0, 40)}...`;
    });
    console.log(`Selected card ${i + 1} -> Detail panel: ${panelText}`);
  }

  // 7. Verify TAP & DRAG THE ID Instruction
  console.log('\n--- 7. ID INSTRUCTION ---');
  const idInstruction = await page.evaluate(() => {
    const el = document.querySelector('.lanyard-drag-instruction');
    return {
      text: el?.innerText?.trim(),
      display: el ? window.getComputedStyle(el).display : 'none',
      pointerEvents: el ? window.getComputedStyle(el).pointerEvents : null
    };
  });
  console.log('ID Instruction:', idInstruction);

  // Take screenshot in Dark Theme
  await primaryCards[0].hover();
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'scratch/verify_the_core_dark.png', fullPage: false });
  console.log('Saved scratch/verify_the_core_dark.png');

  // Test Light Theme
  console.log('\n--- 8. LIGHT THEME VERIFICATION ---');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    if (window.handleThemeChange) window.handleThemeChange('light');
  });
  await new Promise(r => setTimeout(r, 600));

  const lightStyles = await page.evaluate(() => {
    const card = document.querySelector('.career-tile-card');
    const selected = document.querySelector('.career-tile-card.is-selected');
    const cs = window.getComputedStyle(card);
    const ss = window.getComputedStyle(selected);
    return {
      idleBg: cs.backgroundColor,
      idleColor: cs.color,
      selectedBg: ss.backgroundColor,
      selectedColor: ss.color
    };
  });
  console.log('Light Theme Career Tile Styles:', lightStyles);

  await page.screenshot({ path: 'scratch/verify_the_core_light.png', fullPage: false });
  console.log('Saved scratch/verify_the_core_light.png');

  // Reset to Dark Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (window.handleThemeChange) window.handleThemeChange('dark');
  });
  await new Promise(r => setTimeout(r, 400));

  await browser.close();
  console.log('\n=== ALL VERIFICATION CHECKS COMPLETED ===');
})();
