import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import './ContourTide.css';

const DEFAULT_COLORS = ['#6E6E80', '#FFFFFF'];
const INK_COLORS = ['#454550', '#15151B'];
const RIPPLE_COUNT = 5;
const RGB_CACHE = new Map();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const parseRgb = (value) => {
  if (!value || value === 'transparent') return null;
  if (RGB_CACHE.has(value)) return RGB_CACHE.get(value);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#000';
  ctx.fillStyle = value;
  const normalized = ctx.fillStyle;
  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1);
    const full = hex.length === 3 ? hex.split('').map((ch) => ch + ch).join('') : hex;
    const number = Number.parseInt(full, 16);
    if (!Number.isFinite(number)) return null;
    const rgb = [(number >> 16 & 255) / 255, (number >> 8 & 255) / 255, (number & 255) / 255];
    RGB_CACHE.set(value, rgb);
    return rgb;
  }
  const values = normalized.match(/[\d.]+/g);
  if (!values || values.length < 3) return null;
  const rgb = [Number(values[0]) / 255, Number(values[1]) / 255, Number(values[2]) / 255];
  RGB_CACHE.set(value, rgb);
  return rgb;
};

const luminance = (rgb) => rgb ? rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 : 0;

function nearestOpaqueBackground(element) {
  let current = element;
  while (current && current !== document.documentElement) {
    const color = window.getComputedStyle(current).backgroundColor;
    const match = color.match(/rgba?\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(/[\s,\/]+/).filter(Boolean);
      const alpha = parts.length >= 4 ? Number(parts[3]) : 1;
      if (alpha > 0.02) return color;
    }
    current = current.parentElement;
  }
  return window.getComputedStyle(document.documentElement).backgroundColor || '#0a0a0a';
}

function makeGridGeometry(density, seed) {
  // 620 x 550 = 341,000 points at density=1, matching the reference's stated budget.
  const multiplier = Math.sqrt(clamp(density, 0.3, 2));
  const columns = Math.max(180, Math.round(620 * multiplier));
  const rows = Math.max(160, Math.round(550 * multiplier));
  const count = columns * rows;
  const positions = new Float32Array(count * 3);
  const randomValues = new Float32Array(count);
  let state = (Math.floor(seed) >>> 0) || 0x6d2b79f5;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  let index = 0;
  for (let row = 0; row < rows; row++) {
    const z = THREE.MathUtils.lerp(-94, 28, row / (rows - 1));
    for (let col = 0; col < columns; col++) {
      const x = THREE.MathUtils.lerp(-70, 70, col / (columns - 1));
      const jitterX = (random() - 0.5) * 0.115;
      const jitterZ = (random() - 0.5) * 0.14;
      positions[index * 3] = x + jitterX;
      positions[index * 3 + 1] = 0;
      positions[index * 3 + 2] = z + jitterZ;
      randomValues[index] = random();
      index++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomValues, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uWaveHeight;
  uniform float uChoppiness;
  uniform float uWavelength;
  uniform float uWindAngle;
  uniform float uHorizon;
  uniform float uFog;
  uniform float uFoam;
  uniform float uGlow;
  uniform float uParticleSize;
  uniform float uDpr;
  uniform vec2 uPointer;
  uniform float uInteractive;
  uniform float uSwell;
  uniform float uSwellRadius;
  uniform vec3 uRipples[5];

  attribute float aRandom;
  varying float vCrest;
  varying float vFade;
  varying float vFog;
  varying float vRandom;
  varying float vHalo;

  const float PI = 3.141592653589793;

  void main() {
    vec3 p = position;
    vec2 base = p.xz;
    float t = uTime * uSpeed;
    float angle = radians(uWindAngle);
    vec2 direction = normalize(vec2(sin(angle), cos(angle)));

    // Low-frequency domain warping creates irregular, non-repeating wave contours.
    float warpA = sin(dot(base, vec2(0.025, 0.035)) - t * 0.17 + 1.4);
    float warpB = cos(dot(base, vec2(-0.032, 0.022)) + t * 0.13);
    vec2 q = base + vec2(warpA * 2.4, warpB * 1.8) * (0.35 + uChoppiness * 0.65);

    float wavelength = max(0.22, uWavelength);
    vec2 d1 = direction;
    vec2 d2 = normalize(vec2(direction.x * 0.82 + direction.y * 0.57,
                             direction.y * 0.82 - direction.x * 0.57));
    vec2 d3 = normalize(vec2(direction.x * 0.35 - direction.y * 0.94,
                             direction.y * 0.35 + direction.x * 0.94));
    vec2 d4 = normalize(vec2(direction.x * 0.96 - direction.y * 0.28,
                             direction.y * 0.96 + direction.x * 0.28));

    float phase1 = dot(q, d1) * (0.175 / wavelength) - t * 0.70;
    float phase2 = dot(q, d2) * (0.265 / wavelength) - t * 0.91 + 1.7;
    float phase3 = dot(q, d3) * (0.405 / wavelength) - t * 1.18 + 3.1;
    float phase4 = dot(q, d4) * (0.575 / wavelength) - t * 1.43 + 0.6;

    // A distant, off-centre gyre creates the broad circular tide seen in the reference.
    vec2 vortexVector = q - vec2(17.0, -35.0);
    float vortexDistance = length(vortexVector);
    float vortexAngle = atan(vortexVector.y, vortexVector.x);
    float vortexPhase = vortexDistance * (0.275 / wavelength)
                      + vortexAngle * 1.12 - t * 0.34 + warpA * 0.22;

    float wave = sin(phase1) * 1.20
               + sin(phase2) * 0.54
               + sin(phase3) * 0.25
               + sin(phase4) * 0.105
               + sin(vortexPhase) * 0.20;
    float sharp = max(0.0, uChoppiness);
    wave += sharp * (pow(max(0.0, sin(phase1)), 3.0) * 0.24
                   + pow(max(0.0, sin(phase2)), 4.0) * 0.12);

    // Pointer swell: a broad, soft displacement rather than a hard spotlight.
    float swellRadius = max(0.15, uSwellRadius * 5.5);
    float pointerDistance = length(base - uPointer);
    float pointerFalloff = exp(-pow(pointerDistance / swellRadius, 2.0) * 1.35);
    wave += uInteractive * uSwell * pointerFalloff * 1.15;

    float crest = 0.0;
    crest += pow(max(0.0, sin(phase1)), 12.0) * 0.72;
    crest += pow(max(0.0, sin(phase2)), 15.0) * 0.48;
    crest += pow(max(0.0, sin(phase3)), 18.0) * 0.28;
    crest += pow(max(0.0, sin(phase4)), 20.0) * 0.13;
    crest += pow(max(0.0, sin(vortexPhase)), 19.0) * 0.26;
    crest += exp(-pow(pointerDistance / swellRadius - 0.82, 2.0) * 20.0)
             * uInteractive * uSwell * 0.28;

    // Several short-lived click ripples can coexist, so quick clicks stack.
    for (int i = 0; i < 5; i++) {
      float age = uTime - uRipples[i].z;
      if (age >= 0.0 && age < 7.0) {
        float distanceToRipple = length(base - uRipples[i].xy);
        float radius = age * 5.6;
        float ringDistance = distanceToRipple - radius;
        float ringEnvelope = exp(-ringDistance * ringDistance * 1.75) * exp(-age * 0.38);
        wave += sin(ringDistance * 4.8) * ringEnvelope * 0.62;
        crest += ringEnvelope * 0.9;
      }
    }

    // Small horizontal displacement sharpens the crest silhouette.
    p.x += cos(phase1) * sharp * 0.38 + cos(phase3) * sharp * 0.10;
    p.z += sin(phase2) * sharp * 0.19;
    p.y += wave * uWaveHeight * 2.1;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vec4 clipPosition = projectionMatrix * mvPosition;
    gl_Position = clipPosition;

    float depth = max(0.0, -mvPosition.z);
    float fromTop = 1.0 - (clipPosition.y / max(0.0001, clipPosition.w) * 0.5 + 0.5);
    float horizonFade = smoothstep(uHorizon - 0.035, uHorizon + 0.15, fromTop);
    // Keep the foreground mostly black so the lit contours emerge from the darkness.
    float foregroundFade = 1.0 - smoothstep(0.40, 0.94, fromTop) * 0.76;
    float fogFade = exp(-uFog * max(0.0, depth - 18.0) * 0.0125);

    vCrest = clamp(crest * (0.70 + uFoam * 0.46), 0.0, 1.0);
    vFade = horizonFade * foregroundFade;
    vFog = fogFade;
    vRandom = mix(0.58, 1.0, aRandom);
    vHalo = uGlow;

    float perspectiveSize = mix(1.25, 0.68, smoothstep(14.0, 105.0, depth));
    float sizeVariation = mix(0.76, 1.18, aRandom);
    gl_PointSize = clamp(uParticleSize * uDpr * perspectiveSize * sizeVariation, 0.55, 3.2);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uWaterColor;
  uniform vec3 uCrestColor;
  uniform float uFoam;
  uniform float uGlow;
  varying float vCrest;
  varying float vFade;
  varying float vFog;
  varying float vRandom;
  varying float vHalo;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float radius = length(centered);
    float core = 1.0 - smoothstep(0.12, 0.49, radius);
    float halo = exp(-radius * 7.5) * vHalo * 0.24;
    float crest = clamp(vCrest, 0.0, 1.0);

    vec3 particleColor = mix(uWaterColor, uCrestColor, smoothstep(0.10, 0.72, crest));
    float brightness = 0.34 + crest * (0.9 + uFoam * 0.65) + halo;
    float alpha = (0.035 + crest * (0.27 + uFoam * 0.32) + halo * 0.12)
                * core * vFade * vFog * vRandom;

    // Discard the transparent square corners and retain small, crisp luminous dots.
    if (alpha < 0.008 || radius > 0.5) discard;
    gl_FragColor = vec4(particleColor * brightness, clamp(alpha, 0.0, 0.92));
  }
`;

function makeUniforms({ colors, dpr, settings }) {
  return {
    uTime: { value: 0 },
    uSpeed: { value: settings.speed },
    uWaveHeight: { value: settings.waveHeight },
    uChoppiness: { value: settings.choppiness },
    uWavelength: { value: settings.wavelength },
    uWindAngle: { value: settings.windAngle },
    uHorizon: { value: settings.horizon },
    uFog: { value: settings.fog },
    uGlow: { value: settings.glow },
    uFoam: { value: settings.foam },
    uParticleSize: { value: settings.particleSize },
    uDpr: { value: dpr },
    uPointer: { value: new THREE.Vector2(10000, 10000) },
    uInteractive: { value: settings.interactive ? 1 : 0 },
    uSwell: { value: settings.swell },
    uSwellRadius: { value: settings.swellRadius },
    uRipples: { value: Array.from({ length: RIPPLE_COUNT }, () => new THREE.Vector3(0, 0, -1000)) },
    uWaterColor: { value: new THREE.Color(colors[0]) },
    uCrestColor: { value: new THREE.Color(colors[1]) }
  };
}

/**
 * Contour Tide — particle-ocean shader recreation.
 */
export default function ContourTide({
  colors = DEFAULT_COLORS,
  backgroundColor = '#0a0a0a',
  density = 1,
  particleSize = 1,
  waveHeight = 1,
  choppiness = 0.8,
  wavelength = 1,
  windAngle = 0,
  horizon = 0.1,
  fog = 1,
  glow = 0.35,
  foam = 1,
  speed = 1,
  interactive = true,
  parallax = 1,
  swell = 1,
  swellRadius = 0.9,
  clickRipples = true,
  seed = 0,
  paused = false,
  dpr = 1.5,
  className = '',
  style,
  children
}) {
  const rootRef = useRef(null);
  const settingsRef = useRef(null);
  const apiRef = useRef(null);

  const settings = useMemo(() => ({
    colors,
    backgroundColor,
    density,
    particleSize,
    waveHeight,
    choppiness,
    wavelength,
    windAngle,
    horizon,
    fog,
    glow,
    foam,
    speed,
    interactive,
    parallax,
    swell,
    swellRadius,
    clickRipples,
    seed,
    paused,
    dpr
  }), [colors, backgroundColor, density, particleSize, waveHeight, choppiness, wavelength, windAngle,
    horizon, fog, glow, foam, speed, interactive, parallax, swell, swellRadius, clickRipples, seed, paused, dpr]);

  settingsRef.current = settings;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        premultipliedAlpha: false
      });
    } catch (error) {
      root.dataset.webgl = 'unavailable';
      return undefined;
    }

    const state = settingsRef.current;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, clamp(dpr, 0.75, 2));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(Math.max(1, root.clientWidth), Math.max(1, root.clientHeight), false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.domElement.className = 'contour-tide__canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    root.prepend(renderer.domElement);

    const geometry = makeGridGeometry(density, seed);
    const uniforms = makeUniforms({ colors, dpr: pixelRatio, settings: state });
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    const ocean = new THREE.Points(geometry, material);
    ocean.frustumCulled = false;

    const scene = new THREE.Scene();
    scene.add(ocean);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 260);
    camera.position.set(0, 18, 15);
    camera.lookAt(0, 0, -37);
    camera.updateProjectionMatrix();

    let alive = true;
    let visible = true;
    let raf = 0;
    let lastFrame = performance.now();
    let elapsed = 0;
    let rippleIndex = 0;
    const pointerNdc = new THREE.Vector2(0, 0);
    const cameraDrift = new THREE.Vector2(0, 0);
    let themeRevision = 0;
    let paletteKey = '';
    let effectiveBg = backgroundColor;
    let lastBackground = backgroundColor;
    const pointerWorld = new THREE.Vector2(10000, 10000);
    const baseCameraPosition = new THREE.Vector3(0, 18, 15);
    const baseCameraTarget = new THREE.Vector3(0, 0, -37);
    const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = !!reduceMotionQuery?.matches;

    const updatePalette = (force = false) => {
      const s = settingsRef.current;
      let background = s.backgroundColor;
      if (!background || background === 'transparent') {
        if (force || lastBackground !== s.backgroundColor || effectiveBg === 'transparent') {
          effectiveBg = nearestOpaqueBackground(root.parentElement || root);
        }
        background = effectiveBg;
      } else {
        effectiveBg = background;
      }
      lastBackground = s.backgroundColor;
      const rgb = parseRgb(background);
      const isLight = luminance(rgb) > 0.56;
      const suppliedColors = Array.isArray(s.colors) && s.colors.length >= 2 ? s.colors : DEFAULT_COLORS;
      const isDefault = suppliedColors[0] === DEFAULT_COLORS[0] && suppliedColors[1] === DEFAULT_COLORS[1];
      const resolvedColors = isLight && isDefault ? INK_COLORS : suppliedColors;
      const key = `${themeRevision}|${background}|${resolvedColors[0]}|${resolvedColors[1]}`;
      if (force || key !== paletteKey) {
        root.classList.toggle('contour-tide--light', isLight);
        root.classList.toggle('contour-tide--dark', !isLight);
        uniforms.uWaterColor.value.set(resolvedColors[0]);
        uniforms.uCrestColor.value.set(resolvedColors[1]);
        paletteKey = key;
      }
    };

    const updateMutableUniforms = () => {
      const s = settingsRef.current;
      uniforms.uSpeed.value = prefersReducedMotion ? 0 : s.speed;
      uniforms.uWaveHeight.value = s.waveHeight;
      uniforms.uChoppiness.value = s.choppiness;
      uniforms.uWavelength.value = s.wavelength;
      uniforms.uWindAngle.value = s.windAngle;
      uniforms.uHorizon.value = clamp(s.horizon, 0, 0.9);
      uniforms.uFog.value = clamp(s.fog, 0, 4);
      uniforms.uGlow.value = clamp(s.glow, 0, 2);
      uniforms.uFoam.value = clamp(s.foam, 0, 2);
      uniforms.uParticleSize.value = clamp(s.particleSize, 0.2, 3);
      uniforms.uInteractive.value = s.interactive ? 1 : 0;
      uniforms.uSwell.value = clamp(s.swell, 0, 3);
      uniforms.uSwellRadius.value = clamp(s.swellRadius, 0.1, 3);
      uniforms.uDpr.value = Math.min(window.devicePixelRatio || 1, clamp(s.dpr, 0.75, 2));
      updatePalette();
    };

    const updateCameraParallax = (immediate = false, dt = 1 / 60) => {
      const amount = clamp(settingsRef.current.parallax, 0, 3);
      const targetX = pointerNdc.x * 1.45 * amount;
      const targetY = -pointerNdc.y * 0.78 * amount;
      const blend = immediate ? 1 : 1 - Math.exp(-dt * 3.8);
      cameraDrift.x += (targetX - cameraDrift.x) * blend;
      cameraDrift.y += (targetY - cameraDrift.y) * blend;
      camera.position.set(baseCameraPosition.x + cameraDrift.x, baseCameraPosition.y, baseCameraPosition.z + cameraDrift.y);
      camera.lookAt(baseCameraTarget.x + cameraDrift.x * 0.42, baseCameraTarget.y, baseCameraTarget.z + cameraDrift.y * 0.34);
      camera.updateMatrixWorld();
    };

    const draw = (immediateCamera = true, dt = 1 / 60) => {
      if (!alive) return;
      updateMutableUniforms();
      updateCameraParallax(immediateCamera, dt);
      renderer.render(scene, camera);
    };

    const shouldAnimate = () => {
      const s = settingsRef.current;
      return alive && visible && !s.paused && !prefersReducedMotion && s.speed > 0;
    };

    const tick = (now) => {
      raf = 0;
      if (!alive || !visible) return;
      const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
      lastFrame = now;
      if (shouldAnimate()) elapsed += dt;
      uniforms.uTime.value = elapsed;
      draw(false, dt);
      if (shouldAnimate()) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!alive || !visible || raf || !shouldAnimate()) return;
      lastFrame = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const renderOnce = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      draw();
    };

    const pointerToWorld = (event) => {
      // Check hero boundary: do not react to coordinates within or above hero
      const heroEl = document.getElementById('hero-section');
      if (heroEl) {
        const heroBottom = heroEl.getBoundingClientRect().bottom;
        if (event.clientY <= heroBottom) return;
      }
      const rect = root.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ny = 1 - ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2;
      pointerNdc.set(nx, ny);
      pointerWorld.set(nx * 40, -37 - ny * 35);
      uniforms.uPointer.value.copy(pointerWorld);
    };

    const onPointerMove = (event) => {
      if (!settingsRef.current.interactive) return;
      pointerToWorld(event);
      if (!shouldAnimate()) renderOnce();
    };

    const onPointerLeave = () => {
      pointerNdc.set(0, 0);
      pointerWorld.set(10000, 10000);
      uniforms.uPointer.value.copy(pointerWorld);
      if (!shouldAnimate()) renderOnce();
    };

    const onPointerDown = (event) => {
      const s = settingsRef.current;
      if (!s.clickRipples || event.button > 0 || s.paused || s.speed === 0 || prefersReducedMotion) return;
      if (event.target !== renderer.domElement && !renderer.domElement.contains(event.target)) return;
      pointerToWorld(event);
      const ripple = uniforms.uRipples.value[rippleIndex % RIPPLE_COUNT];
      ripple.set(pointerWorld.x, pointerWorld.y, elapsed);
      rippleIndex++;
      start();
    };

    const resize = () => {
      if (!alive) return;
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, clamp(settingsRef.current.dpr, 0.75, 2)));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderOnce();
      start();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        renderOnce();
        start();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }, { threshold: 0.01 });
    visibilityObserver.observe(root);

    const themeObserver = new MutationObserver(() => {
      themeRevision++;
      updatePalette(true);
      renderOnce();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-mode'] });
    if (document.body) themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-mode'] });

    const onReducedMotionChange = (event) => {
      prefersReducedMotion = event.matches;
      renderOnce();
      start();
    };
    reduceMotionQuery?.addEventListener?.('change', onReducedMotionChange);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerleave', onPointerLeave, { passive: true });
    root.addEventListener('pointerdown', onPointerDown);

    apiRef.current = { draw, start, renderOnce };
    updatePalette(true);
    resize();
    start();

    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      apiRef.current = null;
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      reduceMotionQuery?.removeEventListener?.('change', onReducedMotionChange);
      window.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', onPointerLeave);
      root.removeEventListener('pointerdown', onPointerDown);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === root) root.removeChild(renderer.domElement);
    };
  }, [density, seed, dpr]);

  useEffect(() => {
    apiRef.current?.draw();
    apiRef.current?.start();
  }, [settings]);

  const rootStyle = {
    backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
    ...style
  };

  return (
    <div
      ref={rootRef}
      className={`contour-tide ${className}`.trim()}
      style={rootStyle}
      data-contour-tide
      aria-label="Animated ocean of particles rolling in waves"
      role="img"
    >
      <div className="contour-tide__fallback" aria-hidden="true" />
      {children ? <div className="contour-tide__content">{children}</div> : null}
    </div>
  );
}
