import { RSSNewsScraper } from './automation/scrapers/rss-news-scraper.js';

async function testScraper() {
  const scraper = new RSSNewsScraper();

  console.log('Testing location detection...\n');

  // Test texts
  const testTexts = [
    'Drone sighting at Aalborg Airport causes disruption',
    'Port of Copenhagen closed due to drone incident',
    'Billund Airport security incident with UAV reported',
    'Skrydstrup Air Base reports drone breach yesterday',
    'Multiple drones spotted near Port of Aarhus',
    'Esbjerg harbor security responds to drone sighting'
  ];

  testTexts.forEach(text => {
    const location = scraper.extractLocationInfo(text);
    console.log(`Text: "${text}"`);
    if (location) {
      console.log(`✓ Found: ${location.name} (${location.type})`);
      console.log(`  Coordinates: ${location.lat}, ${location.lon}`);
    } else {
      console.log(`✗ No location found`);
    }
    console.log('');
  });

  console.log('\nNumber of news sources configured:', Object.keys(scraper.rssSources).length);
  console.log('Number of airports configured:', Object.keys(scraper.europeanAirports).length);
  console.log('Number of harbors configured:', Object.keys(scraper.europeanHarbors).length);
}

testScraper().catch(console.error);