'use client';

import React from 'react';
import ScrollStack, { ScrollStackItem } from './ScrollStack';

const CINEMATIC_ENTRIES = [
  {
    id: 'btf-01',
    slotNumber: '01',
    title: 'RAMAYANA',
    category: '01 // GENERATIVE AI × VFX',
    desc: 'At DNEG, I built 2D/3D AI workflows for realistic face replacement and lip-sync.',
    image: '1_Ram.png',
    position: 'center 40%'
  },
  {
    id: 'btf-02',
    slotNumber: '02',
    title: 'VEER BHADRA',
    category: '02 // AI FILMMAKING',
    desc: 'Shaped the film from character design and scripting to direction and final sequences.',
    image: 'VB.png',
    position: 'center 48%'
  },
  {
    id: 'btf-03',
    slotNumber: '03',
    title: 'FIRMWARE UPDATE',
    category: '03 // GENERATIVE AI PRODUCTION',
    desc: 'Transformed the director’s vision into AI-generated characters, worlds, and cinematic sequences.',
    image: 'Firmware.png',
    position: 'center 26%'
  },
  {
    id: 'btf-04',
    slotNumber: '04',
    title: 'ASHRA Cinematic Universe',
    category: '04 // SOLO CREATIVE IP',
    desc: 'Created everything from concept and world-building to music, branding, and final film.',
    image: 'Ashra.png',
    position: 'center center'
  },
  {
    id: 'btf-05',
    slotNumber: '05',
    title: 'HORNS & SKULL',
    category: '05 // REIMAGINED COMIC & SHOTS',
    desc: 'Building a Marvel-inspired universe reimagined in Indian Version.',
    image: 'horns.png',
    position: 'center 36%'
  },
  {
    id: 'btf-06',
    slotNumber: '06',
    title: 'DUNE LOOK-DEV',
    category: '06 // STUDIO PIPELINE & VFX',
    desc: 'Visual exploration for cinematic environments, lighting and atmospheric composition.',
    image: 'dune-dneg.jpg',
    position: 'center 48%'
  },
  {
    id: 'btf-07',
    slotNumber: '07',
    title: 'ENVIRONMENT DESIGN',
    category: '07 // PLANETARY WORLD BUILDING',
    desc: 'Atmosphere, planetary scale and environment composition for feature film narratives.',
    image: 'media_1791962972986.png',
    position: 'center center'
  },
  {
    id: 'btf-08',
    slotNumber: '08',
    title: 'AI FILMMAKING',
    category: '08 // GENERATIVE FLOWS',
    desc: 'Generative image-to-video creative workflows and multi-shot synthetic film pipelines.',
    image: 'media_1791977571390.png',
    position: 'center 38%'
  },
  {
    id: 'btf-09',
    slotNumber: '09',
    title: 'MYTHIC WORLDS',
    category: '09 // CONCEPT & LORE',
    desc: 'Original mythological world development and synthetic epic atmosphere.',
    image: 'Ramayana.png',
    position: 'center 40%'
  }
];

function CinematicBanner({ entry, isLight }) {
  const hasImage = Boolean(entry && entry.image && entry.image.trim());

  return (
    <div className="beyond-frame-card__inner">
      {hasImage ? (
        <img
          src={entry.image}
          alt={`${entry.title} — ${entry.category}`}
          className="beyond-frame-card__image"
          style={{ objectPosition: entry.position || 'center center' }}
          loading="eager"
          draggable={false}
        />
      ) : (
        <div
          className="beyond-frame-card__image"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isLight ? '#eae8e2' : '#141418',
            color: isLight ? '#777' : '#888',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            letterSpacing: '0.1em'
          }}
        >
          <span>CINEMATIC SLOT READY FOR ASSET</span>
        </div>
      )}

      {/* Restrained dark gradient behind the text in lower-left only */}
      <div className="beyond-frame-card__gradient" aria-hidden="true" />

      {/* Content overlay */}
      <div className="beyond-frame-card__content">
        <div className="beyond-frame-card__badge">
          <span className="beyond-frame-card__badge-dot" />
          <span>{entry.category}</span>
        </div>
        <h3 className="beyond-frame-card__title">{entry.title}</h3>
        <p className="beyond-frame-card__desc">{entry.desc}</p>
      </div>

      <div className="beyond-frame-card__ratio-badge" aria-hidden="true">
        <span>4:1 BANNER // 1584×396</span>
      </div>
    </div>
  );
}

export default function BeyondTheFrame({ theme = 'dark', entries }) {
  const isLight = theme === 'light';
  // Ensure exactly 9 items are rendered with stable IDs
  const activeEntries = (Array.isArray(entries) && entries.length === 9)
    ? entries
    : Array.from({ length: 9 }, (_, idx) => {
        const fallback = CINEMATIC_ENTRIES[idx];
        const raw = (Array.isArray(entries) ? entries[idx] : null) || fallback;
        return {
          ...fallback,
          ...raw,
          id: fallback.id,
          slotNumber: fallback.slotNumber
        };
      });

  return (
    <ScrollStack showPaddingCues={true} theme={theme}>
      {activeEntries.map((entry, idx) => (
        <ScrollStackItem key={entry.id || `btf-0${idx + 1}`} index={idx}>
          <CinematicBanner entry={entry} isLight={isLight} />
        </ScrollStackItem>
      ))}
    </ScrollStack>
  );
}
