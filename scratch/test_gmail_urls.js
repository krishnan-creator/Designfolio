const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const testUrls = [
    { name: 'Current Problematic URL (fs=1)', url: 'https://mail.google.com/mail/u/0/?fs=1&to=meet2krishnan@gmail.com&tff=cm' },
    { name: 'Standard Compose with view=cm (fs=0)', url: 'https://mail.google.com/mail/?view=cm&fs=0&to=meet2krishnan@gmail.com' },
    { name: 'Standard Compose with view=cm (no fs)', url: 'https://mail.google.com/mail/?view=cm&to=meet2krishnan@gmail.com' },
    { name: 'Inbox Hash Compose (#compose)', url: 'https://mail.google.com/mail/u/0/#compose' },
    { name: 'Inbox Hash with to query', url: 'https://mail.google.com/mail/u/0/#inbox?compose=new&to=meet2krishnan@gmail.com' },
    { name: 'mailto URI handler via Gmail', url: 'https://mail.google.com/mail/?extsrc=mailto&url=mailto%3Ameet2krishnan%40gmail.com' }
  ];

  for (const t of testUrls) {
    const page = await browser.newPage();
    try {
      console.log(`\nTesting: ${t.name}`);
      console.log(`Requested URL: ${t.url}`);
      const resp = await page.goto(t.url, { waitUntil: 'load', timeout: 15000 }).catch(e => ({ status: () => 'timeout / redirected' }));
      const currentUrl = page.url();
      console.log(`Final landing URL: ${currentUrl}`);
      const title = await page.title();
      console.log(`Page title: ${title}`);
      
      // Check if accounts.google.com (requires auth if no session)
      if (currentUrl.includes('accounts.google.com')) {
        console.log(`Result: Redirects to Google Login (session unauthenticated in headless browser)`);
      } else if (currentUrl.includes('mail.google.com')) {
        console.log(`Result: Landed on mail.google.com`);
      }
    } catch (err) {
      console.log(`Error testing ${t.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
})();
