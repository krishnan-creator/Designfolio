const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testHeaderAndBackstage() {
  console.log('====================================================');
  console.log('BROWSER TEST: PERMANENT DARK HEADER & BACKSTAGE UI');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Visit portfolio homepage
    console.log('1. Loading portfolio at http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // 2. Test Header in Dark Mode (Default)
    console.log('\n2. Testing Header in Dark Mode...');
    const headerDarkStyles = await page.evaluate(() => {
      const header = document.querySelector('.hero-header');
      const nav = document.querySelector('.header-nav');
      const navItems = Array.from(document.querySelectorAll('.nav-item')).map(el => ({
        text: el.textContent.trim(),
        color: window.getComputedStyle(el).color,
        bg: window.getComputedStyle(el).backgroundColor
      }));
      const themeBtn = document.querySelector('.theme-toggle-btn');
      const tagPill = document.querySelector('.header-tag-pill');
      const clock = document.querySelector('.time-digits');

      return {
        headerBg: window.getComputedStyle(header).backgroundColor,
        navBg: window.getComputedStyle(nav).backgroundColor,
        navBorder: window.getComputedStyle(nav).borderColor,
        navItems,
        themeBtnBg: window.getComputedStyle(themeBtn).backgroundColor,
        themeBtnColor: window.getComputedStyle(themeBtn).color,
        tagPillBg: window.getComputedStyle(tagPill).backgroundColor,
        tagPillColor: window.getComputedStyle(tagPill).color,
        clockColor: window.getComputedStyle(clock).color
      };
    });

    console.log('  Dark header bg:', headerDarkStyles.headerBg);
    console.log('  Dark nav bg:', headerDarkStyles.navBg);
    assert(headerDarkStyles.headerBg.includes('11, 11, 13') || headerDarkStyles.headerBg.includes('rgba(11'), 'Header background is dark in dark mode');
    assert(headerDarkStyles.navItems.length === 6, 'Exactly 6 navigation items present');

    // 3. Switch to Light Mode and Test Permanent Dark Header
    console.log('\n3. Switching to Light Mode via theme toggle...');
    await page.click('#theme-toggle');
    await new Promise(r => setTimeout(r, 600));

    const htmlTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    assert(htmlTheme === 'light', 'Site successfully switched to light mode: data-theme="light"');

    const headerLightStyles = await page.evaluate(() => {
      const header = document.querySelector('.hero-header');
      const nav = document.querySelector('.header-nav');
      const capsule = document.querySelector('.nav-liquid-capsule');
      const navItems = Array.from(document.querySelectorAll('.nav-item')).map(el => ({
        text: el.textContent.trim(),
        color: window.getComputedStyle(el).color,
        bg: window.getComputedStyle(el).backgroundColor
      }));
      const themeBtn = document.querySelector('.theme-toggle-btn');
      const tagPill = document.querySelector('.header-tag-pill');
      const clockDigits = document.querySelector('.time-digits');
      const clockPeriod = document.querySelector('.time-period');
      const cbkBrand = document.querySelector('.brand-cbk');

      return {
        headerBg: window.getComputedStyle(header).backgroundColor,
        headerColor: window.getComputedStyle(header).color,
        headerBorder: window.getComputedStyle(header).borderBottomColor,
        navBg: window.getComputedStyle(nav).backgroundColor,
        capsuleBg: window.getComputedStyle(capsule).backgroundColor,
        navItems,
        themeBtnBg: window.getComputedStyle(themeBtn).backgroundColor,
        themeBtnColor: window.getComputedStyle(themeBtn).color,
        tagPillBg: window.getComputedStyle(tagPill).backgroundColor,
        tagPillColor: window.getComputedStyle(tagPill).color,
        clockDigitsColor: window.getComputedStyle(clockDigits).color,
        clockPeriodColor: window.getComputedStyle(clockPeriod).color,
        cbkColor: window.getComputedStyle(cbkBrand).color
      };
    });

    console.log('  Light mode header bg:', headerLightStyles.headerBg);
    console.log('  Light mode nav bg:', headerLightStyles.navBg);
    console.log('  Light mode themeBtn bg:', headerLightStyles.themeBtnBg);

    assert(headerLightStyles.headerBg.includes('11, 11, 13') || headerLightStyles.headerBg.includes('rgba(11'), 'Header background is STILL DARK in light mode');
    assert(headerLightStyles.navBg.includes('18, 18, 22') || headerLightStyles.navBg.includes('rgba(18'), 'Header nav pill background is STILL DARK in light mode');
    assert(headerLightStyles.capsuleBg.includes('rgba(255, 255, 255, 0.12)'), 'Nav liquid capsule is dark translucent in light mode');
    assert(headerLightStyles.cbkColor === 'rgb(255, 255, 255)', 'CBK wordmark remains crisp white in light mode');
    assert(headerLightStyles.clockDigitsColor === 'rgb(255, 255, 255)', 'Clock digits remain white in light mode');
    assert(headerLightStyles.themeBtnBg.includes('rgba(255, 255, 255, 0.06)') || headerLightStyles.themeBtnBg.includes('rgba(255, 255, 255, 0.12)'), 'Theme toggle button remains dark in light mode');

    for (const item of headerLightStyles.navItems) {
      assert(!item.bg || item.bg === 'rgba(0, 0, 0, 0)' || item.bg === 'transparent', `Nav button [${item.text}] has no light background`);
      assert(item.color.includes('255, 255, 255'), `Nav button [${item.text}] has readable light text`);
    }

    // 4. Test Hover State on Navigation Button in Light Mode
    console.log('\n4. Testing Navigation Button Hover in Light Mode...');
    await page.hover('#nav-item-projects');
    await new Promise(r => setTimeout(r, 400));

    const hoverStyle = await page.evaluate(() => {
      const item = document.querySelector('#nav-item-projects');
      return {
        color: window.getComputedStyle(item).color,
        bg: window.getComputedStyle(item).backgroundColor
      };
    });

    console.log('  Hovered nav item color:', hoverStyle.color, 'bg:', hoverStyle.bg);
    assert(hoverStyle.color.includes('255, 255, 255'), 'Hovered nav button has white text: ' + hoverStyle.color);
    assert(hoverStyle.bg === 'rgba(0, 0, 0, 0)' || hoverStyle.bg === 'transparent', 'Hovered nav button NEVER turns white or light gray');

    // 5. Test Mobile Width in Light Mode
    console.log('\n5. Testing Mobile Width (390px) in Light Mode...');
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 300));

    const mobileStyles = await page.evaluate(() => {
      const header = document.querySelector('.hero-header');
      const nav = document.querySelector('.header-nav');
      const navItem = document.querySelector('.nav-item');
      return {
        headerBg: window.getComputedStyle(header).backgroundColor,
        navBg: window.getComputedStyle(nav).backgroundColor,
        navItemColor: window.getComputedStyle(navItem).color
      };
    });

    assert(mobileStyles.headerBg.includes('11, 11, 13') || mobileStyles.headerBg.includes('rgba(11'), 'Mobile header remains dark in light mode');
    assert(mobileStyles.navBg.includes('18, 18, 22') || mobileStyles.navBg.includes('rgba(18'), 'Mobile nav remains dark in light mode');
    assert(mobileStyles.navItemColor.includes('255, 255, 255'), 'Mobile nav item text remains light');

    // Restore desktop viewport
    await page.setViewport({ width: 1440, height: 900 });

    // 6. Test Backstage Access & OTP UI
    console.log('\n6. Testing Backstage Route Access (/backstage)...');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'networkidle2' });

    const authOverlayVisible = await page.evaluate(() => {
      const overlay = document.getElementById('auth-overlay');
      const otpView = document.getElementById('auth-view-otp');
      const mobile = document.getElementById('auth-dest-mobile').textContent.trim();
      const email = document.getElementById('auth-dest-email').textContent.trim();
      const countdown = document.getElementById('auth-countdown').textContent.trim();

      return {
        visible: overlay && window.getComputedStyle(overlay).display !== 'none',
        otpViewVisible: otpView && window.getComputedStyle(otpView).display !== 'none',
        mobile,
        email,
        countdown
      };
    });

    assert(authOverlayVisible.visible === true, 'Auth overlay is displayed for unauthenticated user');
    assert(authOverlayVisible.otpViewVisible === true, 'OTP verification view is active');
    assert(authOverlayVisible.mobile === '+91 ******1703', 'Masked mobile destination shown: ' + authOverlayVisible.mobile);
    assert(authOverlayVisible.email === 'pr*******@gmail.com', 'Masked email destination shown: ' + authOverlayVisible.email);
    assert(authOverlayVisible.countdown.startsWith('02:') || authOverlayVisible.countdown.startsWith('03:'), 'Live 3-minute countdown timer active: ' + authOverlayVisible.countdown);

    // 7. Test Password Fallback Switcher
    console.log('\n7. Testing Password Fallback Modal Switch...');
    await page.evaluate(() => window.switchToPasswordView());
    await new Promise(r => setTimeout(r, 200));

    const pwViewVisible = await page.evaluate(() => {
      const pwView = document.getElementById('auth-view-password');
      return pwView && window.getComputedStyle(pwView).display !== 'none';
    });
    assert(pwViewVisible === true, 'Password fallback view displayed');

    // Switch back to OTP
    await page.evaluate(() => window.switchToOtpView());
    await new Promise(r => setTimeout(r, 200));

    // 8. Test Submitting Wrong OTP
    console.log('\n8. Testing Client OTP Verification Submission...');
    await page.type('#auth-otp', '123456');
    await page.click('#auth-otp-btn');
    await new Promise(r => setTimeout(r, 500));

    const otpError = await page.evaluate(() => {
      const err = document.getElementById('auth-otp-error');
      return {
        visible: err && window.getComputedStyle(err).display !== 'none',
        text: err ? err.textContent : ''
      };
    });

    assert(otpError.visible === true, 'Error message shown for incorrect OTP');
    assert(otpError.text.includes('Incorrect verification code'), 'Error text: ' + otpError.text);

    // 9. Authenticate via Password Fallback in UI
    console.log('\n9. Authenticating via Password Fallback in UI...');
    await page.evaluate(() => window.switchToPasswordView());
    await new Promise(r => setTimeout(r, 200));

    await page.type('#auth-fallback-password', 'cbk2026');
    await page.click('#auth-password-btn');
    await new Promise(r => setTimeout(r, 1200));

    const backstageUnlocked = await page.evaluate(() => {
      const overlay = document.getElementById('auth-overlay');
      return !overlay || window.getComputedStyle(overlay).display === 'none';
    });

    assert(backstageUnlocked === true, 'Backstage unlocked successfully upon password fallback verification');

    // 10. Test Scenario E: Logout button inside Backstage
    console.log('\n10. Testing Logout Button inside Backstage...');
    const logoutBtnPresent = await page.evaluate(() => {
      const btn = document.querySelector('.btn-logout');
      return !!btn;
    });
    assert(logoutBtnPresent === true, 'Logout button present in Backstage header');

    await page.click('.btn-logout');
    await new Promise(r => setTimeout(r, 800));

    const loggedOutOverlay = await page.evaluate(() => {
      const overlay = document.getElementById('auth-overlay');
      return overlay && window.getComputedStyle(overlay).display !== 'none';
    });
    assert(loggedOutOverlay === true, 'Overlay immediately re-appears upon logout, requiring fresh authentication');

    console.log('\n====================================================');
    console.log(`BROWSER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

  } finally {
    await browser.close();
  }
}

testHeaderAndBackstage().catch(err => {
  console.error('Browser test failed:', err);
  process.exit(1);
});
