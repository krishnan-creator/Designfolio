const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const ARTWORKS = [
  {
    filename: 'landscape-08.jpg',
    w: 1280, h: 720,
    type: 'landscape',
    render: `
      // Titan Starship Wreck in Frozen Sea
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#020b14');
      grad.addColorStop(0.4, '#082338');
      grad.addColorStop(0.7, '#114b5f');
      grad.addColorStop(1, '#051821');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Aurora Borealis
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.globalAlpha = 0.35 - i * 0.08;
        const aGrad = ctx.createLinearGradient(0, 50 + i * 40, w, 200 + i * 40);
        aGrad.addColorStop(0, '#00ffc8');
        aGrad.addColorStop(0.5, '#7b2cbf');
        aGrad.addColorStop(1, '#00b4d8');
        ctx.fillStyle = aGrad;
        ctx.beginPath();
        ctx.moveTo(0, 100 + i * 30);
        ctx.bezierCurveTo(w*0.3, 40 + i*50, w*0.7, 180 + i*20, w, 80 + i*40);
        ctx.lineTo(w, 240 + i*40);
        ctx.bezierCurveTo(w*0.6, 220, w*0.3, 140, 0, 200);
        ctx.closePath();
        ctx.filter = 'blur(35px)';
        ctx.fill();
        ctx.restore();
      }

      // Colossal Starship Hull (Silhouette in ice)
      ctx.save();
      ctx.fillStyle = '#080d14';
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.75);
      ctx.lineTo(w * 0.45, h * 0.28);
      ctx.lineTo(w * 0.58, h * 0.34);
      ctx.lineTo(w * 0.75, h * 0.58);
      ctx.lineTo(w * 0.85, h * 0.78);
      ctx.closePath();
      ctx.fill();

      // Hull highlights and engine glow
      ctx.strokeStyle = '#2a4359';
      ctx.lineWidth = 4;
      ctx.stroke();

      const engGrad = ctx.createRadialGradient(w*0.5, h*0.38, 5, w*0.5, h*0.38, 80);
      engGrad.addColorStop(0, 'rgba(0, 220, 255, 0.9)');
      engGrad.addColorStop(0.5, 'rgba(0, 100, 200, 0.4)');
      engGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = engGrad;
      ctx.beginPath();
      ctx.arc(w*0.5, h*0.38, 80, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      // Frozen Sea Glaciers
      ctx.fillStyle = '#0f293a';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.72);
      for (let x = 0; x <= w; x += 40) {
        ctx.lineTo(x, h * 0.72 + Math.sin(x * 0.02) * 25 + Math.cos(x * 0.05) * 15);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Ice highlights
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.72);
      for (let x = 0; x <= w; x += 40) {
        ctx.lineTo(x, h * 0.72 + Math.sin(x * 0.02) * 25 + Math.cos(x * 0.05) * 15);
      }
      ctx.stroke();
    `
  },
  {
    filename: 'landscape-09.jpg',
    w: 1280, h: 720,
    type: 'landscape',
    render: `
      // Solar Forge Horizon Ridge
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1a0003');
      grad.addColorStop(0.4, '#4a0505');
      grad.addColorStop(0.7, '#d9480f');
      grad.addColorStop(1, '#ff922b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Blazing Solar Prominence
      ctx.save();
      const sunGrad = ctx.createRadialGradient(w * 0.65, h * 0.4, 20, w * 0.65, h * 0.4, 280);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.2, '#ffe066');
      sunGrad.addColorStop(0.6, '#ff6b6b');
      sunGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w * 0.65, h * 0.4, 280, 0, Math.PI * 2);
      ctx.fill();

      // Coronal loops
      ctx.strokeStyle = 'rgba(255, 230, 100, 0.4)';
      ctx.lineWidth = 6;
      ctx.filter = 'blur(4px)';
      ctx.beginPath();
      ctx.arc(w * 0.65, h * 0.4, 220, Math.PI * 0.8, Math.PI * 1.9);
      ctx.stroke();
      ctx.restore();

      // Megastructure solar collector silhouette
      ctx.fillStyle = '#0d0203';
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h);
      ctx.lineTo(w * 0.25, h * 0.35);
      ctx.lineTo(w * 0.32, h * 0.35);
      ctx.lineTo(w * 0.38, h * 0.55);
      ctx.lineTo(w * 0.52, h * 0.55);
      ctx.lineTo(w * 0.58, h * 0.38);
      ctx.lineTo(w * 0.64, h * 0.38);
      ctx.lineTo(w * 0.72, h);
      ctx.closePath();
      ctx.fill();

      // Molten energy beams
      ctx.strokeStyle = '#fff3bf';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.35);
      ctx.lineTo(w * 0.65, h * 0.4);
      ctx.moveTo(w * 0.61, h * 0.38);
      ctx.lineTo(w * 0.65, h * 0.4);
      ctx.stroke();
    `
  },
  {
    filename: 'landscape-10.jpg',
    w: 1280, h: 720,
    type: 'landscape',
    render: `
      // Submerged Cybernetic Megastructure
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#020d1a');
      grad.addColorStop(0.5, '#052a3d');
      grad.addColorStop(1, '#011520');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Light shafts / god rays
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const rayGrad = ctx.createLinearGradient(w * 0.2 + i * 150, 0, w * 0.1 + i * 180, h);
        rayGrad.addColorStop(0, 'rgba(34, 211, 238, 0.25)');
        rayGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(w * 0.15 + i * 140, 0);
        ctx.lineTo(w * 0.25 + i * 140, 0);
        ctx.lineTo(w * 0.4 + i * 180, h);
        ctx.lineTo(w * 0.2 + i * 180, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Ancient temple monoliths
      ctx.fillStyle = '#03141f';
      ctx.beginPath();
      ctx.rect(w * 0.18, h * 0.35, 120, h * 0.65);
      ctx.rect(w * 0.42, h * 0.22, 180, h * 0.78);
      ctx.rect(w * 0.72, h * 0.40, 140, h * 0.60);
      ctx.fill();

      // Glowing Teal Runes
      ctx.fillStyle = '#2dd4bf';
      ctx.shadowColor = '#2dd4bf';
      ctx.shadowBlur = 12;
      for (let y = h * 0.28; y < h * 0.85; y += 45) {
        ctx.fillRect(w * 0.50, y, 24, 6);
        ctx.fillRect(w * 0.23, y + 50, 16, 5);
        ctx.fillRect(w * 0.78, y + 20, 20, 5);
      }
    `
  },
  {
    filename: 'portrait-03.jpg',
    w: 720, h: 1080,
    type: 'portrait',
    render: `
      // Cyberpunk Combat Android
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#06060c');
      grad.addColorStop(0.6, '#0f1020');
      grad.addColorStop(1, '#1f0d1b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Neon Rim Lighting (Magenta / Cyan)
      const rimM = ctx.createRadialGradient(w * 0.2, h * 0.35, 10, w * 0.2, h * 0.35, 260);
      rimM.addColorStop(0, 'rgba(236, 72, 153, 0.45)');
      rimM.addColorStop(1, 'transparent');
      ctx.fillStyle = rimM;
      ctx.fillRect(0, 0, w, h);

      const rimC = ctx.createRadialGradient(w * 0.8, h * 0.45, 10, w * 0.8, h * 0.45, 260);
      rimC.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      rimC.addColorStop(1, 'transparent');
      ctx.fillStyle = rimC;
      ctx.fillRect(0, 0, w, h);

      // Cybernetic Head Silhouette
      ctx.save();
      ctx.fillStyle = '#11121d';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.42, 140, 190, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neck and Torso Armor
      ctx.beginPath();
      ctx.moveTo(w * 0.36, h * 0.58);
      ctx.lineTo(w * 0.2, h);
      ctx.lineTo(w * 0.8, h);
      ctx.lineTo(w * 0.64, h * 0.58);
      ctx.closePath();
      ctx.fill();

      // Glowing Crimson Ocular Sensor
      ctx.fillStyle = '#ff2a55';
      ctx.shadowColor = '#ff2a55';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.ellipse(w * 0.43, h * 0.40, 22, 12, -0.1, 0, Math.PI * 2);
      ctx.ellipse(w * 0.57, h * 0.40, 22, 12, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Cybernetic panel lines
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.24);
      ctx.lineTo(w * 0.5, h * 0.36);
      ctx.moveTo(w * 0.32, h * 0.44);
      ctx.lineTo(w * 0.42, h * 0.52);
      ctx.moveTo(w * 0.68, h * 0.44);
      ctx.lineTo(w * 0.58, h * 0.52);
      ctx.stroke();
      ctx.restore();
    `
  },
  {
    filename: 'portrait-04.jpg',
    w: 720, h: 1080,
    type: 'portrait',
    render: `
      // Quantum Monk Transmutation
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#050308');
      grad.addColorStop(0.5, '#150a24');
      grad.addColorStop(1, '#2d1447');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Sacred Golden Geometry Rings
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 2;
      for (let r = 70; r < 240; r += 45) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.42, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Meditating Silhouette
      ctx.fillStyle = '#090510';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.34, 55, 0, Math.PI * 2); // Head
      ctx.moveTo(w * 0.5, h * 0.39);
      ctx.lineTo(w * 0.28, h * 0.68); // Left shoulder/knee
      ctx.lineTo(w * 0.72, h * 0.68); // Right knee
      ctx.closePath();
      ctx.fill();

      // Quantum Floating Energy Core
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.48, 16, 0, Math.PI * 2);
      ctx.fill();
    `
  },
  {
    filename: 'portrait-05.jpg',
    w: 720, h: 1080,
    type: 'portrait',
    render: `
      // Astro-Nomad Void Walker
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#000003');
      grad.addColorStop(0.6, '#060a14');
      grad.addColorStop(1, '#0b1626');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Deep Space Stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 90; i++) {
        const x = (i * 37) % w;
        const y = (i * 83) % (h * 0.6);
        ctx.fillRect(x, y, (i % 3) + 1, (i % 3) + 1);
      }

      // Helmet & Torso Silhouette
      ctx.fillStyle = '#0f141c';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.38, 130, 0, Math.PI * 2);
      ctx.fill();

      // Curved Gold Visor with Nebula Reflection
      ctx.save();
      const vGrad = ctx.createLinearGradient(w * 0.3, h * 0.28, w * 0.7, h * 0.46);
      vGrad.addColorStop(0, '#fbbf24');
      vGrad.addColorStop(0.3, '#ec4899');
      vGrad.addColorStop(0.7, '#8b5cf6');
      vGrad.addColorStop(1, '#3b82f6');
      ctx.fillStyle = vGrad;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.37, 95, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Space Suit Torso & Neck Ring
      ctx.fillStyle = '#151d28';
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.52);
      ctx.lineTo(w * 0.15, h);
      ctx.lineTo(w * 0.85, h);
      ctx.lineTo(w * 0.7, h * 0.52);
      ctx.closePath();
      ctx.fill();
    `
  },
  {
    filename: 'portrait-06.jpg',
    w: 720, h: 1080,
    type: 'portrait',
    render: `
      // Valkyrie Kinetic Exosuit
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#131e33');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Kinetic Wing Blades
      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 25;
      for (let i = 0; i < 4; i++) {
        // Left wings
        ctx.beginPath();
        ctx.moveTo(w * 0.4, h * 0.35 + i * 40);
        ctx.lineTo(w * 0.05, h * 0.2 + i * 50);
        ctx.lineTo(w * 0.35, h * 0.4 + i * 40);
        ctx.closePath();
        ctx.fill();
        // Right wings
        ctx.beginPath();
        ctx.moveTo(w * 0.6, h * 0.35 + i * 40);
        ctx.lineTo(w * 0.95, h * 0.2 + i * 50);
        ctx.lineTo(w * 0.65, h * 0.4 + i * 40);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Armor Silhouette
      ctx.fillStyle = '#0b111a';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.36, 90, 120, 0, 0, Math.PI * 2);
      ctx.rect(w * 0.32, h * 0.48, w * 0.36, h * 0.52);
      ctx.fill();
    `
  },
  {
    filename: 'portrait-07.jpg',
    w: 720, h: 1080,
    type: 'portrait',
    render: `
      // Neomorphic Bio-Replicant
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#08080c');
      grad.addColorStop(0.5, '#12141c');
      grad.addColorStop(1, '#1a1d29');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Pale Synthetic Porcelain Face
      ctx.save();
      const faceGrad = ctx.createRadialGradient(w * 0.5, h * 0.42, 20, w * 0.5, h * 0.42, 170);
      faceGrad.addColorStop(0, '#f1f5f9');
      faceGrad.addColorStop(0.7, '#94a3b8');
      faceGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.42, 130, 180, 0, 0, Math.PI * 2);
      ctx.fill();

      // Luminescent Cyan Circuit Veins
      ctx.strokeStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.32);
      ctx.lineTo(w * 0.44, h * 0.42);
      ctx.lineTo(w * 0.42, h * 0.54);
      ctx.moveTo(w * 0.62, h * 0.32);
      ctx.lineTo(w * 0.56, h * 0.42);
      ctx.lineTo(w * 0.58, h * 0.54);
      ctx.stroke();
      ctx.restore();
    `
  },
  {
    filename: 'portrait-08.jpg',
    w: 720, h: 1080,
    type: 'portrait',
    render: `
      // Solar Deity High Priest
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1c0c02');
      grad.addColorStop(0.6, '#381604');
      grad.addColorStop(1, '#0d0501');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Gold Sunburst Headdress
      ctx.save();
      ctx.fillStyle = '#eab308';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 20;
      for (let i = 0; i < 16; i++) {
        const ang = (i / 15) * Math.PI - Math.PI;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.36);
        ctx.lineTo(w * 0.5 + Math.cos(ang) * 220, h * 0.36 + Math.sin(ang) * 220);
        ctx.lineTo(w * 0.5 + Math.cos(ang + 0.1) * 190, h * 0.36 + Math.sin(ang + 0.1) * 190);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Obsidian Mask
      ctx.fillStyle = '#080808';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.42, 110, 150, 0, 0, Math.PI * 2);
      ctx.fill();
    `
  },
  {
    filename: 'portrait-09.jpg',
    w: 720, h: 1080,
    type: 'portrait',
    render: `
      // Shinjuku Neo-Ronin
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#050508');
      grad.addColorStop(0.5, '#120a1c');
      grad.addColorStop(1, '#050308');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Cyber Katana Energy Blade
      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 25;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.95);
      ctx.lineTo(w * 0.78, h * 0.12);
      ctx.stroke();

      // Blade Core White
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.95);
      ctx.lineTo(w * 0.78, h * 0.12);
      ctx.stroke();
      ctx.restore();

      // High-Collar Cyber Ronin Coat
      ctx.fillStyle = '#0a0d14';
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.42);
      ctx.lineTo(w * 0.18, h);
      ctx.lineTo(w * 0.82, h);
      ctx.lineTo(w * 0.68, h * 0.42);
      ctx.closePath();
      ctx.fill();
    `
  },
  {
    filename: 'portrait-10.jpg',
    w: 720, h: 1080,
    type: 'portrait',
    render: `
      // Celestial Chronomancer
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#03050c');
      grad.addColorStop(0.5, '#0a1226');
      grad.addColorStop(1, '#1b0d28');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Temporal Astrolabe Rings
      ctx.save();
      ctx.strokeStyle = '#818cf8';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.40, 210, 110, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.40, 210, 110, -Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Chronomancer Silhouette
      ctx.fillStyle = '#080a12';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.35, 60, 0, Math.PI * 2);
      ctx.moveTo(w * 0.35, h * 0.45);
      ctx.lineTo(w * 0.2, h);
      ctx.lineTo(w * 0.8, h);
      ctx.lineTo(w * 0.65, h * 0.45);
      ctx.closePath();
      ctx.fill();
    `
  }
];

// Create an HTML generator to render each canvas and capture via Chrome
const htmlContent = `
<!DOCTYPE html>
<html>
<head><style>body { margin: 0; background: #000; overflow: hidden; }</style></head>
<body>
<canvas id="cvs"></canvas>
<script>
window.renderArt = function(idx) {
  const art = ${JSON.stringify(ARTWORKS)}[idx];
  const cvs = document.getElementById('cvs');
  cvs.width = art.w;
  cvs.height = art.h;
  const ctx = cvs.getContext('2d');
  const w = art.w;
  const h = art.h;
  eval(art.render);
  return true;
};
</script>
</body>
</html>
`;

fs.writeFileSync('scratch/art_generator.html', htmlContent);

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\temp\\chrome_debug_art_' + Math.random().toString(36).substring(7);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--remote-allow-origins=*',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { detached: false });

  try {
    for (let i = 0; i < 30; i++) {
      try {
        await fetchJson('http://127.0.0.1:9222/json/version');
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const pages = await fetchJson('http://127.0.0.1:9222/json/list');
    let target = pages && pages.find(p => p.type === 'page');
    if (!target) {
      target = await fetchJson('http://127.0.0.1:9222/json/new');
    }

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 1;
    const pending = new Map();

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');

    await send('Page.navigate', { url: 'http://localhost:3000/scratch/art_generator.html' });
    await new Promise(r => setTimeout(r, 1000));

    for (let i = 0; i < ARTWORKS.length; i++) {
      const art = ARTWORKS[i];
      await send('Emulation.setDeviceMetricsOverride', {
        width: art.w,
        height: art.h,
        deviceScaleFactor: 1,
        mobile: false
      });
      await send('Runtime.evaluate', {
        expression: 'window.renderArt(' + i + ')'
      });
      await new Promise(r => setTimeout(r, 200));

      const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
      const buf = Buffer.from(shot.data, 'base64');
      fs.writeFileSync(art.filename, buf);
      console.log('Saved', art.filename, 'size:', buf.length);
    }

    ws.close();
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

main().catch(console.error);
