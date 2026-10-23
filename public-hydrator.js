/**
 * CBK DESIGNFOLIO — Authoritative Public Content Hydrator
 * Hydrates public DOM from /api/content while preserving all custom animations,
 * 3D lanyard physics, scroll stacks, and visual interactions.
 */

(function () {
  'use strict';

  let currentContent = null;

  async function fetchContent() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isPreview = urlParams.get('preview') === 'true';
      const endpoint = isPreview ? '/api/content?draft=true' : '/api/content';

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('API responded with ' + res.status);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn('[CBK Hydrator] Could not fetch remote content, using embedded fallback:', err);
    }
    return null;
  }

  function hydrateHero(section) {
    if (!section || !section.content) return;
    const heroSec = document.getElementById('hero') || document.querySelector('section.hero');
    if (heroSec) {
      if (section.visible === false) {
        heroSec.style.display = 'none';
        return;
      } else {
        heroSec.style.display = '';
      }
    }
    const c = section.content;

    // Quote text
    const quoteEl = document.getElementById('quote-text');
    if (quoteEl && c.quote) quoteEl.textContent = c.quote;
    const bracketEl = document.getElementById('q-bracket');
    if (bracketEl && c.quoteBracket) bracketEl.textContent = c.quoteBracket;

    // Sticky Note badge / artwork / paper / pin
    const stickyEl = document.getElementById('hero-sticky-note');
    if (stickyEl) {
      stickyEl.style.display = c.stickyNote?.visible === false ? 'none' : '';
    }
    if (c.stickyNote) {
      const stampEl = document.getElementById('sticky-stamp');
      if (stampEl) {
        if (c.stickyNote.badge) stampEl.setAttribute('aria-label', c.stickyNote.badge);
        const img = stampEl.querySelector('.sticky-stamp-img');
        if (img && c.stickyNote.image) img.src = c.stickyNote.image;
      }
      if (c.stickyNote.paperImage) {
        const paperImg = document.querySelector('#hero-sticky-note .sticky-paper-img');
        if (paperImg) paperImg.src = c.stickyNote.paperImage;
      }
      if (c.stickyNote.pinImage) {
        const pinImg = document.querySelector('#hero-push-pin .push-pin-img');
        if (pinImg) pinImg.src = c.stickyNote.pinImage;
      }
    }

    // Resume button
    const resumeBtn = document.getElementById('hero-resume-download');
    if (resumeBtn) {
      resumeBtn.style.display = c.resumeButton?.visible === false ? 'none' : '';
      if (c.resumeButtonLabel) {
        const span = resumeBtn.querySelector('span');
        if (span) span.textContent = c.resumeButtonLabel;
      }
      if (c.resumeUrl) {
        resumeBtn.setAttribute('href', c.resumeUrl);
      }
    }

    // Scroll Down widget
    const scrollWidget = document.getElementById('scroll-widget');
    if (scrollWidget) {
      scrollWidget.style.display = c.scrollDownWidget?.visible === false ? 'none' : '';
      const label = scrollWidget.querySelector('.sd-label');
      const sub = scrollWidget.querySelector('.sd-sub');
      if (label && c.scrollDownLabel) label.textContent = c.scrollDownLabel;
      if (sub && c.scrollDownSub) sub.textContent = c.scrollDownSub;
    }

    // Hero ticker wrap
    const tickerWrap = document.querySelector('.hero-ticker-wrap');
    if (tickerWrap) {
      tickerWrap.style.display = c.ticker?.visible === false ? 'none' : '';
    }

    // Hero ticker text (if defined directly on hero)
    if (c.tickerText) {
      renderHeroTickerContent(c.tickerText);
    }

    // Hero EXR snap audio configuration
    if (c.audio || (section.config && section.config.audio)) {
      const audioConfig = c.audio || section.config.audio;
      window.__HERO_AUDIO__ = {
        src: audioConfig.src || 'snap.mpeg',
        startFrame: Number(audioConfig.startFrame) || 100,
        endFrame: Number(audioConfig.endFrame) || 124,
        enabled: audioConfig.enabled !== false
      };
      if (typeof window.updateHeroAudioConfig === 'function') {
        window.updateHeroAudioConfig(window.__HERO_AUDIO__);
      }
    }
  }

  function renderHeroTickerContent(rawTextOrItems, separatorChar) {
    const separator = separatorChar || '·';
    let items = [];
    if (typeof rawTextOrItems === 'string') {
      const sep = rawTextOrItems.includes('·') ? '·' : (rawTextOrItems.includes('•') ? '•' : '·');
      items = rawTextOrItems.split(sep).map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(rawTextOrItems)) {
      items = rawTextOrItems.map(s => String(s).trim()).filter(Boolean);
    }
    if (!items.length) return;

    const sequences = document.querySelectorAll('.hero-ticker-wrap .ticker-sequence');
    sequences.forEach(seq => {
      let html = '';
      items.forEach(item => {
        html += `<span>${escapeHtml(item)}</span><span class="ticker-dot">${escapeHtml(separator)}</span>`;
      });
      seq.innerHTML = html;
    });
  }

  function hydrateTicker(section) {
    if (!section) return;
    const tickerWrap = document.querySelector('.hero-ticker-wrap');
    if (tickerWrap) {
      if (section.visible === false) {
        tickerWrap.style.display = 'none';
        return;
      } else {
        tickerWrap.style.display = '';
      }
    }
    if (!section.content) return;
    const c = section.content;
    const raw = c.tickerText || c.items;
    if (raw) {
      renderHeroTickerContent(raw, section.config?.separator || '·');
    }
  }

  function hydrateNumbers(section) {
    if (!section || !section.content) return;
    const secEl = document.getElementById('by-the-numbers');
    if (!secEl) return;

    if (section.visible === false) {
      secEl.style.display = 'none';
      return;
    } else {
      secEl.style.display = '';
    }

    const c = section.content;
    const metaLabel = secEl.querySelector('.dbl-meta-label span:last-child');
    if (metaLabel && c.metaLabel) metaLabel.textContent = c.metaLabel;
    const title = secEl.querySelector('.dbl-title-main');
    if (title && c.title) title.textContent = c.title;
    const desc = secEl.querySelector('.dbl-subtitle-desc');
    if (desc && c.subtitle) desc.textContent = c.subtitle;

    const grid = secEl.querySelector('.numbers-editorial-grid');
    if (grid) {
      const visibleItems = (c.items || []).filter(item => item.visible !== false);
      if (visibleItems.length === 0) {
        grid.innerHTML = '';
      } else {
        grid.style.gridTemplateColumns = '';
        grid.innerHTML = visibleItems.map(item => `
          <div class="number-tile ${item.featured ? 'number-tile-featured' : ''}" tabindex="0" role="region" aria-label="${escapeHtml(item.value + (item.suffix || '') + ' ' + item.label)}">
            <div class="number-tile-header">
              <span class="number-cat">${escapeHtml(item.category || '')}</span>
              <span class="number-accent-dot"></span>
            </div>
            <div class="number-val">${escapeHtml(item.value || '')}<span class="plus-sym">${escapeHtml(item.suffix || '')}</span></div>
            <div class="number-label">${escapeHtml(item.label || '')}</div>
            <div class="number-expand-desc">
              <p>${escapeHtml(item.description || '')}</p>
            </div>
          </div>
        `).join('');
      }
    }
  }

  function hydrateBeyondTheFrame(section) {
    if (!section || !section.content) return;
    const secEl = document.getElementById('beyond-the-frame-zone');
    if (!secEl) return;

    if (section.visible === false) {
      secEl.style.display = 'none';
      return;
    } else {
      secEl.style.display = '';
    }

    const c = section.content;
    const meta = secEl.querySelector('.beyond-frame-meta span:last-child');
    if (meta && c.metaLabel) meta.textContent = c.metaLabel;
    const title = secEl.querySelector('.beyond-frame-title');
    if (title && c.title) title.textContent = c.title;
    const desc = secEl.querySelector('.beyond-frame-description');
    if (desc && c.description) desc.textContent = c.description;

    // Hydrate continuous Beyond the Frame marquee wordmark ticker
    const tickerStream = secEl.querySelector('.beyond-frame-wordmark-stream');
    if (tickerStream && (c.tickerText || c.wordmark)) {
      const rawText = (c.tickerText || c.wordmark || 'BEYOND THE FRAME').trim();
      let phrases = [];
      if (rawText.includes('✦')) {
        phrases = rawText.split('✦').map(s => s.trim()).filter(Boolean);
      } else if (rawText.includes('·')) {
        phrases = rawText.split('·').map(s => s.trim()).filter(Boolean);
      } else {
        phrases = [rawText];
      }
      let fullItems = [];
      while (fullItems.length < 4) {
        fullItems.push(...phrases);
      }
      const groupHtml = fullItems.map(p => `
        <span class="beyond-frame-wordmark-item">${escapeHtml(p)}</span>
        <span class="beyond-frame-wordmark-sep" aria-hidden="true">✦</span>
      `).join('');

      tickerStream.innerHTML = `
        <div class="beyond-frame-wordmark-group" aria-hidden="false">
          ${groupHtml}
        </div>
        <div class="beyond-frame-wordmark-group" aria-hidden="true">
          ${groupHtml}
        </div>
      `;
    }

    // Hydrate cinematic entries
    if (Array.isArray(c.entries)) {
      const activeEntries = c.entries.filter(e => e.visible !== false);
      if (typeof window.updateBeyondTheFrame === 'function') {
        window.updateBeyondTheFrame(activeEntries);
      } else {
        window.__beyondFrameCustomEntries = activeEntries;
        if (window.beyondFrameInstance && typeof window.beyondFrameInstance.update === 'function') {
          window.beyondFrameInstance.update({
            entries: activeEntries
          });
        }
      }
    }
  }

  function hydrateSelectedWorks(section) {
    if (!section || !section.content) return;
    const secEl = document.getElementById('selected-works');
    if (!secEl) return;

    if (section.visible === false) {
      secEl.style.display = 'none';
      return;
    } else {
      secEl.style.display = '';
    }

    const c = section.content;
    const meta = secEl.querySelector('.dbl-meta-label span:last-child');
    if (meta && c.metaLabel) meta.textContent = c.metaLabel;
    const title = secEl.querySelector('.dbl-title-main');
    if (title && c.title) title.textContent = c.title;
    const desc = secEl.querySelector('.dbl-subtitle-desc');
    if (desc && c.subtitle) desc.textContent = c.subtitle;

    const row1 = document.getElementById('works-row-1');
    const expandedArea = document.getElementById('works-expanded-area');

    // Render landscape projects
    if (Array.isArray(c.landscapeProjects)) {
      const visibleProjects = c.landscapeProjects.filter(p => p.visible !== false);

      if (row1) {
        const initial = visibleProjects.slice(0, 2);
        row1.innerHTML = initial.map(renderLandscapeCard).join('');
      }

      if (expandedArea) {
        let rowsHtml = '';
        if (visibleProjects.length > 2) {
          const remaining = visibleProjects.slice(2);
          for (let i = 0; i < remaining.length; i += 2) {
            const pair = remaining.slice(i, i + 2);
            rowsHtml += `<div class="works-landscape-row">${pair.map(renderLandscapeCard).join('')}</div>`;
          }
        }

        // Render portrait reels if present
        if (Array.isArray(c.portraitReels) && c.portraitReels.length > 0) {
          const reels = c.portraitReels.filter(r => r.visible !== false);
          rowsHtml += `
            <div class="works-reels-row">
              ${reels.map(renderReelCard).join('')}
            </div>
          `;
        }

        expandedArea.innerHTML = rowsHtml;
      }
    }

    attachWorksHoverListeners();
  }

  function attachWorksHoverListeners() {
    const cards = document.querySelectorAll('.works-card');
    cards.forEach(card => {
      if (card.__hoverAttached) return;
      card.__hoverAttached = true;
      const video = card.querySelector('video.works-card-media-video');
      if (!video) return;

      card.addEventListener('mouseenter', () => {
        video.muted = true;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      });

      card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    });
  }
  window.attachWorksHoverListeners = attachWorksHoverListeners;

  function renderLandscapeCard(p) {
    const src = p.image || '';
    const isVideo = src.endsWith('.mp4') || src.endsWith('.webm');
    const poster = p.poster || '';
    const posterAttr = poster ? `poster="${escapeHtml(poster)}"` : '';
    const badgeText = p.badge || (p.category && p.year ? `${p.category} // ${p.year}` : 'INDEPENDENT IP // 2026');
    const mediaTag = isVideo
      ? `<video src="${escapeHtml(src)}" ${posterAttr} preload="none" loop muted playsinline class="works-card-media-video"></video>`
      : `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.title || '')}" loading="lazy">`;

    return `
      <div class="works-card works-card-landscape" 
           data-video-src="${escapeHtml(src)}" 
           data-video-title="${escapeHtml(p.title || '')}" 
           data-video-poster="${escapeHtml(poster)}"
           onclick="openCinematicLightbox(this)">
        <div class="works-media-wrap">
          ${mediaTag}
          <div class="works-play-overlay">
            <div class="works-play-btn" aria-label="Play Video">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
          </div>
          <span class="film-meta-badge">${escapeHtml(badgeText)}</span>
        </div>
        <div class="works-card-body">
          <h3 class="works-title">${escapeHtml(p.title || '')}</h3>
          <div class="works-summary">${escapeHtml(p.summary || '')}</div>
          <p class="works-desc">${escapeHtml(p.description || '')}</p>
        </div>
      </div>
    `;
  }

  function renderReelCard(r) {
    const src = r.image || '';
    const isVideo = src.endsWith('.mp4') || src.endsWith('.webm');
    const poster = r.poster || '';
    const posterAttr = poster ? `poster="${escapeHtml(poster)}"` : '';
    const badgeText = r.badge || (r.category && r.year ? `${r.category} // ${r.year}` : 'COMMERCIAL AD // 2025');
    const mediaTag = isVideo
      ? `<video src="${escapeHtml(src)}" ${posterAttr} preload="none" loop muted playsinline class="works-card-media-video"></video>`
      : `<img src="${escapeHtml(src)}" alt="${escapeHtml(r.title || '')}" loading="lazy">`;

    return `
      <div class="works-card works-card-reel" 
           data-video-src="${escapeHtml(src)}" 
           data-video-title="${escapeHtml(r.title || '')}" 
           data-video-poster="${escapeHtml(poster)}"
           onclick="openCinematicLightbox(this)">
        <div class="works-media-wrap">
          ${mediaTag}
          <div class="works-play-overlay">
            <div class="works-play-btn" aria-label="Play Reel">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
          </div>
          <span class="film-meta-badge">${escapeHtml(badgeText)}</span>
        </div>
        <div class="works-card-body">
          <h3 class="works-title">${escapeHtml(r.title || '')}</h3>
          <div class="works-summary">${escapeHtml(r.summary || '')}</div>
          <p class="works-desc">${escapeHtml(r.description || '')}</p>
        </div>
      </div>
    `;
  }

  function hydrateVisualOrbit(section) {
    if (!section || !section.content) return;
    const secEl = document.getElementById('visual-orbit');
    if (!secEl) return;

    if (section.visible === false) {
      secEl.style.display = 'none';
      return;
    } else {
      secEl.style.display = '';
    }

    const c = section.content;
    const meta = secEl.querySelector('.dbl-meta-label span:last-child');
    if (meta && c.metaLabel) meta.textContent = c.metaLabel;
    const title = secEl.querySelector('.dbl-title-main');
    if (title && c.title) title.textContent = c.title;
    const desc = secEl.querySelector('.dbl-subtitle-desc');
    if (desc && c.subtitle) desc.textContent = c.subtitle;

    // Collect 40 unique orbital slots from content.slots, content.images, or content.tiles
    let rawSlots = [];
    if (Array.isArray(c.slots) && c.slots.length > 0) {
      rawSlots = c.slots;
    } else if (Array.isArray(c.images) && c.images.length > 0) {
      rawSlots = c.images;
    } else if (Array.isArray(c.tiles) && c.tiles.length > 0) {
      rawSlots = c.tiles;
    }

    const CANONICAL_ORBIT_FALLBACKS = [
      '1.webp', '6.webp', '3__1_.webp', '8__5_.webp', '5__1_.webp', '6__1_.webp',
      '7__1_.webp', '8__1_.jpeg', '1__1_.png', '2__2_.webp', '3__2_.webp', '6__4_.webp',
      '5__2_.webp', '6__2_.webp', '7__2_.webp', '8__2_.webp', '1__2_.webp', '2__3_.webp',
      '3__3_.webp', '4__3_.webp', '5__3_.webp', '6__3_.webp', '7__3_.webp', '8__1_.webp',
      '1__3_.webp', '2__4_.webp', '3__4_.webp', '4__4_.webp', '5__4_.webp', '6__5_.webp',
      '7__4_.webp', '8__3_.webp', '1__4_.webp', '2__5_.webp', '3__5_.webp', '4__5_.webp',
      '1__1_.webp', '4__2_.webp', '8__4_.webp', '4__1_.webp'
    ];

    const primarySlots = Array.from({ length: 40 }, (_, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const stableId = `orbit-${num}`;
      const item = rawSlots[idx] || rawSlots.find?.(s => s && (s.id === stableId || s.slot === num));
      let src = (item?.image || item?.src || '').trim();
      if (!src) src = CANONICAL_ORBIT_FALLBACKS[idx] || '1.webp';
      const alt = item?.alt && !item.alt.includes('Empty slot') ? item.alt : `Visual Orbit Asset ${num}`;
      return {
        id: item?.id || stableId,
        slotNumber: num,
        src: src,
        alt: alt,
        visible: item?.visible !== false
      };
    });

    const extraSlots = [];
    if (rawSlots.length > 40) {
      for (let i = 40; i < Math.min(rawSlots.length, 48); i++) {
        const item = rawSlots[i];
        const src = (item?.image || item?.src || '').trim();
        if (src) {
          const num = String(i + 1).padStart(2, '0');
          extraSlots.push({
            id: item.id || `orbit-${num}`,
            slotNumber: num,
            src: src,
            alt: item.alt || `Visual Orbit Asset ${num}`,
            visible: item?.visible !== false
          });
        }
      }
    }

    const publicSlots = [...primarySlots, ...extraSlots];

    if (typeof window.updateVisualOrbitImages === 'function') {
      window.updateVisualOrbitImages(publicSlots);
    } else if (window.domeGalleryInstance && typeof window.domeGalleryInstance.update === 'function') {
      window.domeGalleryInstance.update({ images: publicSlots });
    } else {
      window.__visualOrbitCustomImages = publicSlots;
    }
  }

  function hydrateExpertise(section) {
    if (!section || !section.content) return;
    const secEl = document.getElementById('my-expertise');
    if (!secEl) return;

    if (section.visible === false) {
      secEl.style.display = 'none';
      return;
    } else {
      secEl.style.display = '';
    }

    const c = section.content;
    const meta = secEl.querySelector('.dbl-meta-label span:last-child');
    if (meta && c.metaLabel) meta.textContent = c.metaLabel;
    const title = secEl.querySelector('.dbl-title-main');
    if (title && c.title) title.textContent = c.title;
    const desc = secEl.querySelector('.dbl-subtitle-desc');
    if (desc && c.subtitle) desc.textContent = c.subtitle;

    if (Array.isArray(c.companies)) {
      const allDomRows = secEl.querySelectorAll('.expertise-list .expertise-row');
      // Hide any DOM rows that were permanently deleted from c.companies
      allDomRows.forEach(row => {
        const match = c.companies.find(comp => comp.id === row.id || (comp.id === 'exp-impromp2labs' && row.id === 'exp-impromp2'));
        if (!match || match.visible === false) {
          row.style.display = 'none';
        }
      });

      const rows = allDomRows;
      c.companies.forEach((comp, idx) => {
        let row = document.getElementById(comp.id);
        if (!row && comp.id === 'exp-impromp2labs') {
          row = document.getElementById('exp-impromp2');
        }
        if (!row && rows[idx]) {
          row = rows[idx];
        }
        if (!row) return;

        if (comp.visible === false) {
          row.style.display = 'none';
          return;
        } else {
          row.style.display = '';
        }

        const heading = row.querySelector('.company-heading');
        if (heading && comp.name) {
          heading.textContent = comp.name;
        }

        const logoSlot = row.querySelector('.company-logo-slot');
        if (logoSlot) {
          if (comp.showLogo === false) {
            logoSlot.style.display = 'none';
          } else {
            logoSlot.style.display = '';
            if (comp.logo && String(comp.logo).trim()) {
              logoSlot.innerHTML = `<img src="${escapeHtml(comp.logo)}" alt="${escapeHtml(comp.name)} Logo" class="company-logo-img">`;
              logoSlot.classList.add('has-logo');
            } else {
              logoSlot.classList.remove('has-logo');
              logoSlot.innerHTML = `
                <div class="logo-slot-inner">
                  <span class="logo-slot-badge">LOGO</span>
                  <span class="logo-slot-name">${escapeHtml(comp.name ? comp.name.split(' ')[0] : '')}</span>
                </div>
              `;
            }
          }
        }

        const roleTag = row.querySelector('.company-role-tag');
        if (roleTag && comp.role) {
          roleTag.textContent = comp.role;
        }

        const datePill = row.querySelector('.comp-date-pill');
        if (datePill && comp.dates) {
          datePill.textContent = comp.dates;
        }

        const locPill = row.querySelector('.comp-loc-pill');
        if (locPill && comp.location) {
          locPill.textContent = comp.location;
        }

        const intro = row.querySelector('.info-block-intro');
        if (intro && comp.intro !== undefined) {
          intro.textContent = comp.intro;
        }

        const bulletsList = row.querySelector('.info-bullets');
        if (bulletsList && Array.isArray(comp.bullets)) {
          bulletsList.innerHTML = comp.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('');
        }

        const skillsWrap = row.querySelector('.skill-tags');
        if (skillsWrap && Array.isArray(comp.skills)) {
          skillsWrap.innerHTML = comp.skills.map(s => `<span class="skill-tag" tabindex="0">${escapeHtml(s)}</span>`).join('');
        }

        const toolsWrap = row.querySelector('.tool-tags');
        if (toolsWrap && Array.isArray(comp.tools)) {
          toolsWrap.innerHTML = comp.tools.map(t => `<span class="tool-tag" tabindex="0">${escapeHtml(t)}</span>`).join('');
        }

        let mediaRow = row.querySelector('.expertise-media-row');
        const hasSlots = Array.isArray(comp.mediaSlots) && comp.mediaSlots.length > 0;

        if (hasSlots) {
          if (!mediaRow) {
            mediaRow = document.createElement('div');
            const contentCol = row.querySelector('.expertise-content-col') || row;
            contentCol.appendChild(mediaRow);
          }
          mediaRow.style.display = '';
          mediaRow.className = `expertise-media-row expertise-media-row--${comp.mediaSlots.length}`;
          mediaRow.innerHTML = comp.mediaSlots.map((m, mIdx) => {
            const badge = m.badge || `[◈] ${String(mIdx + 1).padStart(2, '0')} / ${m.title || 'SHOWCASE'}`;
            const src = m.image || '';
            const isVideo = src.endsWith('.mp4') || src.endsWith('.webm');
            const mediaTag = isVideo
              ? `<video src="${escapeHtml(src)}" autoplay loop muted playsinline class="expertise-media-img"></video>`
              : `<img src="${escapeHtml(src)}" alt="${escapeHtml(m.title || '')}" class="expertise-media-img" loading="lazy">`;

            return `
              <div class="expertise-media-slot" tabindex="0">
                <div class="expertise-media-frame">
                  ${mediaTag}
                  <div class="expertise-media-overlay">
                    <span class="expertise-media-badge">${escapeHtml(badge)}</span>
                  </div>
                </div>
                <div class="expertise-media-caption">
                  <span class="expertise-media-title">${escapeHtml(m.title || '')}</span>
                  <span class="expertise-media-meta">${escapeHtml(m.meta || '')}</span>
                </div>
              </div>
            `;
          }).join('');
        } else if (mediaRow) {
          mediaRow.style.display = 'none';
          mediaRow.innerHTML = '';
        }
      });
    }
  }

  function hydrateCoreAndHobbies(coreSection) {
    if (!coreSection || !coreSection.content) return;
    const coreEl = document.getElementById('the-core');
    if (!coreEl) return;

    if (coreSection.visible === false) {
      coreEl.style.display = 'none';
    } else {
      coreEl.style.display = '';
    }

    const c = coreSection.content;
    const meta = coreEl.querySelector('.dbl-meta-label span:last-child');
    if (meta && c.metaLabel) meta.textContent = c.metaLabel;
    const title = coreEl.querySelector('.dbl-title-main');
    if (title && c.title) title.textContent = c.title;
    const desc = coreEl.querySelector('.dbl-subtitle-desc');
    if (desc && c.subtitle) desc.textContent = c.subtitle;

    const lanyardMount = document.getElementById('lanyard-profile-mount');
    if (lanyardMount) {
      lanyardMount.style.display = c.lanyardProfile?.visible === false ? 'none' : '';
    }

    // Update Lanyard instance props if alive
    if (window.lanyardInstance && typeof window.lanyardInstance.update === 'function') {
      window.lanyardInstance.update({
        frontImage: c.idCard?.frontImage || 'ID Front(6).png',
        backImage: c.idCard?.backImage || 'ID Back(1).png',
        strapImage: c.idCard?.strapImage || 'ID tag(1).png',
        dragInstructionText: c.idCard?.dragInstructionText || 'TAP & DRAG THE ID',
        name: c.profileName || 'C. BALA KRISHNAN',
        badge: c.metaLabel || '05 / THE CORE // IDENTITY & PRACTICE',
        foundations: c.foundations,
        creativeSkills: c.creativeSkills,
        careerStages: c.careerStages
      });
    }

    // STRICT REQUIREMENT: HOBBIES AS CHILD OF THE CORE
    const hobbiesChild = (coreSection.children || []).find(ch => ch.type === 'hobbies');
    const hobbiesEl = document.getElementById('hobbies-archive');
    if (hobbiesEl && hobbiesChild && hobbiesChild.content) {
      if (hobbiesChild.visible === false) {
        hobbiesEl.style.display = 'none';
        return;
      } else {
        hobbiesEl.style.display = '';
      }

      const hc = hobbiesChild.content;
      const hTitle = hobbiesEl.querySelector('.hobbies-compact-title');
      if (hTitle) hTitle.textContent = hc.title || 'OFF THE CLOCK';

      const hMeta = hobbiesEl.querySelector('.hobbies-compact-header .dbl-meta-label span:last-child');
      if (hMeta && hc.metaLabel) {
        hMeta.textContent = hc.metaLabel.replace('OFF THE CLOCK', '').replace('HOBBIES', '').trim();
      }

      const subTag = hobbiesEl.querySelector('.hobbies-subtitle-tag');
      if (subTag) {
        subTag.textContent = hc.subtitle || 'Beyond the work. Into the worlds that shape me.';
      }

      // Collect 12 slots (hobby-01 through hobby-12)
      let rawSlots = [];
      if (Array.isArray(hc.slots) && hc.slots.length > 0) {
        rawSlots = hc.slots;
      } else if (Array.isArray(hc.items) && hc.items.length > 0) {
        rawSlots = hc.items;
      } else if (Array.isArray(hc.cards) && hc.cards.length > 0) {
        rawSlots = hc.cards;
      }

      const full12Slots = Array.from({ length: 12 }, (_, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const stableId = `hobby-${num}`;
        const item = rawSlots[idx] || rawSlots.find?.(s => s && (s.id === stableId || s.slot === num || s.slotNumber === num));
        const src = (item?.image || item?.src || '').trim();
        return {
          id: item?.id || stableId,
          slotNumber: num,
          src: src,
          image: src,
          alt: item?.alt || (src ? `Hobby ${num}` : `Empty slot ${num}`),
          title: item?.title || `Hobby ${num}`,
          subtitle: item?.subtitle || item?.description || '',
          description: item?.description || item?.subtitle || '',
          visible: (item && item.visible !== undefined) ? (item.visible !== false) : true
        };
      });

      if (typeof window.updateHobbiesItems === 'function') {
        window.updateHobbiesItems(full12Slots);
      } else if (window.elasticReelInstance && typeof window.elasticReelInstance.update === 'function') {
        window.elasticReelInstance.update({ items: full12Slots });
      } else {
        window.__hobbiesCustomItems = full12Slots;
      }
    }
  }

  function hydrateCTA(section) {
    if (!section || !section.content) return;
    const secEl = document.getElementById('lets-build');
    if (!secEl) return;

    if (section.visible === false) {
      secEl.style.display = 'none';
      return;
    } else {
      secEl.style.display = '';
    }

    const c = section.content;
    const eyebrow = secEl.querySelector('.dbl-meta-label span:last-child');
    if (eyebrow && c.eyebrow) eyebrow.textContent = c.eyebrow;

    const hLines = secEl.querySelectorAll('.build-headline-line');
    if (hLines.length >= 2) {
      if (c.headlineLine1) hLines[0].textContent = c.headlineLine1;
      if (c.headlineLine2) hLines[1].textContent = c.headlineLine2;
    }

    const slash = secEl.querySelector('.build-headline-accent-slash');
    if (slash && c.accentSlash) slash.textContent = c.accentSlash;

    const statement = secEl.querySelector('.build-statement');
    if (statement && c.statement) {
      const text = c.statement;
      if (text.includes("resonates,") && (text.includes("let’s connect") || text.includes("let's connect"))) {
        const parts = text.split(/(?=let[’']s connect)/i);
        if (parts.length === 2) {
          statement.innerHTML = `${escapeHtml(parts[0])}<br class="statement-desktop-break"> ${escapeHtml(parts[1])}`;
        } else {
          statement.textContent = text;
        }
      } else if (text.includes("I'd") || text.includes("I’d")) {
        const parts = text.split(/(?=I['’]d)/);
        if (parts.length === 2) {
          statement.innerHTML = `${escapeHtml(parts[0])}<span class="statement-break">${escapeHtml(parts[1])}</span>`;
        } else {
          statement.textContent = text;
        }
      } else {
        statement.textContent = text;
      }
    }

    // Primary CTA Button (LET'S CONNECT / Form submit button)
    const primaryBtn = secEl.querySelector('.build-btn-primary') || document.getElementById('contact-submit-btn');
    if (primaryBtn) {
      if (c.primaryButton?.visible === false) {
        primaryBtn.style.display = 'none';
      } else {
        primaryBtn.style.display = '';
      }
      if (c.primaryButton?.label) {
        const span = primaryBtn.querySelector('span') || document.getElementById('contact-btn-label');
        if (span) span.textContent = c.primaryButton.label;
      }
    }

    // WhatsApp Button
    const waBtn = secEl.querySelector('.build-btn-whatsapp');
    if (waBtn) {
      if (c.whatsappButton?.visible === false) {
        waBtn.style.display = 'none';
      } else {
        waBtn.style.display = '';
      }
      if (c.whatsappButton?.url) waBtn.setAttribute('href', c.whatsappButton.url);
      if (c.whatsappButton?.label) {
        const span = waBtn.querySelector('span');
        if (span) span.textContent = c.whatsappButton.label;
      }
    }

    // LinkedIn Button
    const liBtn = secEl.querySelector('.build-btn-linkedin');
    if (liBtn) {
      if (c.linkedinButton?.visible === false) {
        liBtn.style.display = 'none';
      } else {
        liBtn.style.display = '';
      }
      if (c.linkedinButton?.url) liBtn.setAttribute('href', c.linkedinButton.url);
      if (c.linkedinButton?.label) {
        const span = liBtn.querySelector('span');
        if (span) span.textContent = c.linkedinButton.label;
      }
    }
  }

  function renderDynamicSection(section) {
    if (!section) return;
    let secEl = document.getElementById(section.id);
    if (!secEl) {
      secEl = document.createElement('section');
      secEl.id = section.id;
      secEl.className = 'custom-cms-section dbl-section-wrap';

      const container = document.querySelector('.dbl-content-container') || document.body;
      const ctaSection = document.getElementById('lets-build');
      if (ctaSection && ctaSection.parentNode === container) {
        container.insertBefore(secEl, ctaSection);
      } else {
        container.appendChild(secEl);
      }
    }

    if (section.visible === false) {
      secEl.style.display = 'none';
      return;
    } else {
      secEl.style.display = '';
    }

    const c = section.content || {};
    const t = section.type;

    let innerHtml = `
      <div class="dbl-content-container" style="padding: 48px 0;">
        <div class="dbl-section-header">
          <div class="dbl-meta-label">
            <span>[◈]</span>
            <span>${escapeHtml(c.metaLabel || section.name || '')}</span>
          </div>
          <h2 class="dbl-title-main">${escapeHtml(c.title || section.name || '')}</h2>
          ${c.subtitle ? `<p class="dbl-subtitle-desc">${escapeHtml(c.subtitle)}</p>` : ''}
        </div>
    `;

    if (t === 'card-grid' || t === 'archive') {
      const items = Array.isArray(c.items) ? c.items : [];
      innerHtml += `
        <div class="custom-card-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; margin-top: 32px;">
          ${items.map(item => `
            <div class="works-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; overflow: hidden; padding: 20px;">
              ${item.image ? `<div style="height: 200px; overflow: hidden; border-radius: 6px; margin-bottom: 14px;"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title || '')}" style="width: 100%; height: 100%; object-fit: cover;"></div>` : ''}
              ${item.badge ? `<div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--crimson); margin-bottom: 6px;">${escapeHtml(item.badge)}</div>` : ''}
              <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 8px;">${escapeHtml(item.title || '')}</h3>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">${escapeHtml(item.description || item.desc || '')}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else if (t === 'text-media') {
      innerHtml += `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 32px; align-items: center;">
          <div>
            ${c.headline ? `<h3 style="font-size: 20px; font-weight: 700; color: #FFF; margin-bottom: 14px;">${escapeHtml(c.headline)}</h3>` : ''}
            ${(c.paragraphs || [c.description || '']).map(p => `<p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">${escapeHtml(p)}</p>`).join('')}
          </div>
          <div>
            ${c.mediaImage ? `<img src="${escapeHtml(c.mediaImage)}" alt="" style="width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">` : ''}
            ${c.mediaCaption ? `<div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted); margin-top: 8px;">${escapeHtml(c.mediaCaption)}</div>` : ''}
          </div>
        </div>
      `;
    } else if (t === 'editorial') {
      innerHtml += `
        <div style="max-width: 800px; margin: 32px auto; text-align: center;">
          ${c.pullQuote ? `<blockquote style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 600; color: #FFF; line-height: 1.4; margin-bottom: 24px; border-left: 3px solid var(--crimson); padding-left: 20px; text-align: left;">"${escapeHtml(c.pullQuote)}"</blockquote>` : ''}
          ${c.bodyText ? `<p style="font-size: 15px; color: var(--text-secondary); line-height: 1.8; text-align: left;">${escapeHtml(c.bodyText)}</p>` : ''}
        </div>
      `;
    } else if (t === 'video-showcase') {
      innerHtml += `
        <div style="margin-top: 32px; max-width: 1000px; margin-left: auto; margin-right: auto; text-align: center;">
          ${c.videoUrl ? `
            <div style="position: relative; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); background: #000;">
              <video src="${escapeHtml(c.videoUrl)}" poster="${escapeHtml(c.poster || '')}" controls style="width: 100%; display: block;"></video>
            </div>
          ` : ''}
          ${c.videoTitle ? `<h3 style="font-size: 16px; font-weight: 700; color: #FFF; margin-top: 14px;">${escapeHtml(c.videoTitle)}</h3>` : ''}
        </div>
      `;
    } else {
      innerHtml += `
        <div style="margin-top: 24px; padding: 24px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,266,0.06); border-radius: 8px;">
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">${escapeHtml(c.description || c.subtitle || 'Custom portfolio component.')}</p>
        </div>
      `;
    }

    innerHtml += `</div>`;
    secEl.innerHTML = innerHtml;
  }

  function hydrate(content) {
    if (!content || !Array.isArray(content.sections)) return;
    currentContent = content;

    // Global Settings
    if (content.settings) {
      const s = content.settings;
      if (s.siteTitle) document.title = s.siteTitle;
      if (s.wordmark) {
        const brandDf = document.getElementById('brand-df');
        if (brandDf) brandDf.textContent = s.wordmark;
      }
      if (s.resumeUrl) {
        const resumeBtn = document.getElementById('hero-resume-download');
        if (resumeBtn) resumeBtn.setAttribute('href', s.resumeUrl);
      }
      if (s.headerTag) {
        const tag = document.getElementById('backstage-trigger');
        if (tag) tag.textContent = s.headerTag;
      }
    }

    content.sections.forEach(sec => {
      switch (sec.type) {
        case 'hero':
          hydrateHero(sec);
          break;
        case 'ticker':
          hydrateTicker(sec);
          break;
        case 'metrics':
          hydrateNumbers(sec);
          break;
        case 'beyond-the-frame':
          hydrateBeyondTheFrame(sec);
          break;
        case 'selected-works':
          hydrateSelectedWorks(sec);
          break;
        case 'visual-orbit':
          hydrateVisualOrbit(sec);
          break;
        case 'my-expertise':
          hydrateExpertise(sec);
          break;
        case 'the-core':
          hydrateCoreAndHobbies(sec);
          break;
        case 'cta':
          hydrateCTA(sec);
          break;
        default:
          renderDynamicSection(sec);
          break;
      }
    });

    console.log('[CBK Hydrator] Content successfully applied (Version ' + (content.version || 1) + ')');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------
  // INITIALIZATION & EVENT LISTENERS
  // -------------------------------------------------------------
  async function init() {
    const data = await fetchContent();
    if (data) {
      hydrate(data);
    }

    // Live preview bridge for Backstage iframe
    window.addEventListener('message', event => {
      if (event.data && event.data.type === 'BACKSTAGE_PREVIEW_UPDATE') {
        hydrate(event.data.content);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__cbkHydrator = {
    hydrate,
    getContent: () => currentContent
  };
})();
