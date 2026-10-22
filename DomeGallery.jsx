'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGesture } from '@use-gesture/react';
import './DomeGallery.css';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const wrapAngleSigned = (degrees) => {
  const angle = (((degrees + 180) % 360) + 360) % 360;
  return angle - 180;
};

function getPageTheme() {
  if (typeof document === 'undefined') return 'dark';

  const elements = [document.documentElement, document.body].filter(Boolean);
  for (const element of elements) {
    const dataTheme = (
      element.getAttribute('data-theme') ||
      element.getAttribute('data-bs-theme') ||
      ''
    ).toLowerCase();

    if (dataTheme === 'dark' || dataTheme === 'light') return dataTheme;

    if (
      element.classList.contains('dark') ||
      element.classList.contains('dark-mode') ||
      element.classList.contains('theme-dark')
    ) {
      return 'dark';
    }

    if (
      element.classList.contains('light') ||
      element.classList.contains('light-mode') ||
      element.classList.contains('theme-light')
    ) {
      return 'light';
    }
  }

  const colorScheme = window.getComputedStyle(document.documentElement).colorScheme;
  if (colorScheme?.includes('dark')) return 'dark';
  if (colorScheme?.includes('light')) return 'light';

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const DEFAULT_ORBIT_IMAGES = [
  { id: 'orbit-01', slotNumber: '01', src: '1.webp', alt: 'Visual Orbit Asset 01', title: 'Asset 01' },
  { id: 'orbit-02', slotNumber: '02', src: '6.webp', alt: 'Visual Orbit Asset 02', title: 'Asset 02' },
  { id: 'orbit-03', slotNumber: '03', src: '3__1_.webp', alt: 'Visual Orbit Asset 03', title: 'Asset 03' },
  { id: 'orbit-04', slotNumber: '04', src: '8__5_.webp', alt: 'Visual Orbit Asset 04', title: 'Asset 04' },
  { id: 'orbit-05', slotNumber: '05', src: '5__1_.webp', alt: 'Visual Orbit Asset 05', title: 'Asset 05' },
  { id: 'orbit-06', slotNumber: '06', src: '6__1_.webp', alt: 'Visual Orbit Asset 06', title: 'Asset 06' },
  { id: 'orbit-07', slotNumber: '07', src: '7__1_.webp', alt: 'Visual Orbit Asset 07', title: 'Asset 07' },
  { id: 'orbit-08', slotNumber: '08', src: '8__1_.jpeg', alt: 'Visual Orbit Asset 08', title: 'Asset 08' },
  { id: 'orbit-09', slotNumber: '09', src: '1__1_.png', alt: 'Visual Orbit Asset 09', title: 'Asset 09' },
  { id: 'orbit-10', slotNumber: '10', src: '2__2_.webp', alt: 'Visual Orbit Asset 10', title: 'Asset 10' },
  { id: 'orbit-11', slotNumber: '11', src: '3__2_.webp', alt: 'Visual Orbit Asset 11', title: 'Asset 11' },
  { id: 'orbit-12', slotNumber: '12', src: '6__4_.webp', alt: 'Visual Orbit Asset 12', title: 'Asset 12' },
  { id: 'orbit-13', slotNumber: '13', src: '5__2_.webp', alt: 'Visual Orbit Asset 13', title: 'Asset 13' },
  { id: 'orbit-14', slotNumber: '14', src: '6__2_.webp', alt: 'Visual Orbit Asset 14', title: 'Asset 14' },
  { id: 'orbit-15', slotNumber: '15', src: '7__2_.webp', alt: 'Visual Orbit Asset 15', title: 'Asset 15' },
  { id: 'orbit-16', slotNumber: '16', src: '8__2_.webp', alt: 'Visual Orbit Asset 16', title: 'Asset 16' },
  { id: 'orbit-17', slotNumber: '17', src: '1__2_.webp', alt: 'Visual Orbit Asset 17', title: 'Asset 17' },
  { id: 'orbit-18', slotNumber: '18', src: '2__3_.webp', alt: 'Visual Orbit Asset 18', title: 'Asset 18' },
  { id: 'orbit-19', slotNumber: '19', src: '3__3_.webp', alt: 'Visual Orbit Asset 19', title: 'Asset 19' },
  { id: 'orbit-20', slotNumber: '20', src: '4__3_.webp', alt: 'Visual Orbit Asset 20', title: 'Asset 20' },
  { id: 'orbit-21', slotNumber: '21', src: '5__3_.webp', alt: 'Visual Orbit Asset 21', title: 'Asset 21' },
  { id: 'orbit-22', slotNumber: '22', src: '6__3_.webp', alt: 'Visual Orbit Asset 22', title: 'Asset 22' },
  { id: 'orbit-23', slotNumber: '23', src: '7__3_.webp', alt: 'Visual Orbit Asset 23', title: 'Asset 23' },
  { id: 'orbit-24', slotNumber: '24', src: '8__1_.webp', alt: 'Visual Orbit Asset 24', title: 'Asset 24' },
  { id: 'orbit-25', slotNumber: '25', src: '1__3_.webp', alt: 'Visual Orbit Asset 25', title: 'Asset 25' },
  { id: 'orbit-26', slotNumber: '26', src: '2__4_.webp', alt: 'Visual Orbit Asset 26', title: 'Asset 26' },
  { id: 'orbit-27', slotNumber: '27', src: '3__4_.webp', alt: 'Visual Orbit Asset 27', title: 'Asset 27' },
  { id: 'orbit-28', slotNumber: '28', src: '4__4_.webp', alt: 'Visual Orbit Asset 28', title: 'Asset 28' },
  { id: 'orbit-29', slotNumber: '29', src: '5__4_.webp', alt: 'Visual Orbit Asset 29', title: 'Asset 29' },
  { id: 'orbit-30', slotNumber: '30', src: '6__5_.webp', alt: 'Visual Orbit Asset 30', title: 'Asset 30' },
  { id: 'orbit-31', slotNumber: '31', src: '7__4_.webp', alt: 'Visual Orbit Asset 31', title: 'Asset 31' },
  { id: 'orbit-32', slotNumber: '32', src: '8__3_.webp', alt: 'Visual Orbit Asset 32', title: 'Asset 32' },
  { id: 'orbit-33', slotNumber: '33', src: '1__4_.webp', alt: 'Visual Orbit Asset 33', title: 'Asset 33' },
  { id: 'orbit-34', slotNumber: '34', src: '2__5_.webp', alt: 'Visual Orbit Asset 34', title: 'Asset 34' },
  { id: 'orbit-35', slotNumber: '35', src: '3__5_.webp', alt: 'Visual Orbit Asset 35', title: 'Asset 35' },
  { id: 'orbit-36', slotNumber: '36', src: '4__5_.webp', alt: 'Visual Orbit Asset 36', title: 'Asset 36' },
  { id: 'orbit-37', slotNumber: '37', src: '1__1_.webp', alt: 'Visual Orbit Asset 37', title: 'Asset 37' },
  { id: 'orbit-38', slotNumber: '38', src: '4__2_.webp', alt: 'Visual Orbit Asset 38', title: 'Asset 38' },
  { id: 'orbit-39', slotNumber: '39', src: '8__4_.webp', alt: 'Visual Orbit Asset 39', title: 'Asset 39' },
  { id: 'orbit-40', slotNumber: '40', src: '4__1_.webp', alt: 'Visual Orbit Asset 40', title: 'Asset 40' },
  { id: 'orbit-41', slotNumber: '41', src: '', alt: 'Visual Orbit Slot 41', title: 'Slot 41' },
  { id: 'orbit-42', slotNumber: '42', src: '', alt: 'Visual Orbit Slot 42', title: 'Slot 42' },
  { id: 'orbit-43', slotNumber: '43', src: '', alt: 'Visual Orbit Slot 43', title: 'Slot 43' },
  { id: 'orbit-44', slotNumber: '44', src: '', alt: 'Visual Orbit Slot 44', title: 'Slot 44' },
  { id: 'orbit-45', slotNumber: '45', src: '', alt: 'Visual Orbit Slot 45', title: 'Slot 45' },
  { id: 'orbit-46', slotNumber: '46', src: '', alt: 'Visual Orbit Slot 46', title: 'Slot 46' },
  { id: 'orbit-47', slotNumber: '47', src: '', alt: 'Visual Orbit Slot 47', title: 'Slot 47' },
  { id: 'orbit-48', slotNumber: '48', src: '', alt: 'Visual Orbit Slot 48', title: 'Slot 48' }
];

/**
 * Normalizes input slots array into EXACTLY 48 stable slots (orbit-01 to orbit-48).
 * Preserves all 40 populated source assets without modulo duplication.
 * Unpopulated slots (orbit-41 to orbit-48) remain clean and ready for user upload.
 */
export function normalizeSlots(inputImages) {
  const rawList = Array.isArray(inputImages) && inputImages.length > 0 ? inputImages : DEFAULT_ORBIT_IMAGES;
  const targetCount = 48;

  return Array.from({ length: targetCount }, (_, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const stableId = `orbit-${num}`;
    const fallback = DEFAULT_ORBIT_IMAGES[idx] || { id: stableId, slotNumber: num, src: '', alt: `Visual Orbit Slot ${num}`, title: `Slot ${num}` };
    const raw = rawList.find?.((s) => s && (s.id === stableId || s.slot === num || s.slotNumber === num)) || rawList[idx] || fallback;

    let src = '';
    let alt = '';
    let title = '';

    if (typeof raw === 'string') {
      src = raw.trim();
    } else if (raw && typeof raw === 'object') {
      src = (raw.src || raw.image || '').trim();
      alt = raw.alt || '';
      title = raw.title || '';
    }

    if (!src) {
      src = fallback.src || '';
      alt = raw.alt || (src ? `Visual Orbit Asset ${num}` : `Visual Orbit Slot ${num}`);
      title = raw.title || (src ? `Asset ${num}` : `Slot ${num}`);
    } else {
      if (!alt || alt.includes('Empty slot')) alt = `Visual Orbit Asset ${num}`;
      if (!title || title.includes('Empty')) title = `Asset ${num}`;
    }

    return {
      id: (raw && raw.id) || stableId,
      slotNumber: num,
      src,
      alt,
      title,
      position: (raw && raw.position) || 'center center'
    };
  });
}

/**
 * Normal 12x4 DomeGallery architecture based on Circle.txt:
 * 12 horizontal positions around 360 degrees x 4 vertical rows = EXACTLY 48 slots.
 * Uniform base tile geometry, consistent spherical transforms.
 * Restrained alternating horizontal stagger (15 deg) for natural spherical brick-bond coverage.
 */
export const ROW_CONFIG = [
  { row: 0, count: 12, lat: 22.5, offsetDeg: 0 },
  { row: 1, count: 12, lat: 7.5, offsetDeg: 15 },
  { row: 2, count: 12, lat: -7.5, offsetDeg: 0 },
  { row: 3, count: 12, lat: -22.5, offsetDeg: 15 }
];

export function computeItemBaseRotation(offsetX, offsetY, sizeX = 2, sizeY = 2, segments = 12) {
  const unit = 360 / segments / 2;
  const rotateY = unit * (offsetX + (sizeX - 1) / 2);
  const rotateX = unit * (offsetY - (sizeY - 1) / 2);
  return { rotateX, rotateY };
}

export function buildSphereItems(slots) {
  const normalizedSlots = normalizeSlots(slots);
  const items = [];
  let slotIdx = 0;

  ROW_CONFIG.forEach((cfg) => {
    const colStepDeg = 360 / cfg.count; // 30 deg
    for (let c = 0; c < cfg.count; c++) {
      const slot = normalizedSlots[slotIdx] || {
        id: `orbit-${String(slotIdx + 1).padStart(2, '0')}`,
        slotNumber: String(slotIdx + 1).padStart(2, '0'),
        src: '',
        alt: `Visual Orbit Slot ${String(slotIdx + 1).padStart(2, '0')}`,
        title: `Slot ${String(slotIdx + 1).padStart(2, '0')}`,
        position: 'center center'
      };

      const rotY = ((c * colStepDeg + cfg.offsetDeg) % 360 + 360) % 360;
      const rotX = cfg.lat;

      items.push({
        id: slot.id,
        slotNumber: slot.slotNumber,
        src: slot.src,
        alt: slot.alt,
        title: slot.title,
        position: slot.position || 'center center',
        row: cfg.row,
        col: c,
        rotX,
        rotY,
        x: c * 2 + (cfg.offsetDeg > 0 ? 1 : 0) - (cfg.count - 1),
        y: (cfg.row - 1.5) * 2,
        sizeX: 2,
        sizeY: 2,
        index: slotIdx
      });

      slotIdx++;
    }
  });

  return items;
}

export default function DomeGallery({
  images = DEFAULT_ORBIT_IMAGES,
  fit = 0.8,
  fitBasis = 'auto',
  minRadius = 710,
  maxRadius = 860,
  padFactor = 0.18,
  maxVerticalRotationDeg = 0,
  dragSensitivity = 20,
  dragDampening = 4.6,
  segments = 10,
  imageBorderRadius = '12px',
  openedImageBorderRadius = '20px',
  grayscale = false,
  theme = 'auto',
  className = '',
}) {
  const safeSegments = Math.max(10, Math.floor(Number(segments) || 10));
  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const sphereRef = useRef(null);

  // Rotation and gesture state
  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef(null);
  const isDraggingRef = useRef(false);
  const movedRef = useRef(false);
  const lastDragEndAtRef = useRef(0);
  const animRafRef = useRef(null);

  // Pointer hover-pause state: pauses rotation whenever mouse pointer is anywhere within dome
  const isPointerInsideDomeRef = useRef(false);

  const [autoTheme, setAutoTheme] = useState('dark');
  const [radius, setRadius] = useState(minRadius);

  // Hover state for individual populated tile
  const [hoveredSlotId, setHoveredSlotId] = useState(null);

  // Lightbox state
  const [activeViewerSlot, setActiveViewerSlot] = useState(null);
  const activeViewerSlotRef = useRef(null);
  activeViewerSlotRef.current = activeViewerSlot;

  const resolvedTheme = theme === 'auto' ? autoTheme : theme;
  const items = useMemo(() => buildSphereItems(images), [images]);

  // Stable list of all 40 populated slots for Prev/Next navigation
  const populatedItems = useMemo(() => {
    return items.filter((item) => item.src && item.src.trim() !== '');
  }, [items]);

  // Theme observer
  useEffect(() => {
    if (theme !== 'auto') return undefined;

    const updateTheme = () => setAutoTheme(getPageTheme());
    updateTheme();

    const observer = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(updateTheme)
      : null;
    const observerOptions = {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-bs-theme', 'style'],
    };

    if (observer && document.documentElement) {
      observer.observe(document.documentElement, observerOptions);
    }
    if (observer && document.body) {
      observer.observe(document.body, observerOptions);
    }

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    mediaQuery?.addEventListener?.('change', updateTheme);

    return () => {
      observer?.disconnect();
      mediaQuery?.removeEventListener?.('change', updateTheme);
    };
  }, [theme]);

  // Apply CSS 3D spherical transform directly to sphere element
  const applyTransform = useCallback((xDegrees, yDegrees) => {
    const sphere = sphereRef.current;
    if (!sphere) return;
    sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDegrees}deg) rotateY(${yDegrees}deg)`;
  }, []);

  // Responsive radius calculation: Enlarge dome by ~18% on desktop as visual centerpiece
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const updateSize = () => {
      const rect = root.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const minDimension = Math.min(width, height);

      // On desktop (width >= 1100), ensure full-scale dome radius >= 710px
      // For 4 rows at latitudes -22.5 to +22.5 deg, target radius R >= 710px
      // occupies ~88% of the container height with natural commanding spherical curvature
      let targetR = Math.round(height * 0.88);
      if (width >= 1100) {
        targetR = Math.max(minRadius, targetR);
      }
      const responsiveMax = Math.min(maxRadius, Math.max(440, width * 0.68));
      const nextRadius = Math.round(clamp(targetR, Math.min(440, responsiveMax), responsiveMax));

      // Calculate uniform tile dimensions for 12 x 4 DomeGallery
      // Circumference / 12 * 0.94 gives ~365px width at R=740
      const circ = nextRadius * 2 * Math.PI;
      const itemWidth = Math.round((circ / 12) * 0.94);
      // Row chord for 15 deg pitch (2 * R * sin(7.5 deg)) gives ~193px; item height ~184px
      const rowPitchChord = Math.round(2 * nextRadius * Math.sin(7.5 * (Math.PI / 180)));
      const itemHeight = Math.round(rowPitchChord * 0.95);

      const viewerPadding = Math.max(8, Math.round(minDimension * padFactor));

      root.style.setProperty('--radius', `${nextRadius}px`);
      root.style.setProperty('--circ', `${Math.round(circ)}px`);
      root.style.setProperty('--item-width', `${itemWidth}px`);
      root.style.setProperty('--item-height', `${itemHeight}px`);
      root.style.setProperty('--viewer-pad', `${viewerPadding}px`);
      root.style.setProperty('--segments-x', 12);
      root.style.setProperty('--segments-y', 12);
      root.style.setProperty('--tile-radius', imageBorderRadius);
      root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
      root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');

      setRadius(nextRadius);
      applyTransform(rotationRef.current.x, rotationRef.current.y);
    };

    updateSize();
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(root);
    } else {
      window.addEventListener('resize', updateSize);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [
    applyTransform,
    fit,
    fitBasis,
    imageBorderRadius,
    maxRadius,
    minRadius,
    openedImageBorderRadius,
    padFactor,
    safeSegments,
    grayscale,
  ]);

  useEffect(() => {
    applyTransform(rotationRef.current.x, rotationRef.current.y);
  }, [applyTransform, radius]);

  // Single authoritative inertia velocity ref (in deg/sec)
  const inertiaVelocityRef = useRef(0);
  const recentMoveSamplesRef = useRef([]);

  const stopInertia = useCallback(() => {
    inertiaVelocityRef.current = 0;
  }, []);

  // Window-level pointer tracking for rock-solid dome hover-pause behavior
  useEffect(() => {
    const handleWindowPointerMove = (e) => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      isPointerInsideDomeRef.current = isInside;
    };

    const handleDocMouseLeave = (e) => {
      if (!e.relatedTarget && !e.toElement) {
        isPointerInsideDomeRef.current = false;
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('mousemove', handleWindowPointerMove, { passive: true });
    document.addEventListener('mouseleave', handleDocMouseLeave);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('mousemove', handleWindowPointerMove);
      document.removeEventListener('mouseleave', handleDocMouseLeave);
    };
  }, []);

  // SINGLE UNIFIED ANIMATION SYSTEM: AUTOMATIC ORBIT + DRAG-RELEASE MOMENTUM + HOVER-PAUSE
  useEffect(() => {
    let lastTime = performance.now();
    const autoSpeed = -4.0; // Steady, cinematic right-to-left orbit speed (deg/sec)
    const frictionDecay = 2.8; // Smooth physical exponential deceleration factor per second

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const isReducedMotion = typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      // 1. Fullscreen lightbox or reduced-motion halts all movement
      if (activeViewerSlotRef.current || isReducedMotion) {
        inertiaVelocityRef.current = 0;
        animRafRef.current = requestAnimationFrame(loop);
        return;
      }

      // 2. Active manual drag takes complete priority (handled in useGesture)
      if (isDraggingRef.current) {
        animRafRef.current = requestAnimationFrame(loop);
        return;
      }

      // 3. State D & E: If drag-release momentum (inertia) is active, apply and decelerate smoothly
      if (Math.abs(inertiaVelocityRef.current) > 0.3) {
        const deltaY = inertiaVelocityRef.current * dt;
        const currentRot = rotationRef.current;
        const nextY = wrapAngleSigned(currentRot.y + deltaY);
        rotationRef.current = { x: 0, y: nextY };
        applyTransform(0, nextY);

        // Frame-rate independent exponential deceleration
        inertiaVelocityRef.current *= Math.exp(-frictionDecay * dt);
        if (Math.abs(inertiaVelocityRef.current) <= 0.3) {
          inertiaVelocityRef.current = 0;
        }
      } else {
        // Momentum has fully settled
        inertiaVelocityRef.current = 0;

        // State F: Automatic orbit resumes IF pointer is outside the dome
        // If pointer is inside the dome, respect pointer-pause (dome stays stationary)
        if (!isPointerInsideDomeRef.current) {
          const deltaY = autoSpeed * dt;
          const currentRot = rotationRef.current;
          const nextY = wrapAngleSigned(currentRot.y + deltaY);
          rotationRef.current = { x: 0, y: nextY };
          applyTransform(0, nextY);
        }
      }

      animRafRef.current = requestAnimationFrame(loop);
    };

    animRafRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRafRef.current) cancelAnimationFrame(animRafRef.current);
    };
  }, [applyTransform]);

  // Drag gesture via @use-gesture/react
  useGesture(
    {
      onDragStart: ({ event }) => {
        if (activeViewerSlotRef.current) return;
        inertiaVelocityRef.current = 0;
        isDraggingRef.current = true;
        movedRef.current = false;
        startRotRef.current = { ...rotationRef.current };
        startPosRef.current = { x: event.clientX, y: event.clientY };
        recentMoveSamplesRef.current = [{ time: performance.now(), x: event.clientX }];
      },
      onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0] }) => {
        if (activeViewerSlotRef.current || !isDraggingRef.current || !startPosRef.current) return;

        const dx = event.clientX - startPosRef.current.x;
        if (!movedRef.current && Math.abs(dx) > 4) movedRef.current = true;

        // Update rotation yaw directly with zero vertical tilt
        const nextY = wrapAngleSigned(startRotRef.current.y + dx / dragSensitivity);
        rotationRef.current = { x: 0, y: nextY };
        applyTransform(0, nextY);

        const now = performance.now();
        if (!last) {
          recentMoveSamplesRef.current.push({ time: now, x: event.clientX });
          // Retain samples within the last 150ms window
          if (recentMoveSamplesRef.current.length > 10) {
            recentMoveSamplesRef.current.shift();
          }
          recentMoveSamplesRef.current = recentMoveSamplesRef.current.filter(s => now - s.time <= 150);
        } else {
          isDraggingRef.current = false;

          const samples = recentMoveSamplesRef.current;
          let releaseVelocityDeg = 0;

          // 1. Gesture velocity
          let vX = (velocity[0] || 0) * (direction[0] || 0);
          if (Math.abs(vX) > 0.001) {
            releaseVelocityDeg = (vX * 1000) / dragSensitivity;
          }

          // 2. High-precision moving window velocity from recent 150ms samples
          if (samples.length >= 2) {
            const first = samples[0];
            const lastSample = samples[samples.length - 1];
            const dtWindow = (lastSample.time - first.time) / 1000;
            const dxWindow = lastSample.x - first.x;
            if (dtWindow > 0.015) {
              const sampleSpeed = (dxWindow / dtWindow) / dragSensitivity;
              if (Math.abs(sampleSpeed) > Math.abs(releaseVelocityDeg)) {
                releaseVelocityDeg = sampleSpeed;
              }
            }
          }

          // Limit to physical maximum speed
          releaseVelocityDeg = clamp(releaseVelocityDeg, -75, 75);

          // Apply momentum if deliberate motion (> 1.2 deg/sec)
          if (Math.abs(releaseVelocityDeg) >= 1.2) {
            inertiaVelocityRef.current = releaseVelocityDeg;
          } else {
            inertiaVelocityRef.current = 0;
          }

          if (movedRef.current) lastDragEndAtRef.current = performance.now();
          movedRef.current = false;
          startPosRef.current = null;
          recentMoveSamplesRef.current = [];
        }
      },
      onDragEnd: () => {
        isDraggingRef.current = false;
      },
    },
    { target: mainRef, eventOptions: { passive: true }, drag: { filterTaps: true } },
  );

  // Fullscreen Lightbox Open & Close logic
  const openLightbox = useCallback((item) => {
    if (!item || !item.src) return;
    stopInertia();
    setActiveViewerSlot(item);
    document.body.classList.add('dg-scroll-lock');
  }, [stopInertia]);

  const closeLightbox = useCallback(() => {
    setActiveViewerSlot(null);
    document.body.classList.remove('dg-scroll-lock');
  }, []);

  // Prev / Next populated slot navigation
  const navigatePrev = useCallback(() => {
    if (!activeViewerSlot || populatedItems.length <= 1) return;
    const currentIndex = populatedItems.findIndex((it) => it.id === activeViewerSlot.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + populatedItems.length) % populatedItems.length;
    setActiveViewerSlot(populatedItems[prevIndex]);
  }, [activeViewerSlot, populatedItems]);

  const navigateNext = useCallback(() => {
    if (!activeViewerSlot || populatedItems.length <= 1) return;
    const currentIndex = populatedItems.findIndex((it) => it.id === activeViewerSlot.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % populatedItems.length;
    setActiveViewerSlot(populatedItems[nextIndex]);
  }, [activeViewerSlot, populatedItems]);

  // Keyboard navigation & Escape close handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!activeViewerSlot) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigatePrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigateNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeViewerSlot, closeLightbox, navigatePrev, navigateNext]);

  // Mobile touch swipe handling for Lightbox
  const touchStartXRef = useRef(null);
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) navigatePrev();
      else navigateNext();
    }
    touchStartXRef.current = null;
  };

  // Clean up scroll lock on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('dg-scroll-lock');
    };
  }, []);

  const handleTileClick = (item) => {
    if (isDraggingRef.current || movedRef.current) return;
    if (performance.now() - lastDragEndAtRef.current < 100) return;
    if (!item.src) return;
    openLightbox(item);
  };

  return (
    <div
      ref={rootRef}
      className={`sphere-root ${className}`.trim()}
      data-theme={resolvedTheme}
      onPointerEnter={() => {
        isPointerInsideDomeRef.current = true;
      }}
      onPointerLeave={() => {
        isPointerInsideDomeRef.current = false;
      }}
      onMouseEnter={() => {
        isPointerInsideDomeRef.current = true;
      }}
      onMouseLeave={() => {
        isPointerInsideDomeRef.current = false;
      }}
      style={{
        '--segments-x': safeSegments,
        '--segments-y': safeSegments,
        '--image-filter': grayscale ? 'grayscale(1)' : 'none',
      }}
    >
      <main
        ref={mainRef}
        className="sphere-main"
        aria-label="Interactive 3D Visual Orbit Dome Gallery"
      >
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((item) => {
              const hasImage = Boolean(item.src && item.src.trim() !== '');

              return (
                <div
                  key={item.id}
                  className={`item${hasImage ? '' : ' item--empty'}`}
                  data-slot-id={item.id}
                  data-slot-number={item.slotNumber}
                  data-src={item.src}
                  data-col={item.col}
                  data-row={item.row}
                  data-offset-x={item.x}
                  data-offset-y={item.y}
                  data-size-x={item.sizeX}
                  data-size-y={item.sizeY}
                  style={{
                    '--rot-x': `${item.rotX}deg`,
                    '--rot-y': `${item.rotY}deg`,
                    '--offset-x': item.x,
                    '--offset-y': item.y,
                    '--item-size-x': item.sizeX,
                    '--item-size-y': item.sizeY,
                  }}
                >
                  <div
                    className={`item__image${hasImage && hoveredSlotId === item.id ? ' is-hovered' : ''}${hasImage ? '' : ' item__image--empty'}`}
                    role={hasImage ? 'button' : 'presentation'}
                    tabIndex={hasImage ? 0 : -1}
                    aria-label={hasImage ? (item.alt || `Visual Orbit Asset ${item.slotNumber}`) : undefined}
                    onMouseEnter={() => hasImage && setHoveredSlotId(item.id)}
                    onMouseLeave={() => hasImage && setHoveredSlotId((curr) => curr === item.id ? null : curr)}
                    onFocus={() => hasImage && setHoveredSlotId(item.id)}
                    onBlur={() => hasImage && setHoveredSlotId((curr) => curr === item.id ? null : curr)}
                    onClick={() => hasImage && handleTileClick(item)}
                    onKeyDown={(e) => {
                      if (hasImage && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleTileClick(item);
                      }
                    }}
                  >
                    {hasImage ? (
                      <img
                        src={item.src}
                        alt={item.alt || `Visual Orbit Asset ${item.slotNumber}`}
                        draggable={false}
                        loading="eager"
                        decoding="async"
                        style={{ objectPosition: item.position || 'center center' }}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fullscreen Lightbox Image Viewer */}
        {activeViewerSlot && (
          <div
            className="dg-lightbox-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={activeViewerSlot.alt || 'Expanded gallery image'}
            onClick={(e) => {
              if (e.target === e.currentTarget || e.target.classList.contains('dg-lightbox-scrim')) {
                closeLightbox();
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="dg-lightbox-scrim" />

            {/* Accessible Close Button */}
            <button
              type="button"
              className="dg-lightbox-btn dg-lightbox-btn--close"
              onClick={closeLightbox}
              aria-label="Close fullscreen image (Escape)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Left navigation arrow button (shown if multiple populated items) */}
            {populatedItems.length > 1 && (
              <button
                type="button"
                className="dg-lightbox-btn dg-lightbox-btn--prev"
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePrev();
                }}
                aria-label="Previous image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            )}

            {/* Centered Image Container — clicking image does NOT close viewer */}
            <div className="dg-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img
                src={activeViewerSlot.src}
                alt={activeViewerSlot.alt || 'Fullscreen view'}
                className="dg-lightbox-image"
                draggable={false}
              />
            </div>

            {/* Right navigation arrow button (shown if multiple populated items) */}
            {populatedItems.length > 1 && (
              <button
                type="button"
                className="dg-lightbox-btn dg-lightbox-btn--next"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateNext();
                }}
                aria-label="Next image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
