const fs = require('fs');

console.log('Reading source files...');
let html = fs.readFileSync('index.html.bak_before_directive', 'utf8');
const newStyles = fs.readFileSync('scratch/new_master_styles.css', 'utf8');
const newScripts = fs.readFileSync('scratch/new_master_scripts.js', 'utf8');

console.log('Applying Step 1: Fonts & Styles...');
// 1. Google Fonts Montserrat & Pop Warner @font-face
const fontLinkTarget = '<link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Barlow+Condensed:wght@800;900&family=Bebas+Neue&family=Caveat:wght@600;700&family=Great+Vibes&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">';
const fontLinkReplacement = '<link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Barlow+Condensed:wght@800;900&family=Bebas+Neue&family=Caveat:wght@600;700&family=Great+Vibes&family=JetBrains+Mono:wght@400;500;600;700&family=Montserrat:wght@700;800;900&family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">\n\n  <style>\n    @font-face {\n      font-family: \'Pop Warner\';\n      src: url(\'pop-warner.ttf\') format(\'truetype\');\n      font-weight: normal;\n      font-style: normal;\n      font-display: swap;\n    }';

if (!html.includes(fontLinkTarget)) {
  console.error('Failed to find fontLinkTarget');
  process.exit(1);
}
html = html.replace(fontLinkTarget, fontLinkReplacement);

// 2. Append newStyles before </style>
html = html.replace('</style>', newStyles + '\n  </style>');

console.log('Applying Step 2: Metric 8 in BY THE NUMBERS...');
// 3. Update Metric 8
const oldMetric8Target = `<div class="number-val">2</div>
              <div class="number-label">ASHRA CHAPTERS</div>
              <div class="number-expand-desc">
                <p>Single-handed creative development across two Ashra chapters, involving real-person-inspired character work with friends' faces, character sheets, environment sheets, prompts, visual development, and supporting production assets.</p>
              </div>`;

const newMetric8 = `<div class="number-val">2</div>
              <div class="number-label">ORIGINAL CINEMATIC CHAPTERS</div>
              <div class="number-expand-desc">
                <p>Independently developed an original story concept across two chapters, from character sheets and environment development to prop design, prompts, and supporting visual development for cinema.</p>
              </div>`;

if (!html.includes(oldMetric8Target)) {
  console.error('Failed to find oldMetric8Target');
  process.exit(1);
}
html = html.replace(oldMetric8Target, newMetric8);

console.log('Applying Step 3: Canvases...');
// 4. Update canvas elements in HTML
// Replace #post-hero-fluid-background
html = html.replace(
  '<canvas id="post-hero-fluid-background"></canvas>',
  `<canvas id="laser-flow-canvas"></canvas>
    <canvas id="splash-cursor-canvas"></canvas>
    <canvas id="water-ripple-canvas"></canvas>`
);

// 5. Replace DISCIPLINES section (remove puzzle, insert Velmax Catalog)
console.log('Applying Step 4: Velmax Catalog...');
const discStart = html.indexOf('<section class="disciplines-section" id="disciplines">');
const discEnd = html.indexOf('</section>', discStart) + '</section>'.length;

const velmaxCatalogHtml = `<!-- ============================================================
           SECTION 04 — DISCIPLINES: VELMAX CATALOG-INSPIRED INTERACTIVE COMPONENT
           ============================================================ -->
      <section class="disciplines-section" id="disciplines">
        <div class="dbl-section-header">
          <div class="dbl-meta-label">
            <span class="dbl-meta-dot"></span>
            <span>04 / DISCIPLINES · SPATIAL CATALOG</span>
          </div>
          <h2 class="dbl-title-main">DISCIPLINES</h2>
          <p class="dbl-subtitle-desc">Interactive spatial catalog of creative specializations, generative workflows, and cinematic production disciplines.</p>
        </div>

        <div class="velmax-catalog-stage" id="velmax-catalog-stage">
          <!-- Theme Inversion Badge -->
          <div class="catalog-stage-header">
            <div class="catalog-mode-badge" id="catalog-mode-badge">
              <span class="catalog-badge-dot"></span>
              <span class="catalog-badge-text">SPECIAL EXHIBITION // THEME CONTRAST</span>
            </div>
            <div class="catalog-nav-controls">
              <button type="button" class="catalog-arrow-btn" id="catalog-prev-btn" aria-label="Previous Discipline">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span class="catalog-counter" id="catalog-counter">01 / 09</span>
              <button type="button" class="catalog-arrow-btn" id="catalog-next-btn" aria-label="Next Discipline">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>

          <!-- 3D Spatial Ring Viewport -->
          <div class="catalog-track-viewport" id="catalog-track-viewport">
            <div class="catalog-cards-track" id="catalog-cards-track">
              <!-- Rendered via window.initVelmaxCatalog() -->
            </div>
          </div>

          <!-- Drag Hint -->
          <div class="catalog-drag-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l-3 3 3 3M19 9l3 3-3 3M2 12h20"/></svg>
            <span>DRAG TO ROTATE RING · CLICK CARD FOR SPECIFICATION</span>
          </div>

          <!-- Detail Drawer / Modal -->
          <div class="catalog-detail-drawer" id="catalog-detail-drawer" aria-hidden="true">
            <div class="drawer-backdrop" id="drawer-backdrop"></div>
            <div class="drawer-content-box">
              <button type="button" class="drawer-close-btn" id="drawer-close-btn" aria-label="Close Specification">×</button>
              <div class="drawer-grid">
                <div class="drawer-media-col">
                  <div class="drawer-image-wrap">
                    <img id="drawer-card-img" src="Ramayana.png" alt="Discipline Specimen">
                  </div>
                  <div class="drawer-media-tag" id="drawer-media-tag">SPECIMEN // PRODUCTION STILL</div>
                </div>
                <div class="drawer-info-col">
                  <span class="drawer-index-tag" id="drawer-index-tag">DISCIPLINE // 01</span>
                  <h3 class="drawer-title" id="drawer-title">CREATIVE DIRECTION</h3>
                  <p class="drawer-desc" id="drawer-desc">Shaping holistic visual aesthetics, high-velocity concept design, stylistic continuity, and reference-driven storytelling from initial brief to executive delivery.</p>
                  <div class="drawer-caps-heading">CORE CAPABILITIES</div>
                  <div class="drawer-caps-list" id="drawer-caps-list"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>`;

html = html.substring(0, discStart) + velmaxCatalogHtml + html.substring(discEnd);

console.log('Applying Step 5: Replace THE PIPELINE with A BIT ABOUT ME...');
// 6. Replace THE PIPELINE section with A BIT ABOUT ME
const pipeStart = html.indexOf('<section class="pipeline-section" id="the-pipeline"');
const pipeEnd = html.indexOf('</section>', pipeStart) + '</section>'.length;

const aboutMeHtml = `<!-- ============================================================
           SECTION 05 — A BIT ABOUT ME (EDITORIAL CREATIVE PROFILE & DRAWING ARTIST)
           ============================================================ -->
      <section class="about-me-section" id="a-bit-about-me">
        <div class="dbl-section-header">
          <div class="dbl-meta-label">
            <span class="dbl-meta-dot"></span>
            <span>05 / A BIT ABOUT ME · CREATIVE PROFILE</span>
          </div>
          <h2 class="dbl-title-main">A BIT ABOUT ME</h2>
          <p class="dbl-subtitle-desc">The visual evolution, artistic foundations, and creative journey of C. Bala Krishnan.</p>
        </div>

        <div class="about-me-grid">
          <!-- Intro Card -->
          <div class="about-card about-intro-card">
            <div class="about-card-tag">BIOGRAPHY // DIRECTION</div>
            <h3 class="about-card-title">C. BALA KRISHNAN</h3>
            <p class="about-intro-lead">
              Creative Director and Generative AI Artist operating at the intersection of classical visual discipline, synthetic intelligence, and cinematic storytelling.
            </p>
            <p class="about-intro-body">
              My progression began with traditional art and foundational sketching, advancing through graphic design, brand architecture, and user experience. Over the last four years, this foundation propelled an intensive specialization into prompt architecture, custom diffusion pipelines, and studio VFX visual development.
            </p>
            <div class="about-meta-row">
              <span class="about-pill">HYDERABAD, INDIA</span>
              <span class="about-pill">7+ YEARS EXPERIENCE</span>
              <span class="about-pill">CINEMATIC GENAI</span>
            </div>
          </div>

          <!-- Portrait Card -->
          <div class="about-card about-portrait-card">
            <div class="about-portrait-wrap">
              <img src="portrait-01.png" alt="C. Bala Krishnan Portrait" class="about-portrait-img">
              <div class="about-portrait-overlay"></div>
            </div>
            <div class="about-portrait-meta">
              <span class="portrait-name-label">C. BALA KRISHNAN</span>
              <span class="portrait-role-label">GEN AI CREATIVE LEAD</span>
            </div>
          </div>

          <!-- Foundation Card -->
          <div class="about-card about-foundation-card">
            <div class="about-card-tag">FOUNDATION // CREATIVE PRINCIPLES</div>
            <h4 class="about-card-subheading">CLASSICAL TO SYNTHETIC</h4>
            <p class="about-foundation-text">
              Trained in classical drawing disciplines, compositional geometry, color theory, and typographic hierarchies. Rather than replacing traditional principles, generative models serve as high-velocity amplifiers—allowing complex ideas to evolve from sketch to photorealistic cinema in record time.
            </p>
            <div class="foundation-pillars">
              <div class="pillar-item"><span class="pillar-dot"></span><span>Drawing & Anatomy Studies</span></div>
              <div class="pillar-item"><span class="pillar-dot"></span><span>Lighting & Keyframe Staging</span></div>
              <div class="pillar-item"><span class="pillar-dot"></span><span>Latent Space Architecture</span></div>
            </div>
          </div>

          <!-- Career Timeline Summary -->
          <div class="about-card about-timeline-card">
            <div class="about-card-tag">CHRONOLOGY // CAREER PATH</div>
            <h4 class="about-card-subheading">PRODUCTION TIMELINE</h4>
            <div class="about-timeline-track">
              <div class="timeline-step">
                <div class="step-bullet"></div>
                <div class="step-info">
                  <span class="step-company">PREMA SAI DESIGNERS</span>
                  <span class="step-role">Graphic Designer · 2018–2024</span>
                </div>
              </div>
              <div class="timeline-step">
                <div class="step-bullet"></div>
                <div class="step-info">
                  <span class="step-company">CYBEREDGE</span>
                  <span class="step-role">AI Design Engineer · 2024–2025</span>
                </div>
              </div>
              <div class="timeline-step">
                <div class="step-bullet"></div>
                <div class="step-info">
                  <span class="step-company">IMPROMP2LABS</span>
                  <span class="step-role">Gen AI Creative Lead · 2025–Present</span>
                </div>
              </div>
              <div class="timeline-step">
                <div class="step-bullet"></div>
                <div class="step-info">
                  <span class="step-company">DNEG</span>
                  <span class="step-role">Generative AI Artist · 2026</span>
                </div>
              </div>
            </div>
          </div>

          <!-- DRAWING ARTIST PANEL -->
          <div class="about-card about-drawing-card">
            <div class="drawing-header-row">
              <div>
                <div class="about-card-tag">FINE ART FOUNDATION // VISUAL IDEATION</div>
                <h3 class="drawing-headline">DRAWING ARTIST</h3>
              </div>
              <div class="drawing-badge">EST. TRADITIONAL ORIGINS</div>
            </div>
            
            <blockquote class="drawing-quote">
              “Drawing is where an idea first becomes a shape, a character, or a world. That visual foundation continues to inform my design, AI experimentation, and cinematic development.”
            </blockquote>

            <!-- Curated Artwork Stack / Gallery -->
            <div class="drawing-gallery-grid">
              <div class="drawing-artwork-thumb">
                <img src="Ramayana.png" alt="Cinematic Study">
                <span class="artwork-thumb-label">NARRATIVE CONCEPT // RAMAYANA</span>
              </div>
              <div class="drawing-artwork-thumb">
                <img src="VeerBhadra.png" alt="Character Exploration">
                <span class="artwork-thumb-label">FIGURE & ARCHETYPE // VEERABHADRA</span>
              </div>
              <div class="drawing-artwork-thumb">
                <img src="dune-dneg.jpg" alt="Atmospheric Environment">
                <span class="artwork-thumb-label">VOLUME & SCALE // DUNE STUDY</span>
              </div>
              <div class="drawing-artwork-thumb">
                <img src="landscape-02.jpg" alt="Compositional Staging">
                <span class="artwork-thumb-label">ENVIRONMENT COMPOSITION</span>
              </div>
            </div>
          </div>

          <!-- Personal Interests & Creative Process Card -->
          <div class="about-card about-interests-card">
            <div class="about-card-tag">CREATIVE PROCESS & INTERESTS</div>
            <h4 class="about-card-subheading">DRIVING OBSESSIONS</h4>
            <div class="interests-grid">
              <div class="interest-pill-box">
                <span class="interest-icon">◈</span>
                <div>
                  <strong>Cinematic Worldbuilding</strong>
                  <p>Constructing multi-generational mythologies and speculative fictional architectures.</p>
                </div>
              </div>
              <div class="interest-pill-box">
                <span class="interest-icon">◈</span>
                <div>
                  <strong>Procedural Node Systems</strong>
                  <p>Exploring node-based graph synthesis, ComfyUI custom logic, and automation.</p>
                </div>
              </div>
              <div class="interest-pill-box">
                <span class="interest-icon">◈</span>
                <div>
                  <strong>Anatomy & Spatial Lighting</strong>
                  <p>Studying dynamic anatomy, Caravaggio chiaroscuro, and virtual camera optics.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>`;

html = html.substring(0, pipeStart) + aboutMeHtml + html.substring(pipeEnd);

console.log('Applying Step 6: Hero Theme Wave in Particle Simulation...');
// Add Hero Theme Wave triggers in JS
// Find triggerCircularThemeSwitch
const switchStart = html.indexOf('function triggerCircularThemeSwitch(e) {');
const applyThemePos = html.indexOf('applyTheme(nextTheme);', switchStart);
// When isUserInHero is true, trigger Hero Name Wave
const heroThemeTrigger = `applyTheme(nextTheme);
          if (window.triggerHeroNameWave) {
            window.triggerHeroNameWave(cx, cy);
          }`;
html = html.substring(0, applyThemePos) + heroThemeTrigger + html.substring(applyThemePos + 'applyTheme(nextTheme);'.length);

// Inside initDenseParticleTypography, add window.triggerHeroNameWave and wave physics
const partInitStart = html.indexOf('function initDenseParticleTypography() {');
const wavePhysicsDef = `
      let themeWaveActive = false;
      let themeWaveStartTime = 0;
      let themeWaveOriginX = 0;
      let themeWaveOriginY = 0;

      window.triggerHeroNameWave = function(originX, originY) {
        themeWaveActive = true;
        themeWaveStartTime = performance.now();
        themeWaveOriginX = originX || (window.innerWidth - 48);
        themeWaveOriginY = originY || 36;
      };
`;
html = html.substring(0, partInitStart) + wavePhysicsDef + html.substring(partInitStart);

// Inside renderParticleTypography loop, apply the wave force
const loopPos = html.indexOf('for (let i = 0; i < nameParticles.length; i++) {');
const waveForceLoop = `
        if (themeWaveActive) {
          const elapsed = performance.now() - themeWaveStartTime;
          const WAVE_DURATION = 1350;
          const progress = elapsed / WAVE_DURATION;

          if (progress >= 1.0) {
            themeWaveActive = false;
          } else {
            const rect = nameWrap.getBoundingClientRect();
            const localOx = themeWaveOriginX - rect.left;
            const localOy = themeWaveOriginY - rect.top;
            const maxDist = Math.hypot(nameCanvasWidth, nameCanvasHeight) * 1.6;
            const waveRadius = progress * maxDist;
            const waveWidth = 140.0;
            const waveAmp = (1.0 - progress) * 32.0;

            for (let i = 0; i < nameParticles.length; i++) {
              const p = nameParticles[i];
              const dx = p.homeX - localOx;
              const dy = p.homeY - localOy;
              const dist = Math.hypot(dx, dy);
              const diff = Math.abs(dist - waveRadius);

              if (diff < waveWidth) {
                const factor = Math.sin((1.0 - diff / waveWidth) * Math.PI);
                const force = factor * waveAmp;
                const angle = Math.atan2(dy, dx);
                p.vx += Math.cos(angle) * force * 0.45;
                p.vy += Math.sin(angle) * force * 0.45 + Math.sin(p.homeX * 0.04 + progress * 14.0) * force * 0.55;
              }
            }
          }
        }
`;
html = html.substring(0, loopPos) + waveForceLoop + html.substring(loopPos);

console.log('Applying Step 7: Clean old post-hero background & cursor trail JS...');
// Remove old initPostHeroBackground and initSectionAwareCursor implementations
const oldBgStart = html.indexOf('(function initPostHeroBackground() {');
const oldCursorEnd = html.indexOf('requestAnimationFrame(renderCursorRipples);\n      })();') + 'requestAnimationFrame(renderCursorRipples);\n      })();'.length;

if (oldBgStart !== -1 && oldCursorEnd > oldBgStart) {
  html = html.substring(0, oldBgStart) + '// Replaced with React Bits SplashCursor & LaserFlow\n' + html.substring(oldCursorEnd);
  console.log('Cleaned old post hero background & old cursor trails');
}

// Remove old puzzle JS & pipeline sphere JS
const oldPuzzleStart = html.indexOf('(function initDisciplinesPuzzle() {');
const oldPipeEnd = html.indexOf('window.addEventListener(\'mouseup\', () => {\n            if (isDraggingSphere) {') ;
const oldPipeFullEnd = html.indexOf('});\n      }\n    })();', oldPipeEnd) + '});\n      }\n    })();'.length;

if (oldPuzzleStart !== -1 && oldPipeFullEnd > oldPuzzleStart) {
  html = html.substring(0, oldPuzzleStart) + '// Replaced with Velmax Catalog & A Bit About Me\n' + html.substring(oldPipeFullEnd);
  console.log('Cleaned old puzzle JS & pipeline sphere JS');
}

// Append new master scripts before </body>
html = html.replace('</body>', `<script>
${newScripts}

document.addEventListener('DOMContentLoaded', () => {
  if (window.initVelmaxCatalog) window.initVelmaxCatalog();
  if (window.initMasterThemeAndEffects) window.initMasterThemeAndEffects();
});
</script>
</body>`);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully wrote updated index.html! New length:', html.length);
