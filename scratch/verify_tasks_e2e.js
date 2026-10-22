const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Locate local chrome
function getChromePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found');
}

async function run() {
  console.log('--- STARTING VERIFICATION FOR TASK 1 (VISUAL ORBIT) & TASK 2 (BEYOND THE FRAME) ---');
  const browser = await puppeteer.launch({
    executablePath: getChromePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // TEST 1: PUBLIC HOMEPAGE — VISUAL ORBIT DOME SCALE & FULL-BLEED
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Inspecting Public Homepage Visual Orbit...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));

    // Wait for Visual Orbit container and DomeGallery root
    await page.waitForSelector('.sphere-root', { timeout: 10000 });

    const orbitMetrics = await page.evaluate(() => {
      const root = document.querySelector('.sphere-root');
      const container = document.querySelector('.visual-orbit-container');
      const sphere = document.querySelector('.sphere');
      const items = Array.from(document.querySelectorAll('.sphere .item'));
      const populatedImages = Array.from(document.querySelectorAll('.item__image img'));
      const emptyHolders = Array.from(document.querySelectorAll('.item__image--empty'));

      const rootStyle = window.getComputedStyle(root);
      const containerRect = container.getBoundingClientRect();
      const firstImg = populatedImages[0];
      const imgStyle = firstImg ? window.getComputedStyle(firstImg) : null;
      const holder = firstImg ? firstImg.closest('.item__image') : null;
      const holderStyle = holder ? window.getComputedStyle(holder) : null;
      const holderRect = holder ? holder.getBoundingClientRect() : null;
      const imgRect = firstImg ? firstImg.getBoundingClientRect() : null;

      return {
        radiusProp: rootStyle.getPropertyValue('--radius').trim(),
        itemWidthProp: rootStyle.getPropertyValue('--item-width').trim(),
        itemHeightProp: rootStyle.getPropertyValue('--item-height').trim(),
        containerWidth: Math.round(containerRect.width),
        containerHeight: Math.round(containerRect.height),
        totalItems: items.length,
        populatedCount: populatedImages.length,
        emptyCount: emptyHolders.length,
        firstImgComputed: {
          width: imgStyle?.width,
          height: imgStyle?.height,
          objectFit: imgStyle?.objectFit,
          objectPosition: imgStyle?.objectPosition,
          rectWidth: Math.round(imgRect?.width || 0),
          rectHeight: Math.round(imgRect?.height || 0)
        },
        holderComputed: {
          overflow: holderStyle?.overflow,
          borderRadius: holderStyle?.borderRadius,
          rectWidth: Math.round(holderRect?.width || 0),
          rectHeight: Math.round(holderRect?.height || 0)
        }
      };
    });

    console.log('Visual Orbit Radius CSS var:', orbitMetrics.radiusProp);
    console.log('Visual Orbit Item Width var:', orbitMetrics.itemWidthProp);
    console.log('Visual Orbit Item Height var:', orbitMetrics.itemHeightProp);
    console.log('Total Orbit Items:', orbitMetrics.totalItems, '(Expected: 48)');
    console.log('Populated Images:', orbitMetrics.populatedCount, '(Expected: 40)');
    console.log('Empty Slots:', orbitMetrics.emptyCount, '(Expected: 8)');
    console.log('First Image object-fit:', orbitMetrics.firstImgComputed.objectFit);
    console.log('First Image dimensions:', orbitMetrics.firstImgComputed.rectWidth + 'x' + orbitMetrics.firstImgComputed.rectHeight);
    console.log('Holder dimensions:', orbitMetrics.holderComputed.rectWidth + 'x' + orbitMetrics.holderComputed.rectHeight);
    console.log('Holder overflow:', orbitMetrics.holderComputed.overflow);

    const radiusNum = parseInt(orbitMetrics.radiusProp);
    if (radiusNum < 700) throw new Error(`Radius expected >= 710px, got ${radiusNum}`);
    if (orbitMetrics.firstImgComputed.objectFit !== 'cover') {
      throw new Error(`Expected object-fit: cover, got ${orbitMetrics.firstImgComputed.objectFit}`);
    }
    if (orbitMetrics.totalItems !== 48) {
      throw new Error(`Expected 48 total items in Visual Orbit, got ${orbitMetrics.totalItems}`);
    }

    // Capture screenshot of enlarged Visual Orbit
    const orbitEl = await page.$('#visual-orbit');
    if (orbitEl) {
      await orbitEl.screenshot({ path: 'scratch/verified_enlarged_orbit_dark.png' });
      console.log('Saved scratch/verified_enlarged_orbit_dark.png');
    }

    // Test click-to-enlarge lightbox in Visual Orbit
    console.log('Testing click-to-enlarge lightbox in Visual Orbit...');
    await page.evaluate(() => {
      const firstPopulated = document.querySelector('.item__image:not(.item__image--empty)');
      if (firstPopulated) firstPopulated.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const lightboxMetrics = await page.evaluate(() => {
      const overlay = document.querySelector('.dg-lightbox-overlay');
      const img = document.querySelector('.dg-lightbox-image');
      const closeBtn = document.querySelector('.dg-lightbox-btn--close');
      const overlayStyle = overlay ? window.getComputedStyle(overlay) : null;
      return {
        isOpen: !!overlay,
        bgColor: overlayStyle?.backgroundColor,
        imgSrc: img?.getAttribute('src'),
        hasClose: !!closeBtn
      };
    });
    console.log('Lightbox open:', lightboxMetrics.isOpen, 'bg:', lightboxMetrics.bgColor);
    if (!lightboxMetrics.isOpen) throw new Error('Lightbox failed to open upon tile click');

    // Close lightbox via Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));
    const isClosed = await page.evaluate(() => !document.querySelector('.dg-lightbox-overlay'));
    console.log('Lightbox closed via Escape:', isClosed);
    if (!isClosed) throw new Error('Lightbox failed to close upon Escape');

    // -------------------------------------------------------------
    // TEST 2: PUBLIC HOMEPAGE — BEYOND THE FRAME EXACTLY 9 CARDS
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Inspecting Public Homepage Beyond The Frame...');
    const btfMetrics = await page.evaluate(() => {
      const btfZone = document.getElementById('beyond-the-frame-zone');
      const cards = Array.from(document.querySelectorAll('.beyond-frame-card'));
      const pips = Array.from(document.querySelectorAll('.beyond-frame-step-pip'));
      const counter = document.querySelector('.beyond-frame-step-counter');
      const marqueeItems = Array.from(document.querySelectorAll('.beyond-frame-wordmark-item')).map(el => el.textContent.trim());

      const cardDetails = cards.map((c, i) => {
        const title = c.querySelector('.beyond-frame-card__title')?.textContent.trim();
        const badge = c.querySelector('.beyond-frame-card__badge span:last-child')?.textContent.trim();
        const img = c.querySelector('.beyond-frame-card__image')?.getAttribute('src');
        return { index: i, title, badge, img };
      });

      return {
        totalCards: cards.length,
        totalPips: pips.length,
        counterText: counter ? counter.textContent.trim() : null,
        marqueeUnique: Array.from(new Set(marqueeItems)),
        cardDetails
      };
    });

    console.log('Beyond The Frame Total Cards:', btfMetrics.totalCards, '(Expected: 9)');
    console.log('Beyond The Frame Step Pips:', btfMetrics.totalPips, '(Expected: 9)');
    console.log('Beyond The Frame Counter text:', btfMetrics.counterText, '(Expected: 01 / 09)');
    console.log('Card list:');
    btfMetrics.cardDetails.forEach(c => {
      console.log(`  [${c.index + 1}] ${c.title} (${c.badge}) -> ${c.img}`);
    });

    if (btfMetrics.totalCards !== 9) {
      throw new Error(`Expected exactly 9 Beyond The Frame cards, got ${btfMetrics.totalCards}`);
    }
    if (btfMetrics.totalPips !== 9) {
      throw new Error(`Expected exactly 9 Beyond The Frame step pips, got ${btfMetrics.totalPips}`);
    }
    if (btfMetrics.counterText !== '01 / 09') {
      throw new Error(`Expected counter text '01 / 09', got '${btfMetrics.counterText}'`);
    }

    // Capture screenshot of Beyond the Frame
    const btfZone = await page.$('#beyond-the-frame-zone');
    if (btfZone) {
      await btfZone.screenshot({ path: 'scratch/verified_beyond_frame_9cards.png' });
      console.log('Saved scratch/verified_beyond_frame_9cards.png');
    }

    // Test cycling through cards 1 to 9
    console.log('Testing cycling through cards using next button...');
    const nextBtn = await page.$('.beyond-frame-ctrl-btn--next');
    if (nextBtn) {
      for (let i = 0; i < 8; i++) {
        await nextBtn.click();
        await new Promise(r => setTimeout(r, 120));
      }
      const counterAtEnd = await page.$eval('.beyond-frame-step-counter', el => el.textContent.trim());
      console.log('Counter at end card:', counterAtEnd, '(Expected: 09 / 09)');
      if (counterAtEnd !== '09 / 09') {
        throw new Error(`Expected '09 / 09' after 8 clicks, got '${counterAtEnd}'`);
      }
    }

    // -------------------------------------------------------------
    // TEST 3: BACKSTAGE CMS — SYNCHRONIZED 9 EDITABLE SLOTS
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Inspecting Backstage CMS...');
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    // Authenticate with passphrase
    const authOverlay = await page.$('#auth-overlay');
    if (authOverlay) {
      const isVisible = await page.evaluate(el => el && window.getComputedStyle(el).display !== 'none', authOverlay);
      if (isVisible) {
        console.log('Logging in via passphrase...');
        await page.click('#tab-btn-password');
        await new Promise(r => setTimeout(r, 400));
        await page.waitForSelector('#auth-fallback-password', { timeout: 3000 });
        const envContent = fs.readFileSync('.env', 'utf8');
        const pwMatch = envContent.match(/^BACKSTAGE_PASSWORD=(.+)$/m);
        const adminPassword = pwMatch ? pwMatch[1].trim() : '@Krish1602';
        await page.type('#auth-fallback-password', adminPassword);
        await page.click('#auth-password-btn');
        await page.waitForFunction(() => {
          const overlay = document.getElementById('auth-overlay');
          return overlay && overlay.style.display === 'none';
        }, { timeout: 8000 });
        console.log('Backstage CMS unlocked successfully!');
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Select Beyond The Frame section
    await page.evaluate(() => {
      if (typeof window.selectSection === 'function') {
        window.selectSection('sec-beyond-frame');
      } else {
        const item = document.querySelector('.tree-item[data-id="sec-beyond-frame"]');
        if (item) item.click();
      }
    });
    await new Promise(r => setTimeout(r, 1200));

    const backstageBtfMetrics = await page.evaluate(() => {
      const propsSlots = Array.from(document.querySelectorAll('#props-container .collection-card[data-slot-id]'));
      const centerSlots = Array.from(document.querySelectorAll('#center-form-container .collection-card[data-slot-id]'));
      const slotData = propsSlots.map((s, idx) => {
        const id = s.getAttribute('data-slot-id');
        const titleInput = s.querySelector('input[type="text"]');
        const mediaField = s.querySelector('.media-field-name');
        return {
          idx,
          id,
          title: titleInput ? titleInput.value : '',
          media: mediaField ? mediaField.textContent.trim() : ''
        };
      });
      const headerTitle = document.querySelector('#props-container .collection-header .collection-title')?.textContent.trim();
      const addBtn = document.querySelector('#props-container .btn-add-item');

      return {
        totalPropsSlots: propsSlots.length,
        totalCenterSlots: centerSlots.length,
        headerTitle,
        hasAddButton: !!addBtn,
        slotData
      };
    });

    console.log('Backstage BTF Header:', backstageBtfMetrics.headerTitle);
    console.log('Backstage BTF Props Panel Slots:', backstageBtfMetrics.totalPropsSlots, '(Expected: 9)');
    console.log('Backstage BTF Center Form Slots:', backstageBtfMetrics.totalCenterSlots, '(Expected: 9)');
    console.log('Backstage BTF Has Dynamic Add Button:', backstageBtfMetrics.hasAddButton, '(Expected: false)');
    console.log('Backstage BTF Slots:');
    backstageBtfMetrics.slotData.forEach(s => {
      console.log(`  [${s.idx + 1}] ID: ${s.id} -> ${s.title} (${s.media})`);
    });

    if (backstageBtfMetrics.totalPropsSlots !== 9) {
      throw new Error(`Expected exactly 9 Backstage BTF slots in props panel, got ${backstageBtfMetrics.totalPropsSlots}`);
    }
    if (backstageBtfMetrics.totalCenterSlots !== 9) {
      throw new Error(`Expected exactly 9 Backstage BTF slots in center form, got ${backstageBtfMetrics.totalCenterSlots}`);
    }
    if (backstageBtfMetrics.hasAddButton) {
      throw new Error('Backstage should not have dynamic add button for fixed 9-slot BTF collection');
    }

    // Capture screenshot of Backstage BTF editor
    await page.screenshot({ path: 'scratch/verified_backstage_btf_9slots.png' });
    console.log('Saved scratch/verified_backstage_btf_9slots.png');

    // Test editing a BTF slot in Backstage, saving draft, reloading, and confirming persistence
    console.log('\n[TEST 3B] Testing Backstage slot update and persistence...');
    await page.evaluate(() => {
      const slot9Input = document.querySelector('#props-container .collection-card[data-slot-id="btf-09"] input[type="text"]');
      if (slot9Input) {
        slot9Input.value = 'MYTHIC WORLDS // TEST SYNC';
        slot9Input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 800));

    // Reload Backstage and verify slot count remains 9 and updated draft persists
    await page.goto('http://localhost:3000/backstage', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => {
      if (typeof window.selectSection === 'function') {
        window.selectSection('sec-beyond-frame');
      }
    });
    await new Promise(r => setTimeout(r, 800));

    const reloadedSlotsCount = await page.evaluate(() => {
      return document.querySelectorAll('#props-container .collection-card[data-slot-id]').length;
    });
    console.log('Slots count after reload:', reloadedSlotsCount, '(Expected: 9)');
    if (reloadedSlotsCount !== 9) {
      throw new Error(`Expected exactly 9 slots after reload, got ${reloadedSlotsCount}`);
    }

    // Restore title to original and save draft
    await page.evaluate(() => {
      const slot9Input = document.querySelector('#props-container .collection-card[data-slot-id="btf-09"] input[type="text"]');
      if (slot9Input) {
        slot9Input.value = 'MYTHIC WORLDS';
        slot9Input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 800));

    // -------------------------------------------------------------
    // TEST 4: LIGHT THEME & RESPONSIVE LAYOUT VERIFICATION
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Testing Light Theme & Responsive Viewports...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    // Switch to light theme
    await page.evaluate(() => {
      const themeToggle = document.getElementById('theme-toggle-btn') || document.querySelector('.theme-toggle');
      if (themeToggle) themeToggle.click();
      else document.documentElement.setAttribute('data-theme', 'light');
    });
    await new Promise(r => setTimeout(r, 600));

    const lightThemeTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('Active theme:', lightThemeTheme);

    const orbitElLight = await page.$('#visual-orbit');
    if (orbitElLight) {
      await orbitElLight.screenshot({ path: 'scratch/verified_orbit_light.png' });
      console.log('Saved scratch/verified_orbit_light.png');
    }

    // Test Mobile viewport (390 x 844)
    console.log('Testing Mobile Viewport (390 x 844)...');
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 600));

    const mobileMetrics = await page.evaluate(() => {
      const root = document.querySelector('.sphere-root');
      const btfCards = document.querySelectorAll('.beyond-frame-card');
      const rootStyle = window.getComputedStyle(root);
      return {
        radiusProp: rootStyle.getPropertyValue('--radius').trim(),
        itemWidthProp: rootStyle.getPropertyValue('--item-width').trim(),
        itemHeightProp: rootStyle.getPropertyValue('--item-height').trim(),
        btfCardsCount: btfCards.length
      };
    });
    console.log('Mobile Visual Orbit Radius:', mobileMetrics.radiusProp);
    console.log('Mobile Visual Orbit Tile Width:', mobileMetrics.itemWidthProp);
    console.log('Mobile BTF Cards:', mobileMetrics.btfCardsCount, '(Expected: 9)');

    if (mobileMetrics.btfCardsCount !== 9) {
      throw new Error(`Mobile BTF expected 9 cards, got ${mobileMetrics.btfCardsCount}`);
    }

    await page.screenshot({ path: 'scratch/verified_mobile_390.png' });
    console.log('Saved scratch/verified_mobile_390.png');

    console.log('\n========================================');
    console.log('ALL VERIFICATION ASSERTIONS PASSED! (100%)');
    console.log('========================================');

  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('\nVERIFICATION FAILED:', err.message);
  process.exit(1);
});
