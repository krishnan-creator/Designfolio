const fs = require('fs');

const cssToAdd = `
/* ============================================================
   WIDESCREEN CINEMATIC PROJECT SHOWCASE (RAMAYANA & VEERABHADRA)
   ============================================================ */
.cinematic-showcase-zone {
  position: relative;
  width: 100%;
  background: var(--dbl-surface-matte);
  border: 1px solid var(--dbl-border-base);
  border-radius: 10px;
  padding: clamp(20px, 2.5vw, 32px);
  overflow: hidden;
  box-shadow: 0 20px 48px -10px rgba(0, 0, 0, 0.45);
  transition: var(--dbl-theme-transition);
}

[data-theme="light"] .cinematic-showcase-zone {
  background: #FFFFFF;
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.06);
}

.showcase-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.showcase-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--dbl-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.showcase-tag .signal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dbl-crimson);
  box-shadow: 0 0 8px var(--dbl-crimson);
  animation: signalPulse 2.4s ease-in-out infinite;
}

.showcase-rotation-nav {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rot-index-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: var(--dbl-text-tertiary);
  letter-spacing: 0.16em;
}

.rot-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rot-tab-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 4px;
  border: 1px solid var(--dbl-border-subtle);
  background: rgba(255, 255, 255, 0.04);
  color: var(--dbl-text-tertiary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
  transition: all 0.25s ease;
}

[data-theme="light"] .rot-tab-btn {
  background: rgba(0, 0, 0, 0.04);
  color: #55555C;
}

.rot-tab-btn:hover {
  color: var(--dbl-text-primary);
  border-color: var(--dbl-border-strong);
}

.rot-tab-btn.is-active {
  color: var(--dbl-text-primary);
  border-color: var(--dbl-crimson-border);
  background: var(--dbl-crimson-subtle);
}

.rot-tab-btn .tab-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--dbl-text-tertiary);
  transition: background 0.25s ease;
}

.rot-tab-btn.is-active .tab-dot {
  background: var(--dbl-crimson);
  box-shadow: 0 0 6px var(--dbl-crimson);
}

.tab-progress-line {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--dbl-crimson);
  width: 0%;
}

.rot-tab-btn.is-active .tab-progress-line {
  width: 100%;
  transition: width 10s linear;
}

.cinematic-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 6.2;
  min-height: 240px;
  max-height: 440px;
  border-radius: 8px;
  overflow: hidden;
  background: #08080A;
  border: 1px solid var(--dbl-border-subtle);
}

.cinematic-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transform: scale(1.02);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.cinematic-slide.is-active {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.cinematic-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: brightness(0.96) contrast(1.04);
}

.slide-metadata-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: clamp(14px, 2.2vw, 24px) clamp(16px, 2.8vw, 32px);
  background: linear-gradient(180deg, transparent 0%, rgba(8, 8, 11, 0.75) 40%, rgba(8, 8, 11, 0.95) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.slide-info-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slide-badge-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--dbl-crimson);
  text-transform: uppercase;
}

.slide-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 800;
  font-size: clamp(1.4rem, 2.8vw, 2.2rem);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #ffffff;
  line-height: 1;
}

.slide-caption-desc {
  font-size: clamp(11.5px, 1.1vw, 13.5px);
  color: rgba(255, 255, 255, 0.85);
  max-width: 620px;
  line-height: 1.4;
  margin-top: 2px;
}

.slide-tag-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  padding: 6px 14px;
  border-radius: 4px;
  background: rgba(18, 18, 24, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid var(--dbl-border-base);
  color: #ffffff;
  white-space: nowrap;
}
`;

fs.appendFileSync('scratch/new_sections.css', cssToAdd);
console.log('Appended showcase CSS to scratch/new_sections.css');
