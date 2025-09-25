import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({ viewport: { width: 375, height: 667 } }).then(ctx => ctx.newPage());

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('State assigned') || text.includes('FocusIncident')) {
      console.log('LOG:', text);
    }
  });

  await page.goto('https://dronez.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const check = await page.evaluate(() => ({
    stateExists: !!window.state,
    droneStateExists: !!window.droneState,
    focusIncidentExists: !!window.focusIncident,
    droneFocusIncidentExists: !!window.droneFocusIncident,
    allIncidentsLength: window.state?.allIncidents?.length || 0
  }));

  console.log('Globals:', JSON.stringify(check, null, 2));
  await browser.close();
})();