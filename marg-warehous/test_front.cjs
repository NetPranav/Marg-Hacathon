const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('FRONT LOG:', msg.text()));
  page.on('pageerror', error => console.log('FRONT ERROR:', error.message));
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot_front.png' });
  
  await browser.close();
})();
