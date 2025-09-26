import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({ viewport: { width: 375, height: 667 } }).then(ctx => ctx.newPage());

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('State') || text.includes('FocusIncident')) {
      console.log('LOG:', text);
    }
  });

  await page.goto('https://dronez.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const check = await page.evaluate(() => ({
    stateExists: !!window.state,
    focusIncidentExists: !!window.focusIncident,
    incidentsCount: window.state?.data?.incidents?.length || 0,
    mapExists: !!window.map
  }));

  console.log('Final check:', JSON.stringify(check, null, 2));

  // Take screenshot to verify no demo data
  await page.screenshot({ path: 'no-simulation-data.png' });
  console.log('Screenshot saved as no-simulation-data.png');

  await browser.close();
})();