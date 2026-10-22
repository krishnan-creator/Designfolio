const fs = require('fs');

const NINE_ENTRIES = [
  {
    id: 'btf-01',
    slotNumber: '01',
    title: 'RAMAYANA',
    category: '01 // GENERATIVE AI × VFX',
    desc: 'At DNEG, I built 2D/3D AI workflows for realistic face replacement and lip-sync',
    image: '1_Ram.png',
    position: 'center 40%',
    visible: true
  },
  {
    id: 'btf-02',
    slotNumber: '02',
    title: 'VEER BHADRA',
    category: '02 // AI FILMMAKING',
    desc: 'Shaped the film from character design and scripting to direction and final sequences.',
    image: 'VB.png',
    position: 'center 48%',
    visible: true
  },
  {
    id: 'btf-03',
    slotNumber: '03',
    title: 'FIRMWARE UPDATE',
    category: '03 // GENERATIVE AI PRODUCTION',
    desc: 'Transformed the director’s vision into AI-generated characters, worlds, and cinematic sequences.',
    image: 'Firmware.png',
    position: 'center 26%',
    visible: true
  },
  {
    id: 'btf-04',
    slotNumber: '04',
    title: 'ASHRA Cinematic Universe',
    category: '04 // SOLO CREATIVE IP',
    desc: 'Created everything from concept and world-building to music, branding, and final film.',
    image: 'Ashra.png',
    position: 'center center',
    visible: true
  },
  {
    id: 'btf-05',
    slotNumber: '05',
    title: 'HORNS & SKULL',
    category: '05 //  Re Imagined COMIC & SHOTS',
    desc: 'Building a Marvel-inspired universe reimagined in Indian Version.',
    image: 'horns.png',
    position: 'center 36%',
    visible: true
  },
  {
    id: 'btf-06',
    slotNumber: '06',
    title: 'DUNE LOOK-DEV',
    category: '06 // STUDIO PIPELINE & VFX',
    desc: 'Visual exploration for cinematic environments, lighting and atmospheric composition.',
    image: 'dune-dneg.jpg',
    position: 'center 48%',
    visible: true
  },
  {
    id: 'btf-07',
    slotNumber: '07',
    title: 'ENVIRONMENT DESIGN',
    category: '07 // PLANETARY WORLD BUILDING',
    desc: 'Atmosphere, planetary scale and environment composition for feature film narratives.',
    image: 'media_1791962972986.png',
    position: 'center center',
    visible: true
  },
  {
    id: 'btf-08',
    slotNumber: '08',
    title: 'AI FILMMAKING',
    category: '08 // GENERATIVE FLOWS',
    desc: 'Generative image-to-video creative workflows and multi-shot synthetic film pipelines.',
    image: 'media_1791977571390.png',
    position: 'center 38%',
    visible: true
  },
  {
    id: 'btf-09',
    slotNumber: '09',
    title: 'MYTHIC WORLDS',
    category: '09 // CONCEPT & LORE',
    desc: 'Original mythological world development and synthetic epic atmosphere.',
    image: 'Ramayana.png',
    position: 'center 40%',
    visible: true
  }
];

const TICKER_TEXT = 'RAMAYANA    🔸   VEER BHADRA    🔸   FIRMWARE UPDATE     🔸    ASHRA    🔸   HORNS & SKULL    🔸   DUNE LOOK-DEV    🔸   ENVIRONMENT DESIGN    🔸   AI FILMMAKING    🔸   MYTHIC WORLDS';

['data/content.json', 'data/content-draft.json'].forEach(file => {
  if (!fs.existsSync(file)) return;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const btf = data.sections.find(s => s.id === 'sec-beyond-frame');
  if (btf) {
    if (!btf.content) btf.content = {};
    btf.content.entries = NINE_ENTRIES;
    btf.content.tickerText = TICKER_TEXT;
    btf.content.wordmark = TICKER_TEXT;
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  console.log('Updated', file, 'entries count:', btf?.content?.entries?.length);
});
