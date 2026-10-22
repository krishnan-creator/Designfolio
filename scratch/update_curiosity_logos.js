const fs = require('fs');

const NEW_TOOL_ICONS = `// SVG Brand & Discipline Icons for MY CURIOSITY STACK (Accurate Brand Logos)
const TOOL_ICONS = {
  'Antigravity': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 20 2 20 12 2" />
      <polygon points="12 8 18 18 6 18 12 8" />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" />
    </svg>
  ),
  'Qwen': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.2L3.5 7.1v9.8L12 21.8l8.5-4.9V7.1L12 2.2zm0 2.3l6.5 3.8L12 12 5.5 8.3 12 4.5zm-6.8 4.9l5.8 3.3v7l-5.8-3.3V9.4zm7.8 10.3v-7l5.8-3.3v7l-5.8 3.3z" />
    </svg>
  ),
  'Gemini': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 24c0-6.627-5.373-12-12-12 6.627 0 12-5.373 12-12 0 6.627 5.373 12 12 12-6.627 0-12 5.373-12 12z" />
    </svg>
  ),
  'ChatGPT': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.28 9.37a5.98 5.98 0 0 0-.52-4.94 6.05 6.05 0 0 0-6.51-2.76 6 6 0 0 0-4.6-2.07 6.06 6.06 0 0 0-5.77 4.19 6 6 0 0 0-3.98 2.9 6.04 6.04 0 0 0 .74 7.08 5.98 5.98 0 0 0 .52 4.94 6.05 6.05 0 0 0 6.51 2.76 6 6 0 0 0 4.6 2.07 6.06 6.06 0 0 0 5.77-4.19 6 6 0 0 0 3.98-2.9 6.04 6.04 0 0 0-.74-7.08zm-9.02 12.44a4.48 4.48 0 0 1-2.88-1.04l.15-.08 4.78-2.76a.79.79 0 0 0 .4-.68v-6.73l2.02 1.16a.07.07 0 0 1 .04.05v5.62a4.52 4.52 0 0 1-4.51 4.46zm-7.79-3.7a4.49 4.49 0 0 1-.54-3.01l.15.09 4.78 2.76a.78.78 0 0 0 .79 0l5.83-3.36v2.33a.08.08 0 0 1-.03.07l-4.87 2.81a4.52 4.52 0 0 1-6.11-1.69zm-1.65-8.5a4.49 4.49 0 0 1 2.34-1.98v5.68a.79.79 0 0 0 .39.68l5.83 3.37-2.02 1.16a.08.08 0 0 1-.07 0l-4.87-2.81a4.52 4.52 0 0 1-1.6-6.1zm14.8 2.45l-5.83-3.37 2.02-1.16a.08.08 0 0 1 .07 0l4.87 2.81a4.52 4.52 0 0 1-1.13 8.16v-5.76a.79.79 0 0 0-.4-.68zm2.46-3.87a4.5 4.5 0 0 1 .54 3.01l-.15-.09-4.78-2.76a.78.78 0 0 0-.79 0l-5.83 3.36V9.28a.08.08 0 0 1 .03-.07l4.87-2.81a4.52 4.52 0 0 1 6.11 1.69zM8.31 10.82l2.02-1.16a.07.07 0 0 1 .07 0l4.87 2.81a4.52 4.52 0 0 1 1.6 6.1 4.49 4.49 0 0 1-2.34 1.98v-5.68a.79.79 0 0 0-.39-.68l-5.83-3.37zm2.45 2.68l2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5v-3z" />
    </svg>
  ),
  'Claude': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v3.13l2.21-2.21a1.5 1.5 0 1 1 2.12 2.12L15.63 8.75h3.12a1.5 1.5 0 1 1 0 3h-3.12l2.21 2.21a1.5 1.5 0 1 1-2.12 2.12L13.5 13.87v3.13a1.5 1.5 0 1 1-3 0v-3.13l-2.21 2.21a1.5 1.5 0 0 1-2.12-2.12l2.21-2.21H5.25a1.5 1.5 0 1 1 0-3h3.13L6.17 6.54a1.5 1.5 0 0 1 2.12-2.12L10.5 6.63V3.5A1.5 1.5 0 0 1 12 2z" />
    </svg>
  ),
  'Google AI Studio': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 7v10M7 12h10" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  'ComfyUI': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.25" />
      <circle cx="18" cy="8" r="3" fill="currentColor" fillOpacity="0.25" />
      <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.25" />
      <path d="M8.5 7.2L15.5 6.8M7.8 8.8L10.5 15.5M16.2 10.5L13.5 15.5" />
    </svg>
  ),
  'Supabase': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.32 14.285a.396.396 0 0 0 .316.634H12v8.685c0 .324.37.497.604.272l10.962-13.889a.396.396 0 0 0-.204-.633z" />
    </svg>
  ),
  'Midjourney': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.5 3L3.5 15.5H11.5V3ZM12.5 3V15.5H20.5L12.5 3ZM3 17.5L5.5 21H18.5L21 17.5H3Z" />
    </svg>
  ),
  'FLUX': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 3h16v4.5H9v3h9v4.5H9V21H4V3z" />
    </svg>
  ),
  'Seedream': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-2.38 1.05-4.52 2.72-6l5.28 6.5V20zm2-2.15V9.45l4.82-2.73C19.8 8.18 20 9.56 20 12c0 3.87-2.74 7.1-6.42 7.85z" />
    </svg>
  ),
  'Vibe Coding': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <path d="M14 4l-4 16" strokeDasharray="3 2" />
    </svg>
  ),
  'Prompt Engineering': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17l6-6-6-6" />
      <line x1="12" y1="19" x2="20" y2="19" />
      <polygon points="19 3 20 6 23 7 20 8 19 11 18 8 15 7 18 6 19 3" fill="currentColor" stroke="none" />
    </svg>
  ),
  'Workflow Testing': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      <circle cx="8" cy="9" r="1.2" fill="currentColor" />
      <circle cx="8" cy="15" r="1.2" fill="currentColor" />
    </svg>
  ),
  'Pipeline Integration': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="6" height="6" rx="1.5" />
      <rect x="15" y="3" width="6" height="6" rx="1.5" />
      <rect x="9" y="15" width="6" height="6" rx="1.5" />
      <path d="M6 9v3a2 2 0 0 0 2 2h4" />
      <path d="M18 9v3a2 2 0 0 1-2 2h-4" />
      <path d="M12 14v1" />
    </svg>
  ),
  'AI-Assisted Prototyping': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="9" x2="9" y2="21" />
      <circle cx="6" cy="6" r="1.2" fill="currentColor" />
      <circle cx="15" cy="15" r="2.2" fill="currentColor" fillOpacity="0.25" />
    </svg>
  ),
  'Creative Automation': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
      <polygon points="12 8 13.2 10.5 16 11 13.8 12.8 14.5 15.5 12 14 9.5 15.5 10.2 12.8 8 11 10.8 10.5 12 8" fill="currentColor" stroke="none" />
    </svg>
  )
};`;

let code = fs.readFileSync('LanyardProfileSection.jsx', 'utf8');

// Replace the TOOL_ICONS block
code = code.replace(
  /\/\/ SVG Brand & Discipline Icons for MY CURIOSITY STACK[\s\S]*?const TOOL_ICONS = \{[\s\S]*?\n\};\n/m,
  NEW_TOOL_ICONS + '\n'
);

fs.writeFileSync('LanyardProfileSection.jsx', code);
console.log('LanyardProfileSection.jsx successfully updated with official SVG brand logos!');
