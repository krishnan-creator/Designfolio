const fs = require('fs');

const origHtml = fs.readFileSync('index.html', 'utf8');
fs.writeFileSync('index.html.bak_before_master', origHtml, 'utf8');
console.log('Saved backup to index.html.bak_before_master');

let html = origHtml;

// 1. Add Anton to Google Fonts in <head>
if (!html.includes('family=Anton')) {
  html = html.replace(
    'https://fonts.googleapis.com/css2?',
    'https://fonts.googleapis.com/css2?family=Anton&'
  );
  console.log('1. Added Anton to Google Fonts');
}

// 2. Add Spider-Verse CBK Glitch CSS and Adaptive Cursor CSS in <style>
const newCss = `
    /* ============================================================
       SPIDER-VERSE-INSPIRED CBK HEADER GLITCH
       ============================================================ */
    @keyframes cbkSpiderBeat {
      0% {
        transform: translate(0, 0);
        text-shadow: none;
        clip-path: none;
      }
      18% {
        transform: translate(-2.5px, 1px) skewX(-2.5deg);
        text-shadow: -2.5px 0 #00ffff, 2.5px 0 #ff0055;
        clip-path: inset(12% 0 32% 0);
      }
      42% {
        transform: translate(3px, -1px) skewX(3deg);
        text-shadow: 2.5px 0 #00ffff, -2.5px 0 #ff0055;
        clip-path: inset(48% 0 8% 0);
      }
      68% {
        transform: translate(-1.5px, 0.5px);
        text-shadow: -2px 0 #00ffff, 2px 0 #ff0055;
        clip-path: inset(0 0 65% 0);
      }
      85% {
        transform: translate(1px, -0.5px);
        text-shadow: 1px 0 #00ffff, -1px 0 #ff0055;
        clip-path: none;
      }
      100% {
        transform: translate(0, 0);
        text-shadow: none;
        clip-path: none;
      }
    }

    .brand-cbk.cbk-spider-glitch {
      animation: cbkSpiderBeat 0.22s steps(2, jump-none) forwards !important;
      will-change: transform, text-shadow, clip-path;
    }

    /* ============================================================
       TRUE ADAPTIVE CURSOR (FULL FILL CONTRAST)
       ============================================================ */
    .section-cursor .cursor-arrow-svg polygon {
      fill: #FFFFFF !important;
      stroke: rgba(0, 0, 0, 0.75) !important;
      stroke-width: 0.9;
      transition: fill 0.14s ease, stroke 0.14s ease;
    }

    .section-cursor.cursor-fill-dark .cursor-arrow-svg polygon {
      fill: #0B0B0E !important;
      stroke: rgba(255, 255, 255, 0.85) !important;
    }

    .section-cursor.cursor-fill-light .cursor-arrow-svg polygon {
      fill: #FFFFFF !important;
      stroke: rgba(0, 0, 0, 0.85) !important;
    }

    /* MANDATORY WHITE CURSOR IN HERO IN BOTH THEMES */
    .section-cursor.is-in-hero .cursor-arrow-svg polygon,
    [data-theme="light"] .section-cursor.is-in-hero .cursor-arrow-svg polygon {
      fill: #FFFFFF !important;
      stroke: rgba(0, 0, 0, 0.75) !important;
    }

    /* ============================================================
       DNEG EDITORIAL FEATURE FILM CREDITS (LEFT COLUMN)
       ============================================================ */
    .dneg-film-credits-editorial {
      margin-top: 14px;
      padding: 10px 12px;
      background: var(--dbl-surface-matte);
      border: 1px solid var(--dbl-border-base);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      width: 100%;
      box-sizing: border-box;
    }

    .film-credits-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }

    .film-credits-marker {
      color: var(--dbl-crimson);
      font-size: 9px;
    }

    .film-credits-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: var(--dbl-text-tertiary);
      text-transform: uppercase;
    }

    .film-credit-item {
      display: flex;
      align-items: baseline;
      gap: 7px;
    }

    .film-credit-idx {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px;
      font-weight: 600;
      color: var(--dbl-crimson);
    }

    .film-credit-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 9.5px;
      font-weight: 750;
      letter-spacing: 0.08em;
      color: var(--dbl-text-primary);
      text-transform: uppercase;
      line-height: 1.2;
    }

    .film-credit-divider {
      height: 1px;
      background: var(--dbl-border-subtle);
      width: 100%;
      margin: 1px 0;
    }

    /* ============================================================
       OPPOSITE-THEME BRITTLE CONTACT CARD
       ============================================================ */
    .brittle-contact-card {
      width: 100%;
      max-width: 1100px;
      margin: 0 auto 3rem auto;
      padding: clamp(2rem, 4.5vw, 3.8rem);
      box-sizing: border-box;
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Dark Theme: Rough Warm Pale Mineral Card with Crisp Dark Typography */
    [data-theme="dark"] .brittle-contact-card {
      background: #F4F3EF;
      border: 1px solid rgba(255, 255, 255, 0.45);
      color: #121215;
      box-shadow: 0 28px 56px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.95);
    }

    [data-theme="dark"] .brittle-contact-card .build-headline {
      color: #111114 !important;
    }

    [data-theme="dark"] .brittle-contact-card .build-statement {
      color: #4a4a52 !important;
    }

    [data-theme="dark"] .brittle-contact-card .dbl-meta-label {
      color: #72727d !important;
    }

    [data-theme="dark"] .brittle-contact-card .build-btn-primary {
      background: #121216 !important;
      color: #ffffff !important;
      border-color: #121216 !important;
    }

    [data-theme="dark"] .brittle-contact-card .build-btn-primary:hover {
      background: #ffffff !important;
      color: #121216 !important;
      border-color: #121216 !important;
    }

    [data-theme="dark"] .brittle-contact-card .build-btn-secondary {
      background: rgba(0, 0, 0, 0.05) !important;
      color: #18181d !important;
      border-color: rgba(0, 0, 0, 0.16) !important;
    }

    [data-theme="dark"] .brittle-contact-card .build-btn-secondary:hover {
      background: #121216 !important;
      color: #ffffff !important;
      border-color: #121216 !important;
    }

    /* Light Theme: Rough Dark Graphite Card with Crisp Light Typography */
    [data-theme="light"] .brittle-contact-card {
      background: #111115;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #F4F4F2;
      box-shadow: 0 24px 50px -10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    [data-theme="light"] .brittle-contact-card .build-headline {
      color: #FFFFFF !important;
    }

    [data-theme="light"] .brittle-contact-card .build-statement {
      color: #9C9CA5 !important;
    }

    [data-theme="light"] .brittle-contact-card .dbl-meta-label {
      color: #8E8E98 !important;
    }

    [data-theme="light"] .brittle-contact-card .build-btn-primary {
      background: #FFFFFF !important;
      color: #111115 !important;
      border-color: #FFFFFF !important;
    }

    [data-theme="light"] .brittle-contact-card .build-btn-primary:hover {
      background: #111115 !important;
      color: #FFFFFF !important;
      border-color: #FFFFFF !important;
    }

    [data-theme="light"] .brittle-contact-card .build-btn-secondary {
      background: rgba(255, 255, 255, 0.06) !important;
      color: #FFFFFF !important;
      border-color: rgba(255, 255, 255, 0.18) !important;
    }

    [data-theme="light"] .brittle-contact-card .build-btn-secondary:hover {
      background: #FFFFFF !important;
      color: #111115 !important;
      border-color: #FFFFFF !important;
    }

    /* ============================================================
       SELECTED WORKS EXPANSION & CINEMATIC LIGHTBOX
       ============================================================ */
    .selected-works-section {
      border-top: 1px solid var(--dbl-border-base);
      padding-top: clamp(60px, 8vh, 90px);
      margin-top: clamp(60px, 8vh, 90px);
      position: relative;
    }

    .selected-works-grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
    }

    .works-landscape-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      width: 100%;
    }

    .works-reels-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      width: 100%;
      margin-top: 8px;
    }

    .works-card {
      position: relative;
      background: var(--dbl-surface-matte);
      border: 1px solid var(--dbl-border-base);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                  border-color 0.3s ease,
                  box-shadow 0.3s ease;
    }

    .works-card:hover {
      border-color: var(--dbl-border-strong);
      transform: translateY(-4px);
      box-shadow: 0 20px 48px -12px rgba(0, 0, 0, 0.45);
    }

    .works-media-wrap {
      position: relative;
      width: 100%;
      overflow: hidden;
      background: #09090C;
    }

    .works-card-landscape .works-media-wrap {
      aspect-ratio: 16 / 9;
    }

    .works-card-reel .works-media-wrap {
      aspect-ratio: 9 / 16;
      max-height: 480px;
    }

    .works-media-wrap img,
    .works-media-wrap video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .works-card:hover .works-media-wrap img,
    .works-card:hover .works-media-wrap video {
      transform: scale(1.03);
    }

    .works-play-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.28);
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .works-card:hover .works-play-overlay {
      opacity: 1;
    }

    .works-play-btn {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      color: #0b0b0e;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      transform: scale(0.9);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .works-card:hover .works-play-btn {
      transform: scale(1);
    }

    .works-card-body {
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .works-tag-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      color: var(--dbl-crimson);
      text-transform: uppercase;
    }

    .works-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(16px, 1.4vw, 20px);
      font-weight: 800;
      letter-spacing: 0.04em;
      color: var(--dbl-text-primary);
      text-transform: uppercase;
      margin: 0 0 6px 0;
      line-height: 1.25;
    }

    .works-summary {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--dbl-text-secondary);
      margin: 0 0 10px 0;
      line-height: 1.35;
    }

    .works-desc {
      font-size: 12px;
      line-height: 1.55;
      color: var(--dbl-text-tertiary);
      margin: 0;
      flex: 1;
    }

    .works-see-more-wrap {
      display: flex;
      justify-content: center;
      margin-top: 36px;
      margin-bottom: 20px;
    }

    .works-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 13px 28px;
      border-radius: 999px;
      background: var(--dbl-surface-matte);
      border: 1px solid var(--dbl-border-strong);
      color: var(--dbl-text-primary);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .works-toggle-btn:hover {
      background: var(--dbl-text-primary);
      color: var(--dbl-bg-root);
      border-color: var(--dbl-text-primary);
      transform: translateY(-2px);
    }

    .works-expandable-area {
      display: flex;
      flex-direction: column;
      gap: 24px;
      overflow: hidden;
      transition: max-height 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
    }

    .works-expandable-area.is-collapsed {
      max-height: 0;
      opacity: 0;
      margin: 0;
      pointer-events: none;
    }

    .works-expandable-area.is-expanded {
      max-height: 4000px;
      opacity: 1;
      pointer-events: auto;
    }

    /* FULLSCREEN CINEMATIC LIGHTBOX MODAL */
    .cinematic-lightbox-modal {
      position: fixed;
      inset: 0;
      z-index: 99999999;
      background: rgba(5, 5, 8, 0.94);
      backdrop-filter: blur(24px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    .cinematic-lightbox-modal.is-open {
      opacity: 1;
      visibility: visible;
    }

    .lightbox-close-btn {
      position: absolute;
      top: 24px;
      right: 28px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 20px;
      transition: all 0.2s ease;
      z-index: 10;
    }

    .lightbox-close-btn:hover {
      background: #ffffff;
      color: #0b0b0e;
      transform: scale(1.08);
    }

    .lightbox-media-container {
      width: min(92vw, 1180px);
      max-height: 80vh;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 32px 72px rgba(0, 0, 0, 0.85);
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lightbox-video-player {
      width: 100%;
      max-height: 78vh;
      outline: none;
    }

    .lightbox-caption-bar {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 4px;
    }

    .lightbox-caption-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #ffffff;
      text-transform: uppercase;
    }

    .lightbox-caption-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #8E8E98;
    }

    @media (max-width: 900px) {
      .works-landscape-row,
      .works-reels-row {
        grid-template-columns: 1fr;
      }
    }
`;

html = html.replace('</style>', newCss + '\n  </style>');
console.log('2. Injected CSS for Glitch, Adaptive Cursor, Selected Works, Lightbox, and Brittle Contact Card');

// 3. Update .hero-left-stage CSS position and .sticky-stamp-img size
html = html.replace(
  'top: 53.5%;\n      transform: translateY(-44%);',
  'top: 48%;\n      transform: translateY(-48%);'
);
html = html.replace(
  '.sticky-stamp-img {\n      width: 98px;',
  '.sticky-stamp-img {\n      width: clamp(155px, 80%, 195px);'
);
console.log('3. Elevated Hero left stage and scaled up stamp artwork');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Saved preliminary changes to index.html');
