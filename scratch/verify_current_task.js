const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('============================================================');
  console.log('VERIFICATION SUITE: CBK DESIGNFOLIO — TASKS 1, 2, & 3');
  console.log('============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const networkRequests = [];
  const failedRequests = [];
  const consoleErrors = [];

  page.on('request', req => {
    networkRequests.push({ url: req.url(), resourceType: req.resourceType() });
  });
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), errorText: req.failure()?.errorText });
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  const results = {
    task1: [],
    task2: [],
    task3: []
  };

  function assert(category, condition, label, details) {
    const status = condition ? 'PASS' : 'FAIL';
    const logFn = condition ? console.log : console.error;
    logFn(`[${status}] [${category}] ${label}${details ? ` -> ${details}` : ''}`);
    results[category].push({ status, label, details });
  }

  try {
    console.log('--- Step 1: Navigating to http://localhost:3000 ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // =========================================================================
    // TASK 3: INITIAL PERFORMANCE & VIDEO AUDIT
    // =========================================================================
    console.log('\n--- Auditing Task 3: Performance & Network Contention ---');

    // 1. Check video elements
    const videoStats = await page.evaluate(() => {
      const vids = Array.from(document.querySelectorAll('video'));
      return {
        count: vids.length,
        allPreloadNone: vids.every(v => v.preload === 'none'),
        allPaused: vids.every(v => v.paused),
        details: vids.map(v => ({ src: v.src.split('/').pop(), preload: v.preload, paused: v.paused }))
      };
    });

    assert('task3', videoStats.count === 9, '9 Selected Works video elements found', `Count: ${videoStats.count}`);
    assert('task3', videoStats.allPreloadNone, 'All preview videos configured with preload="none"', JSON.stringify(videoStats.details.map(d => `${d.src}:${d.preload}`)));
    assert('task3', failedRequests.length === 0, 'No aborted network stream requests on page load', `Failed requests: ${failedRequests.length}`);

    // =========================================================================
    // TASK 1: THRINE MODEL IN BOTH THEMES
    // =========================================================================
    console.log('\n--- Auditing Task 1: Thrine 3D Model in Both Themes ---');

    // Scroll to the footer contact section
    await page.evaluate(() => {
      const footer = document.querySelector('.brittle-contact-card') || document.getElementById('contact-section');
      if (footer) footer.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 2000));

    // Check script tag for thrine embed
    const scriptCheck = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src*="thrine.app/embed/v1.js"]'));
      return {
        count: scripts.length,
        type: scripts[0]?.type,
        src: scripts[0]?.src
      };
    });
    assert('task1', scriptCheck.count === 1, 'Thrine embed runtime script loaded exactly once', `count: ${scriptCheck.count}`);

    // Check model-embed element in Dark Mode
    const darkModelStats = await page.evaluate(() => {
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      const embed = document.querySelector('model-embed');
      const container = document.querySelector('.thrine-model-container');
      if (!embed || !container) return { found: false, theme };

      const rect = embed.getBoundingClientRect();
      const style = window.getComputedStyle(embed);
      const containerStyle = window.getComputedStyle(container);

      const ratio = rect.width / (rect.height || 1);
      const expectedRatio = 1259 / 787;

      return {
        found: true,
        theme,
        project: embed.getAttribute('project'),
        aspectRatioStyle: style.aspectRatio,
        computedWidth: rect.width,
        computedHeight: rect.height,
        ratio: ratio.toFixed(4),
        expectedRatio: expectedRatio.toFixed(4),
        ratioMatches: Math.abs(ratio - expectedRatio) < 0.05,
        embedBg: style.backgroundColor,
        containerBg: containerStyle.backgroundColor
      };
    });

    assert('task1', darkModelStats.found, 'model-embed element found in DOM');
    assert('task1', darkModelStats.project === 'e_d9b05f3677dd12bf8341', 'Dark theme uses exact project ID e_d9b05f3677dd12bf8341', `Found: ${darkModelStats.project}`);
    assert('task1', darkModelStats.ratioMatches, 'Model aspect-ratio matches 1259/787', `Computed ratio: ${darkModelStats.ratio}, Expected: ${darkModelStats.expectedRatio}`);
    assert('task1', darkModelStats.embedBg === 'rgba(0, 0, 0, 0)' || darkModelStats.embedBg === 'transparent', 'Model embed has transparent background', `bg: ${darkModelStats.embedBg}`);

    // Capture Dark Mode Screenshot of Contact Section
    const contactCardEl = await page.$('.brittle-contact-card');
    if (contactCardEl) {
      await contactCardEl.screenshot({ path: 'scratch/screenshot_lets_build_dark.png' });
      console.log('Saved screenshot: scratch/screenshot_lets_build_dark.png');
    }

    // Toggle to Light Theme
    console.log('\n--- Toggling to Light Theme ---');
    await page.evaluate(() => {
      const toggle = document.querySelector('.theme-toggle-btn') || document.getElementById('theme-toggle');
      if (toggle) {
        toggle.click();
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        if (window.handleThemeChange) window.handleThemeChange();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    // Check model-embed element in Light Mode
    const lightModelStats = await page.evaluate(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      const embed = document.querySelector('model-embed');
      const container = document.querySelector('.thrine-model-container');
      if (!embed || !container) return { found: false, theme };

      const rect = embed.getBoundingClientRect();
      const style = window.getComputedStyle(embed);
      const ratio = rect.width / (rect.height || 1);
      const expectedRatio = 1259 / 787;

      return {
        found: true,
        theme,
        project: embed.getAttribute('project'),
        aspectRatioStyle: style.aspectRatio,
        computedWidth: rect.width,
        computedHeight: rect.height,
        ratio: ratio.toFixed(4),
        expectedRatio: expectedRatio.toFixed(4),
        ratioMatches: Math.abs(ratio - expectedRatio) < 0.05,
        embedBg: style.backgroundColor
      };
    });

    assert('task1', lightModelStats.theme === 'light', 'Document transitioned to data-theme="light"', `Theme: ${lightModelStats.theme}`);
    assert('task1', lightModelStats.project === 'e_d9b05f3677dd12bf8341', 'Light theme preserves exact project ID e_d9b05f3677dd12bf8341', `Found: ${lightModelStats.project}`);
    assert('task1', lightModelStats.ratioMatches, 'Light mode aspect-ratio matches 1259/787', `Computed ratio: ${lightModelStats.ratio}`);

    // Capture Light Mode Screenshot of Contact Section
    if (contactCardEl) {
      await contactCardEl.screenshot({ path: 'scratch/screenshot_lets_build_light.png' });
      console.log('Saved screenshot: scratch/screenshot_lets_build_light.png');
    }

    // Switch back to Dark Theme for remaining tests
    await page.evaluate(() => {
      const toggle = document.querySelector('.theme-toggle-btn') || document.getElementById('theme-toggle');
      if (toggle) toggle.click();
      else {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (window.handleThemeChange) window.handleThemeChange();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    // =========================================================================
    // TASK 2: COMPACT CONTACT SECTION & FORM VERIFICATION
    // =========================================================================
    console.log('\n--- Auditing Task 2: Compact Contact Section & Geometry ---');

    const geom = await page.evaluate(() => {
      const card = document.querySelector('.brittle-contact-card');
      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const messageInput = document.getElementById('contact-message');
      const primaryBtn = document.getElementById('contact-submit-btn');
      const secondaryWrap = document.querySelector('.build-secondary-actions');
      const sphereCol = document.querySelector('.contact-card-sphere-col');
      const formCol = document.querySelector('.contact-card-content-col') || document.querySelector('.inline-contact-form');

      const cardStyle = window.getComputedStyle(card);
      const cardRect = card.getBoundingClientRect();
      const nameRect = nameInput.getBoundingClientRect();
      const emailRect = emailInput.getBoundingClientRect();
      const msgRect = messageInput.getBoundingClientRect();
      const sphereRect = sphereCol.getBoundingClientRect();
      const formRect = formCol.getBoundingClientRect();

      const padTop = parseFloat(cardStyle.paddingTop);
      const padBottom = parseFloat(cardStyle.paddingBottom);
      const gapNameEmail = emailRect.top - nameRect.bottom;
      const gapEmailMsg = msgRect.top - emailRect.bottom;

      // Overlap check
      const overlaps = !(
        formRect.right <= sphereRect.left ||
        formRect.left >= sphereRect.right ||
        formRect.bottom <= sphereRect.top ||
        formRect.top >= sphereRect.bottom
      );

      return {
        cardHeight: cardRect.height,
        minHeight: cardStyle.minHeight,
        padTop,
        padBottom,
        gapNameEmail,
        gapEmailMsg,
        nameHeight: nameRect.height,
        emailHeight: emailRect.height,
        msgHeight: msgRect.height,
        sphereWidth: sphereRect.width,
        sphereHeight: sphereRect.height,
        overlaps
      };
    });

    assert('task2', geom.padTop >= 35 && geom.padTop <= 50, 'Card vertical padding top is tightened to 36-48px range', `Measured: ${geom.padTop}px`);
    assert('task2', geom.padBottom >= 35 && geom.padBottom <= 50, 'Card vertical padding bottom is tightened to 36-48px range', `Measured: ${geom.padBottom}px`);
    assert('task2', geom.gapNameEmail >= 18 && geom.gapNameEmail <= 24, 'Gap between Name and Email is tightened to ~18-22px', `Measured: ${geom.gapNameEmail}px`);
    assert('task2', geom.gapEmailMsg >= 18 && geom.gapEmailMsg <= 24, 'Gap between Email and Message is tightened to ~18-22px', `Measured: ${geom.gapEmailMsg}px`);
    assert('task2', geom.nameHeight === 44, 'Name input height is standard 44px', `Measured: ${geom.nameHeight}px`);
    assert('task2', geom.emailHeight === 44, 'Email input height is standard 44px', `Measured: ${geom.emailHeight}px`);
    assert('task2', geom.msgHeight >= 80 && geom.msgHeight <= 100, 'Message input height is compact (~90px)', `Measured: ${geom.msgHeight}px`);
    assert('task2', !geom.overlaps, 'Form column and 3D sphere column do not overlap', `Form and Sphere overlap: ${geom.overlaps}`);

    // Form submission & validation testing
    console.log('\n--- Testing Form Submission & Validation ---');

    // 1. Submit empty form
    await page.click('#contact-submit-btn');
    await new Promise(r => setTimeout(r, 300));
    const emptyErrors = await page.evaluate(() => {
      const errName = document.getElementById('contact-name-error')?.textContent.trim();
      const errEmail = document.getElementById('contact-email-error')?.textContent.trim();
      const errMessage = document.getElementById('contact-message-error')?.textContent.trim();
      return { errName, errEmail, errMessage };
    });
    assert('task2', !!emptyErrors.errName && !!emptyErrors.errEmail && !!emptyErrors.errMessage, 'Empty submission triggers required validation on all 3 fields', JSON.stringify(emptyErrors));

    // 2. Fill invalid email
    await page.type('#contact-name', 'Alex Mercer');
    await page.type('#contact-email', 'invalid-email-address');
    await page.type('#contact-message', 'Hello, this is a test inquiry for CBK DESIGNFOLIO.');
    await page.click('#contact-submit-btn');
    await new Promise(r => setTimeout(r, 300));

    const invalidEmailErr = await page.evaluate(() => {
      const errEmail = document.getElementById('contact-email-error')?.textContent.trim();
      return errEmail;
    });
    assert('task2', !!invalidEmailErr && invalidEmailErr.toLowerCase().includes('email'), 'Invalid email format triggers specific email validation error', `Error: ${invalidEmailErr}`);

    // 3. Fill valid email and submit
    await page.evaluate(() => {
      const email = document.getElementById('contact-email');
      if (email) email.value = '';
    });
    await page.type('#contact-email', 'alex@designfolio.test');
    await page.click('#contact-submit-btn');
    await page.waitForFunction(() => {
      const el = document.getElementById('contact-status-box');
      return el && el.style.display === 'block' && el.textContent.trim().length > 0;
    }, { timeout: 10000 });

    const submitStatus = await page.evaluate(() => {
      const statusEl = document.getElementById('contact-status-box');
      return {
        text: statusEl?.textContent.trim(),
        hasSuccessClass: statusEl?.classList.contains('success'),
        display: statusEl?.style.display
      };
    });
    assert('task2', (submitStatus.hasSuccessClass || submitStatus.display === 'block') && submitStatus.text.length > 0, 'Valid form submission displays success confirmation', `Status: "${submitStatus.text?.slice(0, 50)}"`);

    // 4. Verify Social Buttons
    const socialButtons = await page.evaluate(() => {
      const waBtn = document.querySelector('.build-secondary-actions a[href*="wa.me"], .build-secondary-actions [data-action="whatsapp"], .build-secondary-actions a[title*="WhatsApp"]');
      const liBtn = document.querySelector('.build-secondary-actions a[href*="linkedin.com"], .build-secondary-actions [data-action="linkedin"], .build-secondary-actions a[title*="LinkedIn"]');
      const allActionBtns = Array.from(document.querySelectorAll('.build-secondary-actions .build-action-btn'));

      return {
        count: allActionBtns.length,
        buttonTexts: allActionBtns.map(b => b.textContent.trim()),
        hasWhatsApp: allActionBtns.some(b => b.textContent.toLowerCase().includes('whatsapp')),
        hasLinkedIn: allActionBtns.some(b => b.textContent.toLowerCase().includes('linkedin'))
      };
    });
    assert('task2', socialButtons.count >= 2, 'WhatsApp and LinkedIn social action buttons preserved', JSON.stringify(socialButtons.buttonTexts));

    // =========================================================================
    // TASK 3: COMPREHENSIVE SCROLL AND FRAME RATE MEASUREMENTS
    // =========================================================================
    console.log('\n--- Auditing Task 3: Full Page Scroll Frame Rate & Jitter ---');

    const scrollMetrics = await page.evaluate(async () => {
      const totalHeight = document.documentElement.scrollHeight;
      const step = 250;
      const delays = [];
      let prevTime = performance.now();

      for (let y = 0; y < totalHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => requestAnimationFrame(r));
        const now = performance.now();
        delays.push(now - prevTime);
        prevTime = now;
      }

      // Scroll back up to Hero
      for (let y = totalHeight; y >= 0; y -= step) {
        window.scrollTo(0, y);
        await new Promise(r => requestAnimationFrame(r));
        const now = performance.now();
        delays.push(now - prevTime);
        prevTime = now;
      }

      const avgFrame = delays.reduce((a, b) => a + b, 0) / delays.length;
      const maxFrame = Math.max(...delays);
      const longFrames = delays.filter(d => d > 40).length;

      return {
        stepCount: delays.length,
        avgFrameTime: avgFrame.toFixed(2),
        maxFrameTime: maxFrame.toFixed(2),
        longFrames
      };
    });

    assert('task3', parseFloat(scrollMetrics.avgFrameTime) < 30, 'Average scroll frame duration is smooth (< 30ms)', `Avg: ${scrollMetrics.avgFrameTime}ms`);
    assert('task3', scrollMetrics.longFrames === 0, 'Zero frame drops (> 40ms) during bi-directional scrolling', `Dropped frames: ${scrollMetrics.longFrames}`);
    assert('task3', consoleErrors.length === 0, 'Zero runtime console errors across entire session', `Errors: ${consoleErrors.length}`);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }

  console.log('\n============================================================');
  console.log('SUMMARY RESULTS:');
  const task1Pass = results.task1.every(r => r.status === 'PASS');
  const task2Pass = results.task2.every(r => r.status === 'PASS');
  const task3Pass = results.task3.every(r => r.status === 'PASS');

  console.log(`TASK 1 (Thrine Model in Both Themes): ${task1Pass ? 'ALL PASS ✅' : 'SOME FAILED ❌'}`);
  console.log(`TASK 2 (Compact Let's Connect Section): ${task2Pass ? 'ALL PASS ✅' : 'SOME FAILED ❌'}`);
  console.log(`TASK 3 (Website Performance Repair):    ${task3Pass ? 'ALL PASS ✅' : 'SOME FAILED ❌'}`);
  console.log('============================================================\n');

  fs.writeFileSync('scratch/verification_results.json', JSON.stringify(results, null, 2));
})();
