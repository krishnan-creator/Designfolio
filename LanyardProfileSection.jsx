import React, { useState, useEffect, useRef } from 'react';
import Lanyard from './Lanyard';
import './LanyardProfileSection.css';

// 5 Tools for 01 / FOUNDATIONS in exact order: ComfyUI, Antigravity, Qwen, Higgsfield, ElevenLabs
const FOUNDATIONS_TOOLS = [
  'ComfyUI',
  'Antigravity',
  'Qwen',
  'Higgsfield',
  'ElevenLabs'
];

const FOUNDATIONS_ICONS = {
  'ComfyUI': (
    <img
      src="logo-comfyui.png"
      alt="ComfyUI"
      className="foundation-icon-img"
      style={{ borderRadius: '6px' }}
    />
  ),
  'Antigravity': (
    <img
      src="logo-antigravity.png"
      alt="Antigravity"
      className="foundation-icon-img"
    />
  ),
  'Qwen': (
    <img
      src="logo-qwen.png"
      alt="Qwen"
      className="foundation-icon-img"
    />
  ),
  'Higgsfield': (
    <img
      src="logo-higgsfield.png"
      alt="Higgsfield"
      className="foundation-icon-img"
      style={{ borderRadius: '6px' }}
    />
  ),
  'ElevenLabs': (
    <img
      src="logo-elevenlabs.png"
      alt="ElevenLabs"
      className="foundation-icon-img"
      style={{ borderRadius: '6px' }}
    />
  )
};

// 5 Skill Categories for 02 / CREATIVE SKILLS (Clean titles, restrained icons, concise sub-skills)
const CREATIVE_SKILLS = [
  {
    id: 'creative-intelligence',
    title: 'CREATIVE INTELLIGENCE',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
      </svg>
    ),
    subskills: [
      'AI Art Direction',
      'Prompting',
      'Multimodal Ideas',
      'Reference Control',
      'Style Systems'
    ]
  },
  {
    id: 'visual-development',
    title: 'VISUAL DEVELOPMENT',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    subskills: [
      'Concept Art',
      'Character Design',
      'Worldbuilding',
      'Light & Composition',
      'Props & Assets'
    ]
  },
  {
    id: 'cinematic-preproduction',
    title: 'CINEMATIC PREPRODUCTION',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    subskills: [
      'Narrative Design',
      'Storyboards',
      'Shot Lists',
      'Camera & Lens',
      'Screen Continuity'
    ]
  },
  {
    id: 'ai-filmmaking-motion',
    title: 'AI FILMMAKING & MOTION',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    ),
    subskills: [
      'Image-to-Video',
      'Motion Design',
      'Performance Control',
      'Multi-Shot Flow',
      'Lip Sync'
    ]
  },
  {
    id: 'pipeline-engineering',
    title: 'PRODUCTION & PIPELINE ENGINEERING',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <path d="M10 6.5h4M10 17.5h4M6.5 10v4M17.5 10v4" />
      </svg>
    ),
    subskills: [
      'Compositing',
      'Inpaint / Outpaint',
      'AI Sound',
      'Pipeline Orchestration',
      'Model Evaluation'
    ]
  }
];

// Career Stages Distinctive Larger Icons (28-36px, consistent 1.8 stroke, strongly icon-led)
const CAREER_ICONS = {
  'ARTIST': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.97-4.48-9-10-9z" />
      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" />
      <circle cx="10.5" cy="7.5" r="1.5" fill="currentColor" />
      <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" />
      <circle cx="17.5" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
  ),
  'DESIGNER': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  'UX DESIGNER': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  ),
  'DESIGN ENGINEER': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  ),
  'AI ARTIST': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.6 6.8L22 12l-7.4 3.2L12 22l-2.6-6.8L2 12l7.4-3.2z" />
    </svg>
  ),
  'CREATIVE DIRECTOR': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 8h20" />
      <path d="M6 4l2 4" />
      <path d="M11 4l2 4" />
      <path d="M16 4l2 4" />
      <polygon points="10 12 15 15 10 18 10 12" fill="currentColor" stroke="none" />
    </svg>
  )
};

const CAREER_STAGES = [
  {
    id: 'ARTIST',
    step: '01',
    label: 'ARTIST',
    sub: 'Visual & Analog Foundations',
    desc: 'Built a foundation in drawing, composition and visual storytelling.'
  },
  {
    id: 'DESIGNER',
    step: '02',
    label: 'DESIGNER',
    sub: 'Brand & Typographic Systems',
    desc: 'Translated artistic ideas into structured visual communication.'
  },
  {
    id: 'UX DESIGNER',
    step: '03',
    label: 'UX DESIGNER',
    sub: 'Interaction Logic & Mental Models',
    desc: 'Connected visual design with clearer, more usable experiences.'
  },
  {
    id: 'DESIGN ENGINEER',
    step: '04',
    label: 'DESIGN ENGINEER',
    sub: 'Design Tokens & Code Architecture',
    desc: 'Linked design systems with practical interactive implementation.'
  },
  {
    id: 'AI ARTIST',
    step: '05',
    label: 'AI ARTIST',
    sub: 'Diffusion Pipelines & Film Look-Dev',
    desc: 'Expanded visual production through generative tools and repeatable creative workflows.'
  },
  {
    id: 'CREATIVE DIRECTOR',
    step: '06',
    label: 'CREATIVE DIRECTOR',
    sub: 'Synthetic Film Pipelines & Leadership',
    desc: 'Connects art direction, generative AI and cinematic production into one creative vision.'
  }
];

function detectDocumentTheme() {
  if (typeof document === 'undefined') return 'dark';
  const el = document.documentElement;
  const theme = el.getAttribute('data-theme') || el.getAttribute('data-mode') || '';
  if (theme.toLowerCase().includes('light')) return 'light';
  if (theme.toLowerCase().includes('dark')) return 'dark';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function LanyardProfileSection({
  theme = 'auto',
  frontImage = 'ID Front(6).png',
  backImage = 'ID Back(1).png',
  strapImage = 'ID tag(1).png',
  dragInstructionText = 'TAP & DRAG THE ID',
  name = 'C. BALA KRISHNAN',
  badge = '05 / THE CORE // IDENTITY & PRACTICE',
  foundations: customFoundations,
  creativeSkills: customCreativeSkills,
  careerStages: customCareerStages,
  className = '',
}) {
  const [, setTick] = useState(0);
  const docTheme = typeof document !== 'undefined' ? detectDocumentTheme() : null;
  const activeTheme = docTheme || ((theme === 'light' || theme === 'dark') ? theme : 'dark');

  const careerStagesList = Array.isArray(customCareerStages) && customCareerStages.length > 0
    ? customCareerStages
    : CAREER_STAGES;

  const foundationsList = Array.isArray(customFoundations) && customFoundations.length > 0
    ? customFoundations
    : FOUNDATIONS_TOOLS;

  const creativeSkillsList = Array.isArray(customCreativeSkills) && customCreativeSkills.length > 0
    ? customCreativeSkills
    : CREATIVE_SKILLS;
  
  // Career Map state
  const [selectedStageId, setSelectedStageId] = useState('CREATIVE DIRECTOR');
  const [hoveredStageId, setHoveredStageId] = useState(null);
  
  // Creative Skills hover & tap state
  const [activeSkillIndex, setActiveSkillIndex] = useState(null);
  const closeTimeoutRef = useRef(null);

  const [introTrigger, setIntroTrigger] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => setTick(t => t + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    return () => observer.disconnect();
  }, []);

  // Viewport intersection triggers natural hanging swing settling when section enters view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let hasLeft = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasLeft) {
        hasLeft = false;
        setIntroTrigger(prev => prev + 1);
      } else if (!entry.isIntersecting) {
        hasLeft = true;
      }
    }, { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const activeStage = careerStagesList.find(s => s.id === (hoveredStageId || selectedStageId) || s.label === (hoveredStageId || selectedStageId)) || careerStagesList[careerStagesList.length - 1] || {};

  const lanyardColors = activeTheme === 'dark'
    ? { cardColor: '#0A0A0C', strapColor: '#BFC0C6', metal: 'graphite' }
    : { cardColor: '#FFFFFF', strapColor: '#171719', metal: 'silver' };

  // Creative skills hover interaction handlers (unified boundary)
  const handleSkillHover = (index) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveSkillIndex(index);
  };

  const handleZoneEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleZoneLeave = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setActiveSkillIndex(null);
    }, 140);
  };

  const handleSkillClick = (index) => {
    setActiveSkillIndex(prev => prev === index ? null : index);
  };

  return (
    <div
      ref={sectionRef}
      className={`lanyard-glass-panel-wrapper ${className}`.trim()}
      data-theme={activeTheme}
    >
      <section
        className="lanyard-profile-section"
        aria-label="C. Bala Krishnan profile, foundations, creative skills and career skill map"
      >
        {/* LEFT COLUMN: 3D INTERACTIVE LANYARD BADGE WITH CLEAR INSTRUCTION */}
        <div className="lanyard-profile-section__visual">
          {/* Small, understated technical metadata instruction directly above card */}
          <div className="lanyard-drag-instruction" aria-label={dragInstructionText}>
            <span className="lanyard-drag-dot" aria-hidden="true" />
            <span className="lanyard-drag-text">{dragInstructionText}</span>
          </div>

          <Lanyard
            frontImage={frontImage}
            backImage={backImage}
            strapImage={strapImage}
            imageFit="contain"
            cardColor={lanyardColors.cardColor}
            orientation="portrait"
            finish="matte"
            cornerRadius={0.28}
            size={0.72}
            anchor="center"
            strapLength={0.30}
            strapColor={lanyardColors.strapColor}
            strapWidth={0.62}
            metal={lanyardColors.metal}
            gravity={0.35}
            damping={0.48}
            elasticity={0.2}
            breeze={0.08}
            interactive
            intro={true}
            introTrigger={introTrigger}
          />
        </div>

        {/* RIGHT COLUMN: PERSONAL CONTEXT, 01 / FOUNDATIONS, 02 / CREATIVE SKILLS, 03 / CAREER SKILL MAP */}
        <div className="lanyard-profile-section__content">
          <header className="lanyard-profile-section__header">
            <span className="lanyard-profile-section__badge">{badge}</span>
            <h2 className="lanyard-profile-section__name">{name}</h2>
          </header>

          {/* 01 / FOUNDATIONS */}
          <section className="lanyard-profile-section__block" aria-labelledby="foundations-title">
            <h3 className="lanyard-profile-section__heading" id="foundations-title">
              <span className="lanyard-profile-section__index">01 /</span>
              <span>FOUNDATIONS</span>
            </h3>
            <div className="foundations-grid" role="list">
              {foundationsList.map((toolItem) => {
                const toolName = typeof toolItem === 'string' ? toolItem : (toolItem.name || '');
                const toolLogo = typeof toolItem === 'object' && toolItem.logo ? toolItem.logo : null;
                const icon = toolLogo ? (
                  <img src={toolLogo} alt={toolName} className="foundation-icon-img" style={{ borderRadius: '6px' }} />
                ) : (
                  FOUNDATIONS_ICONS[toolName] || (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M8 12h8" />
                    </svg>
                  )
                );
                return (
                  <div
                    className="foundation-card"
                    key={toolName}
                    tabIndex={0}
                    role="listitem"
                  >
                    <div className="foundation-icon" aria-hidden="true">
                      {icon}
                    </div>
                    <span className="foundation-name">{toolName}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 02 / CREATIVE SKILLS (Exact five category tiles with clean titles, restrained icons, surface inversion) */}
          <section className="lanyard-profile-section__block" aria-labelledby="creative-skills-title">
            <div className="creative-skills-header-row">
              <h3 className="lanyard-profile-section__heading" id="creative-skills-title">
                <span className="lanyard-profile-section__index">02 /</span>
                <span>CREATIVE SKILLS</span>
              </h3>
              <span className="creative-skills-instruction">Hover or tap category to inspect sub-skills</span>
            </div>

            <div
              className="creative-skills-interactive-zone"
              onMouseEnter={handleZoneEnter}
              onMouseLeave={handleZoneLeave}
            >
              {/* FIVE PRIMARY CATEGORY TILES ARRANGED HORIZONTALLY — ONLY ICON & TITLE */}
              <div className="creative-skills-grid" role="list">
                {creativeSkillsList.map((skill, idx) => {
                  const isActive = activeSkillIndex === idx;
                  const defaultSkill = CREATIVE_SKILLS[idx] || CREATIVE_SKILLS.find(s => s.id === skill.id);
                  const icon = skill.icon || defaultSkill?.icon || (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  );
                  return (
                    <button
                      key={skill.id || idx}
                      type="button"
                      className={`creative-skill-card ${isActive ? 'is-active' : ''}`}
                      onMouseEnter={() => handleSkillHover(idx)}
                      onClick={() => handleSkillClick(idx)}
                      onFocus={() => handleSkillHover(idx)}
                      aria-expanded={isActive}
                      role="listitem"
                    >
                      <div className="creative-skill-icon" aria-hidden="true">
                        {icon}
                      </div>
                      <span className="creative-skill-title">{skill.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* REVEALED SUB-SKILLS: COMPACT HORIZONTAL ROW IN SPACE DIRECTLY BELOW */}
              <div className={`creative-subskills-wrapper ${activeSkillIndex !== null ? 'is-open' : ''}`}>
                {activeSkillIndex !== null && creativeSkillsList[activeSkillIndex] ? (
                  <div className="creative-subskills-row" role="region" aria-label="Revealed sub-skills">
                    {(creativeSkillsList[activeSkillIndex].subskills || creativeSkillsList[activeSkillIndex].capabilities || []).map((sub, i) => (
                      <div
                        key={sub}
                        className="creative-subskill-chip"
                        style={{ animationDelay: `${i * 35}ms` }}
                      >
                        {sub}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="creative-subskills-close"
                      onClick={() => setActiveSkillIndex(null)}
                      aria-label="Close revealed sub-skills"
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="creative-subskills-placeholder">
                    <span className="creative-subskills-hint">Hover over any creative skill tile above to reveal capabilities</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 03 / CAREER SKILL MAP: 6 STRONGLY ICON-LED TILES (BIGGER ICONS, TITLES BELOW, NO NUMBERS) */}
          <section className="lanyard-profile-section__block" aria-labelledby="career-map-title">
            <div className="lanyard-timeline-header-row">
              <h3 className="lanyard-profile-section__heading" id="career-map-title">
                <span className="lanyard-profile-section__index">03 /</span>
                <span>CAREER SKILL MAP</span>
              </h3>
              <span className="lanyard-timeline-instruction">Horizontal career progression · Select stage to inspect</span>
            </div>

            {/* 6 INDEPENDENT TILES: BIGGER ICONS NEAR TOP, TITLE DIRECTLY BELOW, ZERO RED LINE */}
            <div className="career-map-container" role="tablist" aria-label="Career stage progression">
              <div className="career-tiles-grid">
                {careerStagesList.map((stage) => {
                  const isSelected = selectedStageId === stage.id || selectedStageId === stage.label;
                  const isHovered = hoveredStageId === stage.id || hoveredStageId === stage.label;
                  const icon = stage.icon || CAREER_ICONS[stage.label] || CAREER_ICONS[stage.id] || (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                    </svg>
                  );

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      tabIndex={0}
                      className={`career-tile-card ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`}
                      onClick={() => setSelectedStageId(stage.id)}
                      onMouseEnter={() => setHoveredStageId(stage.id)}
                      onMouseLeave={() => setHoveredStageId(null)}
                      onFocus={() => setHoveredStageId(stage.id)}
                      onBlur={() => setHoveredStageId(null)}
                    >
                      <div className="career-tile-icon" aria-hidden="true">
                        {icon}
                      </div>
                      <span className="career-tile-role">{stage.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RICH CONTEXTUAL DETAIL PANEL BENEATH TIMELINE — FULL DETAILS PRESERVED */}
            <div className="career-timeline-detail-panel" aria-live="polite">
              <div className="detail-panel-header">
                <div className="detail-panel-role">
                  <span className="detail-panel-step">STAGE {activeStage.step || ''} //</span>
                  <span className="detail-panel-title">{activeStage.label || ''}</span>
                  <span className="detail-panel-sep">·</span>
                  <span className="detail-panel-sub">{activeStage.sub || ''}</span>
                </div>
              </div>
              <p className="detail-panel-desc">{activeStage.desc || ''}</p>
            </div>

            <p className="lanyard-profile-section__tagline">The journey behind the practice.</p>
          </section>
        </div>
      </section>
    </div>
  );
}
