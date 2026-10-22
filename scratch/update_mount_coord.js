const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const oldMountBlock = `  // Initial mounts
  const initialTheme = getCurrentTheme();
  updateHeaderTechText(initialTheme);
  updateBackgroundAndCursor(initialTheme);
  initMorphShowcase();
  initVisualOrbitGallery(initialTheme);
  initLanyardProfile(initialTheme);

  // 5. Mount LanyardProfileSection for THE CORE
  let lanyardInstance = null;
  function initLanyardProfile(theme) {
    const lanyardMount = document.getElementById('lanyard-profile-mount');
    if (lanyardMount && window.mountLanyardProfileSection && !lanyardInstance) {
      lanyardInstance = window.mountLanyardProfileSection(lanyardMount, {
        theme: theme || getCurrentTheme(),
        frontImage: 'card-front.png',
        backImage: 'card-back.png',
        strapImage: 'band.png'
      });
    } else if (lanyardInstance) {
      lanyardInstance.update({ theme: theme || getCurrentTheme() });
    }
  }`;

const newMountBlock = `  // 5. Mount LanyardProfileSection for THE CORE
  let lanyardInstance = null;
  function initLanyardProfile(theme) {
    const lanyardMount = document.getElementById('lanyard-profile-mount');
    if (lanyardMount && window.mountLanyardProfileSection && !lanyardInstance) {
      lanyardInstance = window.mountLanyardProfileSection(lanyardMount, {
        theme: theme || getCurrentTheme(),
        frontImage: 'card-front.png',
        backImage: 'card-back.png',
        strapImage: 'band.png'
      });
    } else if (lanyardInstance) {
      lanyardInstance.update({ theme: theme || getCurrentTheme() });
    }
  }

  // Unified mounting coordinator ensuring async bundle readiness
  function initAllMountedComponents() {
    const t = getCurrentTheme();
    updateBackgroundAndCursor(t);
    initMorphShowcase();
    initVisualOrbitGallery(t);
    initLanyardProfile(t);
  }

  if (window.mountDomeGallery || window.clientBundleReady) {
    initAllMountedComponents();
  } else {
    window.addEventListener('clientBundleReady', initAllMountedComponents, { once: true });
    window.addEventListener('load', initAllMountedComponents, { once: true });
    let mountAttempts = 0;
    const mountInterval = setInterval(() => {
      mountAttempts++;
      if (window.mountDomeGallery || window.mountLanyardProfileSection || mountAttempts > 60) {
        clearInterval(mountInterval);
        initAllMountedComponents();
      }
    }, 50);
  }`;

if (html.includes(oldMountBlock)) {
  html = html.replace(oldMountBlock, newMountBlock);
  fs.writeFileSync(htmlPath, html);
  console.log('✅ Updated mount coordinator in index.html');
} else {
  console.error('Could not find oldMountBlock');
}
