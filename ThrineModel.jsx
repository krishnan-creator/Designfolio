import React from 'react';

/**
 * ThrineModel - Reusable React Component for Thrine 3D Model Embed
 * Renders the single unified 3D model-embed custom element across both light and dark themes.
 * Project ID: e_d9b05f3677dd12bf8341
 * Aspect ratio: 1259 / 787
 */
export default function ThrineModel({ theme = 'dark' }) {
  const isLight = theme === 'light';
  const project = 'e_d9b05f3677dd12bf8341';
  const aspectRatio = '1259 / 787';
  const key = 'thrine-model-main';

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
          transform: 'scale(1.05)',
          transformOrigin: 'center center',
          background: 'transparent'
        }}
      />
    </div>
  );
}
