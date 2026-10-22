"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import "./ElasticReel.css";

const DEFAULT_HOVER_EXPANDED_FLEX = 6;
const DEFAULT_COLLAPSED_FLEX = 0.72;
const DEFAULT_SELECTED_FLEX = 7.5;
const LABEL_ROTATION = -90;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Normalizes authoritative 12 slots (hobby-01 through hobby-12),
 * preserving uploaded assets, metadata, and per-item persistent visibility.
 */
function normalizeItems(items) {
  const list = Array.isArray(items) ? items : [];
  return Array.from({ length: 12 }, (_, i) => {
    const num = String(i + 1).padStart(2, "0");
    const stableId = `hobby-${num}`;
    const found =
      list.find((it) => it && (it.id === stableId || it.slot === num || it.slotNumber === num)) ||
      list[i] ||
      null;

    let image = "";
    let alt = "";
    let title = `Hobby ${num}`;
    let description = "";
    let visible = true;

    if (typeof found === "string") {
      image = found.trim();
      alt = image ? `Hobby ${num}` : `Empty slot ${num}`;
    } else if (found && typeof found === "object") {
      image = (found.image || found.src || "").trim();
      alt = found.alt || (image ? `Hobby ${num}` : `Empty slot ${num}`);
      title = found.title || `Hobby ${num}`;
      description = found.description || found.subtitle || "";
      visible = found.visible !== undefined ? (found.visible !== false) : true;
    }

    return {
      id: stableId,
      slotNumber: num,
      image,
      alt,
      title,
      description,
      visible,
    };
  });
}

export function HoverExpand({
  items: rawItems = [],
  orientation = "horizontal",
  activeIndex: activeIndexProp,
  onActiveIndexChange,
  expandedFlex = DEFAULT_HOVER_EXPANDED_FLEX,
  collapsedFlex = DEFAULT_COLLAPSED_FLEX,
  selectedFlex = DEFAULT_SELECTED_FLEX,
  showLabelsWhenCollapsed = false,
  showNavigation = true,
  className = "",
}) {
  const shouldReduceMotion = useReducedMotion();
  
  // Authoritative collection of all 12 records
  const allItems = useMemo(() => normalizeItems(rawItems), [rawItems]);

  // Public visible collection: only records marked visible, in original relative order
  const visibleItems = useMemo(() => {
    return allItems.filter((item) => item.visible !== false);
  }, [allItems]);

  const n = visibleItems.length;

  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [isHoverDevice, setIsHoverDevice] = useState(false);
  const isHorizontal = orientation === "horizontal";

  // Clear active hover or selection state if the targeted item was hidden (Phase 6.4)
  useEffect(() => {
    if (selectedId && !visibleItems.some((it) => it.id === selectedId)) {
      setSelectedId(null);
    }
    if (hoveredId && !visibleItems.some((it) => it.id === hoveredId)) {
      setHoveredId(null);
    }
  }, [visibleItems, selectedId, hoveredId]);

  // List of populated items within visible collection
  const populatedItems = useMemo(() => {
    return visibleItems.filter((item) => !!item.image);
  }, [visibleItems]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsHoverDevice(mediaQuery.matches);

    const handleChange = (event) => {
      setIsHoverDevice(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const externalActiveId =
    activeIndexProp !== undefined &&
    activeIndexProp >= 0 &&
    activeIndexProp < visibleItems.length
      ? visibleItems[activeIndexProp]?.id
      : null;

  // Selection takes priority over hover
  const activeId =
    selectedId !== null
      ? selectedId
      : hoveredId !== null
        ? hoveredId
        : externalActiveId;

  const selectItem = useCallback(
    (id) => {
      const item = visibleItems.find((it) => it.id === id);
      if (!item || !item.image) return;
      setSelectedId(id);
      setHoveredId(null);
      const idx = visibleItems.findIndex((it) => it.id === id);
      onActiveIndexChange?.(idx);
    },
    [visibleItems, onActiveIndexChange],
  );

  const closeFeaturedView = useCallback(() => {
    setSelectedId(null);
    setHoveredId(null);
  }, []);

  // Navigation moves cleanly between populated visible images
  const moveSelection = useCallback(
    (delta) => {
      if (populatedItems.length <= 1) return;
      const currentId = selectedId || activeId;
      const pos = populatedItems.findIndex((it) => it.id === currentId);
      const currentPos = pos !== -1 ? pos : 0;
      const nextPos = (currentPos + delta + populatedItems.length) % populatedItems.length;
      const nextItem = populatedItems[nextPos];
      if (!nextItem) return;

      if (selectedId !== null) {
        setSelectedId(nextItem.id);
        setHoveredId(null);
      } else {
        setHoveredId(nextItem.id);
      }
      const visIdx = visibleItems.findIndex((it) => it.id === nextItem.id);
      onActiveIndexChange?.(visIdx);
    },
    [activeId, onActiveIndexChange, populatedItems, selectedId, visibleItems],
  );

  const handlePanelKeyDown = (event, id) => {
    const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";
    const previousKey = isHorizontal ? "ArrowLeft" : "ArrowUp";

    if (event.key === nextKey || event.key === previousKey) {
      event.preventDefault();
      const delta = event.key === nextKey ? 1 : -1;
      moveSelection(delta);
    } else if (event.key === "Escape" && selectedId !== null) {
      event.preventDefault();
      closeFeaturedView();
    }
  };

  // Close selection on global Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && selectedId !== null) {
        closeFeaturedView();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeFeaturedView, selectedId]);

  // Dynamic flex weights scaling smoothly to any visible item count n (Phase 4 & Phase 6)
  const dynamicFlex = useMemo(() => {
    if (n <= 1) {
      return { expanded: 1, collapsed: 1, selected: 1 };
    }
    if (n === 2) {
      return { expanded: 2.2, collapsed: 1, selected: 2.6 };
    }
    if (n === 3) {
      return { expanded: 3.0, collapsed: 1, selected: 3.8 };
    }
    if (n === 4) {
      return { expanded: 3.8, collapsed: 0.9, selected: 4.8 };
    }
    if (n === 5) {
      return { expanded: 4.6, collapsed: 0.8, selected: 5.8 };
    }
    return {
      expanded: expandedFlex || DEFAULT_HOVER_EXPANDED_FLEX,
      collapsed: collapsedFlex || DEFAULT_COLLAPSED_FLEX,
      selected: selectedFlex || DEFAULT_SELECTED_FLEX,
    };
  }, [n, expandedFlex, collapsedFlex, selectedFlex]);

  return (
    <div
      className={cn(
        "elastic-gallery-root elastic-reel",
        orientation === "horizontal" ? "elastic-gallery--horizontal" : "elastic-gallery--vertical",
        className,
      )}
    >
      <div
        aria-label={`Hobbies Elastic Gallery with ${n} visible panels`}
        className={cn(
          "elastic-gallery-track",
          isHorizontal ? "elastic-gallery-track--horizontal" : "elastic-gallery-track--vertical",
        )}
        data-count={n}
        onMouseLeave={() => {
          if (selectedId === null) {
            setHoveredId(null);
          }
        }}
        role="group"
        style={{ "--visible-count": n }}
      >
        {visibleItems.map((item, index) => {
          const isPopulated = !!item.image;
          const isActive = isPopulated && item.id === activeId;
          const isSelected = isPopulated && item.id === selectedId;
          const isHovered = isPopulated && item.id === hoveredId;
          const shouldShowLabel = isActive || showLabelsWhenCollapsed;

          // Resting state: when nothing is active or selected, every visible panel gets equal flexWeight = 1
          // Automatically dividing W - (n-1)g equally across all n panels (Phase 4.3)
          let flexWeight = 1;
          if (n <= 1) {
            flexWeight = 1;
          } else if (selectedId !== null) {
            flexWeight = isSelected ? dynamicFlex.selected : dynamicFlex.collapsed;
          } else if (hoveredId !== null) {
            flexWeight = isHovered ? dynamicFlex.expanded : dynamicFlex.collapsed;
          } else {
            flexWeight = 1;
          }

          return (
            <motion.div
              animate={{ flexGrow: flexWeight }}
              className={cn(
                "elastic-slat elastic-reel__slice",
                isPopulated ? "elastic-slat--populated" : "elastic-slat--empty is-empty",
                isActive && "elastic-slat--active",
                isSelected && "elastic-slat--selected",
              )}
              data-id={item.id}
              data-slot={item.slotNumber}
              initial={false}
              key={item.id}
              onMouseEnter={() => {
                if (isHoverDevice && selectedId === null && isPopulated) {
                  setHoveredId(item.id);
                }
              }}
              onMouseLeave={() => {
                if (selectedId === null && isPopulated) {
                  setHoveredId((current) => (current === item.id ? null : current));
                }
              }}
              style={{ flexBasis: 0, minWidth: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 260, damping: 28, mass: 0.8 }
              }
            >
              {isPopulated ? (
                <>
                  <img
                    alt={item.alt || item.title}
                    className={cn(
                      "elastic-slat-img",
                      isActive ? "scale-[1.015]" : "scale-100",
                      activeId !== null && !isActive && "elastic-slat-img--dimmed",
                    )}
                    draggable={false}
                    loading={index < 3 ? "eager" : "lazy"}
                    src={item.image}
                  />

                  <div
                    aria-hidden="true"
                    className={cn(
                      "elastic-slat-scrim",
                      isActive ? "elastic-slat-scrim--active" : "elastic-slat-scrim--idle",
                    )}
                  />

                  {/* Interactive Button overlay for populated panels */}
                  <button
                    aria-label={`Preview ${item.title}`}
                    aria-pressed={isSelected}
                    className="elastic-slat-button"
                    id={`hover-expand-panel-${item.id}`}
                    onClick={() => selectItem(item.id)}
                    onFocus={() => {
                      if (selectedId === null) setHoveredId(item.id);
                    }}
                    onKeyDown={(event) => handlePanelKeyDown(event, item.id)}
                    onMouseEnter={() => {
                      if (isHoverDevice && selectedId === null) setHoveredId(item.id);
                    }}
                    type="button"
                  >
                    <span className="sr-only">Select {item.title}</span>
                  </button>

                  {/* Metadata display */}
                  <motion.div
                    animate={
                      shouldReduceMotion
                        ? { opacity: shouldShowLabel ? 1 : 0 }
                        : {
                            opacity: shouldShowLabel ? 1 : 0,
                            rotate: isHorizontal && !isActive ? LABEL_ROTATION : 0,
                          }
                    }
                    className={cn(
                      "elastic-slat-caption",
                      isSelected && "elastic-slat-caption--selected",
                    )}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 260, damping: 28, mass: 0.8 }
                    }
                  >
                    <div
                      className={cn(
                        "elastic-caption-content",
                        isHorizontal && !isActive && "elastic-caption-content--vertical",
                        isSelected && "elastic-caption-content--selected",
                      )}
                    >
                      {isSelected ? (
                        <p className="elastic-caption-slot-tag">
                          {item.slotNumber} // 12
                        </p>
                      ) : null}
                      <p className="elastic-caption-title">{item.title}</p>
                      {isActive && item.description ? (
                        <p className="elastic-caption-desc">{item.description}</p>
                      ) : null}
                    </div>
                  </motion.div>

                  {/* Navigation controls when selected */}
                  {isSelected && showNavigation ? (
                    <div className="elastic-nav-bar">
                      <div className="elastic-nav-arrows">
                        {populatedItems.length > 1 && (
                          <>
                            <button
                              aria-label="Previous image"
                              className="elastic-nav-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                moveSelection(-1);
                              }}
                              type="button"
                            >
                              ‹
                            </button>
                            <button
                              aria-label="Next image"
                              className="elastic-nav-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                moveSelection(1);
                              }}
                              type="button"
                            >
                              ›
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        aria-label="Close featured view (Escape)"
                        className="elastic-nav-btn elastic-nav-btn--close"
                        onClick={(event) => {
                          event.stopPropagation();
                          closeFeaturedView();
                        }}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                /* Empty slot placeholder */
                <div
                  className="elastic-slat-empty"
                  aria-label={`Empty slot ${item.slotNumber}`}
                >
                  <div className="elastic-empty-badge">
                    <span className="elastic-empty-num elastic-reel__empty-num">{item.slotNumber}</span>
                    <span className="elastic-empty-label">SLOT</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function ElasticReel(props) {
  return <HoverExpand {...props} />;
}
