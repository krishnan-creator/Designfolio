const fs = require('fs');

const file = 'data/content.json';
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const vo = d.sections.find(s => s.id === 'sec-visual-orbit');

if (vo) {
  vo.config = {
    fit: 0.8,
    minRadius: 600,
    maxVerticalRotationDeg: 0,
    segments: 20,
    dragDampening: 4.6,
    grayscale: false
  };

  if (!vo.content) vo.content = {};

  const initialImages = [
    {
      id: 'orbit-01',
      slot: '01',
      slotNumber: '01',
      image: 'Ramayana.png',
      src: 'Ramayana.png',
      title: "Namit Malhotra's Ramayana",
      alt: "Namit Malhotra's Ramayana"
    },
    {
      id: 'orbit-02',
      slot: '02',
      slotNumber: '02',
      image: 'VeerBhadra.png',
      src: 'VeerBhadra.png',
      title: 'Veerabhadra',
      alt: 'Veerabhadra'
    },
    {
      id: 'orbit-03',
      slot: '03',
      slotNumber: '03',
      image: 'dune-dneg.jpg',
      src: 'dune-dneg.jpg',
      title: 'Dune: Part Three',
      alt: 'Dune: Part Three'
    },
    {
      id: 'orbit-04',
      slot: '04',
      slotNumber: '04',
      image: 'portrait-01.png',
      src: 'portrait-01.png',
      title: 'High Fashion & Digital Human',
      alt: 'High Fashion & Digital Human'
    }
  ];

  vo.content.slots = Array.from({ length: 40 }, (_, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    if (idx < 4) return initialImages[idx];
    return {
      id: 'orbit-' + num,
      slot: num,
      slotNumber: num,
      image: '',
      src: '',
      alt: 'Empty slot ' + num,
      title: ''
    };
  });

  vo.content.images = vo.content.slots;
  vo.content.tiles = vo.content.slots.filter(s => s.image);

  fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
  console.log('Successfully updated content.json Visual Orbit config and slots!');
}
