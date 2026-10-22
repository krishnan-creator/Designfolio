const fs = require('fs');

function cleanData(file) {
  if (!fs.existsSync(file)) return;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  // 1. Visual Orbit
  const vo = data.sections.find(s => s.id === 'sec-visual-orbit');
  if (vo) {
    if (!vo.content) vo.content = {};
    vo.content.slots = Array.from({ length: 40 }, (_, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      return {
        id: 'orbit-' + num,
        slot: num,
        slotNumber: num,
        image: '',
        src: '',
        alt: 'Empty slot ' + num,
        title: 'Asset ' + num
      };
    });
    vo.content.images = vo.content.slots;
    vo.content.tiles = [];
  }

  // 2. The Core -> sub-hobbies
  const core = data.sections.find(s => s.id === 'sec-core');
  if (core && core.children) {
    const hobbies = core.children.find(ch => ch.type === 'hobbies');
    if (hobbies) {
      if (!hobbies.content) hobbies.content = {};
      hobbies.content.subtitle = '[ A little art. A lot of adventure ]';
      hobbies.content.slots = Array.from({ length: 12 }, (_, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        return {
          id: 'hobby-' + num,
          slot: num,
          slotNumber: num,
          image: '',
          src: '',
          alt: 'Empty slot ' + num,
          title: 'Hobby ' + num,
          subtitle: '',
          visible: true
        };
      });
      hobbies.content.items = hobbies.content.slots;
      delete hobbies.content.cards;
    }
  }

  // 3. CTA
  const cta = data.sections.find(s => s.id === 'sec-cta');
  if (cta && cta.content) {
    cta.content.primaryButton = {
      label: "LET'S CONNECT",
      url: 'https://mail.google.com/mail/?view=cm&fs=0&to=meet2krishnan@gmail.com',
      target: '_blank'
    };
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  console.log('Cleaned and updated:', file);
}

cleanData('data/content.json');
cleanData('data/content-draft.json');
