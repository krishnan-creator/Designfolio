const fs = require('fs');

const raw = fs.readFileSync('scratch/SplashCursor.jsx', 'utf8');

// Find start of useEffect body (line ~25)
const effectStart = raw.indexOf('useEffect(() => {');
const effectBody = raw.substring(effectStart + 'useEffect(() => {'.length);

// Find end of return () => { ... }
const returnIdx = effectBody.lastIndexOf('return () => {');
const cleanupEndIdx = effectBody.indexOf('};', returnIdx) + 2;

const bodyUntilCleanup = effectBody.substring(0, returnIdx);
const cleanupBody = effectBody.substring(returnIdx + 'return () => {'.length, cleanupEndIdx - 2);

const output = `// ============================================================
// OFFICIAL REACT BITS SPLASH CURSOR (VANILLA WEBGL ADAPTER)
// Parameters: Fixed Violet #A855F7, Rainbow Mode: false, Transparent: true
// ============================================================
window.initSplashCursor = function(canvas, customConfig = {}) {
  if (!canvas) return null;

  let isActive = true;
  let animationFrameId = null;

  const defaultConfig = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1440,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 3.5,
    VELOCITY_DISSIPATION: 2,
    PRESSURE: 0.1,
    PRESSURE_ITERATIONS: 20,
    CURL: 3,
    SPLAT_RADIUS: 0.2,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLOR_UPDATE_SPEED: 10,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: true,
    RAINBOW_MODE: false,
    COLOR: '#A855F7',
    PAUSED: false
  };

  const config = Object.assign({}, defaultConfig, customConfig);

${bodyUntilCleanup.replace(/canvasRef\.current/g, 'canvas')}

  return {
    destroy: function() {
      isActive = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
${cleanupBody}
    }
  };
};
`;

fs.writeFileSync('scratch/splash_cursor_vanilla.js', output);
console.log('Saved splash_cursor_vanilla.js successfully, length:', output.length);
