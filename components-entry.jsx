import React from 'react';
import ReactDOM from 'react-dom/client';
import TechText from './TechText';
import DomeGallery, { DEFAULT_ORBIT_IMAGES } from './DomeGallery';
import WireTerrainScan from './WireTerrainScan';
import BackgroundCubesGrid from './BackgroundCubesGrid';
import SplashCursor from './SplashCursor';
import BeyondTheFrame from './BeyondTheFrame';
import LanyardProfileSection from './LanyardProfileSection';
import ElasticReel from './ElasticReel';
import ThrineModel from './ThrineModel';
import './ElasticReel.css';
import './ScrollStack.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary error in ' + (this.props.name || 'Component') + ':', error.message, error.stack);
  }
  render() {
    if (this.state.hasError) {
      return <div className="render-error" style={{ color: 'red', padding: 8 }}>Render Error in {this.props.name}: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

const roots = new WeakMap();

function getOrCreateRoot(container) {
  let root = roots.get(container);
  if (!root) {
    root = ReactDOM.createRoot(container);
    roots.set(container, root);
  }
  return root;
}

// 1. Mount TechText in Header for DESIGNFOLIO wordmark
window.mountTechText = function(containerId, options = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;
  const root = getOrCreateRoot(container);
  const defaultProps = {
    text: "DESIGNFOLIO",
    fontWeight: 600,
    fontSize: 10,
    reveal: "letter",
    dashLength: 2,
    dashGap: 1,
    specks: 4,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#F2F2F2",
    accentColor: "#E62929",
    letterSpacing: 0.22,
    reach: 40,
    softness: 0.7,
    strokeWidth: 0.8,
    speed: 0.8,
    lineStyle: "dashed",
    selection: false,
    labels: false,
    draggable: false,
    sweep: true
  };
  const props = { ...defaultProps, ...options };
  root.render(<TechText {...props} />);
  return root;
};

// 2. Mount WireTerrainScan for Post-Hero Dark theme background (Preserved strictly)
window.mountWireTerrainScan = function(containerId, options = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;
  const root = getOrCreateRoot(container);
  let currentProps = { ...options };
  root.render(<ErrorBoundary name="WireTerrainScan"><WireTerrainScan {...currentProps} /></ErrorBoundary>);
  return {
    root,
    update(newProps) {
      currentProps = { ...currentProps, ...newProps };
      root.render(<ErrorBoundary name="WireTerrainScan"><WireTerrainScan {...currentProps} /></ErrorBoundary>);
    },
    unmount() {
      root.unmount();
      roots.delete(container);
    }
  };
};

window.mountContourTide = window.mountWireTerrainScan;
window.mountHyperspeed = window.mountWireTerrainScan;

// 3. Mount BackgroundCubesGrid for Light Theme ONLY (Monochromatic technical Nothing-style palette)
window.mountBackgroundCubesGrid = function(containerId, options = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;
  const root = getOrCreateRoot(container);
  const defaultProps = {
    cellSize: 120,
    gap: 0.03,
    topColor: '#F4F3F0',
    leftColor: '#E5E4E0',
    rightColor: '#D6D5D1',
    amplitude: 0.6,
    speed: 6.5,
    damping: 0.08,
    idleRipples: true,
    idleDelay: 2.0,
    glowColor: '#A9A8A3',
    glow: 0.3
  };
  let currentProps = { ...defaultProps, ...options };
  root.render(<ErrorBoundary name="BackgroundCubesGrid"><BackgroundCubesGrid {...currentProps} /></ErrorBoundary>);
  return {
    root,
    update(newProps) {
      currentProps = { ...currentProps, ...newProps };
      root.render(<ErrorBoundary name="BackgroundCubesGrid"><BackgroundCubesGrid {...currentProps} /></ErrorBoundary>);
    },
    unmount() {
      root.unmount();
      roots.delete(container);
    }
  };
};

// Replace old gradient wave mounts with the new cubes grid
window.mountGradientWaves = window.mountBackgroundCubesGrid;
window.mountWaveGridBackground = window.mountBackgroundCubesGrid;

// 4. Mount SplashCursor Dark Theme Pointer Fluid (Post-Hero only, preserved strictly)
window.mountSplashCursor = function(containerId, options = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;
  const root = getOrCreateRoot(container);
  const defaultProps = {
    DENSITY_DISSIPATION: 3.5,
    VELOCITY_DISSIPATION: 2,
    PRESSURE: 0.1,
    CURL: 3,
    SPLAT_RADIUS: 0.2,
    SPLAT_FORCE: 6000,
    COLOR_UPDATE_SPEED: 10,
    SHADING: true,
    RAINBOW_MODE: false,
    COLOR: "#A855F7"
  };
  let currentProps = { ...defaultProps, ...options };
  root.render(<SplashCursor {...currentProps} />);
  return {
    root,
    update(newProps) {
      currentProps = { ...currentProps, ...newProps };
      root.render(<SplashCursor {...currentProps} />);
    },
    unmount() {
      root.unmount();
      roots.delete(container);
    }
  };
};

// 5. Mount BeyondTheFrame (rebuilt with ScrollStack and 5 cinematic cards)
window.mountBeyondTheFrame = function(containerId, options = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;
  const root = getOrCreateRoot(container);
  let currentProps = { ...options };
  root.render(<ErrorBoundary name="BeyondTheFrame"><BeyondTheFrame {...currentProps} /></ErrorBoundary>);
  return {
    root,
    update(newProps) {
      currentProps = { ...currentProps, ...newProps };
      root.render(<ErrorBoundary name="BeyondTheFrame"><BeyondTheFrame {...currentProps} /></ErrorBoundary>);
    },
    unmount() {
      root.unmount();
      roots.delete(container);
    }
  };
};

window.mountMorphSlider = window.mountBeyondTheFrame;

// 6. Mount DomeGallery for Visual Orbit (EXACTLY 40 REAL POPULATED ASSETS, ZERO EMPTY TILES)
const DEFAULT_ORBIT_SLOTS = DEFAULT_ORBIT_IMAGES;

window.mountDomeGallery = function(containerId, options = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;
  const root = getOrCreateRoot(container);
  const defaultProps = {
    images: DEFAULT_ORBIT_SLOTS,
    fit: 0.8,
    minRadius: 710,
    maxRadius: 860,
    maxVerticalRotationDeg: 0,
    segments: 10,
    dragDampening: 4.6,
    grayscale: false,
    theme: "auto"
  };
  let currentProps = { ...defaultProps, ...options };
  root.render(<ErrorBoundary name="DomeGallery"><DomeGallery {...currentProps} /></ErrorBoundary>);
  return {
    root,
    update(newProps) {
      currentProps = { ...currentProps, ...newProps };
      root.render(<ErrorBoundary name="DomeGallery"><DomeGallery {...currentProps} /></ErrorBoundary>);
    },
    unmount() {
      root.unmount();
      roots.delete(container);
    }
  };
};

// 6.1 Mount ElasticReel (Elastic Gallery) for Hobbies (12 UNIQUE SLOTS, INITIALLY ALL EMPTY)
const DEFAULT_HOBBY_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return {
    id: `hobby-${num}`,
    slotNumber: num,
    image: '',
    src: '',
    alt: `Empty slot ${num}`,
    title: `Hobby ${num}`,
    description: ''
  };
});

window.mountElasticReel = function(containerId, options = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;
  const root = getOrCreateRoot(container);
  const defaultProps = {
    items: DEFAULT_HOBBY_SLOTS,
    expandedFlex: 6,
    collapsedFlex: 0.72,
    selectedFlex: 7.5,
    showNavigation: true
  };
  let currentProps = { ...defaultProps, ...options };
  root.render(<ErrorBoundary name="ElasticReel"><ElasticReel {...currentProps} /></ErrorBoundary>);
  return {
    root,
    update(newProps) {
      currentProps = { ...currentProps, ...newProps };
      root.render(<ErrorBoundary name="ElasticReel"><ElasticReel {...currentProps} /></ErrorBoundary>);
    },
    unmount() {
      root.unmount();
      roots.delete(container);
    }
  };
};

// 7. Mount LanyardProfileSection for THE CORE
window.mountLanyardProfileSection = function(containerId, options = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;
  const root = getOrCreateRoot(container);
  const defaultProps = {
    theme: 'auto',
    frontImage: 'ID Front(6).png',
    backImage: 'ID Back(1).png',
    strapImage: 'ID tag(1).png'
  };
  let currentProps = { ...defaultProps, ...options };
  root.render(<ErrorBoundary name="LanyardProfileSection"><LanyardProfileSection {...currentProps} /></ErrorBoundary>);
  return {
    root,
    update(newProps) {
      currentProps = { ...currentProps, ...newProps };
      root.render(<ErrorBoundary name="LanyardProfileSection"><LanyardProfileSection {...currentProps} /></ErrorBoundary>);
    },
    unmount() {
      root.unmount();
      roots.delete(container);
    }
  };
};

// 8. Mount Thrine 3D Model for LET'S BUILD contact section
window.mountThrineModel = function(containerId, options = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;
  const root = getOrCreateRoot(container);
  let currentProps = { ...options };
  root.render(<ErrorBoundary name="ThrineModel"><ThrineModel {...currentProps} /></ErrorBoundary>);
  return {
    root,
    update(newProps) {
      currentProps = { ...currentProps, ...newProps };
      root.render(<ErrorBoundary name="ThrineModel"><ThrineModel {...currentProps} /></ErrorBoundary>);
    },
    unmount() {
      root.unmount();
      roots.delete(container);
    }
  };
};

window.clientBundleReady = true;
if (typeof window !== 'undefined') {
  window.dispatchEvent(new Event('clientBundleReady'));
}
