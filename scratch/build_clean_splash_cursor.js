const fs = require('fs');

const raw = fs.readFileSync('scratch/SplashCursor.jsx', 'utf8');

// The original file has:
// function SplashCursor({ ...props... }) {
//   ...
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     let isActive = true;
//     function pointerPrototype() { ... }
//     let config = { ... };
//     ...
//     return () => {
//       ... cleanup ...
//     };
//   }, []);
//   ...
// }

// Let's extract from pointerPrototype to the end of cleanup.
const ptrIdx = raw.indexOf('function pointerPrototype() {');
const returnIdx = raw.lastIndexOf('return () => {');
const cleanupEndIdx = raw.indexOf('};', returnIdx) + 2;

const logicCode = raw.substring(ptrIdx, returnIdx);
const cleanupCode = raw.substring(returnIdx + 'return () => {'.length, cleanupEndIdx - 2);

// In logicCode, replace `let config = { ... };` with:
// config from parameter
const configStart = logicCode.indexOf('let config = {');
const configEnd = logicCode.indexOf('};', configStart) + 2;

const codeBeforeConfig = logicCode.substring(0, configStart);
const codeAfterConfig = logicCode.substring(configEnd);

const cleanCode = `// ============================================================
// OFFICIAL REACT BITS SPLASH CURSOR (VANILLA WEBGL MODULE)
// Exact parameters from prompt:
// DENSITY_DISSIPATION: 3.5, VELOCITY_DISSIPATION: 2, PRESSURE: 0.1,
// CURL: 3, SPLAT_RADIUS: 0.2, SPLAT_FORCE: 6000, COLOR_UPDATE_SPEED: 10,
// SHADING: true, RAINBOW_MODE: false, COLOR: '#A855F7', TRANSPARENT: true
// ============================================================
window.initSplashCursor = function(canvas, userConfig = {}) {
  if (!canvas) return null;

  let isActive = true;

  const config = Object.assign({
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
    PAUSED: false,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: true,
    RAINBOW_MODE: false,
    COLOR: '#A855F7'
  }, userConfig);

${codeBeforeConfig}
${codeAfterConfig}

  return {
    destroy: function() {
      isActive = false;
${cleanupCode}
    }
  };
};
`;

fs.writeFileSync('scratch/splash_cursor_clean.js', cleanCode);

try {
  new Function(cleanCode);
  console.log('SUCCESS! splash_cursor_clean.js is 100% VALID JavaScript!');
} catch (e) {
  console.error('Syntax error:', e.message);
}
