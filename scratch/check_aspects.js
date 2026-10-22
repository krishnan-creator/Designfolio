const fs = require('fs');

const lines = fs.readFileSync('DomeGallery.jsx', 'utf8').split('\n');
const imgLines = lines.filter(l => l.includes('slotNumber:') && l.includes('src:'));
const imgs = imgLines.map(l => {
  const m = l.match(/src:\s*'([^']+)'/);
  return m ? m[1] : '';
}).filter(Boolean);

function getDimensions(file) {
  const buf = fs.readFileSync(file);
  if (file.endsWith('.png')) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (file.endsWith('.webp')) {
    const chunkType = buf.toString('ascii', 12, 16);
    if (chunkType === 'VP8X') {
      return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
    }
    if (chunkType === 'VP8L') {
      const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
      const width = 1 + (((b1 & 0x3F) << 8) | b0);
      const height = 1 + (((b3 & 0xF) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6));
      return { w: width, h: height };
    }
    if (chunkType === 'VP8 ') {
      const w = buf.readUInt16LE(26) & 0x3fff;
      const h = buf.readUInt16LE(28) & 0x3fff;
      return { w, h };
    }
  }
  if (file.endsWith('.jpeg') || file.endsWith('.jpg')) {
    for (let i = 0; i < buf.length - 8; i++) {
      if (buf[i] === 0xFF && (buf[i+1] === 0xC0 || buf[i+1] === 0xC2)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
    }
  }
  return { w: 0, h: 0 };
}

imgs.forEach((img, i) => {
  const d = getDimensions(img);
  console.log(`${i+1}. ${img}: ${d.w}x${d.h} ${d.w < d.h ? 'PORTRAIT' : 'LANDSCAPE'}`);
});
