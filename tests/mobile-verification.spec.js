import { test, expect } from '@playwright/test';

test('Mobile map display and incident functionality', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  console.log('🔍 Testing mobile map display...');

  // Navigate to the app
  await page.goto('/');

  // Wait for the page to load
  await page.waitForTimeout(2000);

  // Check if main-container exists and has proper height
  const mainContainer = page.locator('#main-container');
  await expect(mainContainer).toBeVisible();

  // Check if map-container exists and is visible
  const mapContainer = page.locator('#map-container');
  await expect(mapContainer).toBeVisible();

  // Get the height of the map container
  const mapHeight = await mapContainer.evaluate(el => el.offsetHeight);
  console.log(`📏 Map container height: ${mapHeight}px`);

  // Map should have significant height (not 0 or very small)
  expect(mapHeight).toBeGreaterThan(200);

  // Check if Leaflet map is initialized
  const leafletMap = page.locator('.leaflet-container');
  await expect(leafletMap).toBeVisible();

  console.log('✅ Mobile map display test passed');
});

test('Verify incidents data loading', async ({ page }) => {
  console.log('🔍 Testing incidents data loading...');

  // Navigate to the incidents.json endpoint
  await page.goto('/incidents.json');

  // Get the JSON content
  const content = await page.textContent('body');
  const incidentsData = JSON.parse(content);

  console.log(`📊 Found ${incidentsData.incidents.length} incidents in data`);
  console.log(`🕐 Data generated at: ${incidentsData.generated_utc}`);

  // Verify we have incident data
  expect(incidentsData.incidents.length).toBeGreaterThan(0);

  // Check first incident has required fields
  const firstIncident = incidentsData.incidents[0];
  expect(firstIncident).toHaveProperty('id');
  expect(firstIncident).toHaveProperty('asset');
  expect(firstIncident).toHaveProperty('incident');
  expect(firstIncident.asset).toHaveProperty('lat');
  expect(firstIncident.asset).toHaveProperty('lon');

  console.log(`📍 First incident at: ${firstIncident.asset.name} (${firstIncident.asset.lat}, ${firstIncident.asset.lon})`);
  console.log('✅ Incidents data verification completed');
});

test('Test incident markers and interaction', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  console.log('🔍 Testing incident markers and interaction...');

  await page.goto('/');

  // Wait for map to load
  await page.waitForTimeout(3000);

  // Check for incident markers
  await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
  const markers = await page.locator('.leaflet-marker-icon').count();
  console.log(`🎯 Found ${markers} incident markers`);

  expect(markers).toBeGreaterThan(0);

  // Test clicking the first marker
  if (markers > 0) {
    console.log('🖱️ Testing incident click interaction...');

    const firstMarker = page.locator('.leaflet-marker-icon').first();
    await firstMarker.click();

    // Wait for any animations or popups
    await page.waitForTimeout(1000);

    console.log('✅ Incident click interaction test completed');
  }

  console.log('✅ All incident marker tests passed');
});