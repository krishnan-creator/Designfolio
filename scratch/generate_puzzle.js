const fs = require('fs');

const W = 300;
const H = 200;

// Internal vertical edges at (col, row):
// between (0,r) and (1,r) at x=300 for r=0,1,2
// between (1,r) and (2,r) at x=600 for r=0,1,2
// dirs: 1 = right tab (col 0/1 has tab, col 1/2 has blank), -1 = left tab
const vTabs = [
  [1, -1, 1], // between col 0 and 1: row 0: tab right, row 1: tab left, row 2: tab right
  [-1, 1, -1] // between col 1 and 2: row 0: tab left, row 1: tab right, row 2: tab left
];

// Internal horizontal edges at (col, row):
// between (c,0) and (c,1) at y=200 for c=0,1,2
// between (c,1) and (c,2) at y=400 for c=0,1,2
// dirs: 1 = down tab (row 0 has tab down, row 1 has blank up), -1 = up tab
const hTabs = [
  [1, -1, 1], // between row 0 and 1: col 0: tab down, col 1: tab up, col 2: tab down
  [-1, 1, -1] // between row 1 and 2: col 0: tab up, col 1: tab down, col 2: tab up
];

function getEdgeH(x0, y0, dir) {
  // horizontal edge from x0 to x0+W at y0
  // if dir == 0 (outer edge), straight line
  if (dir === 0) return `L ${x0 + W} ${y0}`;
  const d = dir * 28;
  const xm = x0 + W / 2;
  return `L ${xm - 35} ${y0} ` +
         `C ${xm - 25} ${y0}, ${xm - 28} ${y0 + d * 0.45}, ${xm - 18} ${y0 + d * 0.55} ` +
         `C ${xm - 24} ${y0 + d * 0.95}, ${xm - 12} ${y0 + d * 1.25}, ${xm} ${y0 + d * 1.25} ` +
         `C ${xm + 12} ${y0 + d * 1.25}, ${xm + 24} ${y0 + d * 0.95}, ${xm + 18} ${y0 + d * 0.55} ` +
         `C ${xm + 28} ${y0 + d * 0.45}, ${xm + 25} ${y0}, ${xm + 35} ${y0} ` +
         `L ${x0 + W} ${y0}`;
}

function getEdgeHRev(x1, y0, dir) {
  // horizontal edge from x1 down to x1-W at y0 (going left)
  if (dir === 0) return `L ${x1 - W} ${y0}`;
  const d = dir * 28;
  const xm = x1 - W / 2;
  return `L ${xm + 35} ${y0} ` +
         `C ${xm + 25} ${y0}, ${xm + 28} ${y0 + d * 0.45}, ${xm + 18} ${y0 + d * 0.55} ` +
         `C ${xm + 24} ${y0 + d * 0.95}, ${xm + 12} ${y0 + d * 1.25}, ${xm} ${y0 + d * 1.25} ` +
         `C ${xm - 12} ${y0 + d * 1.25}, ${xm - 24} ${y0 + d * 0.95}, ${xm - 18} ${y0 + d * 0.55} ` +
         `C ${xm - 28} ${y0 + d * 0.45}, ${xm - 25} ${y0}, ${xm - 35} ${y0} ` +
         `L ${x1 - W} ${y0}`;
}

function getEdgeV(x0, y0, dir) {
  // vertical edge from (x0, y0) down to (x0, y0+H)
  if (dir === 0) return `L ${x0} ${y0 + H}`;
  const d = dir * 28;
  const ym = y0 + H / 2;
  return `L ${x0} ${ym - 30} ` +
         `C ${x0} ${ym - 20}, ${x0 + d * 0.45} ${ym - 24}, ${x0 + d * 0.55} ${ym - 16} ` +
         `C ${x0 + d * 0.95} ${ym - 22}, ${x0 + d * 1.25} ${ym - 10}, ${x0 + d * 1.25} ${ym} ` +
         `C ${x0 + d * 1.25} ${ym + 10}, ${x0 + d * 0.95} ${ym + 22}, ${x0 + d * 0.55} ${ym + 16} ` +
         `C ${x0 + d * 0.45} ${ym + 24}, ${x0} ${ym + 20}, ${x0} ${ym + 30} ` +
         `L ${x0} ${y0 + H}`;
}

function getEdgeVRev(x0, y1, dir) {
  // vertical edge from (x0, y1) UP to (x0, y1-H)
  if (dir === 0) return `L ${x0} ${y1 - H}`;
  const d = dir * 28;
  const ym = y1 - H / 2;
  return `L ${x0} ${ym + 30} ` +
         `C ${x0} ${ym + 20}, ${x0 + d * 0.45} ${ym + 24}, ${x0 + d * 0.55} ${ym + 16} ` +
         `C ${x0 + d * 0.95} ${ym + 22}, ${x0 + d * 1.25} ${ym + 10}, ${x0 + d * 1.25} ${ym} ` +
         `C ${x0 + d * 1.25} ${ym - 10}, ${x0 + d * 0.95} ${ym - 22}, ${x0 + d * 0.55} ${ym - 16} ` +
         `C ${x0 + d * 0.45} ${ym - 24}, ${x0} ${ym - 20}, ${x0} ${ym - 30} ` +
         `L ${x0} ${y1 - H}`;
}

function makePiecePath(col, row) {
  const x0 = col * W;
  const y0 = row * H;
  const x1 = x0 + W;
  const y1 = y0 + H;

  // Top edge:
  const topDir = (row === 0) ? 0 : -hTabs[row - 1][col]; // reverse of bottom edge of row-1
  // Right edge:
  const rightDir = (col === 2) ? 0 : vTabs[col][row];
  // Bottom edge:
  const bottomDir = (row === 2) ? 0 : hTabs[row][col];
  // Left edge:
  const leftDir = (col === 0) ? 0 : -vTabs[col - 1][row]; // reverse of right edge of col-1

  let path = `M ${x0} ${y0} `;
  // Top edge (going right to x1, y0):
  path += getEdgeH(x0, y0, topDir) + ' ';
  // Right edge (going down to x1, y1):
  path += getEdgeV(x1, y0, rightDir) + ' ';
  // Bottom edge (going left to x0, y1):
  path += getEdgeHRev(x1, y1, bottomDir) + ' ';
  // Left edge (going up to x0, y0):
  path += getEdgeVRev(x0, y1, leftDir) + ' Z';

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

console.log('Generated ' + paths.length + ' pieces successfully.');
fs.writeFileSync('scratch/puzzle_data.json', JSON.stringify(paths, null, 2));
