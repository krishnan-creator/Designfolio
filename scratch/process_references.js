const fs = require('fs');
const zlib = require('zlib');

function unfilterPng(buf) {
  let pos = 8;
  let idatList = [];
  let w = 0, h = 0;
  while(pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.slice(pos+4, pos+8).toString();
    if (type === 'IHDR') {
      w = buf.readUInt32BE(pos+8);
      h = buf.readUInt32BE(pos+12);
    } else if (type === 'IDAT') {
      idatList.push(buf.slice(pos+8, pos+8+len));
    }
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idatList));
  const rowBytes = w * 4;
  const pixels = Buffer.alloc(w * h * 4);
  
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (rowBytes + 1)];
    const srcRow = y * (rowBytes + 1) + 1;
    const dstRow = y * rowBytes;
    
    for (let x = 0; x < rowBytes; x++) {
      let val = raw[srcRow + x];
      const a = x >= 4 ? pixels[dstRow + x - 4] : 0;
      const b = y > 0 ? pixels[(y - 1) * rowBytes + x] : 0;
      const c = (x >= 4 && y > 0) ? pixels[(y - 1) * rowBytes + x - 4] : 0;
      
      if (filter === 1) val = (val + a) & 0xff;
      else if (filter === 2) val = (val + b) & 0xff;
      else if (filter === 3) val = (val + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : ((pb <= pc) ? b : c);
        val = (val + pr) & 0xff;
      }
      pixels[dstRow + x] = val;
    }
  }
  return { w, h, pixels };
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.slice(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function encodePng(w, h, pixels) {
  const rowBytes = w * 4;
  const raw = Buffer.alloc(h * (rowBytes + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (rowBytes + 1)] = 0; // Filter 0 (None)
    pixels.copy(raw, y * (rowBytes + 1) + 1, y * rowBytes, (y + 1) * rowBytes);
  }
  const idatData = zlib.deflateSync(raw, { level: 9 });
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', idatData),
    makePngChunk('IEND', Buffer.alloc(0))
  ]);
}

// Process sticky note
function processStickyNote() {
  const buf = fs.readFileSync('sticky-note-reference.png');
  const { w, h, pixels } = unfilterPng(buf);
  
  // Flood fill from corners for white/near-white background
  const visited = new Uint8Array(w * h);
  const queue = [0, w - 1, (h - 1) * w, h * w - 1]; // 4 corners
  queue.forEach(idx => { visited[idx] = 1; });
  
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % w;
    const y = Math.floor(idx / w);
    const pIdx = idx * 4;
    const r = pixels[pIdx];
    const g = pixels[pIdx + 1];
    const b = pixels[pIdx + 2];
    
    // Check if near white
    // Note is yellowish (high r, high g, lower b), background is neutral white (r~g~b > 240)
    const isNearWhite = (r > 235 && g > 235 && b > 230 && Math.abs(r - g) < 20 && (r - b) < 25);
    if (isNearWhite) {
      pixels[pIdx + 3] = 0; // transparent
      const neighbors = [];
      if (x > 0) neighbors.push(idx - 1);
      if (x < w - 1) neighbors.push(idx + 1);
      if (y > 0) neighbors.push(idx - w);
      if (y < h - 1) neighbors.push(idx + w);
      
      for (const n of neighbors) {
        if (!visited[n]) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  // Antialias edges: if any opaque pixel touches a transparent pixel and is very bright white-ish, feather alpha
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const pIdx = idx * 4;
      if (pixels[pIdx + 3] > 0) {
        const hasTransNeighbor = 
          pixels[((y-1)*w + x)*4 + 3] === 0 ||
          pixels[((y+1)*w + x)*4 + 3] === 0 ||
          pixels[(y*w + x-1)*4 + 3] === 0 ||
          pixels[(y*w + x+1)*4 + 3] === 0;
        if (hasTransNeighbor) {
          const r = pixels[pIdx];
          const g = pixels[pIdx+1];
          const b = pixels[pIdx+2];
          if (r > 230 && g > 230 && b > 220) {
            pixels[pIdx + 3] = Math.max(0, 255 - Math.round((r + g + b) / 3));
          }
        }
      }
    }
  }

  // Find bounding box
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pixels[(y * w + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropPixels = Buffer.alloc(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((minY + y) * w + (minX + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;
      pixels.copy(cropPixels, dstIdx, srcIdx, srcIdx + 4);
    }
  }

  const outBuf = encodePng(cropW, cropH, cropPixels);
  fs.writeFileSync('sticky-note-clean.png', outBuf);
  console.log(`Saved sticky-note-clean.png: ${outBuf.length} (${cropW}x${cropH})`);
}

// Process push pin
function processPushPin() {
  const buf = fs.readFileSync('push-pin-reference.png');
  const { w, h, pixels } = unfilterPng(buf);
  
  // Ignore bottom banner: clear anything where y >= 500
  for (let y = 500; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pIdx = (y * w + x) * 4;
      pixels[pIdx + 3] = 0;
    }
  }

  const visited = new Uint8Array(w * h);
  const queue = [0, w - 1, 499 * w, 499 * w + w - 1];
  queue.forEach(idx => { visited[idx] = 1; });
  
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % w;
    const y = Math.floor(idx / w);
    if (y >= 500) continue;
    const pIdx = idx * 4;
    const r = pixels[pIdx];
    const g = pixels[pIdx + 1];
    const b = pixels[pIdx + 2];
    
    // Background is pure white / light gray > 230
    const isBackground = (r > 225 && g > 225 && b > 225);
    if (isBackground) {
      pixels[pIdx + 3] = 0; // transparent
      const neighbors = [];
      if (x > 0) neighbors.push(idx - 1);
      if (x < w - 1) neighbors.push(idx + 1);
      if (y > 0) neighbors.push(idx - w);
      if (y < 499) neighbors.push(idx + w);
      
      for (const n of neighbors) {
        if (!visited[n]) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  // Antialias edge
  for (let y = 1; y < 499; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const pIdx = idx * 4;
      if (pixels[pIdx + 3] > 0) {
        const hasTransNeighbor = 
          pixels[((y-1)*w + x)*4 + 3] === 0 ||
          pixels[((y+1)*w + x)*4 + 3] === 0 ||
          pixels[(y*w + x-1)*4 + 3] === 0 ||
          pixels[(y*w + x+1)*4 + 3] === 0;
        if (hasTransNeighbor) {
          const r = pixels[pIdx];
          const g = pixels[pIdx+1];
          const b = pixels[pIdx+2];
          if (r > 220 && g > 220 && b > 220) {
            pixels[pIdx + 3] = Math.max(0, Math.min(255, 765 - (r + g + b)));
          }
        }
      }
    }
  }

  // Find bounding box
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < 500; y++) {
    for (let x = 0; x < w; x++) {
      if (pixels[(y * w + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropPixels = Buffer.alloc(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((minY + y) * w + (minX + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;
      pixels.copy(cropPixels, dstIdx, srcIdx, srcIdx + 4);
    }
  }

  const outBuf = encodePng(cropW, cropH, cropPixels);
  fs.writeFileSync('push-pin-clean.png', outBuf);
  console.log(`Saved push-pin-clean.png: ${outBuf.length} (${cropW}x${cropH})`);
}

processStickyNote();
processPushPin();
