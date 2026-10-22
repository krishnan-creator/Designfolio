const fs = require('fs');

// Read puzzle data
const puzzleData = JSON.parse(fs.readFileSync('scratch/puzzle_data.json', 'utf8'));

// 1. Build BY THE NUMBERS HTML
const byTheNumbersHTML = `
      <!-- ============================================================
           SECTION 02 — BY THE NUMBERS (MINIMAL EDITORIAL METRIC ARCHIVE)
           ============================================================ -->
      <section class="by-the-numbers-section" id="by-the-numbers">
        <a id="impact-metrics" style="display:none;" aria-hidden="true"></a>

        <div class="dbl-section-header">
          <div class="dbl-meta-label">
            <span class="dbl-meta-dot"></span>
            <span>02 / BY THE NUMBERS · SCALE / OUTPUT / CINEMA</span>
          </div>
          <h2 class="dbl-title-main">BY THE NUMBERS</h2>
          <p class="dbl-subtitle-desc">Quantitative evidence of generative AI workflows, high-velocity creative direction, and cinematic pipeline outputs.</p>
        </div>

        <div class="numbers-archive-wrap">

          <!-- 8 MINIMAL EDITORIAL METRIC TILES (EXPANDS SMOOTHLY ON HOVER / FOCUS / TAP) -->
          <div class="numbers-editorial-grid">

            <!-- 1. 25K+ AI IMAGES -->
            <div class="number-tile" tabindex="0" role="region" aria-label="25K+ AI IMAGES">
              <div class="number-tile-header">
                <span class="number-cat">PRODUCTION VOLUME</span>
                <span class="number-accent-dot"></span>
              </div>
              <div class="number-val">25K<span class="plus-sym">+</span></div>
              <div class="number-label">AI IMAGES</div>
              <div class="number-expand-desc">
                <p>AI-generated visual production across creative and cinematic projects.</p>
              </div>
            </div>

            <!-- 2. 150+ AI VIDEOS -->
            <div class="number-tile" tabindex="0" role="region" aria-label="150+ AI VIDEOS">
              <div class="number-tile-header">
                <span class="number-cat">CINEMATIC MOTION</span>
                <span class="number-accent-dot"></span>
              </div>
              <div class="number-val">150<span class="plus-sym">+</span></div>
              <div class="number-label">AI VIDEOS</div>
              <div class="number-expand-desc">
                <p>AI-assisted cinematic motion and video production.</p>
              </div>
            </div>

            <!-- 3. 50+ PROJECTS -->
            <div class="number-tile" tabindex="0" role="region" aria-label="50+ PROJECTS">
              <div class="number-tile-header">
                <span class="number-cat">COMMERCIAL & IP</span>
                <span class="number-accent-dot"></span>
              </div>
              <div class="number-val">50<span class="plus-sym">+</span></div>
              <div class="number-label">PROJECTS</div>
              <div class="number-expand-desc">
                <p>Creative, commercial, and cinematic projects.</p>
              </div>
            </div>

            <!-- 4. 10K+ DESIGN ASSETS -->
            <div class="number-tile" tabindex="0" role="region" aria-label="10K+ DESIGN ASSETS">
              <div class="number-tile-header">
                <span class="number-cat">VISUAL SYSTEMS</span>
                <span class="number-accent-dot"></span>
              </div>
              <div class="number-val">10K<span class="plus-sym">+</span></div>
              <div class="number-label">DESIGN ASSETS</div>
              <div class="number-expand-desc">
                <p>Visual and design assets created for varied production needs.</p>
              </div>
            </div>

            <!-- 5. 15+ AI WORKFLOWS -->
            <div class="number-tile" tabindex="0" role="region" aria-label="15+ AI WORKFLOWS">
              <div class="number-tile-header">
                <span class="number-cat">GENAI PIPELINES</span>
                <span class="number-accent-dot"></span>
              </div>
              <div class="number-val">15<span class="plus-sym">+</span></div>
              <div class="number-label">AI WORKFLOWS</div>
              <div class="number-expand-desc">
                <p>Creative AI workflows developed, adapted, or integrated.</p>
              </div>
            </div>

            <!-- 6. 50+ FILM SHOTS -->
            <div class="number-tile" tabindex="0" role="region" aria-label="50+ FILM SHOTS">
              <div class="number-tile-header">
                <span class="number-cat">LOOK-DEV & VFX</span>
                <span class="number-accent-dot"></span>
              </div>
              <div class="number-val">50<span class="plus-sym">+</span></div>
              <div class="number-label">FILM SHOTS</div>
              <div class="number-expand-desc">
                <p>Cinematic shots and visual-development work.</p>
              </div>
            </div>

            <!-- 7. 140+ CLIENTS -->
            <div class="number-tile" tabindex="0" role="region" aria-label="140+ CLIENTS">
              <div class="number-tile-header">
                <span class="number-cat">CLIENT ENGAGEMENT</span>
                <span class="number-accent-dot"></span>
              </div>
              <div class="number-val">140<span class="plus-sym">+</span></div>
              <div class="number-label">CLIENTS</div>
              <div class="number-expand-desc">
                <p>Client-facing creative work across projects and campaigns.</p>
              </div>
            </div>

            <!-- 8. 2 ASHRA CHAPTERS -->
            <div class="number-tile number-tile-featured" tabindex="0" role="region" aria-label="2 ASHRA CHAPTERS">
              <div class="number-tile-header">
                <span class="number-cat">SOLO CINEMATIC IP</span>
                <span class="number-accent-dot"></span>
              </div>
              <div class="number-val">2</div>
              <div class="number-label">ASHRA CHAPTERS</div>
              <div class="number-expand-desc">
                <p>Single-handed creative development across two Ashra chapters, involving real-person-inspired character work with friends' faces, character sheets, environment sheets, prompts, visual development, and supporting production assets.</p>
              </div>
            </div>

          </div>

          <!-- CINEMATIC SHOWCASE (DIRECTLY BELOW METRICS: RAMAYANA & VEERABHADRA ONLY) -->
          <div class="cinematic-showcase-zone" data-media-slot="IMPACT_VIDEO">
            
            <div class="showcase-top-bar">
              <div class="showcase-tag">
                <span class="signal-dot"></span>
                <span>CINEMATIC SHOWCASE // RAMAYANA & VEERABHADRA</span>
              </div>

              <!-- 10-Second Auto-Rotation Indicator & Controls -->
              <div class="showcase-rotation-nav">
                <span class="rot-index-badge" id="rot-num-badge">01 / 02</span>
                <div class="rot-tabs">
                  <button type="button" class="rot-tab-btn is-active" id="rot-btn-0" data-idx="0" aria-label="View Ramayana Visual">
                    <span class="tab-dot"></span>
                    <span>RAMAYANA</span>
                    <span class="tab-progress-line" id="prog-line-0"></span>
                  </button>
                  <button type="button" class="rot-tab-btn" id="rot-btn-1" data-idx="1" aria-label="View Veerabhadra Visual">
                    <span class="tab-dot"></span>
                    <span>VEERABHADRA</span>
                    <span class="tab-progress-line" id="prog-line-1"></span>
                  </button>
                </div>
              </div>
            </div>

            <div class="cinematic-stage" id="cinematic-stage">

              <!-- SLIDE 1: RAMAYANA -->
              <div class="cinematic-slide is-active" id="slide-0" data-index="0">
                <img src="Ramayana.png" alt="Namit Malhotra's Ramayana Feature Cinematic Visual">
                <div class="slide-metadata-overlay">
                  <div class="slide-info-left">
                    <span class="slide-badge-meta">[◈] CINEMATIC / GEN AI</span>
                    <h3 class="slide-title">RAMAYANA</h3>
                    <p class="slide-caption-desc">Feature film cinematic development, digital humans and VFX pipeline integration for studio production.</p>
                  </div>
                  <span class="slide-tag-pill">STUDIO VFX LOOK-DEV</span>
                </div>
              </div>

              <!-- SLIDE 2: VEERABHADRA -->
              <div class="cinematic-slide" id="slide-1" data-index="1">
                <img src="VeerBhadra.png" alt="Veerabhadra Mythic Action IP Character and World Visual">
                <div class="slide-metadata-overlay">
                  <div class="slide-info-left">
                    <span class="slide-badge-meta">[◈] CHARACTER / WORLD</span>
                    <h3 class="slide-title">VEERABHADRA</h3>
                    <p class="slide-caption-desc">Original mythic action IP worldbuilding, hero character design, weapons and environment visual development.</p>
                  </div>
                  <span class="slide-tag-pill">IP WORLD CREATION</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>
`;

// 2. Build DISCIPLINES 9-PIECE PUZZLE HTML
let puzzlePiecesSVG = '';
let puzzleClipDefs = '';
puzzleData.forEach(p => {
  puzzleClipDefs += `
      <clipPath id="p-clip-${p.idx}">
        <path d="${p.path}" />
      </clipPath>`;
  
  // label position: center of piece
  puzzlePiecesSVG += `
      <g class="puzzle-piece" id="puzzle-piece-${p.idx}" data-idx="${p.idx}" data-col="${p.col}" data-row="${p.row}" tabindex="0" role="button" aria-label="${p.name}">
        <!-- Photo clipped to interlocking puzzle shape -->
        <image href="landscape-06.jpg" width="900" height="600" preserveAspectRatio="xMidYMid slice" clip-path="url(#p-clip-${p.idx})" />
        <!-- Editorial dark tint (fades on full assemble or hover) -->
        <path d="${p.path}" class="piece-tint" />
        <!-- Interlocking piece boundary bevel stroke -->
        <path d="${p.path}" class="piece-stroke" />
        <!-- Discipline badge and label -->
        <g class="piece-label-group" transform="translate(${p.cx}, ${p.cy})">
          <text class="piece-num-text" y="-12" text-anchor="middle">0${p.idx + 1}</text>
          <text class="piece-name-text" y="10" text-anchor="middle">${p.name.toUpperCase()}</text>
        </g>
      </g>`;
});

const disciplinesHTML = `
      <!-- ============================================================
           SECTION 02.5 — DISCIPLINES (NINE-PIECE INTERACTIVE PUZZLE)
           ============================================================ -->
      <section class="disciplines-section" id="disciplines">
        <a id="geometric-identity" style="display:none;" aria-hidden="true"></a>

        <div class="dbl-section-header">
          <div class="dbl-meta-label">
            <span class="dbl-meta-dot"></span>
            <span>02.5 / DISCIPLINES · NINE-PIECE INTERACTIVE PUZZLE</span>
          </div>
          <h2 class="dbl-title-main">DISCIPLINES</h2>
          <p class="dbl-subtitle-desc">Interactive nine-piece puzzle articulating core creative capabilities. Interlocking pieces assemble automatically, revealing underlying cinematic landscape look-dev. Select any piece to inspect capability.</p>
        </div>

        <div class="puzzle-container" id="puzzle-container">
          
          <div class="puzzle-status-bar">
            <div class="puzzle-status-left">
              <span class="puzzle-pulse-dot"></span>
              <span class="puzzle-status-text" id="puzzle-status-text">CYCLE: ASSEMBLING PUZZLE</span>
            </div>
            <div class="puzzle-timer-wrap">
              <span class="puzzle-timer-label">HOLD:</span>
              <div class="puzzle-timer-bar-track">
                <div class="puzzle-timer-bar" id="puzzle-timer-bar"></div>
              </div>
            </div>
          </div>

          <div class="puzzle-stage" id="puzzle-stage">
            <svg class="puzzle-svg" id="puzzle-svg" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid meet">
              <defs>
                ${puzzleClipDefs}
              </defs>
              <g id="puzzle-pieces-group" class="puzzle-group is-separated">
                ${puzzlePiecesSVG}
              </g>
            </svg>
          </div>

          <!-- CONTEXTUAL DISCIPLINE DETAIL DRAWER (OPENS ON PIECE SELECTION) -->
          <div class="puzzle-detail-card" id="puzzle-detail-card" aria-hidden="true">
            <div class="puzzle-detail-header">
              <span class="puzzle-detail-tag" id="puzzle-detail-tag">DISCIPLINE // 01</span>
              <button type="button" class="puzzle-detail-close" id="puzzle-detail-close" aria-label="Close detail">×</button>
            </div>
            <h3 class="puzzle-detail-title" id="puzzle-detail-title">CREATIVE DIRECTION</h3>
            <p class="puzzle-detail-desc" id="puzzle-detail-desc">Shaping holistic visual aesthetics, high-velocity concept design, stylistic cohesion, and reference-driven storytelling from initial brief to executive delivery.</p>
          </div>

        </div>
      </section>
`;

// 3. Build MY EXPERTISE HTML
const myExpertiseHTML = `
      <!-- ============================================================
           SECTION 03 — MY EXPERTISE (INFORMATION-FIRST CAREER ARCHIVE)
           ============================================================ -->
      <section class="expertise-section" id="my-expertise">
        <a id="my-journey" style="display:none;" aria-hidden="true"></a>

        <div class="dbl-section-header">
          <div class="dbl-meta-label">
            <span class="dbl-meta-dot"></span>
            <span>03 / MY EXPERTISE · PRODUCTION RECORD & LEADERSHIP</span>
          </div>
          <h2 class="dbl-title-main">MY EXPERTISE</h2>
          <p class="dbl-subtitle-desc">Seven years of creative production evolving from brand systems and graphic design into AI-driven visual development, cinematic worldbuilding, and VFX integration.</p>
        </div>

        <div class="expertise-container">

          <!-- 4 CHRONOLOGICAL COMPANIES (LEFT LOGO SLOTS + MAIN INFO) -->
          <div class="expertise-list">

            <!-- 1. PREMA SAI DESIGNERS -->
            <div class="expertise-row" id="exp-premasai">
              <div class="expertise-logo-col">
                <div class="company-logo-slot" aria-label="Logo: Prema Sai Designers">
                  <div class="logo-slot-inner">
                    <span class="logo-slot-badge">LOGO</span>
                    <span class="logo-slot-name">PREMA SAI</span>
                    <span class="logo-slot-sub">DESIGNERS</span>
                  </div>
                </div>
              </div>
              <div class="expertise-content-col">
                <div class="expertise-card-header">
                  <div>
                    <h3 class="company-heading">PREMA SAI DESIGNERS</h3>
                    <div class="company-role-tag">Graphic Designer</div>
                  </div>
                  <div class="company-meta-pills">
                    <span class="comp-date-pill">AUG 2018 – OCT 2024</span>
                    <span class="comp-loc-pill">Hyderabad · Onsite</span>
                  </div>
                </div>

                <div class="expertise-info-grid">
                  <div class="info-block">
                    <div class="info-block-label">WHAT I DID</div>
                    <p class="info-block-intro">Graphic design, brand systems, and marketing creative production:</p>
                    <ul class="info-bullets">
                      <li>Designed comprehensive brand systems, identity guidelines, and visual communication frameworks.</li>
                      <li>Led high-volume marketing collateral and digital creative production across campaigns.</li>
                      <li>Explored AI-assisted workflow experimentation to accelerate ideation and asset generation.</li>
                    </ul>
                  </div>

                  <div class="info-block">
                    <div class="info-block-label">SKILLS</div>
                    <div class="skill-tags">
                      <span class="skill-tag">Graphic Design</span>
                      <span class="skill-tag">Visual Communication</span>
                      <span class="skill-tag">Branding</span>
                      <span class="skill-tag">Creative Production</span>
                    </div>
                  </div>

                  <div class="info-block">
                    <div class="info-block-label">TOOLS</div>
                    <div class="tool-tags">
                      <span class="tool-tag">Photoshop</span>
                      <span class="tool-tag">Illustrator</span>
                      <span class="tool-tag">InDesign</span>
                      <span class="tool-tag">CorelDRAW</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. CYBEREDGE -->
            <div class="expertise-row" id="exp-cyberedge">
              <div class="expertise-logo-col">
                <div class="company-logo-slot" aria-label="Logo: Cyberedge">
                  <div class="logo-slot-inner">
                    <span class="logo-slot-badge">LOGO</span>
                    <span class="logo-slot-name">CYBEREDGE</span>
                  </div>
                </div>
              </div>
              <div class="expertise-content-col">
                <div class="expertise-card-header">
                  <div>
                    <h3 class="company-heading">CYBEREDGE</h3>
                    <div class="company-role-tag">AI Design Engineer</div>
                  </div>
                  <div class="company-meta-pills">
                    <span class="comp-date-pill">NOV 2024 – NOV 2025</span>
                    <span class="comp-loc-pill">Hyderabad · Hybrid</span>
                  </div>
                </div>

                <div class="expertise-info-grid">
                  <div class="info-block">
                    <div class="info-block-label">WHAT I DID</div>
                    <p class="info-block-intro">AI-assisted visual production and large-scale creative campaigns:</p>
                    <ul class="info-bullets">
                      <li>Engineered generative workflows for high-volume visual variation, composition, and layout exploration.</li>
                      <li>Directed virtual camera staging, lighting setups, and visual look-dev across commercial campaigns.</li>
                      <li>Implemented post-production pipelines bridging raw generative outputs into client-ready deliverables.</li>
                    </ul>
                  </div>

                  <div class="info-block">
                    <div class="info-block-label">SKILLS</div>
                    <div class="skill-tags">
                      <span class="skill-tag">AI Design</span>
                      <span class="skill-tag">Art Direction</span>
                      <span class="skill-tag">Camera & Lighting</span>
                      <span class="skill-tag">Visual Development</span>
                      <span class="skill-tag">Post-Production</span>
                    </div>
                  </div>

                  <div class="info-block">
                    <div class="info-block-label">TOOLS</div>
                    <div class="tool-tags">
                      <span class="tool-tag">Midjourney</span>
                      <span class="tool-tag">Stable Diffusion</span>
                      <span class="tool-tag">Photoshop</span>
                      <span class="tool-tag">Premiere Pro</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. IMPROMP2LABS -->
            <div class="expertise-row" id="exp-impromp2">
              <div class="expertise-logo-col">
                <div class="company-logo-slot" aria-label="Logo: Impromp2labs">
                  <div class="logo-slot-inner">
                    <span class="logo-slot-badge">LOGO</span>
                    <span class="logo-slot-name">IMPROMP2</span>
                    <span class="logo-slot-sub">LABS</span>
                  </div>
                </div>
              </div>
              <div class="expertise-content-col">
                <div class="expertise-card-header">
                  <div>
                    <h3 class="company-heading">IMPROMP2LABS</h3>
                    <div class="company-role-tag">Gen AI Creative Lead</div>
                  </div>
                  <div class="company-meta-pills">
                    <span class="comp-date-pill">NOV 2025 – PRESENT</span>
                    <span class="comp-loc-pill">Hyderabad · Hybrid</span>
                  </div>
                </div>

                <div class="expertise-info-grid">
                  <div class="info-block">
                    <div class="info-block-label">WHAT I DID</div>
                    <p class="info-block-intro">GenAI filmmaking and cinematic visual-development workflows:</p>
                    <ul class="info-bullets">
                      <li>Directed original cinematic IP, character designs, environments, creatures, trailers, and multi-shot sequences.</li>
                      <li>Developed reference-driven consistency pipelines ensuring identity and world persistence across scene cuts.</li>
                      <li>Architected production workflows integrating state-of-the-art diffusion and video generation models.</li>
                    </ul>
                  </div>

                  <div class="info-block">
                    <div class="info-block-label">SKILLS</div>
                    <div class="skill-tags">
                      <span class="skill-tag">Creative Direction</span>
                      <span class="skill-tag">AI Filmmaking</span>
                      <span class="skill-tag">Visual Development</span>
                      <span class="skill-tag">Workflow Design</span>
                      <span class="skill-tag">Prompt Architecture</span>
                    </div>
                  </div>

                  <div class="info-block">
                    <div class="info-block-label">TOOLS</div>
                    <div class="tool-tags">
                      <span class="tool-tag">Midjourney</span>
                      <span class="tool-tag">Runway Gen-3</span>
                      <span class="tool-tag">Kling</span>
                      <span class="tool-tag">Pika</span>
                      <span class="tool-tag">ComfyUI</span>
                      <span class="tool-tag">ElevenLabs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. DNEG -->
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

                <div class="expertise-info-grid">
                  <div class="info-block">
                    <div class="info-block-label">WHAT I DID</div>
                    <p class="info-block-intro">Production-focused generative AI work for Hollywood and studio productions:</p>
                    <ul class="info-bullets">
                      <li>Delivered cinematic look-dev for feature projects including Ramayana studio VFX workflows.</li>
                      <li>Built digital human pipelines with identity-preserving node networks across multiple camera angles.</li>
                      <li>Integrated generative assets into professional VFX pipelines using Nuke, ControlNet, and ComfyUI.</li>
                    </ul>
                  </div>

                  <div class="info-block">
                    <div class="info-block-label">SKILLS</div>
                    <div class="skill-tags">
                      <span class="skill-tag">Digital Humans</span>
                      <span class="skill-tag">Identity Preservation</span>
                      <span class="skill-tag">Visual Development</span>
                      <span class="skill-tag">VFX Integration</span>
                    </div>
                  </div>

                  <div class="info-block">
                    <div class="info-block-label">TOOLS</div>
                    <div class="tool-tags">
                      <span class="tool-tag">ComfyUI</span>
                      <span class="tool-tag">Nuke</span>
                      <span class="tool-tag">ControlNet</span>
                      <span class="tool-tag">IP-Adapter</span>
                      <span class="tool-tag">FLUX</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
`;

fs.writeFileSync('scratch/by_the_numbers.html', byTheNumbersHTML);
fs.writeFileSync('scratch/disciplines.html', disciplinesHTML);
fs.writeFileSync('scratch/my_expertise.html', myExpertiseHTML);
console.log('Generated section HTML files successfully.');
