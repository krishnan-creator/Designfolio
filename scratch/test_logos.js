const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  await page.setContent(`
    <html>
      <body style="margin:0; padding:20px; font-family:sans-serif;">
        <h3>Dark Background (#151519)</h3>
        <div style="background:#151519; padding:20px; display:flex; gap:20px; align-items:center;">
          <img src="http://localhost:3000/logo-comfyui.png" height="54" />
          <img src="http://localhost:3000/logo-antigravity.png" height="54" />
          <img src="http://localhost:3000/logo-qwen.png" height="54" />
          <img src="http://localhost:3000/logo-higgsfield.png" height="54" />
          <img src="http://localhost:3000/logo-elevenlabs.png" height="54" />
        </div>
        <h3>Light Background (#FFFFFF)</h3>
        <div style="background:#FFFFFF; border:1px solid #ccc; padding:20px; display:flex; gap:20px; align-items:center;">
          <img src="http://localhost:3000/logo-comfyui.png" height="54" />
          <img src="http://localhost:3000/logo-antigravity.png" height="54" />
          <img src="http://localhost:3000/logo-qwen.png" height="54" />
          <img src="http://localhost:3000/logo-higgsfield.png" height="54" />
          <img src="http://localhost:3000/logo-elevenlabs.png" height="54" />
        </div>
      </body>
    </html>
  `);

  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'scratch/logos_preview.png' });
  await browser.close();
  console.log('Saved scratch/logos_preview.png');
})();
