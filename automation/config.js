// Automated Drone Incident Collection System Configuration
export const CONFIG = {
  // API Keys and Endpoints
  apis: {
    newsApi: {
      key: process.env.NEWS_API_KEY || 'demo-key',
      baseUrl: 'https://newsapi.org/v2/everything',
      sources: 'bbc-news,reuters,associated-press,the-guardian'
    },
    gdelt: {
      baseUrl: 'https://api.gdeltproject.org/api/v2/doc/doc',
      format: 'json'
    },
    notam: {
      // ICAO NOTAM API endpoints by country
      endpoints: {
        'DK': 'https://www.naviair.dk/notam/api',
        'SE': 'https://aro.lfv.se/notam/api',
        'NO': 'https://avinor.no/notam/api',
        'DE': 'https://dfs.de/notam/api',
        'UK': 'https://nats.aero/notam/api',
        'FR': 'https://aviation.gouv.fr/notam/api'
      }
    },
    osm: {
      overpass: 'https://overpass-api.de/api/interpreter'
    }
  },

  // Search Keywords and Patterns
  keywords: {
    primary: ['drone', 'UAV', 'unmanned aircraft', 'quadcopter', 'multirotor'],
    secondary: ['sighting', 'incident', 'intrusion', 'violation', 'airspace'],
    locations: ['airport', 'nuclear', 'military', 'harbour', 'port', 'railway', 'border'],
    exclusions: ['toy drone', 'recreational', 'authorized', 'permitted']
  },

  // Evidence Classification Rules
  evidenceRules: {
    level3: { // Confirmed
      sources: ['NOTAM', 'NAVTEX', 'official', 'authority', 'police'],
      keywords: ['confirmed', 'official', 'investigation', 'arrest'],
      minSources: 1
    },
    level2: { // Suspected
      sources: ['news', 'media', 'journalist'],
      keywords: ['suspected', 'reported', 'witnesses', 'multiple'],
      minSources: 2
    },
    level1: { // Single source
      sources: ['local news', 'regional media'],
      keywords: ['reported', 'sighting', 'witness'],
      minSources: 1
    },
    level0: { // Unconfirmed
      sources: ['social media', 'twitter', 'facebook', 'reddit'],
      keywords: ['saw', 'spotted', 'think', 'might be'],
      minSources: 1
    }
  },

  // Target Distribution for Evidence Levels
  targetDistribution: {
    evidence0: { min: 6, max: 8, percentage: 20 },   // Unconfirmed
    evidence1: { min: 8, max: 10, percentage: 25 },  // Single source
    evidence2: { min: 15, max: 18, percentage: 40 }, // Suspected
    evidence3: { min: 12, max: 15, percentage: 15 }  // Confirmed
  },

  // Geographic Coverage
  regions: {
    nordic: ['DK', 'SE', 'NO', 'FI', 'IS'],
    western: ['UK', 'IE', 'FR', 'BE', 'NL', 'LU'],
    central: ['DE', 'AT', 'CH', 'CZ', 'SK', 'PL', 'HU'],
    southern: ['ES', 'PT', 'IT', 'GR', 'MT', 'CY'],
    eastern: ['EE', 'LV', 'LT', 'RO', 'BG', 'HR', 'SI']
  },

  // Asset Types and OSM Queries
  assetQueries: {
    airport: `
      [out:json][timeout:25];
      (
        node["aeroway"="aerodrome"]["iata"];
        way["aeroway"="aerodrome"]["iata"];
        relation["aeroway"="aerodrome"]["iata"];
      );
      out center;
    `,
    nuclear: `
      [out:json][timeout:25];
      (
        node["power"="plant"]["plant:source"="nuclear"];
        way["power"="plant"]["plant:source"="nuclear"];
        relation["power"="plant"]["plant:source"="nuclear"];
      );
      out center;
    `,
    military: `
      [out:json][timeout:25];
      (
        node["landuse"="military"];
        way["landuse"="military"];
        relation["landuse"="military"];
      );
      out center;
    `,
    harbour: `
      [out:json][timeout:25];
      (
        node["harbour"="yes"];
        way["harbour"="yes"];
        relation["harbour"="yes"];
      );
      out center;
    `
  },

  // Processing Settings
  processing: {
    maxIncidentsPerRun: 50,
    duplicateThreshold: 0.8, // Similarity threshold for deduplication
    geoRadius: 5000, // meters - incidents within this radius are considered duplicates
    maxAge: 90, // days - maximum age for incidents
    updateFrequency: '0 */6 * * *' // Every 6 hours
  }
};