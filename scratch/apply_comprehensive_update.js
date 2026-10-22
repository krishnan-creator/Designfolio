const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Backup
fs.writeFileSync(path.join(__dirname, '..', 'index.html.bak_before_full'), html);
console.log('Backed up index.html');

// 1. Resume download button text: DOWNLOAD MY RESUME
const oldResumeText = `<span>DOWNLOAD RESUME</span>`;
const newResumeText = `<span>DOWNLOAD MY RESUME</span>`;
if (html.includes(oldResumeText)) {
  html = html.replace(oldResumeText, newResumeText);
  console.log('✅ Updated Resume Button Text to DOWNLOAD MY RESUME');
}

// 2. Replace the entire expertise-list with the clean 4 companies in exact order
// Sequence: DNEG, IMPROMP2LABS, CYBEREDGE, PREMA SAI DESIGNERS
// DNEG with 3 movie chips: RAMAYANA, MASTERS OF THE UNIVERSE, THE ODYSSEY
const expertiseListRegex = /<div class="expertise-list">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<!-- ===================================================\s*04\. MY WORK/i;

const newExpertiseHtml = `<div class="expertise-list">

            <!-- 1. DNEG -->
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
                  <!-- FEATURE FILM PROJECTS -->
                  <div class="info-block">
                    <div class="info-block-label">FEATURE FILM PROJECTS</div>
                    <div class="project-chips-row">
                      <span class="project-chip">RAMAYANA</span>
                      <span class="project-chip">MASTERS OF THE UNIVERSE</span>
                      <span class="project-chip">THE ODYSSEY</span>
                    </div>
                  </div>

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

            <!-- 2. IMPROMP2LABS -->
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

            <!-- 3. CYBEREDGE -->
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

            <!-- 4. PREMA SAI DESIGNERS -->
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

          </div>
        </div>
      </section>

      <!-- ============================================================
           SECTION 04 — MY WORK`;

// Locate start of expertise-list and end before section 04
const expStart = html.indexOf('<div class="expertise-list">');
const myWorkComment = html.indexOf('SECTION 04 — MY WORK', expStart);
if (expStart !== -1 && myWorkComment !== -1) {
  const replaceEnd = html.lastIndexOf('<!-- ============================================================', myWorkComment);
  html = html.substring(0, expStart) + newExpertiseHtml + html.substring(myWorkComment + 'SECTION 04 — MY WORK'.length);
  console.log('✅ Requirement 05: Successfully reordered all 4 career entries & updated DNEG projects');
} else {
  console.warn('⚠️ Could not locate expertise-list slice');
}

// 3. Replace Section 05: A BIT ABOUT ME with THE CORE
const aboutStart = html.indexOf('<section class="about-me-section" id="a-bit-about-me">');
const closingComment = html.indexOf('SECTION 06 — CLOSING CALL', aboutStart);
if (aboutStart !== -1 && closingComment !== -1) {
  const aboutEnd = html.lastIndexOf('<!-- ============================================================', closingComment);
  const theCoreHtml = `<!-- ============================================================
           SECTION 05 — THE CORE (LANYARD 3D PROFILE & CAREER SKILL MAP)
           ============================================================ -->
      <section class="the-core-section" id="the-core">
        <a id="a-bit-about-me" style="display:none;" aria-hidden="true"></a>
        <div class="dbl-section-header">
          <div class="dbl-meta-label">
            <span class="dbl-meta-dot"></span>
            <span>05 / THE CORE · INTERACTIVE PROFILE</span>
          </div>
          <h2 class="dbl-title-main">THE CORE</h2>
          <p class="dbl-subtitle-desc">Interactive 3D lanyard profile, technical arsenal, and the journey behind the practice.</p>
        </div>

        <div class="lanyard-profile-mount-wrap" id="lanyard-profile-mount"></div>
      </section>

      `;
  html = html.substring(0, aboutStart) + theCoreHtml + html.substring(aboutEnd);
  console.log('✅ Requirement 06: Successfully replaced A BIT ABOUT ME with THE CORE');
} else {
  console.warn('⚠️ Could not locate A BIT ABOUT ME section slice');
}

// 4. Update CSS for Visual Orbit, THE CORE, Project Chips, and Opposite Color Button Highlight
const customCssToAdd = `
    /* ============================================================
       THE CORE & CAREER SKILL MAP
       ============================================================ */
    .the-core-section {
      position: relative;
      margin-bottom: clamp(70px, 9vw, 120px);
    }
    .lanyard-profile-mount-wrap {
      width: 100%;
      min-height: 520px;
    }

    /* DNEG FEATURE FILM PROJECT CHIPS */
    .project-chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
    }
    .project-chip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 5px 12px;
      border-radius: 999px;
      background: rgba(220, 38, 38, 0.12);
      border: 1px solid rgba(220, 38, 38, 0.35);
      color: #FF5A5F;
      display: inline-flex;
      align-items: center;
      transition: background-color 0.22s ease, color 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
    }
    [data-theme="light"] .project-chip {
      background: rgba(220, 38, 38, 0.08);
      border-color: rgba(220, 38, 38, 0.25);
      color: #DC2626;
    }

    /* ============================================================
       REQUIREMENT 09 — BUTTON HOVER: HIGHLIGHT PADDING WITH OPPOSITE COLOUR
       ============================================================ */
    .theme-toggle-btn,
    .resume-download-btn,
    .orbit-pill,
    .project-chip,
    .header-tag-pill,
    .drawing-badge,
    .btn-opposite-highlight {
      transition: background-color 0.22s ease, color 0.22s ease, border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease !important;
    }

    /* Dark theme: dark buttons/pills highlight surface & padding into crisp white with deep text */
    [data-theme="dark"] .theme-toggle-btn:hover,
    [data-theme="dark"] .theme-toggle-btn:focus-visible {
      background-color: #FFFFFF !important;
      color: #0E0F12 !important;
      border-color: #FFFFFF !important;
      box-shadow: 0 4px 16px rgba(255, 255, 255, 0.25);
    }
    [data-theme="dark"] .resume-download-btn:hover,
    [data-theme="dark"] .resume-download-btn:focus-visible {
      background-color: #FFFFFF !important;
      color: #0E0F12 !important;
      border-color: #FFFFFF !important;
      box-shadow: 0 6px 20px rgba(255, 255, 255, 0.22);
    }
    [data-theme="dark"] .orbit-pill:hover,
    [data-theme="dark"] .orbit-pill:focus-visible {
      background-color: #FFFFFF !important;
      color: #0E0F12 !important;
      border-color: #FFFFFF !important;
    }
    [data-theme="dark"] .project-chip:hover,
    [data-theme="dark"] .project-chip:focus-visible {
      background-color: #FFFFFF !important;
      color: #0E0F12 !important;
      border-color: #FFFFFF !important;
    }

    /* Light theme: light buttons/pills highlight surface & padding into dark graphite with crisp white text */
    [data-theme="light"] .theme-toggle-btn:hover,
    [data-theme="light"] .theme-toggle-btn:focus-visible {
      background-color: #141518 !important;
      color: #FFFFFF !important;
      border-color: #141518 !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }
    [data-theme="light"] .resume-download-btn:hover,
    [data-theme="light"] .resume-download-btn:focus-visible {
      background-color: #141518 !important;
      color: #FFFFFF !important;
      border-color: #141518 !important;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }
    [data-theme="light"] .orbit-pill:hover,
    [data-theme="light"] .orbit-pill:focus-visible {
      background-color: #141518 !important;
      color: #FFFFFF !important;
      border-color: #141518 !important;
    }
    [data-theme="light"] .project-chip:hover,
    [data-theme="light"] .project-chip:focus-visible {
      background-color: #141518 !important;
      color: #FFFFFF !important;
      border-color: #141518 !important;
    }

    /* Visual Orbit Light Theme: strictly zero rectangular frame, vignette, or blue cast */
    [data-theme="light"] .visual-orbit-section,
    [data-theme="light"] .visual-orbit-container,
    [data-theme="light"] #visual-orbit-gallery-wrap,
    [data-theme="light"] #dome-gallery-mount,
    [data-theme="light"] .sphere-root,
    [data-theme="light"] .sphere-main,
    [data-theme="light"] .stage {
      border: none !important;
      background: transparent !important;
      box-shadow: none !important;
      outline: none !important;
    }
`;

// Inject into style tag right before </style>
html = html.replace('</style>', `${customCssToAdd}\n  </style>`);
console.log('✅ Injected custom CSS rules');

fs.writeFileSync(htmlPath, html);
console.log('Finished updating index.html');
