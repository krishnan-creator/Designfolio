const fs = require('fs');

const splashCode = fs.readFileSync('scratch/splash_cursor_clean.js', 'utf8');
const laserCode = fs.readFileSync('scratch/laser_flow_clean.js', 'utf8');

const additionalJs = `
// ============================================================
// LIGHT THEME WATER RIPPLE ENGINE (CANVAS 2D)
// Gentle circular wavefronts expanding and dissipating on calm water
// ============================================================
window.initWaterRipple = function(canvas) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let isActive = true;
  let animId = null;
  const ripples = [];
  const MAX_RIPPLES = 12;

  let lastX = -1000;
  let lastY = -1000;
  let lastTime = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function onPointerMove(e) {
    if (!isActive) return;
    const now = performance.now();
    const x = e.clientX;
    const y = e.clientY;
    const dist = Math.hypot(x - lastX, y - lastY);

    if (dist > 18 && (now - lastTime) > 45) {
      lastTime = now;
      lastX = x;
      lastY = y;

      const speed = Math.min(dist * 0.8, 40);
      if (ripples.length >= MAX_RIPPLES) {
        ripples.shift();
      }
      ripples.push({
        x: x,
        y: y,
        radius: 4.0,
        maxRadius: 36.0 + speed * 0.9,
        alpha: 0.40,
        decay: 0.016 + (speed > 25 ? 0.006 : 0.010),
        lineWidth: 1.6
      });
    }
  }
  window.addEventListener('mousemove', onPointerMove, { passive: true });

  function loop() {
    if (!isActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += (r.maxRadius - r.radius) * 0.11 + 0.6;
      r.alpha -= r.decay;

      if (r.alpha <= 0.01 || r.radius >= r.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      // Outer wave
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(70, 75, 85, ' + (r.alpha * 0.32).toFixed(3) + ')';
      ctx.lineWidth = r.lineWidth;
      ctx.stroke();

      // Soft secondary inner wave
      if (r.radius > 12) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.68, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 105, 115, ' + (r.alpha * 0.18).toFixed(3) + ')';
        ctx.lineWidth = r.lineWidth * 0.8;
        ctx.stroke();
      }
    }

    animId = requestAnimationFrame(loop);
  }
  animId = requestAnimationFrame(loop);

  return {
    destroy: function() {
      isActive = false;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
};

// ============================================================
// VELMAX CATALOG COMPONENT (SPATIAL 3D RING INTERACTION)
// ============================================================
window.initVelmaxCatalog = function() {
  const container = document.getElementById('velmax-catalog-stage');
  const track = document.getElementById('catalog-cards-track');
  const viewport = document.getElementById('catalog-track-viewport');
  const counterEl = document.getElementById('catalog-counter');
  const prevBtn = document.getElementById('catalog-prev-btn');
  const nextBtn = document.getElementById('catalog-next-btn');

  const drawer = document.getElementById('catalog-detail-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerImg = document.getElementById('drawer-card-img');
  const drawerTag = document.getElementById('drawer-index-tag');
  const drawerTitle = document.getElementById('drawer-title');
  const drawerDesc = document.getElementById('drawer-desc');
  const drawerCapsList = document.getElementById('drawer-caps-list');

  if (!container || !track) return;

  const CATALOG_ITEMS = [
    {
      id: "01",
      title: "CREATIVE DIRECTION",
      cat: "VISION & COHESION",
      desc: "Shaping holistic visual aesthetics, high-velocity concept design, stylistic continuity, and reference-driven storytelling from initial brief to executive delivery.",
      image: "Ramayana.png",
      caps: ["Visual Leadership", "Worldbuilding", "Thematic Continuity", "Campaign Vision"]
    },
    {
      id: "02",
      title: "GENERATIVE AI",
      cat: "NEURAL SYNTHESIS",
      desc: "Mastery of cutting-edge neural models, diffusion architectures, transformer models, and continuous integration of state-of-the-art generative tech.",
      image: "portrait-01.png",
      caps: ["Model Fine-Tuning", "LoRA Training", "Multi-Modal Synthesis", "Latent Space Steering"]
    },
    {
      id: "03",
      title: "VISUAL DEVELOPMENT",
      cat: "LOOK-DEV & MOOD",
      desc: "Look-dev, color keys, atmospheric studies, cinematic lighting schemes, and production-ready visual asset libraries for film and original IP worlds.",
      image: "VeerBhadra.png",
      caps: ["Look-Dev", "Lighting Exploration", "Color Scripting", "Mood Architecture"]
    },
    {
      id: "04",
      title: "CINEMATIC STORYTELLING",
      cat: "NARRATIVE PACING",
      desc: "Architecting multi-shot visual sequences, shot continuity, camera movement, dramatic staging, and emotional pacing across cinematic shorts and trailers.",
      image: "dune-dneg.jpg",
      caps: ["Shot Staging", "Camera Direction", "Pacing & Rhythm", "Narrative Arc"]
    },
    {
      id: "05",
      title: "AI IMAGE + VIDEO",
      cat: "PRODUCTION VELOCITY",
      desc: "High-volume generation and animation pipelines across Midjourney, SDXL, Runway Gen-3, Kling, and proprietary diffusion video workflows.",
      image: "landscape-01.jpg",
      caps: ["High-Resolution Stills", "Temporal Coherence", "Cinematic Motion", "Camera Control"]
    },
    {
      id: "06",
      title: "CHARACTER DEVELOPMENT",
      cat: "DIGITAL IDENTITY",
      desc: "Digital human creation, identity preservation across diverse camera angles and lighting, hero archetypes, and expression turnaround sheets.",
      image: "portrait-02.png",
      caps: ["Facial Consistency", "Costume Architecture", "Digital Humans", "Turnaround Sheets"]
    },
    {
      id: "07",
      title: "ENVIRONMENT DESIGN",
      cat: "MONUMENTAL WORLDS",
      desc: "Constructing expansive architectural, natural, and speculative fictional environments with precise atmospheric depth, scale, and material realism.",
      image: "landscape-03.jpg",
      caps: ["Atmospheric Depth", "World Architecture", "Matte Painting", "Horizon Staging"]
    },
    {
      id: "08",
      title: "AI CREATIVE WORKFLOWS",
      cat: "PIPELINE ENGINEERING",
      desc: "Custom ComfyUI node architectures, LoRA model training, IP-Adapter conditioning, ControlNet pipelines, and automated studio post-production integration.",
      image: "landscape-05.jpg",
      caps: ["ComfyUI Pipelines", "Custom Node Graphs", "ControlNet / IP-Adapter", "Studio Integration"]
    },
    {
      id: "09",
      title: "PROMPT ARCHITECTURE",
      cat: "SEMANTIC CODING",
      desc: "Structured, repeatable semantic prompt engineering, negative-space weighting, token calibration, and consistent stylistic encoding.",
      image: "landscape-07.jpg",
      caps: ["Lexical Engineering", "Weight Calibration", "Style Blending", "Deterministic Output"]
    }
  ];

  // Render cards
  track.innerHTML = '';
  CATALOG_ITEMS.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'catalog-card-item' + (index === 0 ? ' is-active' : '');
    card.setAttribute('data-index', index);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', item.title);

    card.innerHTML = \`
      <div class="catalog-card-header">
        <span class="catalog-card-index">DISCIPLINE // \${item.id}</span>
        <span class="catalog-card-dot"></span>
      </div>
      <div class="catalog-card-img-wrap">
        <img src="\${item.image}" alt="\${item.title}">
      </div>
      <div>
        <div class="catalog-card-title">\${item.title}</div>
        <p class="catalog-card-desc">\${item.desc}</p>
      </div>
      <div class="catalog-card-footer">
        <span>\${item.cat}</span>
        <span>VIEW SPEC →</span>
      </div>
    \`;

    card.addEventListener('click', () => {
      if (currentIndex === index) {
        openDetail(index);
      } else {
        goToIndex(index);
      }
    });

    track.appendChild(card);
  });

  const cards = track.querySelectorAll('.catalog-card-item');
  let currentIndex = 0;
  const total = CATALOG_ITEMS.length;

  function updateCardTransforms() {
    cards.forEach((card, i) => {
      let offset = i - currentIndex;
      // Circular wrap around shortest path
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;

      const isCurrent = offset === 0;
      card.classList.toggle('is-active', isCurrent);

      // 3D positioning along curved horizontal arc
      const spacing = 190;
      const tx = offset * spacing;
      const tz = -Math.abs(offset) * 110;
      const ry = -offset * 14;
      const scale = isCurrent ? 1.05 : Math.max(0.72, 1 - Math.abs(offset) * 0.14);
      const opacity = Math.abs(offset) > 3 ? 0 : Math.max(0.25, 1 - Math.abs(offset) * 0.28);
      const zIndex = 20 - Math.abs(offset);

      card.style.transform = \`translate3d(\${tx}px, 0, \${tz}px) rotateY(\${ry}deg) scale(\${scale})\`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = zIndex;
      card.style.pointerEvents = Math.abs(offset) > 2 ? 'none' : 'auto';
    });

    if (counterEl) {
      counterEl.textContent = \`0\${currentIndex + 1} / 0\${total}\`;
    }
  }

  function goToIndex(idx) {
    currentIndex = ((idx % total) + total) % total;
    updateCardTransforms();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goToIndex(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToIndex(currentIndex + 1));

  // Drag interaction
  let isDragging = false;
  let startX = 0;
  let dragDist = 0;

  viewport.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    dragDist = 0;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dragDist = e.clientX - startX;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    if (dragDist < -45) {
      goToIndex(currentIndex + 1);
    } else if (dragDist > 45) {
      goToIndex(currentIndex - 1);
    }
  });

  // Touch support
  let touchStartX = 0;
  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff < -40) goToIndex(currentIndex + 1);
    else if (diff > 40) goToIndex(currentIndex - 1);
  }, { passive: true });

  // Detail Drawer
  function openDetail(index) {
    const item = CATALOG_ITEMS[index];
    if (!item || !drawer) return;

    if (drawerImg) drawerImg.src = item.image;
    if (drawerTag) drawerTag.textContent = \`DISCIPLINE // \${item.id} · \${item.cat}\`;
    if (drawerTitle) drawerTitle.textContent = item.title;
    if (drawerDesc) drawerDesc.textContent = item.desc;

    if (drawerCapsList) {
      drawerCapsList.innerHTML = item.caps.map(c => \`<span class="drawer-cap-pill">\${c}</span>\`).join('');
    }

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDetail() {
    if (drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
    }
  }

  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDetail);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDetail);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) closeDetail();
  });

  updateCardTransforms();
};

// ============================================================
// MASTER THEME & CURSOR COORDINATOR
// Coordinates SplashCursor (Dark), WaterRipple (Light), LaserFlow (Both),
// and Hero Theme Wave Deformation
// ============================================================
window.initMasterThemeAndEffects = function() {
  const laserCanvas = document.getElementById('laser-flow-canvas');
  const splashCanvas = document.getElementById('splash-cursor-canvas');
  const rippleCanvas = document.getElementById('water-ripple-canvas');
  const cursorEl = document.getElementById('section-cursor');

  let splashInstance = null;
  let rippleInstance = null;
  let laserInstance = null;

  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  // 1. Initialize Laser Flow
  if (laserCanvas && window.initLaserFlow) {
    const isLight = getCurrentTheme() === 'light';
    laserInstance = window.initLaserFlow(document.body, laserCanvas, {
      color: isLight ? '#94A3B8' : '#E2E8F0',
      theme: isLight ? 'light' : 'dark',
      intensity: isLight ? 0.65 : 0.85,
      beamWidth: 0.9,
      speed: 1.0,
      paused: false
    });
  }

  // 2. Cursor effects based on theme
  function updateThemeEffects() {
    const theme = getCurrentTheme();

    if (theme === 'dark') {
      // Dark theme: Activate SplashCursor, destroy WaterRipple
      if (rippleInstance) {
        rippleInstance.destroy();
        rippleInstance = null;
      }
      if (rippleCanvas) rippleCanvas.style.display = 'none';

      if (splashCanvas) {
        splashCanvas.style.display = 'block';
        if (!splashInstance && window.initSplashCursor) {
          splashInstance = window.initSplashCursor(splashCanvas, {
            COLOR: '#A855F7',
            RAINBOW_MODE: false,
            DENSITY_DISSIPATION: 3.5,
            VELOCITY_DISSIPATION: 2,
            PRESSURE: 0.1,
            CURL: 3,
            SPLAT_RADIUS: 0.2,
            SPLAT_FORCE: 6000,
            COLOR_UPDATE_SPEED: 10,
            TRANSPARENT: true
          });
        }
      }

      if (laserInstance) {
        laserInstance.update({
          color: '#E2E8F0',
          theme: 'dark',
          intensity: 0.85
        });
      }
    } else {
      // Light theme: Activate WaterRipple, destroy SplashCursor
      if (splashInstance) {
        splashInstance.destroy();
        splashInstance = null;
      }
      if (splashCanvas) splashCanvas.style.display = 'none';

      if (rippleCanvas) {
        rippleCanvas.style.display = 'block';
        if (!rippleInstance && window.initWaterRipple) {
          rippleInstance = window.initWaterRipple(rippleCanvas);
        }
      }

      if (laserInstance) {
        laserInstance.update({
          color: '#94A3B8',
          theme: 'light',
          intensity: 0.65
        });
      }
    }
  }

  // Initial update
  updateThemeEffects();

  // Watch for theme attribute changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.attributeName === 'data-theme') {
        updateThemeEffects();
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // 3. Vector Triangle Pointer tracking
  if (cursorEl) {
    let mouseX = -100;
    let mouseY = -100;
    let isActive = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isActive) {
        isActive = true;
        cursorEl.classList.add('is-active');
      }
      cursorEl.style.transform = 'translate3d(' + mouseX + 'px, ' + mouseY + 'px, 0)';
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      isActive = false;
      cursorEl.classList.remove('is-active');
    });
  }
};
`;

const fullJs = splashCode + '\n' + laserCode + '\n' + additionalJs;
fs.writeFileSync('scratch/new_master_scripts.js', fullJs, 'utf8');
console.log('Saved scratch/new_master_scripts.js! Length:', fullJs.length);
