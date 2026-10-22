import React from 'react';

/**
 * ThrineModel - Reusable React Component for Thrine 3D Model Embed
 * Renders the appropriate model-embed custom element based on the active website theme.
 * Dark theme:  project e_677e5a3e01da81420ed5, aspect-ratio: 729/643
 * Light theme: project e_6cab7e12cb7be5a21c8c, aspect-ratio: 672/638
 */
export default function ThrineModel({ theme = 'dark' }) {
  const isLight = theme === 'light';
  const project = isLight ? 'e_6cab7e12cb7be5a21c8c' : 'e_677e5a3e01da81420ed5';
  const aspectRatio = isLight ? '672 / 638' : '729 / 643';
  const key = `thrine-model-${isLight ? 'light' : 'dark'}-${project}`;

  return (
    <div className="thrine-model-wrapper" data-theme={isLight ? 'light' : 'dark'}>
      <model-embed
        key={key}
        project={project}
        restrict="transparent"
        style={{
          display: 'block',
          width: '100%',
          aspectRatio: aspectRatio,
          background: 'transparent',
          maskImage: 'radial-gradient(circle at 50% 50%, black 50%, rgba(0, 0, 0, 0) 72%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 50%, rgba(0, 0, 0, 0) 72%)'
        }}
      />
    </div>
  );
}
