import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(ctx => ctx.newPage());

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log('LOG:', text);
  });

  page.on('pageerror', err => {
    console.log('ERROR:', err.message);
  });

  await page.goto('https://dronez.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Check which logs we got
  const hasMapReference = logs.some(log => log.includes('Map reference created'));
  const hasSatelliteLayer = logs.some(log => log.includes('About to create satellite layer'));
  const hasStateCreated = logs.some(log => log.includes('State object created'));
  const hasStateAssigned = logs.some(log => log.includes('State assigned to window'));

  console.log('\n=== Log Analysis ===');
  console.log('Map reference created:', hasMapReference);
  console.log('Satellite layer log:', hasSatelliteLayer);
  console.log('State object created:', hasStateCreated);
  console.log('State assigned to window:', hasStateAssigned);

  await browser.close();
})();