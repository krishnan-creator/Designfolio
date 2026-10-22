const fs = require('fs');
const path = require('path');

const contentPath = path.join(__dirname, '../data/content.json');
const draftPath = path.join(__dirname, '../data/content-draft.json');

const orbitAssets = [
  { id: 'orbit-01', slot: '01', image: '1.webp', src: '1.webp', alt: 'Visual Orbit Asset 01', title: 'Asset 01' },
  { id: 'orbit-02', slot: '02', image: '6.webp', src: '6.webp', alt: 'Visual Orbit Asset 02', title: 'Asset 02' },
  { id: 'orbit-03', slot: '03', image: '3__1_.webp', src: '3__1_.webp', alt: 'Visual Orbit Asset 03', title: 'Asset 03' },
  { id: 'orbit-04', slot: '04', image: '8__5_.webp', src: '8__5_.webp', alt: 'Visual Orbit Asset 04', title: 'Asset 04' },
  { id: 'orbit-05', slot: '05', image: '5__1_.webp', src: '5__1_.webp', alt: 'Visual Orbit Asset 05', title: 'Asset 05' },
  { id: 'orbit-06', slot: '06', image: '6__1_.webp', src: '6__1_.webp', alt: 'Visual Orbit Asset 06', title: 'Asset 06' },
  { id: 'orbit-07', slot: '07', image: '7__1_.webp', src: '7__1_.webp', alt: 'Visual Orbit Asset 07', title: 'Asset 07' },
  { id: 'orbit-08', slot: '08', image: '8__1_.jpeg', src: '8__1_.jpeg', alt: 'Visual Orbit Asset 08', title: 'Asset 08' },
  { id: 'orbit-09', slot: '09', image: '1__1_.png', src: '1__1_.png', alt: 'Visual Orbit Asset 09', title: 'Asset 09' },
  { id: 'orbit-10', slot: '10', image: '2__2_.webp', src: '2__2_.webp', alt: 'Visual Orbit Asset 10', title: 'Asset 10' },
  { id: 'orbit-11', slot: '11', image: '3__2_.webp', src: '3__2_.webp', alt: 'Visual Orbit Asset 11', title: 'Asset 11' },
  { id: 'orbit-12', slot: '12', image: '6__4_.webp', src: '6__4_.webp', alt: 'Visual Orbit Asset 12', title: 'Asset 12' },
  { id: 'orbit-13', slot: '13', image: '5__2_.webp', src: '5__2_.webp', alt: 'Visual Orbit Asset 13', title: 'Asset 13' },
  { id: 'orbit-14', slot: '14', image: '6__2_.webp', src: '6__2_.webp', alt: 'Visual Orbit Asset 14', title: 'Asset 14' },
  { id: 'orbit-15', slot: '15', image: '7__2_.webp', src: '7__2_.webp', alt: 'Visual Orbit Asset 15', title: 'Asset 15' },
  { id: 'orbit-16', slot: '16', image: '8__2_.webp', src: '8__2_.webp', alt: 'Visual Orbit Asset 16', title: 'Asset 16' },
  { id: 'orbit-17', slot: '17', image: '1__2_.webp', src: '1__2_.webp', alt: 'Visual Orbit Asset 17', title: 'Asset 17' },
  { id: 'orbit-18', slot: '18', image: '2__3_.webp', src: '2__3_.webp', alt: 'Visual Orbit Asset 18', title: 'Asset 18' },
  { id: 'orbit-19', slot: '19', image: '3__3_.webp', src: '3__3_.webp', alt: 'Visual Orbit Asset 19', title: 'Asset 19' },
  { id: 'orbit-20', slot: '20', image: '4__3_.webp', src: '4__3_.webp', alt: 'Visual Orbit Asset 20', title: 'Asset 20' },
  { id: 'orbit-21', slot: '21', image: '5__3_.webp', src: '5__3_.webp', alt: 'Visual Orbit Asset 21', title: 'Asset 21' },
  { id: 'orbit-22', slot: '22', image: '6__3_.webp', src: '6__3_.webp', alt: 'Visual Orbit Asset 22', title: 'Asset 22' },
  { id: 'orbit-23', slot: '23', image: '7__3_.webp', src: '7__3_.webp', alt: 'Visual Orbit Asset 23', title: 'Asset 23' },
  { id: 'orbit-24', slot: '24', image: '8__1_.webp', src: '8__1_.webp', alt: 'Visual Orbit Asset 24', title: 'Asset 24' },
  { id: 'orbit-25', slot: '25', image: '1__3_.webp', src: '1__3_.webp', alt: 'Visual Orbit Asset 25', title: 'Asset 25' },
  { id: 'orbit-26', slot: '26', image: '2__4_.webp', src: '2__4_.webp', alt: 'Visual Orbit Asset 26', title: 'Asset 26' },
  { id: 'orbit-27', slot: '27', image: '3__4_.webp', src: '3__4_.webp', alt: 'Visual Orbit Asset 27', title: 'Asset 27' },
  { id: 'orbit-28', slot: '28', image: '4__4_.webp', src: '4__4_.webp', alt: 'Visual Orbit Asset 28', title: 'Asset 28' },
  { id: 'orbit-29', slot: '29', image: '5__4_.webp', src: '5__4_.webp', alt: 'Visual Orbit Asset 29', title: 'Asset 29' },
  { id: 'orbit-30', slot: '30', image: '6__5_.webp', src: '6__5_.webp', alt: 'Visual Orbit Asset 30', title: 'Asset 30' },
  { id: 'orbit-31', slot: '31', image: '7__4_.webp', src: '7__4_.webp', alt: 'Visual Orbit Asset 31', title: 'Asset 31' },
  { id: 'orbit-32', slot: '32', image: '8__3_.webp', src: '8__3_.webp', alt: 'Visual Orbit Asset 32', title: 'Asset 32' },
  { id: 'orbit-33', slot: '33', image: '1__4_.webp', src: '1__4_.webp', alt: 'Visual Orbit Asset 33', title: 'Asset 33' },
  { id: 'orbit-34', slot: '34', image: '2__5_.webp', src: '2__5_.webp', alt: 'Visual Orbit Asset 34', title: 'Asset 34' },
  { id: 'orbit-35', slot: '35', image: '3__5_.webp', src: '3__5_.webp', alt: 'Visual Orbit Asset 35', title: 'Asset 35' },
  { id: 'orbit-36', slot: '36', image: '4__5_.webp', src: '4__5_.webp', alt: 'Visual Orbit Asset 36', title: 'Asset 36' },
  { id: 'orbit-37', slot: '37', image: '1__1_.webp', src: '1__1_.webp', alt: 'Visual Orbit Asset 37', title: 'Asset 37' },
  { id: 'orbit-38', slot: '38', image: '4__2_.webp', src: '4__2_.webp', alt: 'Visual Orbit Asset 38', title: 'Asset 38' },
  { id: 'orbit-39', slot: '39', image: '8__4_.webp', src: '8__4_.webp', alt: 'Visual Orbit Asset 39', title: 'Asset 39' },
  { id: 'orbit-40', slot: '40', image: '4__1_.webp', src: '4__1_.webp', alt: 'Visual Orbit Asset 40', title: 'Asset 40' },
  { id: 'orbit-41', slot: '41', image: '', src: '', alt: '', title: 'Slot 41' },
  { id: 'orbit-42', slot: '42', image: '', src: '', alt: '', title: 'Slot 42' },
  { id: 'orbit-43', slot: '43', image: '', src: '', alt: '', title: 'Slot 43' },
  { id: 'orbit-44', slot: '44', image: '', src: '', alt: '', title: 'Slot 44' },
  { id: 'orbit-45', slot: '45', image: '', src: '', alt: '', title: 'Slot 45' },
  { id: 'orbit-46', slot: '46', image: '', src: '', alt: '', title: 'Slot 46' },
  { id: 'orbit-47', slot: '47', image: '', src: '', alt: '', title: 'Slot 47' },
  { id: 'orbit-48', slot: '48', image: '', src: '', alt: '', title: 'Slot 48' }
];

[contentPath, draftPath].forEach(fp => {
  if (fs.existsSync(fp)) {
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const sec = data.sections?.find(s => s.id === 'sec-visual-orbit');
    if (sec) {
      sec.content.slots = orbitAssets;
      sec.content.images = orbitAssets;
      fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Updated ${fp} with 48 slots (40 populated, 8 empty).`);
    }
  }
});
