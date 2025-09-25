import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  });

  const page = await context.newPage();

  await page.goto('https://dronez.vercel.app/', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  // Click on Incidents tab
  await page.click('.mobile-nav-item[data-tab="incidents"]');
  await page.waitForTimeout(1000);

  // Check incident structure in bottom sheet
  const incidentInfo = await page.evaluate(() => {
    const firstIncident = document.querySelector('#bottom-sheet-content .incident');
    const h3 = firstIncident ? firstIncident.querySelector('h3') : null;

    // Check if state.allIncidents exists
    const stateExists = typeof window.state !== 'undefined';
    const allIncidentsExists = stateExists && window.state.allIncidents;
    const incidentCount = allIncidentsExists ? window.state.allIncidents.length : 0;

    // Get first incident from state
    const firstStateIncident = allIncidentsExists && window.state.allIncidents.length > 0
      ? window.state.allIncidents[0]
      : null;

    return {
      incidentCardExists: !!firstIncident,
      h3Exists: !!h3,
      h3Text: h3 ? h3.textContent : null,
      stateExists,
      allIncidentsExists,
      incidentCount,
      firstStateIncident: firstStateIncident ? {
        id: firstStateIncident.id,
        assetName: firstStateIncident.asset.name
      } : null,
      // Check click listeners
      hasClickListener: firstIncident ? firstIncident.onclick !== null : false
    };
  });

  console.log('Incident debug info:', JSON.stringify(incidentInfo, null, 2));

  await browser.close();
})();