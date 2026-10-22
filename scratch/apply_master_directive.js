const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

console.log('Original index.html length:', html.length);

// -------------------------------------------------------------
// 1. HERO STICKY NOTE: Remove the 5-line paragraph; display only the large stamp artwork!
// -------------------------------------------------------------
const oldStickyContentRegex = /<div class="sticky-content-wrap">[\s\S]*?<div class="sticky-stamp-wrap" id="sticky-stamp" aria-label="GEN AI CREATIVE PRODUCER">[\s\S]*?<img src="Gen ai\.png"[^>]*>[\s\S]*?<\/div>[\s\S]*?<div class="sticky-body" id="sticky-body-lines">[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const newStickyContent = `<div class="sticky-content-wrap">
          <div class="sticky-stamp-wrap" id="sticky-stamp" aria-label="GEN AI CREATIVE PRODUCER">
            <img src="Gen ai.png" alt="GEN AI CREATIVE PRODUCER" class="sticky-stamp-img">
          </div>
        </div>`;

if (oldStickyContentRegex.test(html)) {
  html = html.replace(oldStickyContentRegex, newStickyContent);
  console.log('1. Updated Hero Sticky Note to show only the large GEN AI CREATIVE PRODUCER stamp (removed body copy paragraph).');
} else {
  console.warn('Could not match old sticky content regex, checking fallback...');
  const fallbackStickyRegex = /<div class="sticky-body" id="sticky-body-lines">[\s\S]*?<\/div>/;
  if (fallbackStickyRegex.test(html)) {
    html = html.replace(fallbackStickyRegex, '');
    console.log('1. (Fallback) Removed sticky-body-lines from sticky note.');
  }
}

// -------------------------------------------------------------
// 2. HERO STICKY NOTE CSS: Compact, near-square pale-yellow paper with large stamp
// -------------------------------------------------------------
// Let's ensure .sticky-note styling is compact and near-square
const stickyNoteCssRegex = /\.sticky-note\s*\{[\s\S]*?width:\s*[^;]+;[\s\S]*?height:\s*[^;]+;[\s\S]*?\}/;
const newStickyNoteCss = `.sticky-note {
      position: relative;
      width: clamp(210px, 21vw, 240px);
      height: clamp(200px, 20vw, 230px);
      aspect-ratio: 1 / 1;
      margin-top: 1.2rem;
      margin-bottom: 1.2rem;
      transform-origin: top right;
      perspective: 1000px;
      user-select: none;
      cursor: pointer;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;
      filter: drop-shadow(0 14px 22px rgba(0, 0, 0, 0.45));
    }`;

if (stickyNoteCssRegex.test(html)) {
  html = html.replace(stickyNoteCssRegex, newStickyNoteCss);
  console.log('2. Updated .sticky-note CSS to compact near-square proportions.');
}

// Ensure .sticky-stamp-img is large and prominent
const stickyStampCssRegex = /\.sticky-stamp-img\s*\{[\s\S]*?\}/;
const newStickyStampCss = `.sticky-stamp-img {
      width: 100%;
      max-width: 195px;
      height: auto;
      display: block;
      margin: 0 auto;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .sticky-note:hover .sticky-stamp-img {
      transform: scale(1.04);
    }`;

if (stickyStampCssRegex.test(html)) {
  html = html.replace(stickyStampCssRegex, newStickyStampCss);
  console.log('2b. Updated .sticky-stamp-img CSS for prominent visibility.');
}

// -------------------------------------------------------------
// 3. CINEMATIC SHOWCASE (BY THE NUMBERS): 4 distinct items + scope statement
// -------------------------------------------------------------
const oldShowcaseZoneRegex = /<div class="cinematic-showcase-zone" data-media-slot="IMPACT_VIDEO">[\s\S]*?<div id="morph-slider-mount" class="morph-slider-mount-container"><\/div>[\s\S]*?<\/div>/;

const newShowcaseZone = `<div class="cinematic-showcase-zone" data-media-slot="IMPACT_VIDEO">
            <div class="showcase-top-bar">
              <div class="showcase-tag">
                <span class="signal-dot"></span>
                <span>CINEMATIC SHOWCASE // 4 SELECTED PROJECT CONTEXTS</span>
              </div>
              <p class="showcase-scope-statement">Selected studio-film visual-development explorations and limited-scope contributions, alongside independent cinematic work. Scope varied by project.</p>
            </div>

            <div id="morph-slider-mount" class="morph-slider-mount-container"></div>
          </div>`;

if (oldShowcaseZoneRegex.test(html)) {
  html = html.replace(oldShowcaseZoneRegex, newShowcaseZone);
  console.log('3. Updated Cinematic Showcase heading and added mandatory scope statement.');
}

// -------------------------------------------------------------
// 4. MY EXPERTISE (DNEG): Match 3-column architecture of IMPROMP2LABS + New STUDIO FILMS subsection below SKILLS & TOOLS
// -------------------------------------------------------------
const oldDnegFullRegex = /<!-- 1\. DNEG -->[\s\S]*?<!-- 2\. IMPROMP2LABS -->/;

const newDnegFull = `<!-- 1. DNEG -->
            <div class="expertise-row" id="exp-dneg">
              <div class="expertise-logo-col">
                <div class="company-logo-slot" aria-label="Logo: DNEG">
                  <div class="logo-slot-inner">
                    <span class="logo-slot-badge">LOGO</span>
                    <span class="logo-slot-name">DNEG</span>
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
                    <p class="info-block-intro">Supported production-focused generative AI workflows for feature-film visual development, digital-human creation and VFX integration:</p>
                    <ul class="info-bullets">
                      <li>Developed and adapted AI image/video generation workflows for cinematic look development.</li>
                      <li>Supported identity- and performance-preserving workflows involving face ingest, transfer, face swapping and lip sync.</li>
                      <li>Integrated AI-generated assets into established VFX workflows and supported shot-level validation.</li>
                      <li>Applied ComfyUI-based workflows and Nuke-based post-production integration where appropriate.</li>
                    </ul>
                  </div>

                  <div class="info-block">
                    <div class="info-block-label">SKILLS</div>
                    <div class="skill-tags">
                      <span class="skill-tag" tabIndex="0">Digital Humans</span>
                      <span class="skill-tag" tabIndex="0">Identity Transfer</span>
                      <span class="skill-tag" tabIndex="0">Lip Sync</span>
                      <span class="skill-tag" tabIndex="0">Face Swapping</span>
                      <span class="skill-tag" tabIndex="0">Cinematic Look-Dev</span>
                      <span class="skill-tag" tabIndex="0">Shot Validation</span>
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

                <!-- NEW STUDIO FILMS SUBSECTION: Positioned BELOW Skills & Tools in exact requested order -->
                <div class="dneg-studio-films-section" aria-label="Studio Films Visual Development">
                  <div class="studio-films-header">
                    <span class="studio-films-marker">◈</span>
                    <span class="studio-films-title">STUDIO FILMS // SELECTED PRODUCTION CONTEXTS</span>
                    <span class="studio-films-scope">Limited-scope studio visual development contributions</span>
                  </div>
                  <div class="studio-films-tiles-row">
                    <!-- 1. THE ODYSSEY -->
                    <div class="studio-film-tile">
                      <div class="film-tile-media">
                        <img src="ramayana-output.jpg" alt="The Odyssey feature look development">
                        <div class="film-tile-badge">THE ODYSSEY</div>
                      </div>
                      <div class="film-tile-caption">Visual development & digital doubles</div>
                    </div>

                    <!-- 2. RAMAYANA -->
                    <div class="studio-film-tile">
                      <div class="film-tile-media">
                        <img src="Ramayana.png" alt="Namit Malhotra's Ramayana feature visual development">
                        <div class="film-tile-badge">RAMAYANA</div>
                      </div>
                      <div class="film-tile-caption">Epic cinema AI pipeline & look-dev</div>
                    </div>

                    <!-- 3. DUNE 3 -->
                    <div class="studio-film-tile">
                      <div class="film-tile-media">
                        <img src="dune-dneg.jpg" alt="Dune Part 3 feature visual development">
                        <div class="film-tile-badge">DUNE 3</div>
                      </div>
                      <div class="film-tile-caption">Sci-fi environment & digital humans</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- 2. IMPROMP2LABS -->`;

if (oldDnegFullRegex.test(html)) {
  html = html.replace(oldDnegFullRegex, newDnegFull);
  console.log('4. Updated DNEG layout with 3-column architecture, removed logo side buttons, and added STUDIO FILMS subsection beneath Skills & Tools.');
}

// -------------------------------------------------------------
// 5. SELECTED WORKS: Correct expansion button position (at bottom when expanded) & Medium Video Player Modal
// -------------------------------------------------------------
// Update Selected Works markup to place the toggle button at the very bottom beneath all 3 reels when expanded!
const selectedWorksSectionRegex = /<section class="selected-works-section" id="selected-works">[\s\S]*?<\/section>/;

const newSelectedWorksSection = `<section class="selected-works-section" id="selected-works">
        <div class="dbl-section-header">
          <div class="dbl-meta-label">
            <span class="dbl-meta-dot"></span>
            <span>03 / SELECTED WORKS · CINEMATIC PRODUCTION ARCHIVE</span>
          </div>
          <h2 class="dbl-title-main">SELECTED WORKS</h2>
          <p class="dbl-subtitle-desc">Feature film look-dev, mythic worldbuilding, and studio AI pipelines. Showing initial preview pair — expand for complete landscape archive and portrait reels.</p>
        </div>

        <div class="selected-works-grid">

          <!-- INITIAL VISIBLE ROW: LANDSCAPE 01 & LANDSCAPE 02 (16:9 CONTAINERS) -->
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
                <p class="works-desc">Contributed to production-grade Generative AI workflows and high-fidelity identity preservation at DNEG. Developed ComfyUI-based systems and Metaphysic performance transfer across film shots, enabling seamless studio compositing and shot validation in Nuke.</p>
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
                  <span class="film-meta-badge">[◈] INDEPENDENT IP // 2025</span>
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

            <!-- PORTRAIT REELS ROW: REEL 01 | REEL 02 | REEL 03 (9:16 PROPORTIONS, 3-COLUMN DESKTOP) -->
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

          <!-- SEE MORE / SHOW LESS TOGGLE BUTTON: Positioned below expanded content so it moves to bottom per Requirement 7.2 -->
          <div class="works-see-more-wrap" id="works-toggle-wrap">
            <button type="button" class="works-toggle-btn" id="works-toggle-btn" onclick="toggleSelectedWorksExpand()">
              <span id="works-toggle-text">SEE MORE (4 LANDSCAPES + 3 REELS)</span>
              <svg id="works-toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

        </div>
      </section>`;

if (selectedWorksSectionRegex.test(html)) {
  html = html.replace(selectedWorksSectionRegex, newSelectedWorksSection);
  console.log('5. Updated Selected Works: toggle button placed after expandable area so it moves to very bottom when expanded.');
}

// -------------------------------------------------------------
// 6. MEDIUM VIDEO PLAYER OVERLAY & FULLSCREEN MODE (Requirement 7.3 & 7.4)
// -------------------------------------------------------------
const oldLightboxModalRegex = /<!-- FULLSCREEN CINEMATIC LIGHTBOX MODAL -->[\s\S]*?<div class="cinematic-lightbox-modal" id="selected-works-lightbox"[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const newMediumPlayerModal = `<!-- MEDIUM VIDEO PLAYER OVERLAY & FULLSCREEN (REQUIREMENT 7.3 & 7.4) -->
      <div class="cinematic-lightbox-modal" id="selected-works-lightbox" role="dialog" aria-modal="true" aria-hidden="true" onclick="handleLightboxBackdropClick(event)">
        <div class="medium-player-card" id="medium-player-card" onclick="event.stopPropagation()">
          <button type="button" class="lightbox-close-btn" onclick="closeCinematicLightbox()" aria-label="Close Player">✕</button>
          
          <div class="medium-player-stage" id="player-media-stage">
            <div class="lightbox-media-container" id="lightbox-container">
              <!-- Dynamically inserted video or media preview -->
            </div>
            
            <!-- CUSTOM VIDEO CONTROLS BAR (REQUIREMENTS 7.3 & 7.4) -->
            <div class="video-custom-controls" id="video-custom-controls">
              <button type="button" class="player-btn" id="player-play-btn" aria-label="Play/Pause" onclick="togglePlayerPlay()">
                <svg id="play-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <svg id="pause-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              </button>

              <button type="button" class="player-btn" id="player-skip-btn" aria-label="Skip Forward 10s" onclick="skipPlayer(10)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a10 10 0 1 1-7.07 2.93"></path>
                  <polyline points="5 2 5 7 10 7"></polyline>
                  <text x="9" y="15" font-size="8" fill="currentColor" font-weight="700" stroke="none">10</text>
                </svg>
              </button>

              <div class="player-seek-wrap">
                <input type="range" class="player-seek-slider" id="player-seek-bar" min="0" max="100" value="0" step="0.1" oninput="handlePlayerSeek(this.value)">
                <div class="player-seek-progress" id="player-seek-fill"></div>
              </div>

              <div class="player-time-display" id="player-time-display">00:00 / 00:00</div>

              <button type="button" class="player-btn" id="player-mute-btn" aria-label="Mute/Unmute" onclick="togglePlayerMute()">
                <svg id="vol-icon-on" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <svg id="vol-icon-off" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                </svg>
              </button>

              <input type="range" class="player-vol-slider" id="player-vol-bar" min="0" max="1" value="1" step="0.05" oninput="handlePlayerVolume(this.value)">

              <button type="button" class="player-btn player-fs-btn" id="player-fs-btn" aria-label="Enter Fullscreen" onclick="togglePlayerFullscreen()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
            </div>
          </div>

          <div class="medium-player-footer">
            <div class="player-info-meta">
              <div class="lightbox-caption-title" id="lightbox-title">PROJECT TITLE</div>
              <div class="lightbox-caption-sub" id="lightbox-sub">SUBTITLE</div>
            </div>
            <div class="player-instruction-note">
              Click outside the video to close, or hover over the player and choose fullscreen.
            </div>
          </div>
        </div>
      </div>`;

if (oldLightboxModalRegex.test(html)) {
  html = html.replace(oldLightboxModalRegex, newMediumPlayerModal);
  console.log('6. Replaced lightbox with responsive medium player modal with seek, volume, +10s, and fullscreen.');
}

// -------------------------------------------------------------
// 7. CONTACT CARD & START A PROJECT (Requirements 13 & 14)
// -------------------------------------------------------------
// Use Rough dark.png for light theme and Rough white.png for dark theme
// Wire START A PROJECT to https://mail.google.com/mail/?view=cm&fs=1&to=meet2krishnan%40gmail.com
const startProjectRegex = /<a href="mailto:meet2krishnan@gmail\.com"\s+class="build-action-btn build-btn-primary">/;
const newStartProject = `<a href="https://mail.google.com/mail/?view=cm&fs=1&to=meet2krishnan%40gmail.com" target="_blank" rel="noopener noreferrer" class="build-action-btn build-btn-primary" aria-label="Start a project - Compose Email to meet2krishnan@gmail.com">`;

if (startProjectRegex.test(html)) {
  html = html.replace(startProjectRegex, newStartProject);
  console.log('7. Updated START A PROJECT link to direct Gmail compose URL.');
}

// Update .brittle-contact-card CSS in index.html to use Rough white.png (dark theme) and Rough dark.png (light theme)
const contactCardCssRegex = /\[data-theme="dark"\]\s+\.brittle-contact-card\s*\{[\s\S]*?background:\s*#F4F3EF;[\s\S]*?\}/;
const newDarkCardCss = `[data-theme="dark"] .brittle-contact-card {
      background-color: #F4F3EF;
      background-image: url('Rough white.png');
      background-size: cover;
      background-position: center;
      border: 1px solid rgba(255, 255, 255, 0.45);
      color: #121215;
      box-shadow: 0 28px 56px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.95);
    }`;

if (contactCardCssRegex.test(html)) {
  html = html.replace(contactCardCssRegex, newDarkCardCss);
  console.log('7b. Applied Rough white.png texture to dark-theme contact card.');
}

const contactCardLightCssRegex = /\[data-theme="light"\]\s+\.brittle-contact-card\s*\{[\s\S]*?background:\s*#111115;[\s\S]*?\}/;
const newLightCardCss = `[data-theme="light"] .brittle-contact-card {
      background-color: #111115;
      background-image: url('Rough dark.png');
      background-size: cover;
      background-position: center;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #F4F4F2;
      box-shadow: 0 24px 50px -10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }`;

if (contactCardLightCssRegex.test(html)) {
  html = html.replace(contactCardLightCssRegex, newLightCardCss);
  console.log('7c. Applied Rough dark.png texture to light-theme contact card.');
}

// -------------------------------------------------------------
// 8. ADD FLUID GLASS BUTTON STYLES & DNEG STUDIO FILMS STYLES
// -------------------------------------------------------------
const additionalStyles = `
    /* ============================================================
       REQUIREMENT 12: FLUID GLASS INTERACTIVE SURFACE FOR BUTTONS
       ============================================================ */
    .btn,
    .contact-btn,
    .build-action-btn,
    .resume-download-btn,
    .works-toggle-btn,
    .works-play-btn,
    .theme-toggle-btn,
    .player-btn,
    .lightbox-close-btn {
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    }

    .btn:active,
    .contact-btn:active,
    .build-action-btn:active,
    .resume-download-btn:active,
    .works-toggle-btn:active,
    .player-btn:active {
      transform: scale(0.97) !important;
    }

    /* Specular Fluid Glass Traveling Refraction Highlight */
    .btn::before,
    .contact-btn::before,
    .build-action-btn::before,
    .resume-download-btn::before,
    .works-toggle-btn::before,
    .player-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      opacity: 0;
      background: radial-gradient(circle 90px at var(--fg-x, 50%) var(--fg-y, 50%), rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.08) 50%, transparent 80%);
      transition: opacity 0.25s ease;
      z-index: 1;
    }

    [data-theme="light"] .btn::before,
    [data-theme="light"] .contact-btn::before,
    [data-theme="light"] .build-action-btn::before,
    [data-theme="light"] .resume-download-btn::before,
    [data-theme="light"] .works-toggle-btn::before,
    [data-theme="light"] .player-btn::before {
      background: radial-gradient(circle 90px at var(--fg-x, 50%) var(--fg-y, 50%), rgba(255, 255, 255, 0.65), rgba(0, 0, 0, 0.06) 45%, transparent 80%);
    }

    .btn:hover::before,
    .contact-btn:hover::before,
    .build-action-btn:hover::before,
    .resume-download-btn:hover::before,
    .works-toggle-btn:hover::before,
    .player-btn:hover::before {
      opacity: 1;
    }

    /* ============================================================
       DNEG STUDIO FILMS SUBSECTION (REQUIREMENT 8.3)
       ============================================================ */
    .dneg-studio-films-section {
      margin-top: 1.8rem;
      padding-top: 1.4rem;
      border-top: 1px solid var(--dbl-border-subtle);
      width: 100%;
    }

    .studio-films-header {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      margin-bottom: 0.9rem;
      flex-wrap: wrap;
    }

    .studio-films-marker {
      color: var(--dbl-crimson);
      font-size: 11px;
    }

    .studio-films-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--dbl-text-primary);
      text-transform: uppercase;
    }

    .studio-films-scope {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px;
      color: var(--dbl-text-tertiary);
      letter-spacing: 0.04em;
      margin-left: auto;
    }

    .studio-films-tiles-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      width: 100%;
    }

    .studio-film-tile {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      background: var(--dbl-surface-matte);
      border: 1px solid var(--dbl-border-subtle);
      border-radius: 8px;
      overflow: hidden;
      padding: 0.5rem;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .studio-film-tile:hover {
      border-color: var(--dbl-border-strong);
      transform: translateY(-2px);
    }

    .film-tile-media {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 6px;
      overflow: hidden;
      background: #000;
    }

    .film-tile-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.35s ease;
    }

    .studio-film-tile:hover .film-tile-media img {
      transform: scale(1.05);
    }

    .film-tile-badge {
      position: absolute;
      bottom: 6px;
      left: 6px;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      padding: 2px 7px;
      border-radius: 4px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #FFFFFF;
      text-transform: uppercase;
    }

    .film-tile-caption {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10.5px;
      color: var(--dbl-text-secondary);
      line-height: 1.3;
      padding: 0 2px;
    }

    /* ============================================================
       MEDIUM VIDEO PLAYER MODAL (REQUIREMENT 7.3 & 7.4)
       ============================================================ */
    .medium-player-card {
      position: relative;
      width: clamp(340px, 86vw, 980px);
      max-height: 90vh;
      background: rgba(14, 14, 18, 0.94);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 16px;
      box-shadow: 0 32px 72px -16px rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalScaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalScaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .medium-player-stage {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000;
      overflow: hidden;
    }

    .medium-player-stage .lightbox-media-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .medium-player-stage .lightbox-media-container img,
    .medium-player-stage .lightbox-media-container video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    /* Custom video control bar */
    .video-custom-controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 10px 16px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 70%, transparent 100%);
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0;
      transition: opacity 0.25s ease;
      z-index: 10;
    }

    .medium-player-stage:hover .video-custom-controls,
    .video-custom-controls:focus-within {
      opacity: 1;
    }

    .player-btn {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #FFFFFF;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      outline: none;
      flex-shrink: 0;
    }

    .player-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .player-seek-wrap {
      position: relative;
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .player-seek-slider {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      margin: 0;
      z-index: 2;
    }

    .player-seek-progress {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 0%;
      background: var(--dbl-crimson);
      border-radius: 3px;
    }

    .player-time-display {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.85);
      white-space: nowrap;
      min-width: 85px;
    }

    .player-vol-slider {
      width: 65px;
      height: 4px;
      accent-color: var(--dbl-crimson);
      cursor: pointer;
    }

    .medium-player-footer {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(18, 18, 24, 0.65);
    }

    .player-instruction-note {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10.5px;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 0.03em;
      text-align: right;
    }

    /* Selected Works breathing room before next section */
    .selected-works-section {
      margin-bottom: clamp(65px, 8vw, 110px);
    }
`;

if (!html.includes('REQUIREMENT 12: FLUID GLASS INTERACTIVE SURFACE FOR BUTTONS')) {
  html = html.replace('</style>', additionalStyles + '\n  </style>');
  console.log('8. Injected Fluid Glass button styles and Medium Player styles.');
}

// Write intermediate result
fs.writeFileSync('index.html', html, 'utf8');
console.log('Saved index.html stage 1.');
