const fs = require('fs');

let code = fs.readFileSync('Lanyard.jsx', 'utf8');

// 1. Update makeCanvasTexture
code = code.replace(
  `const makeCanvasTexture = (canvas, anisotropy) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
};`,
  `const makeCanvasTexture = (canvas, anisotropy) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(anisotropy || 16, 8);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
};`
);

// 2. Update drawFitted
code = code.replace(
  `const drawFitted = (ctx, image, width, height, fit) => {
  const scale = (fit === 'contain' ? Math.min : Math.max)(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
};`,
  `const drawFitted = (ctx, image, width, height, fit) => {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const scale = (fit === 'contain' ? Math.min : Math.max)(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
};`
);

// 3. Update placeHanging with natural small pendulum swing
code = code.replace(
  `const placeHanging = (sim, layout, intro) => {
  const { nodes, previous, velocities, body, anchor } = sim;
  nodes[0].copy(anchor);
  for (let i = 1; i <= JOINTS; i++) {
    nodes[i].copy(nodes[i - 1]);
    if (intro) nodes[i].x += sim.rest;
    else nodes[i].y -= sim.rest;
  }
  body.quaternion.identity();
  if (intro) body.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);`,
  `const placeHanging = (sim, layout, intro) => {
  const { nodes, previous, velocities, body, anchor } = sim;
  nodes[0].copy(anchor);
  const swingAngle = intro ? 0.24 : 0;
  for (let i = 1; i <= JOINTS; i++) {
    nodes[i].copy(nodes[i - 1]);
    if (intro) {
      nodes[i].x += sim.rest * Math.sin(swingAngle);
      nodes[i].y -= sim.rest * Math.cos(swingAngle);
    } else {
      nodes[i].y -= sim.rest;
    }
  }
  body.quaternion.identity();
  if (intro) body.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), swingAngle);`
);

// 4. Update Lanyard component props and settingsRef to support introTrigger
code = code.replace(
  `  interactive = true,
  intro = true,
  className = '',
  style
}) => {`,
  `  interactive = true,
  intro = true,
  introTrigger = 0,
  className = '',
  style
}) => {`
);

code = code.replace(
  `    interactive,
    intro
  };`,
  `    interactive,
    intro,
    introTrigger
  };`
);

code = code.replace(
  `      const layoutKey = \`\${s.orientation}|\${s.cornerRadius}\`;`,
  `      if (s.introTrigger && s.introTrigger !== applied.introTrigger) {
        applied.introTrigger = s.introTrigger;
        placeHanging(sim, layout, !reducedMotion);
        start();
      }
      const layoutKey = \`\${s.orientation}|\${s.cornerRadius}\`;`
);

fs.writeFileSync('Lanyard.jsx', code, 'utf8');
console.log('Lanyard.jsx successfully updated!');
