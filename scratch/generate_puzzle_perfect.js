const fs = require('fs');

const W = 300;
const H = 200;

// Tab shape profile along normalized t from 0 to 1, or relative distance.
// Let's create an authentic jigsaw tab profile on an edge of length L.
// Edge runs along axis from 0 to L with a tab centered at L/2.
// Tab extends perpendicular by distance D (can be + or -).

function makeTabPoints(L, D) {
  // L = length of edge, D = tab height/depth (+: right/down, -: left/up)
  const mid = L / 2;
  const neck = 18; // half width of neck base
  const head = 28; // half width of bulb head
  const depth = D; // peak height of bulb

  // We define cubic bezier segments along the edge:
  // p0: (mid - 36, 0)
  // c1: (mid - 24, 0), c2: (mid - neck, depth * 0.35), p1: (mid - neck, depth * 0.55)
  // c3: (mid - head, depth * 0.95), c4: (mid - head * 0.6, depth * 1.25), p2: (mid, depth * 1.25)
  // c5: (mid + head * 0.6, depth * 1.25), c6: (mid + head, depth * 0.95), p3: (mid + neck, depth * 0.55)
  // c7: (mid + neck, depth * 0.35), c8: (mid + 24, 0), p4: (mid + 36, 0)
  return { mid, neck, head, depth };
}

// Vertical seams: at x=300 (col 0|1) and x=600 (col 1|2)
// For each row r in 0, 1, 2:
// vSeam[col_boundary][row] is an array of SVG path commands going from y=0 to y=H.
// When traced reverse, we can reverse the bezier segments!
// Or even simpler: define points along the curve and build forward and reverse paths.

// Let's create the 2 vertical seams (each with 3 segments for r=0, 1, 2)
// and 2 horizontal seams (each with 3 segments for c=0, 1, 2).

// dirs: +1 means tab extends right (for V seam) or down (for H seam)
const vSeamDir = [
  [1, -1, 1], // col boundary 0 (x=300): row 0 -> +1, row 1 -> -1, row 2 -> +1
  [-1, 1, -1] // col boundary 1 (x=600): row 0 -> -1, row 1 -> +1, row 2 -> -1
];

const hSeamDir = [
  [1, -1, 1], // row boundary 0 (y=200): col 0 -> +1, col 1 -> -1, col 2 -> +1
  [-1, 1, -1] // row boundary 1 (y=400): col 0 -> -1, col 1 -> +1, col 2 -> -1
];

// Returns command string from (x, y0) to (x, y0+H)
function getVSeamForward(x, y0, dir) {
  const d = dir * 26; // tab depth
  const ym = y0 + H / 2;
  return `L ${x} ${ym - 36} ` +
         `C ${x} ${ym - 24}, ${x + d * 0.35} ${ym - 20}, ${x + d * 0.55} ${ym - 16} ` +
         `C ${x + d * 0.95} ${ym - 24}, ${x + d * 1.25} ${ym - 12}, ${x + d * 1.25} ${ym} ` +
         `C ${x + d * 1.25} ${ym + 12}, ${x + d * 0.95} ${ym + 24}, ${x + d * 0.55} ${ym + 16} ` +
         `C ${x + d * 0.35} ${ym + 20}, ${x} ${ym + 24}, ${x} ${ym + 36} ` +
         `L ${x} ${y0 + H}`;
}

// Returns EXACT SAME seam in reverse from (x, y0+H) up to (x, y0)
function getVSeamReverse(x, y0, dir) {
  const d = dir * 26;
  const ym = y0 + H / 2;
  return `L ${x} ${ym + 36} ` +
         `C ${x} ${ym + 24}, ${x + d * 0.35} ${ym + 20}, ${x + d * 0.55} ${ym + 16} ` +
         `C ${x + d * 0.95} ${ym + 24}, ${x + d * 1.25} ${ym + 12}, ${x + d * 1.25} ${ym} ` +
         `C ${x + d * 1.25} ${ym - 12}, ${x + d * 0.95} ${ym - 24}, ${x + d * 0.55} ${ym - 16} ` +
         `C ${x + d * 0.35} ${ym - 20}, ${x} ${ym - 24}, ${x} ${ym - 36} ` +
         `L ${x} ${y0}`;
}

// Returns command string from (x0, y) to (x0+W, y)
function getHSeamForward(x0, y, dir) {
  const d = dir * 26;
  const xm = x0 + W / 2;
  return `L ${xm - 36} ${y} ` +
         `C ${xm - 24} ${y}, ${xm - 20} ${y + d * 0.35}, ${xm - 16} ${y + d * 0.55} ` +
         `C ${xm - 24} ${y + d * 0.95}, ${xm - 12} ${y + d * 1.25}, ${xm} ${y + d * 1.25} ` +
         `C ${xm + 12} ${y + d * 1.25}, ${xm + 24} ${y + d * 0.95}, ${xm + 16} ${y + d * 0.55} ` +
         `C ${xm + 20} ${y + d * 0.35}, ${xm + 24} ${y}, ${xm + 36} ${y} ` +
         `L ${x0 + W} ${y}`;
}

// Returns EXACT SAME seam in reverse from (x0+W, y) down to (x0, y)
function getHSeamReverse(x0, y, dir) {
  const d = dir * 26;
  const xm = x0 + W / 2;
  return `L ${xm + 36} ${y} ` +
         `C ${xm + 24} ${y}, ${xm + 20} ${y + d * 0.35}, ${xm + 16} ${y + d * 0.55} ` +
         `C ${xm + 24} ${y + d * 0.95}, ${xm + 12} ${y + d * 1.25}, ${xm} ${y + d * 1.25} ` +
         `C ${xm - 12} ${y + d * 1.25}, ${xm - 24} ${y + d * 0.95}, ${xm - 16} ${y + d * 0.55} ` +
         `C ${xm - 20} ${y + d * 0.35}, ${xm - 24} ${y}, ${xm - 36} ${y} ` +
         `L ${x0} ${y}`;
}

function makePiecePath(c, r) {
  const x0 = c * W;
  const y0 = r * H;
  const x1 = x0 + W;
  const y1 = y0 + H;

  let path = `M ${x0} ${y0} `;

  // 1. Top Edge (going right to x1, y0):
  if (r === 0) {
    path += `L ${x1} ${y0} `;
  } else {
    // Top of row r is horizontal seam (r-1).
    // The row above (r-1) went forward from left to right.
    // So row r must go forward from left to right as well!
    path += getHSeamForward(x0, y0, hSeamDir[r - 1][c]) + ' ';
  }

  // 2. Right Edge (going down to x1, y1):
  if (c === 2) {
    path += `L ${x1} ${y1} `;
  } else {
    // Right of col c is vertical seam c.
    // Col c goes forward from top to bottom.
    path += getVSeamForward(x1, y0, vSeamDir[c][r]) + ' ';
  }

  // 3. Bottom Edge (going left from x1 to x0 at y1):
  if (r === 2) {
    path += `L ${x0} ${y1} `;
  } else {
    // Bottom of row r is horizontal seam r.
    // We are at (x1, y1) going left to (x0, y1), so REVERSE!
    path += getHSeamReverse(x0, y1, hSeamDir[r][c]) + ' ';
  }

  // 4. Left Edge (going up from y1 to y0 at x0):
  if (c === 0) {
    path += `L ${x0} ${y0} `;
  } else {
    // Left of col c is vertical seam (c-1).
    // We are at (x0, y1) going up to (x0, y0), so REVERSE!
    path += getVSeamReverse(x0, y0, vSeamDir[c - 1][r]) + ' ';
  }

  path += 'Z';
  return path;
}

const disciplines = [
  { name: "Creative Direction", desc: "Shaping holistic visual aesthetics, high-velocity concept design, stylistic cohesion, and reference-driven storytelling from initial brief to executive delivery." },
  { name: "Generative AI", desc: "Mastery of cutting-edge neural models, diffusion architectures, transformer models, and continuous integration of state-of-the-art generative tech." },
  { name: "Visual Development", desc: "Look-dev, color keys, atmospheric studies, cinematic lighting, and production-ready visual asset libraries for film and IP worlds." },
  { name: "Cinematic Storytelling", desc: "Crafting multi-shot visual sequences, narrative continuity, dramatic framing, and emotional pacing across cinematic shorts and trailers." },
  { name: "AI Image + Video", desc: "High-volume generation and animation workflows across Midjourney, SDXL, Runway Gen-3, Kling, and custom video pipelines." },
  { name: "Character Development", desc: "Digital human creation, identity preservation across diverse camera angles and lighting, hero design, and full expression turnarounds." },
  { name: "Environment Design", desc: "Monumental worldbuilding, alien and historical architecture, volumetric atmospheric landscapes, and complex sci-fi/mythic environments." },
  { name: "AI Creative Workflows", desc: "Custom ComfyUI node architectures, LoRA model training, IP-Adapter conditioning, ControlNet pipelines, and automated studio pipelines." },
  { name: "Prompt Architecture", desc: "Structured, repeatable semantic prompt engineering, negative-prompt optimization, token weight balancing, and consistent style encoding." }
];

const paths = [];
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    const idx = r * 3 + c;
    paths.push({
      idx,
      row: r,
      col: c,
      name: disciplines[idx].name,
      desc: disciplines[idx].desc,
      path: makePiecePath(c, r),
      cx: c * W + W / 2,
      cy: r * H + H / 2
    });
  }
}

fs.writeFileSync('scratch/puzzle_data.json', JSON.stringify(paths, null, 2));
console.log('Saved perfectly matching puzzle data!');
