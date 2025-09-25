import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  try {
    console.log('Testing mobile UI on deployed version...');
    await page.goto('https://dronewatch-907-arnarssons-projects.vercel.app/', { waitUntil: 'networkidle' });

    // Wait for map to load
    await page.waitForSelector('#map', { timeout: 10000 });

    // Check if content is visible
    const mapVisible = await page.isVisible('#map');
    const headerVisible = await page.isVisible('header');
    const rightPanelVisible = await page.isVisible('#right');

    console.log('Mobile UI Test Results:');
    console.log('- Header visible:', headerVisible);
    console.log('- Map visible:', mapVisible);
    console.log('- Right panel visible:', rightPanelVisible);

    // Take screenshot
    await page.screenshot({ path: 'mobile-test.png', fullPage: true });
    console.log('Screenshot saved as mobile-test.png');

  } catch (error) {
    console.error('Error testing mobile UI:', error);
  }

  await browser.close();
})();