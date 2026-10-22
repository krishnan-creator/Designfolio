const fs = require('fs');

// --- 1. Update Lanyard.jsx ---
let lanyardCode = fs.readFileSync('Lanyard.jsx', 'utf8');

lanyardCode = lanyardCode.replace('const FLIP_SPIN = 9;', 'const FLIP_SPIN = 4.2;');

lanyardCode = lanyardCode.replace(
  /const paintFace = \(canvas, image, color, fit\) => \{[\s\S]*?ctx\.fillRect\(0, 0, canvas\.width, canvas\.height\);[\s\S]*?if \(image\) drawFitted\(ctx, image, canvas\.width, canvas\.height, fit\);[\s\S]*?\};/,
  `const paintFace = (canvas, image, color, fit, flipH = false) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.fillStyle = toCss(color);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (flipH) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  if (image) drawFitted(ctx, image, canvas.width, canvas.height, fit);
  ctx.restore();
};`
);

lanyardCode = lanyardCode.replace(
  'paintFace(backCanvas, images.back || images.front, color, s.imageFit);',
  'paintFace(backCanvas, images.back || images.front, color, s.imageFit, true);'
);

fs.writeFileSync('Lanyard.jsx', lanyardCode);
console.log('Lanyard.jsx successfully updated with restrained FLIP_SPIN and flipped back canvas for correct orientation.');
