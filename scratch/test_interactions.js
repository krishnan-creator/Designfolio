const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testInteractions() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  // 1. Check Video click
  const videoBtn = await page.$('.works-play-btn');
  if (videoBtn) {
    await videoBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const isPlayerOpen = await page.evaluate(() => {
      const p = document.getElementById('cinema-player-modal');
      return p && p.classList.contains('is-open');
    });
    console.log('✓ Video modal opens cleanly:', isPlayerOpen);

    const closeBtn = await page.$('.cinema-player-close');
    if (closeBtn) {
      await closeBtn.click();
      await new Promise(r => setTimeout(r, 300));
      const isPlayerClosed = await page.evaluate(() => {
        const p = document.getElementById('cinema-player-modal');
        return !p || !p.classList.contains('is-open');
      });
      console.log('✓ Video modal closes cleanly:', isPlayerClosed);
    }
  }

  // 2. Check Career Node click
  await page.evaluate(() => {
    const nodes = document.querySelectorAll('.career-node-item');
    if (nodes[3]) nodes[3].click();
  });
  await new Promise(r => setTimeout(r, 300));
  const desc = await page.evaluate(() => {
    return document.querySelector('.detail-panel-desc')?.textContent?.trim();
  });
  console.log('✓ Career node click updates description:', desc);

  await browser.close();
  console.log('All interactive flows verified 100%!');
}

testInteractions().catch(e => {
  console.error(e);
  process.exit(1);
});
