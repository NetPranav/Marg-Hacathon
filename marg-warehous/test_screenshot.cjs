const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
  
  // Fill login
  await page.type('input[type="email"]', 'admin@example.com');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  
  await page.screenshot({ path: 'screenshot_dash.png' });
  
  await browser.close();
})();
