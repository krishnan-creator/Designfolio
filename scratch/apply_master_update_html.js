const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Rebuild DNEG layout in #exp-dneg
const oldDnegRegex = /<!-- 1\. DNEG -->[\s\S]*?<!-- 2\. IMPROMP2LABS -->/;
const newDneg = `<!-- 1. DNEG -->
            <div class="expertise-row" id="exp-dneg">
              <div class="expertise-logo-col">
                <div class="company-logo-slot" aria-label="Logo: DNEG">
                  <div class="logo-slot-inner">
                    <span class="logo-slot-badge">LOGO</span>
                    <span class="logo-slot-name">DNEG</span>
                  </div>
                </div>

                <!-- EDITORIAL FEATURE FILM CREDITS (DIRECTLY BELOW DNEG LOGO) -->
                <div class="dneg-film-credits-editorial" aria-label="Feature film projects">
                  <div class="film-credits-header">
                    <span class="film-credits-marker">◈</span>
                    <span class="film-credits-title">STUDIO FILMS</span>
                  </div>
                  <div class="film-credit-item">
                    <span class="film-credit-idx">01</span>
                    <span class="film-credit-name">RAMAYANA</span>
                  </div>
                  <div class="film-credit-divider"></div>
                  <div class="film-credit-item">
                    <span class="film-credit-idx">02</span>
                    <span class="film-credit-name">MASTERS OF THE UNIVERSE</span>
                  </div>
                  <div class="film-credit-divider"></div>
                  <div class="film-credit-item">
                    <span class="film-credit-idx">03</span>
                    <span class="film-credit-name">THE ODYSSEY</span>
                  </div>
                </div>
              </div>

              <div class="expertise-content-col">
                <div class="expertise-card-header">
                  <div>
                    <h3 class="company-heading">DNEG</h3>
                    <div class="company-role-tag">Generative AI Artist</div>
                  </div>
                  <div class="company-meta-pills">
                    <span class="comp-date-pill">JAN 2026 – APR 2026</span>
                    <span class="comp-loc-pill">Remote</span>
                  </div>
                </div>

                <!-- 3-COLUMN CONTENT GRID MATCHING IMPROMP2LABS ARCHITECTURE -->
                <div class="expertise-info-grid">
                  <div class="info-block">
                    <div class="info-block-label">WHAT I DID</div>
                    <p class="info-block-intro">Production-focused Generative AI workflows within studio VFX pipelines:</p>
                    <ul class="info-bullets">
                      <li>Developed production-ready generative workflows for cinematic digital humans and asset generation.</li>
                      <li>Supported high-fidelity identity and performance transfer workflows using Metaphysic within Brahma.</li>
                      <li>Built scalable ComfyUI-based systems for image and video synthesis, accelerating R&D iterations by 30%.</li>
                      <li>Contributed to face ingest, face swap, lip sync, and identity preservation for realistic performances.</li>
                      <li>Integrated generated outputs into post-production pipelines using Nuke for shot validation.</li>
                    </ul>
                  </div>

                  <div class="info-block">
                    <div class="info-block-label">SKILLS</div>
                    <div class="skill-tags">
                      <span class="skill-tag" tabIndex="0">Digital Humans</span>
                      <span class="skill-tag" tabIndex="0">Identity Transfer</span>
                      <span class="skill-tag" tabIndex="0">Lip Sync</span>
                      <span class="skill-tag" tabIndex="0">Face Swapping</span>
                      <span class="skill-tag" tabIndex="0">Look-Dev</span>
                      <span class="skill-tag" tabIndex="0">Prompt Architecture</span>
                    </div>
                  </div>

                  <div class="info-block">
                    <div class="info-block-label">TOOLS</div>
                    <div class="tool-tags">
                      <span class="tool-tag" tabIndex="0">ComfyUI</span>
                      <span class="tool-tag" tabIndex="0">Nuke</span>
                      <span class="tool-tag" tabIndex="0">MetaFace</span>
                      <span class="tool-tag" tabIndex="0">Metaphysic</span>
                      <span class="tool-tag" tabIndex="0">DGX Systems</span>
                      <span class="tool-tag" tabIndex="0">Brahma</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. IMPROMP2LABS -->`;

if (oldDnegRegex.test(html)) {
  html = html.replace(oldDnegRegex, newDneg);
  console.log('1. Replaced DNEG layout with standardized 3-column architecture and editorial film credits');
} else {
  console.warn('Could not match old DNEG block');
}

// 2. Extract and remove old <section class="mywork-section" id="my-work">...</section>
const oldMyWorkRegex = /<section class="mywork-section" id="my-work">[\s\S]*?<\/section>/;
if (oldMyWorkRegex.test(html)) {
  html = html.replace(oldMyWorkRegex, '');
  console.log('2. Removed old my-work section from post-expertise position');
} else {
  console.warn('Could not match old my-work section');
}

// 3. Build new SELECTED WORKS section HTML
const selectedWorksHtml = `
      <!-- ============================================================
           SECTION 03 — SELECTED WORKS (6 LANDSCAPE VIDEOS + 3 PORTRAIT REELS)
           POSITIONED DIRECTLY AFTER BY THE NUMBERS, BEFORE VISUAL ORBIT
           ============================================================ -->
      <section class="selected-works-section" id="selected-works">
        <div class="dbl-section-header">
          <div class="dbl-meta-label">
            <span class="dbl-meta-dot"></span>
            <span>03 / SELECTED WORKS · CINEMATIC PRODUCTION ARCHIVE</span>
          </div>
          <h2 class="dbl-title-main">SELECTED WORKS</h2>
          <p class="dbl-subtitle-desc">Feature film look-dev, mythic worldbuilding, and studio AI pipelines. Showing initial preview pair — expand for complete landscape archive and portrait reels.</p>
        </div>

        <div class="selected-works-grid">

          <!-- INITIAL VISIBLE ROW: LANDSCAPE 01 & LANDSCAPE 02 -->
          <div class="works-landscape-row" id="works-row-1">

            <!-- LANDSCAPE 01: RAMAYANA -->
            <div class="works-card works-card-landscape" 
                 data-video-src="Ramayana.png" 
                 data-video-title="NAMIT MALHOTRA'S RAMAYANA" 
                 data-video-sub="Feature Cinema // DNEG Generative AI Pipeline"
                 onclick="openCinematicLightbox(this)">
              <div class="works-media-wrap">
                <img src="Ramayana.png" alt="Namit Malhotra's Ramayana Feature Look-Dev">
                <div class="works-play-overlay">
                  <div class="works-play-btn" aria-label="Play Video">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                </div>
                <span class="film-meta-badge">[◈] FEATURE CINEMA // 2026</span>
              </div>
              <div class="works-card-body">
                <div class="works-tag-row">
                  <span>DNEG</span>
                  <span>·</span>
                  <span>VFX PIPELINE</span>
                </div>
                <h3 class="works-title">NAMIT MALHOTRA'S RAMAYANA</h3>
                <div class="works-summary">Feature Film AI Production & Large-Scale VFX Pipeline Look-Dev</div>
                <p class="works-desc">Contributed to production-grade Generative AI workflows and high-fidelity identity preservation at DNEG. Developed ComfyUI-based systems and Metaphysic performance transfer across 50+ film shots, enabling seamless studio compositing and shot validation in Nuke.</p>
              </div>
            </div>

            <!-- LANDSCAPE 02: DUNE 3 -->
            <div class="works-card works-card-landscape" 
                 data-video-src="dune-dneg.jpg" 
                 data-video-title="DUNE: PART THREE" 
                 data-video-sub="Cinematic Worldbuilding & Volumetric Look-Dev"
                 onclick="openCinematicLightbox(this)">
              <div class="works-media-wrap">
                <img src="dune-dneg.jpg" alt="Dune 3 Look-Dev and Cinematic Visual Development">
                <div class="works-play-overlay">
                  <div class="works-play-btn" aria-label="Play Video">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                </div>
                <span class="film-meta-badge">[◈] FEATURE CINEMA // 2026</span>
              </div>
              <div class="works-card-body">
                <div class="works-tag-row">
                  <span>DNEG</span>
                  <span>·</span>
                  <span>HOLLYWOOD VFX</span>
                </div>
                <h3 class="works-title">DUNE: PART THREE</h3>
                <div class="works-summary">Cinematic Worldbuilding, Volumetric Look-Dev & Digital Humans</div>
                <p class="works-desc">Studio visual development and atmospheric look-dev for high-concept sci-fi environments. Scaled DGX infrastructure and diffusion pipelines to produce cinematic environment extensions, lighting studies, and production-ready character assets.</p>
              </div>
            </div>

          </div>

          <!-- SEE MORE TOGGLE BUTTON -->
          <div class="works-see-more-wrap">
            <button type="button" class="works-toggle-btn" id="works-toggle-btn" onclick="toggleSelectedWorksExpand()">
              <span id="works-toggle-text">SEE MORE (4 LANDSCAPES + 3 REELS)</span>
              <svg id="works-toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <!-- EXPANDABLE AREA: ROWS 2 & 3 AND PORTRAIT REELS -->
          <div class="works-expandable-area is-collapsed" id="works-expanded-area">

            <!-- ROW 02: LANDSCAPE 03 | LANDSCAPE 04 -->
            <div class="works-landscape-row">

              <!-- LANDSCAPE 03: VEERABHADRA -->
              <div class="works-card works-card-landscape" 
                   data-video-src="VeerBhadra.png" 
                   data-video-title="VEERABHADRA: THE AWAKENING" 
                   data-video-sub="Original Mythic Action IP Concept Art & Trailer Pipelines"
                   onclick="openCinematicLightbox(this)">
                <div class="works-media-wrap">
                  <img src="VeerBhadra.png" alt="Veerabhadra Mythic Action IP Hero Design">
                  <div class="works-play-overlay">
                    <div class="works-play-btn" aria-label="Play Video">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                  <span class="film-meta-badge">[◈] MYTHIC IP // 2025</span>
                </div>
                <div class="works-card-body">
                  <div class="works-tag-row">
                    <span>IMPROMP2LABS</span>
                    <span>·</span>
                    <span>ORIGINAL IP</span>
                  </div>
                  <h3 class="works-title">VEERABHADRA: THE AWAKENING</h3>
                  <div class="works-summary">Original Mythic Action IP Concept Art & Multi-Shot Trailer Pipelines</div>
                  <p class="works-desc">End-to-end creative direction, mythic character design, weapons, and atmospheric environment architecture. Architected multi-model synthetic media workflows that accelerated trailer sequence iteration by 40% while preserving aesthetic coherence.</p>
                </div>
              </div>

              <!-- LANDSCAPE 04: THE ODYSSEY -->
              <div class="works-card works-card-landscape" 
                   data-video-src="ramayana-output.jpg" 
                   data-video-title="THE ODYSSEY: FACIAL RECONSTRUCTION" 
                   data-video-sub="High-Fidelity Performance Transfer & Neural Doubles"
                   onclick="openCinematicLightbox(this)">
                <div class="works-media-wrap">
                  <img src="ramayana-output.jpg" alt="The Odyssey Production VFX">
                  <div class="works-play-overlay">
                    <div class="works-play-btn" aria-label="Play Video">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                  <span class="film-meta-badge">[◈] FEATURE CINEMA // 2026</span>
                </div>
                <div class="works-card-body">
                  <div class="works-tag-row">
                    <span>DNEG</span>
                    <span>·</span>
                    <span>DIGITAL DOUBLES</span>
                  </div>
                  <h3 class="works-title">THE ODYSSEY: FACIAL RECONSTRUCTION</h3>
                  <div class="works-summary">High-Fidelity Performance Transfer & Neural Face Replacement</div>
                  <p class="works-desc">Specialized facial reconstruction pipelines utilizing MetaFace and Metaphysic technologies. Supported identity-preserving digital doubles, lip sync accuracy, and Nuke validation for demanding feature film production shots.</p>
                </div>
              </div>

            </div>

            <!-- ROW 03: LANDSCAPE 05 | LANDSCAPE 06 -->
            <div class="works-landscape-row">

              <!-- LANDSCAPE 05: GLOBAL BRAND CAMPAIGNS -->
              <div class="works-card works-card-landscape" 
                   data-video-src="landscape-05.jpg" 
                   data-video-title="PORSCHE & AUTOMOTIVE SYNTHETIC VISUALS" 
                   data-video-sub="Commercial Campaign Direction & Synthetic Media Pipelines"
                   onclick="openCinematicLightbox(this)">
                <div class="works-media-wrap">
                  <img src="landscape-05.jpg" alt="Porsche & Automotive Synthetic Visuals">
                  <div class="works-play-overlay">
                    <div class="works-play-btn" aria-label="Play Video">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                  <span class="film-meta-badge">[◈] COMMERCIAL // 2025</span>
                </div>
                <div class="works-card-body">
                  <div class="works-tag-row">
                    <span>IMPROMP2LABS</span>
                    <span>·</span>
                    <span>BRAND FILM</span>
                  </div>
                  <h3 class="works-title">PORSCHE & AUTOMOTIVE VISUALS</h3>
                  <div class="works-summary">High-End Commercial Campaign Direction & Synthetic Media Pipelines</div>
                  <p class="works-desc">Directed cinematic short-form campaigns for global enterprise brands at Impromp2Labs including NFL, Porsche, and INDmoney. Built automated GenAI pipelines for rapid video iteration, reducing turnaround times by 35%.</p>
                </div>
              </div>

              <!-- LANDSCAPE 06: MASTERS OF THE UNIVERSE -->
              <div class="works-card works-card-landscape" 
                   data-video-src="landscape-06.jpg" 
                   data-video-title="MASTERS OF THE UNIVERSE: PRODUCTION VFX" 
                   data-video-sub="Creature Design, Armor Texturing & Studio Shot Integration"
                   onclick="openCinematicLightbox(this)">
                <div class="works-media-wrap">
                  <img src="landscape-06.jpg" alt="Masters of the Universe Look-Dev">
                  <div class="works-play-overlay">
                    <div class="works-play-btn" aria-label="Play Video">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                  <span class="film-meta-badge">[◈] FEATURE CINEMA // 2026</span>
                </div>
                <div class="works-card-body">
                  <div class="works-tag-row">
                    <span>DNEG</span>
                    <span>·</span>
                    <span>CREATURE VFX</span>
                  </div>
                  <h3 class="works-title">MASTERS OF THE UNIVERSE</h3>
                  <div class="works-summary">Creature Design, Armor Texturing & Studio Shot Integration</div>
                  <p class="works-desc">Exploratory generative concept art and cinematic asset synthesis for studio film production. Integrated custom LoRA models and prompt architectures directly into VFX art department review pipelines.</p>
                </div>
              </div>

            </div>

            <!-- PORTRAIT REELS ROW: REEL 01 | REEL 02 | REEL 03 -->
            <div class="works-reels-row">

              <!-- REEL 01 -->
              <div class="works-card works-card-reel" 
                   data-video-src="portrait-01.png" 
                   data-video-title="SYNTHETIC HUMAN // RUNWAY REEL" 
                   data-video-sub="Neural character generation & realistic skin-tone fidelity"
                   onclick="openCinematicLightbox(this)">
                <div class="works-media-wrap">
                  <img src="portrait-01.png" alt="Synthetic Human Runway Reel">
                  <div class="works-play-overlay">
                    <div class="works-play-btn" aria-label="Play Reel">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                  <span class="film-meta-badge">[◈] 9:16 REEL // 01</span>
                </div>
                <div class="works-card-body">
                  <div class="works-tag-row">
                    <span>PORTRAIT</span>
                    <span>·</span>
                    <span>DIGITAL HUMAN</span>
                  </div>
                  <h3 class="works-title">SYNTHETIC HUMAN</h3>
                  <div class="works-summary">Neural character generation & skin-tone fidelity</div>
                  <p class="works-desc">Micro-expression transfer and realistic skin subsurface scattering studies using custom diffusion checkpoints.</p>
                </div>
              </div>

              <!-- REEL 02 -->
              <div class="works-card works-card-reel" 
                   data-video-src="portrait-02.png" 
                   data-video-title="CYBERPUNK NEON DRIFT // REEL" 
                   data-video-sub="Dynamic lighting, particle rain & anamorphic lensing"
                   onclick="openCinematicLightbox(this)">
                <div class="works-media-wrap">
                  <img src="portrait-02.png" alt="Cyberpunk Neon Drift Reel">
                  <div class="works-play-overlay">
                    <div class="works-play-btn" aria-label="Play Reel">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                  <span class="film-meta-badge">[◈] 9:16 REEL // 02</span>
                </div>
                <div class="works-card-body">
                  <div class="works-tag-row">
                    <span>PORTRAIT</span>
                    <span>·</span>
                    <span>CINEMATOGRAPHY</span>
                  </div>
                  <h3 class="works-title">NEON DRIFT</h3>
                  <div class="works-summary">Dynamic lighting & anamorphic lensing</div>
                  <p class="works-desc">Cinematic vertical lighting studies and atmospheric particulate simulation for short-form mobile storytelling.</p>
                </div>
              </div>

              <!-- REEL 03 -->
              <div class="works-card works-card-reel" 
                   data-video-src="portrait-03.jpg" 
                   data-video-title="MYTHIC WARRIOR // MOTION CONCEPT" 
                   data-video-sub="Fluid cloth motion & real-time generative camera paths"
                   onclick="openCinematicLightbox(this)">
                <div class="works-media-wrap">
                  <img src="portrait-03.jpg" alt="Mythic Warrior Motion Concept">
                  <div class="works-play-overlay">
                    <div class="works-play-btn" aria-label="Play Reel">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                  <span class="film-meta-badge">[◈] 9:16 REEL // 03</span>
                </div>
                <div class="works-card-body">
                  <div class="works-tag-row">
                    <span>PORTRAIT</span>
                    <span>·</span>
                    <span>ACTION IP</span>
                  </div>
                  <h3 class="works-title">MYTHIC WARRIOR</h3>
                  <div class="works-summary">Fluid cloth motion & generative camera paths</div>
                  <p class="works-desc">Physics-informed motion transfer and multi-model cinematic choreography for hero action character sequences.</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      <!-- FULLSCREEN CINEMATIC LIGHTBOX MODAL -->
      <div class="cinematic-lightbox-modal" id="selected-works-lightbox" role="dialog" aria-modal="true" aria-hidden="true">
        <button type="button" class="lightbox-close-btn" onclick="closeCinematicLightbox()" aria-label="Close Lightbox">✕</button>
        <div class="lightbox-media-container" id="lightbox-container">
          <!-- Dynamically inserted video or media preview -->
        </div>
        <div class="lightbox-caption-bar">
          <div class="lightbox-caption-title" id="lightbox-title">PROJECT TITLE</div>
          <div class="lightbox-caption-sub" id="lightbox-sub">SUBTITLE</div>
        </div>
      </div>
`;

// Insert SELECTED WORKS directly before <section class="visual-orbit-section" id="visual-orbit">
const visualOrbitTarget = '<section class="visual-orbit-section" id="visual-orbit">';
if (html.includes(visualOrbitTarget)) {
  html = html.replace(visualOrbitTarget, selectedWorksHtml + '\n\n      ' + visualOrbitTarget);
  console.log('3. Positioned SELECTED WORKS directly before Visual Orbit and after By the Numbers');
} else {
  console.warn('Could not locate Visual Orbit section target');
}

// 4. Wrap Contact Section in .brittle-contact-card
const closingSectionRegex = /<section class="closing-build-section" id="lets-build"[^>]*>([\s\S]*?)<footer class="site-footer-strip">/;
if (closingSectionRegex.test(html)) {
  html = html.replace(closingSectionRegex, (match, inner) => {
    return `<section class="closing-build-section" id="lets-build" data-media-slot="FINAL_SHOWREEL_VIDEO">
        <div class="brittle-contact-card" id="brittle-contact-card">
${inner.trim()}
        </div>
        <footer class="site-footer-strip">`;
  });
  console.log('4. Wrapped closing section content in .brittle-contact-card');
} else {
  console.warn('Could not match closing-build-section');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Finished updating HTML structure in index.html');
