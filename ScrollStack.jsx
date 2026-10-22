'use client';

import React, { Children, useState, useEffect, useRef, useCallback } from 'react';
import './ScrollStack.css';

export const ScrollStackItem = ({
  children,
  itemClassName = '',
  style = {},
  active = false,
  index = 0,
  depth = 0,
  dim = 0
}) => (
  <div
    className={`beyond-frame-card scroll-stack-card ${active ? 'is-active' : ''} ${itemClassName}`.trim()}
    style={{
      ...style,
      '--scroll-stack-dim': dim
    }}
    data-card-index={index}
    data-card-depth={depth}
  >
    {children}
    <span className="scroll-stack-card__shade" aria-hidden="true" />
  </div>
);

const ScrollStack = ({
  children,
  className = '',
  onIndexChange,
  showPaddingCues = true,
  theme = 'dark'
}) => {
  const items = Children.toArray(children);
  const totalCards = items.length;
  const maxIndex = Math.max(0, totalCards - 1);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHoveringPadding, setIsHoveringPadding] = useState(false);

  const interactionAreaRef = useRef(null);
  const bannerRef = useRef(null);

  const targetIndexRef = useRef(0);
  const progressRef = useRef(0);
  const animFrameRef = useRef(null);
  const wheelAccumulatorRef = useRef(0);
  const lastStepTimeRef = useRef(0);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  // Jump to specific card
  const goToIndex = useCallback((newIndex) => {
    const clamped = Math.max(0, Math.min(maxIndex, newIndex));
    targetIndexRef.current = clamped;
    setActiveIndex(clamped);
    if (onIndexChange) onIndexChange(clamped);
  }, [maxIndex, onIndexChange]);

  // Next / Previous helpers
  const nextCard = useCallback(() => {
    goToIndex(targetIndexRef.current + 1);
  }, [goToIndex]);

  const prevCard = useCallback(() => {
    goToIndex(targetIndexRef.current - 1);
  }, [goToIndex]);

  // Pointer position detection: check if pointer is over padding (Area B) vs banner (Area A)
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!interactionAreaRef.current) return;
      const interRect = interactionAreaRef.current.getBoundingClientRect();
      const px = e.clientX;
      const py = e.clientY;

      const insideInter = (
        px >= interRect.left &&
        px <= interRect.right &&
        py >= interRect.top &&
        py <= interRect.bottom
      );

      setIsHoveringPadding(insideInter);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Wheel handling: Advances stack when mouse wheel is used over whole interaction region (images + padding)
  useEffect(() => {
    const handleWheel = (e) => {
      if (!interactionAreaRef.current) return;

      const interRect = interactionAreaRef.current.getBoundingClientRect();
      const px = e.clientX;
      const py = e.clientY;

      // 1. Check if pointer is inside designated Beyond The Frame interaction area (images AND padding)
      const insideInter = (
        px >= interRect.left &&
        px <= interRect.right &&
        py >= interRect.top &&
        py <= interRect.bottom
      );

      if (!insideInter) {
        // Outside interaction area completely -> normal page scroll!
        return;
      }

      const deltaY = e.deltaY;
      if (Math.abs(deltaY) < 1) return;

      // 2. Correct endpoint behaviour — never trap the visitor:
      // When at the first card and scrolling UP: release scroll event to normal page!
      if (deltaY < 0 && targetIndexRef.current <= 0) {
        return;
      }

      // When at the final card and scrolling DOWN: release scroll event to normal page!
      if (deltaY > 0 && targetIndexRef.current >= maxIndex) {
        return;
      }

      // 3. Inside designated area between endpoints: consume wheel event and advance/reverse local stack
      e.preventDefault();

      const now = performance.now();
      wheelAccumulatorRef.current += deltaY;

      const WHEEL_THRESHOLD = 26;
      const COOLDOWN_MS = 130;

      if (wheelAccumulatorRef.current >= WHEEL_THRESHOLD && now - lastStepTimeRef.current > COOLDOWN_MS) {
        const nextIdx = Math.min(maxIndex, targetIndexRef.current + 1);
        targetIndexRef.current = nextIdx;
        setActiveIndex(nextIdx);
        if (onIndexChange) onIndexChange(nextIdx);
        wheelAccumulatorRef.current = 0;
        lastStepTimeRef.current = now;
      } else if (wheelAccumulatorRef.current <= -WHEEL_THRESHOLD && now - lastStepTimeRef.current > COOLDOWN_MS) {
        const prevIdx = Math.max(0, targetIndexRef.current - 1);
        targetIndexRef.current = prevIdx;
        setActiveIndex(prevIdx);
        if (onIndexChange) onIndexChange(prevIdx);
        wheelAccumulatorRef.current = 0;
        lastStepTimeRef.current = now;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [maxIndex, onIndexChange]);

  // Touch gesture support on banner
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) {
          nextCard();
        } else {
          prevCard();
        }
      }
    }
  };

  // Keyboard navigation support when focused
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextCard();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      prevCard();
    }
  };

  // Smooth lerp animation loop for card transforms
  const [renderProgress, setRenderProgress] = useState(0);

  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      const target = targetIndexRef.current;
      const current = progressRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.001) {
        progressRef.current += diff * 0.16;
        setRenderProgress(progressRef.current);
      } else if (progressRef.current !== target) {
        progressRef.current = target;
        setRenderProgress(target);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div
      ref={interactionAreaRef}
      className={`beyond-frame-interaction-area ${isHoveringPadding ? 'is-hovering-padding' : ''} ${className}`.trim()}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Beyond The Frame cinematic stack. Scroll over surrounding padding to cycle entries."
      data-scroll-control-zone="padding"
    >
      {/* Top Padding Visual Cue & Stepper Header */}
      {showPaddingCues && (
        <div className="beyond-frame-padding-hint beyond-frame-padding-hint--top">
          <div className="beyond-frame-padding-hint__label">
            <span className={`beyond-frame-hint-dot ${isHoveringPadding ? 'is-active' : ''}`} />
            <span>
              {isHoveringPadding
                ? '✦ SCROLL-CONTROL ACTIVE · MOUSE WHEEL CYCLES CINEMATIC ENTRIES (IMAGE & PADDING)'
                : 'SCROLL-CONTROL ZONE · SCROLL MOUSE WHEEL OVER SECTION TO ADVANCE'}
            </span>
          </div>

          <div className="beyond-frame-padding-hint__stepper" aria-label="Cinematic entry indicators">
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`beyond-frame-step-pip ${idx === activeIndex ? 'is-active' : ''}`}
                onClick={() => goToIndex(idx)}
                aria-label={`Jump to entry 0${idx + 1}`}
                title={`Entry 0${idx + 1}`}
              />
            ))}
            <span className="beyond-frame-step-counter">
              0{activeIndex + 1} / 0{totalCards}
            </span>
          </div>
        </div>
      )}

      {/* Area A: Banner / Media Viewport (4:1 Aspect Ratio) */}
      <div
        ref={bannerRef}
        className="beyond-frame-banner"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        data-banner-area="true"
      >
        <div className="beyond-frame-stack-stage">
          {items.map((child, index) => {
            const diff = index - renderProgress;
            let transform = '';
            let opacity = 1;
            let zIndex = 1;
            let dim = 0;
            const isCurrent = Math.abs(diff) < 0.05;

            if (diff < 0) {
              // Preceding cards: recede subtly behind active card
              const depth = Math.abs(diff);
              const scale = Math.max(0.92, 1 - depth * 0.028);
              const translateY = -depth * 14;
              opacity = Math.max(0, 1 - depth * 0.45);
              zIndex = Math.max(1, 10 - Math.floor(depth));
              dim = Math.min(0.35, depth * 0.18);
              transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
            } else if (diff === 0 || isCurrent) {
              // Active foreground banner: 100% visible, crisp, dominant
              transform = 'translate3d(0, 0, 0) scale(1)';
              opacity = 1;
              zIndex = 20;
              dim = 0;
            } else {
              // Upcoming cards: progressively revealed from below
              if (diff <= 1) {
                const translateYPercent = diff * 100;
                const scale = 0.98 + (1 - diff) * 0.02;
                transform = `translate3d(0, ${translateYPercent.toFixed(2)}%, 0) scale(${scale.toFixed(4)})`;
                opacity = 1;
                zIndex = 30;
                dim = 0;
              } else {
                transform = 'translate3d(0, 100%, 0) scale(0.98)';
                opacity = 0;
                zIndex = 1;
                dim = 0;
              }
            }

            return React.cloneElement(child, {
              key: child.key ?? index,
              active: isCurrent,
              index,
              depth: Math.max(0, -diff),
              dim,
              style: {
                ...child.props.style,
                transform,
                opacity,
                zIndex
              }
            });
          })}
        </div>

        {/* Accessible Next / Prev navigation overlay for touch or quick tap */}
        <div className="beyond-frame-mobile-controls" aria-label="Card navigation">
          <button
            type="button"
            className="beyond-frame-ctrl-btn beyond-frame-ctrl-btn--prev"
            disabled={activeIndex === 0}
            onClick={prevCard}
            aria-label="Previous Cinematic Banner"
          >
            ‹
          </button>
          <button
            type="button"
            className="beyond-frame-ctrl-btn beyond-frame-ctrl-btn--next"
            disabled={activeIndex === maxIndex}
            onClick={nextCard}
            aria-label="Next Cinematic Banner"
          >
            ›
          </button>
        </div>
      </div>

      {/* Bottom Padding Visual Cue & Instruction Footer */}
      {showPaddingCues && (
        <div className="beyond-frame-padding-hint beyond-frame-padding-hint--bottom">
          <div className="beyond-frame-hint-side">
            <span className="beyond-frame-hint-tag">CINEMATIC STACK</span>
            <span className="beyond-frame-hint-sep">✦</span>
            <span>SCROLL WHEEL ADVANCES / REVERSES</span>
          </div>
          <div className="beyond-frame-hint-side">
            <span>4:1 BANNER // 1584×396</span>
            <span className="beyond-frame-hint-sep">✦</span>
            <span>RELEASES TO PAGE AT ENDPOINTS</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrollStack;
