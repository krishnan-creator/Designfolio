const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add CSS for .sticky-paper-bg and .sticky-paper-img and refine .sticky-content-wrap
const targetCss = `.sticky-content-wrap {
      position: relative;
      z-index: 5;
      padding: 24px 16px 12px 16px;
      display: flex;
      flex-direction: column;
      height: 100%;
    }`;

const newStickyCss = `.sticky-paper-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
      overflow: hidden;
      border-radius: 8px;
    }

    .sticky-paper-img {
      width: 100%;
      height: 100%;
      object-fit: fill;
      display: block;
    }

    .sticky-content-wrap {
      position: relative;
      z-index: 5;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 22px 16px 14px 16px;
      box-sizing: border-box;
    }

    .sticky-stamp-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      opacity: 0;
      transform: translateY(-12px) scale(1.18) rotate(-3deg);
      transform-origin: center center;
      pointer-events: none;
    }

    .sticky-stamp-wrap.is-stamped,
    .sticky-note.is-revealed .sticky-stamp-wrap {
      opacity: 1;
      animation: stampPressIn 0.38s cubic-bezier(0.18, 0.89, 0.32, 1.25) forwards;
    }

    .sticky-stamp-img {
      width: 88%;
      max-width: 180px;
      height: auto;
      object-fit: contain;
      display: block;
      filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.28));
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .sticky-note:hover .sticky-stamp-img {
      transform: scale(1.05);
    }`;

if (html.includes(targetCss)) {
  html = html.replace(targetCss, newStickyCss);
  console.log('1. Replaced sticky note CSS with absolute paper background and centered large stamp.');
} else {
  console.warn('Could not find targetCss, injecting after .push-pin-img');
  html = html.replace('.push-pin-img {\n      width: 100%;\n      height: 100%;\n      object-fit: contain;\n      display: block;\n    }', '.push-pin-img {\n      width: 100%;\n      height: 100%;\n      object-fit: contain;\n      display: block;\n    }\n\n' + newStickyCss);
}

// 2. Adjust .sticky-note size to compact square
const oldNoteSize = `width: clamp(210px, 21vw, 240px);\n      height: clamp(200px, 20vw, 230px);`;
const newNoteSize = `width: clamp(185px, 18vw, 215px);\n      height: clamp(185px, 18vw, 215px);`;

if (html.includes(oldNoteSize)) {
  html = html.replace(oldNoteSize, newNoteSize);
  console.log('2. Refined .sticky-note size to compact 185-215px square.');
}

// 3. Ensure automatic reveal of sticky note after page settles (~900ms)
const revealTriggerSearch = `window.addEventListener('scroll', onHeroUserAction, { passive: true });`;
const autoRevealCode = `window.addEventListener('scroll', onHeroUserAction, { passive: true });\n      setTimeout(triggerStickyNoteOnAction, 900);`;

if (html.includes(revealTriggerSearch) && !html.includes('setTimeout(triggerStickyNoteOnAction, 900);')) {
  html = html.replace(revealTriggerSearch, autoRevealCode);
  console.log('3. Added automatic reveal timer for sticky note at 900ms.');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Saved index.html with sticky note fixes.');
