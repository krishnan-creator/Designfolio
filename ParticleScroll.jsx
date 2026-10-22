// Global Particle Scroll effect removed per Requirement 02
// All post-hero sections now use their native DOM layout and normal document scrolling.

export function initPostHeroParticleScroll() {
  if (typeof document !== 'undefined') {
    const oldCanvas = document.getElementById('post-hero-particle-scroll-canvas');
    if (oldCanvas && oldCanvas.parentElement) {
      oldCanvas.parentElement.removeChild(oldCanvas);
    }
  }
  return {
    update: () => {},
    destroy: () => {}
  };
}

export default function ParticleScroll({ children }) {
  return children || null;
}
