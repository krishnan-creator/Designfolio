// ============================================================
// 11. SECTION 02 — BY THE NUMBERS & CINEMATIC SHOWCASE ENGINE
// ============================================================
(function initByTheNumbers() {
  // Metric Tile Tap / Click / Keyboard Accordion Expansion
  const tiles = document.querySelectorAll('.number-tile');
  tiles.forEach(tile => {
    tile.addEventListener('click', () => {
      const isExpanded = tile.classList.contains('is-expanded');
      // Collapse others on mobile/clean reading
      tiles.forEach(t => t.classList.remove('is-expanded'));
      if (!isExpanded) {
        tile.classList.add('is-expanded');
      }
    });

    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tile.classList.toggle('is-expanded');
      }
    });
  });

  // Ramayana & Veerabhadra 10-Second Auto-Rotation Showcase
  const rotTabs = document.querySelectorAll('.rot-tab-btn');
  const slides = document.querySelectorAll('.cinematic-slide');
  const badge = document.getElementById('rot-num-badge');
  let currentIdx = 0;
  let showcaseTimer = null;

  function setSlide(idx) {
    currentIdx = idx;
    slides.forEach((s, i) => {
      s.classList.toggle('is-active', i === idx);
    });
    rotTabs.forEach((b, i) => {
      b.classList.toggle('is-active', i === idx);
    });
    if (badge) {
      badge.textContent = `0${idx + 1} / 02`;
    }
    // Restart 10s progress bar
    const pLines = document.querySelectorAll('.tab-progress-line');
    pLines.forEach(pl => {
      pl.style.transition = 'none';
      pl.style.width = '0%';
    });
    const activeLine = document.getElementById(`prog-line-${idx}`);
    if (activeLine) {
      setTimeout(() => {
        activeLine.style.transition = 'width 10s linear';
        activeLine.style.width = '100%';
      }, 50);
    }
  }

  function nextSlide() {
    setSlide((currentIdx + 1) % 2);
  }

  function startShowcaseTimer() {
    clearInterval(showcaseTimer);
    showcaseTimer = setInterval(nextSlide, 10000);
  }

  rotTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
      setSlide(idx);
      startShowcaseTimer();
    });
  });

  // Start initial rotation
  setSlide(0);
  startShowcaseTimer();
})();

// ============================================================
// 12. SECTION 02.5 — DISCIPLINES: NINE-PIECE INTERACTIVE PUZZLE
// ============================================================
(function initDisciplinesPuzzle() {
  const puzzleGroup = document.getElementById('puzzle-pieces-group');
  const pieces = document.querySelectorAll('.puzzle-piece');
  const statusText = document.getElementById('puzzle-status-text');
  const timerBar = document.getElementById('puzzle-timer-bar');
  const detailCard = document.getElementById('puzzle-detail-card');
  const detailTag = document.getElementById('puzzle-detail-tag');
  const detailTitle = document.getElementById('puzzle-detail-title');
  const detailDesc = document.getElementById('puzzle-detail-desc');
  const detailClose = document.getElementById('puzzle-detail-close');

  if (!puzzleGroup || pieces.length === 0) return;

  const DISCIPLINE_DATA = [
    { name: "Creative Direction", desc: "Shaping holistic visual aesthetics, high-velocity concept design, stylistic cohesion, and reference-driven storytelling from initial brief to executive delivery." },
    { name: "Generative AI", desc: "Mastery of cutting-edge neural models, diffusion architectures, transformer models, and continuous integration of state-of-the-art generative tech." },
    { name: "Visual Development", desc: "Look-dev, color keys, atmospheric studies, cinematic lighting, and production-ready visual asset libraries for film and IP worlds." },
    { name: "Cinematic Storytelling", desc: "Crafting multi-shot visual sequences, narrative continuity, dramatic framing, and emotional pacing across cinematic shorts and trailers." },
    { name: "AI Image + Video", desc: "High-volume generation and animation workflows across Midjourney, SDXL, Runway Gen-3, Kling, and custom video pipelines." },
    { name: "Character Development", desc: "Digital human creation, identity preservation across diverse camera angles and lighting, hero design, and full expression turnarounds." },
    { name: "Environment Design", desc: "Monumental worldbuilding, alien and historical architecture, volumetric atmospheric landscapes, and complex sci-fi/mythic environments." },
    { name: "AI Creative Workflows", desc: "Custom ComfyUI node architectures, LoRA model training, IP-Adapter conditioning, ControlNet pipelines, and automated studio pipelines." },
    { name: "Prompt Architecture", desc: "Structured, repeatable semantic prompt engineering, negative-prompt optimization, token weight balancing, and consistent style encoding." }
  ];

  // Separated offsets for each of the 9 pieces (col 0..2, row 0..2)
  const SEPARATED_OFFSETS = [
    { dx: -42, dy: -36 }, // 0: Top-Left
    { dx: 0,   dy: -46 }, // 1: Top-Center
    { dx: 42,  dy: -36 }, // 2: Top-Right
    { dx: -48, dy: 0   }, // 3: Middle-Left
    { dx: 0,   dy: 0, scale: 0.92 }, // 4: Center
    { dx: 48,  dy: 0   }, // 5: Middle-Right
    { dx: -42, dy: 36  }, // 6: Bottom-Left
    { dx: 0,   dy: 46  }, // 7: Bottom-Center
    { dx: 42,  dy: 36  }  // 8: Bottom-Right
  ];

  let isAssembled = false;
  let isPausedByUser = false;
  let loopTimeout = null;
  let holdInterval = null;
  let holdStartTime = 0;
  const HOLD_DURATION_MS = 10000; // Exact 10 seconds hold
  const SEPARATE_HOLD_MS = 2500;  // 2.5s separated pause

  function applySeparatedState() {
    isAssembled = false;
    puzzleGroup.classList.remove('is-assembled');
    puzzleGroup.classList.add('is-separated');
    if (statusText) statusText.textContent = "CYCLE: SEPARATED ARCHITECTURE";
    if (timerBar) {
      timerBar.style.transition = 'none';
      timerBar.style.width = '0%';
    }

    pieces.forEach((piece, idx) => {
      const off = SEPARATED_OFFSETS[idx] || { dx: 0, dy: 0 };
      const s = off.scale !== undefined ? ` scale(${off.scale})` : '';
      piece.style.transform = `translate(${off.dx}px, ${off.dy}px)${s}`;
    });
  }

  function applyAssembledState() {
    isAssembled = true;
    puzzleGroup.classList.remove('is-separated');
    puzzleGroup.classList.add('is-assembled');
    if (statusText) statusText.textContent = "CYCLE: ASSEMBLED LOOK-DEV (HOLD 10s)";

    pieces.forEach(piece => {
      piece.style.transform = `translate(0px, 0px) scale(1)`;
    });

    // Start 10-second hold countdown
    holdStartTime = Date.now();
    if (timerBar) {
      timerBar.style.transition = 'none';
      timerBar.style.width = '0%';
      setTimeout(() => {
        timerBar.style.transition = 'width 10s linear';
        timerBar.style.width = '100%';
      }, 50);
    }
  }

  function scheduleNextCycle() {
    if (isPausedByUser) return;
    clearTimeout(loopTimeout);

    if (isAssembled) {
      // Hold for 10 seconds, then separate
      loopTimeout = setTimeout(() => {
        if (isPausedByUser) return;
        applySeparatedState();
        scheduleNextCycle();
      }, HOLD_DURATION_MS);
    } else {
      // Hold separated state for 2.5s, then assemble
      loopTimeout = setTimeout(() => {
        if (isPausedByUser) return;
        applyAssembledState();
        scheduleNextCycle();
      }, SEPARATE_HOLD_MS);
    }
  }

  // Interactive Piece Selection
  function selectPiece(idx) {
    const data = DISCIPLINE_DATA[idx];
    if (!data) return;

    // Pause loop during user examination
    isPausedByUser = true;
    clearTimeout(loopTimeout);
    if (statusText) statusText.textContent = `INSPECTING // DISCIPLINE 0${idx + 1} (LOOP PAUSED)`;

    pieces.forEach((p, i) => {
      p.classList.toggle('is-selected', i === idx);
    });

    if (detailCard) {
      detailCard.classList.add('is-open');
      detailCard.setAttribute('aria-hidden', 'false');
      if (detailTag) detailTag.textContent = `DISCIPLINE // 0${idx + 1}`;
      if (detailTitle) detailTitle.textContent = data.name.toUpperCase();
      if (detailDesc) detailDesc.textContent = data.desc;
    }
  }

  function closeDetailCard() {
    if (detailCard) {
      detailCard.classList.remove('is-open');
      detailCard.setAttribute('aria-hidden', 'true');
    }
    pieces.forEach(p => p.classList.remove('is-selected'));

    // Resume loop smoothly
    if (isPausedByUser) {
      isPausedByUser = false;
      if (statusText) statusText.textContent = isAssembled ? "CYCLE: ASSEMBLED LOOK-DEV (HOLD 10s)" : "CYCLE: SEPARATED ARCHITECTURE";
      scheduleNextCycle();
    }
  }

  pieces.forEach((piece, idx) => {
    piece.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPiece(idx);
    });

    piece.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPiece(idx);
      }
    });
  });

  if (detailClose) {
    detailClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDetailCard();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPausedByUser) {
      closeDetailCard();
    }
  });

  // Start with separated arrangement, then assemble after initial 1s
  applySeparatedState();
  loopTimeout = setTimeout(() => {
    applyAssembledState();
    scheduleNextCycle();
  }, 1000);
})();
