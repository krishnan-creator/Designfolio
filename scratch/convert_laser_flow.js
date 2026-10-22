const fs = require('fs');

const code = fs.readFileSync('scratch/LaserFlow.jsx', 'utf8');

// Strip React lines
let vanilla = code.replace("'use client';", '');
vanilla = vanilla.replace("import { useEffect, useRef } from 'react';", '');
vanilla = vanilla.replace("import './LaserFlow.css';", '');

const compStart = vanilla.indexOf('export const LaserFlow =');
const head = vanilla.substring(0, compStart);

const effectStart = vanilla.indexOf('const program = link(gl, VERTEX, FRAGMENT);');
const effectEnd = vanilla.indexOf('return () => {', effectStart);
const effectBody = vanilla.substring(effectStart, effectEnd);

const cleanupStart = effectEnd + 'return () => {'.length;
const cleanupEnd = vanilla.indexOf('};\n  }, []);', cleanupStart);
const cleanupBody = vanilla.substring(cleanupStart, cleanupEnd);

const output = `${head}

window.initLaserFlow = function(container, canvas, userOptions = {}) {
  if (!container || !canvas) return null;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false
  });
  if (!gl) {
    console.warn('WebGL2 not supported for LaserFlow');
    return null;
  }

  const defaultOptions = {
    surfaceRef: null,
    beamPosition: 0.5,
    surfaceLevel: 0.85,
    color: '#E2E8F0',
    intensity: 0.85,
    beamWidth: 0.9,
    flare: 1.2,
    spread: 1.2,
    spill: 0.8,
    fog: 0.15,
    dust: 1.2,
    streaks: 1.0,
    dots: 0.8,
    pulse: 1.2,
    speed: 1.0,
    seed: 3,
    mouseInteraction: true,
    revealImage: null,
    revealRadius: 220,
    revealOpacity: 0.6,
    intro: true,
    theme: 'dark',
    paused: false,
    dpr: Math.min(window.devicePixelRatio || 1, 1.5)
  };

  const settings = Object.assign({}, defaultOptions, userOptions);
  const settingsRef = { current: settings };

  ${effectBody}

  return {
    update: function(newOptions) {
      Object.assign(settingsRef.current, newOptions);
      if (newOptions.color && toRgb) {
        state.tints = buildTints(toRgb(newOptions.color));
      }
      wake();
    },
    destroy: function() {
      ${cleanupBody}
    }
  };
};
`;

fs.writeFileSync('scratch/laser_flow_clean.js', output, 'utf8');
console.log('Successfully wrote scratch/laser_flow_clean.js! Length:', output.length);
