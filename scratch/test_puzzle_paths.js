const fs = require('fs');

// We want a 3x3 grid: cols 0..2, rows 0..2. Total width 900, height 600.
// Cell size: w = 300, h = 200.
// Internal edges:
// Vertical edges at x = 300 (col 0|1) and x = 600 (col 1|2) for rows 0, 1, 2.
// Horizontal edges at y = 200 (row 0|1) and y = 400 (row 1|2) for cols 0, 1, 2.

function tabV(dir) { // dir = 1 for right tab, -1 for left tab
  const d = dir * 26; // tab depth
  const w = dir * 14;
  // y spans 0 to 200. Segment from y=75 to y=125
  return `C 0 82, ${w} 80, ${w} 86 C ${d*1.2} 78, ${d*1.2} 122, ${w} 114 C ${w} 120, 0 118, 0 125`;
}

function tabH(dir) { // dir = 1 for down tab, -1 for up tab
  const d = dir * 26;
  const w = dir * 14;
  // x spans 0 to 300. Segment from x=125 to x=175
  return `C 132 0, 130 ${w}, 136 ${w} C 128 ${d*1.2}, 172 ${d*1.2}, 164 ${w} C 170 ${w}, 168 0, 175 0`;
}

console.log('Tab definitions generated successfully.');
