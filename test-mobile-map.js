import { chromium } from 'playwright';

(async () => {
  console.log('Starting mobile map test...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('PAGE ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.error('Page error:', error);
  });

  try {
    console.log('Navigating to https://dronez.vercel.app/...');
    await page.goto('https://dronez.vercel.app/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Page loaded, checking elements...');

    // Check if map container exists
    const mapContainer = await page.$('#map-container');
    if (mapContainer) {
      console.log('✓ Map container found');

      // Check visibility
      const isVisible = await page.isVisible('#map-container');
      console.log('Map container visible:', isVisible);

      // Get computed styles
      const styles = await page.evaluate(() => {
        const container = document.querySelector('#map-container');
        const map = document.querySelector('#map');
        if (container) {
          const computed = window.getComputedStyle(container);
          return {
            container: {
              display: computed.display,
              width: computed.width,
              height: computed.height,
              position: computed.position,
              backgroundColor: computed.backgroundColor
            },
            map: map ? {
              display: window.getComputedStyle(map).display,
              width: window.getComputedStyle(map).width,
              height: window.getComputedStyle(map).height,
              position: window.getComputedStyle(map).position
            } : null
          };
        }
        return null;
      });

      console.log('Computed styles:', JSON.stringify(styles, null, 2));
    } else {
      console.log('✗ Map container NOT found!');
    }

    // Check if map element exists
    const mapEl = await page.$('#map');
    if (mapEl) {
      console.log('✓ Map element found');
    } else {
      console.log('✗ Map element NOT found!');
    }

    // Check for Leaflet
    const hasLeaflet = await page.evaluate(() => {
      return typeof window.L !== 'undefined';
    });
    console.log('Leaflet loaded:', hasLeaflet);

    // Check if map is initialized
    const mapInitialized = await page.evaluate(() => {
      return window.map && window.map._container ? true : false;
    });
    console.log('Map initialized:', mapInitialized);

    // Get map dimensions
    if (mapInitialized) {
      const mapDimensions = await page.evaluate(() => {
        const container = window.map._container;
        return {
          offsetWidth: container.offsetWidth,
          offsetHeight: container.offsetHeight,
          clientWidth: container.clientWidth,
          clientHeight: container.clientHeight,
          scrollWidth: container.scrollWidth,
          scrollHeight: container.scrollHeight
        };
      });
      console.log('Map dimensions:', mapDimensions);
    }

    // Check for tile layers
    const tileLayers = await page.evaluate(() => {
      if (window.map) {
        let count = 0;
        window.map.eachLayer(layer => {
          if (layer._url) count++;
        });
        return count;
      }
      return 0;
    });
    console.log('Tile layers on map:', tileLayers);

    // Take screenshot
    await page.screenshot({
      path: 'mobile-test-result.png',
      fullPage: false
    });
    console.log('Screenshot saved as mobile-test-result.png');

    // Wait a bit for tiles to load
    await page.waitForTimeout(5000);

    // Take another screenshot after waiting
    await page.screenshot({
      path: 'mobile-test-after-wait.png',
      fullPage: false
    });
    console.log('Second screenshot saved as mobile-test-after-wait.png');

  } catch (error) {
    console.error('Test failed:', error);
  }

  await browser.close();
  console.log('Test completed');
})();