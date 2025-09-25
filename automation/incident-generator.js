import { NewsAPIScraper, GDELTScraper } from './scrapers/news-scraper.js';
import { NOTAMScraper } from './scrapers/notam-scraper.js';
import { EvidenceClassifier } from './evidence-classifier.js';
import { GeographicIntelligence } from './geo-intelligence.js';
import { CONFIG } from './config.js';

export class IncidentGenerator {
  constructor() {
    this.scrapers = {
      news: new NewsAPIScraper(),
      gdelt: new GDELTScraper(),
      notam: new NOTAMScraper()
    };
    this.classifier = new EvidenceClassifier();
    this.geoIntel = new GeographicIntelligence();
  }

  async generateIncidents(options = {}) {
    const {
      daysBack = 7,
      maxIncidents = 50,
      targetDistribution = CONFIG.targetDistribution,
      enableRealData = false,
      supplementWithSimulated = true
    } = options;

    console.log('Starting automated incident generation...');

    let incidents = [];

    // Collect real data if enabled
    if (enableRealData) {
      incidents = await this.collectRealIncidents(daysBack);
      console.log(`Collected ${incidents.length} real incidents`);
    }

    // Supplement with simulated data if needed
    if (supplementWithSimulated || incidents.length < maxIncidents) {
      const needed = maxIncidents - incidents.length;
      const simulatedIncidents = await this.generateSimulatedIncidents(needed, daysBack);
      incidents.push(...simulatedIncidents);
      console.log(`Generated ${simulatedIncidents.length} simulated incidents`);
    }

    // Process all incidents
    incidents = await this.processIncidents(incidents);

    // Balance evidence distribution
    incidents = this.classifier.balanceEvidenceDistribution(incidents.slice(0, maxIncidents));

    console.log(`Final dataset: ${incidents.length} incidents`);
    console.log('Evidence distribution:', this.analyzeDistribution(incidents));

    return incidents;
  }

  async collectRealIncidents(daysBack) {
    const allIncidents = [];

    // Collect from all scrapers in parallel
    const scrapingPromises = [
      this.scrapers.news.scrapeIncidents(daysBack),
      this.scrapers.gdelt.scrapeIncidents(daysBack),
      this.scrapers.notam.scrapeIncidents(daysBack)
    ];

    try {
      const results = await Promise.allSettled(scrapingPromises);

      results.forEach((result, index) => {
        const scraperName = ['news', 'gdelt', 'notam'][index];
        if (result.status === 'fulfilled') {
          allIncidents.push(...result.value);
          console.log(`${scraperName}: ${result.value.length} incidents`);
        } else {
          console.error(`${scraperName} scraper failed:`, result.reason.message);
        }
      });

    } catch (error) {
      console.error('Error collecting real incidents:', error);
    }

    return this.deduplicateIncidents(allIncidents);
  }

  async generateSimulatedIncidents(count, daysBack) {
    const incidents = [];
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Generate incidents with realistic distribution
    for (let i = 0; i < count; i++) {
      const incident = await this.createSimulatedIncident(startDate, daysBack);
      incidents.push(incident);
    }

    return incidents;
  }

  async createSimulatedIncident(startDate, dayRange) {
    // Random timing within the range
    const incidentTime = new Date(startDate.getTime() + Math.random() * dayRange * 24 * 60 * 60 * 1000);

    // Select random location and asset
    const location = this.selectRandomLocation();
    const asset = this.generateAssetForLocation(location);

    // Create base incident
    const incident = {
      id: this.generateIncidentId(location, asset, incidentTime),
      first_seen_utc: incidentTime.toISOString(),
      asset: asset,
      location: location,
      sources: this.generateSimulatedSources(),
      keywords_matched: ['drone', 'sighting'],
      raw_data: this.generateSimulatedContent(location, asset)
    };

    return incident;
  }

  selectRandomLocation() {
    const europeanLocations = [
      // Major airports
      { name: 'Copenhagen Airport', country: 'DK', coordinates: [55.6180, 12.6560], icao: 'EKCH', iata: 'CPH' },
      { name: 'Billund Airport', country: 'DK', coordinates: [55.7403, 9.1522], icao: 'EKBI', iata: 'BLL' },
      { name: 'Aalborg Airport', country: 'DK', coordinates: [57.0927, 9.8492], icao: 'EKYT', iata: 'AAL' },
      { name: 'London Heathrow', country: 'UK', coordinates: [51.4700, -0.4543], icao: 'EGLL', iata: 'LHR' },
      { name: 'Amsterdam Schiphol', country: 'NL', coordinates: [52.3105, 4.7683], icao: 'EHAM', iata: 'AMS' },
      { name: 'Frankfurt Airport', country: 'DE', coordinates: [50.0379, 8.5622], icao: 'EDDF', iata: 'FRA' },
      { name: 'Paris Charles de Gaulle', country: 'FR', coordinates: [49.0097, 2.5479], icao: 'LFPG', iata: 'CDG' },

      // Nuclear facilities
      { name: 'Ringhals Nuclear Power Plant', country: 'SE', coordinates: [57.2500, 12.1000] },
      { name: 'Forsmark Nuclear Power Plant', country: 'SE', coordinates: [60.4056, 18.1756] },
      { name: 'Doel Nuclear Power Station', country: 'BE', coordinates: [51.3256, 4.2572] },
      { name: 'Gravelines Nuclear Power Station', country: 'FR', coordinates: [51.0131, 2.1333] },

      // Military bases
      { name: 'Ramstein Air Base', country: 'DE', coordinates: [49.4369, 7.6003] },
      { name: 'RAF Lakenheath', country: 'UK', coordinates: [52.4093, 0.5610] },
      { name: 'Thule Air Base', country: 'DK', coordinates: [76.5311, -68.7032] },

      // Major ports
      { name: 'Port of Rotterdam', country: 'NL', coordinates: [51.9225, 4.4792] },
      { name: 'Port of Hamburg', country: 'DE', coordinates: [53.5388, 9.9742] },
      { name: 'Port of Copenhagen', country: 'DK', coordinates: [55.6867, 12.6014] },

      // Railway hubs
      { name: 'Berlin Hauptbahnhof', country: 'DE', coordinates: [52.5250, 13.3694] },
      { name: 'Amsterdam Centraal', country: 'NL', coordinates: [52.3791, 4.9003] },
      { name: 'Copenhagen Central Station', country: 'DK', coordinates: [55.6725, 12.5642] },

      // Border crossings
      { name: 'Dover-Calais', country: 'UK', coordinates: [51.1295, 1.3141] },
      { name: 'Øresund Bridge', country: 'DK', coordinates: [55.5717, 12.8786] }
    ];

    return europeanLocations[Math.floor(Math.random() * europeanLocations.length)];
  }

  generateAssetForLocation(location) {
    // Determine asset type based on location name
    const name = location.name.toLowerCase();

    if (name.includes('airport') || location.icao) {
      return {
        type: 'airport',
        name: location.name,
        icao: location.icao,
        iata: location.iata
      };
    }

    if (name.includes('nuclear') || name.includes('power')) {
      return {
        type: 'nuclear',
        name: location.name
      };
    }

    if (name.includes('base') || name.includes('raf') || name.includes('air force')) {
      return {
        type: 'military',
        name: location.name
      };
    }

    if (name.includes('port') || name.includes('harbour')) {
      return {
        type: 'harbour',
        name: location.name
      };
    }

    if (name.includes('station') || name.includes('centraal') || name.includes('hauptbahnhof')) {
      return {
        type: 'rail',
        name: location.name
      };
    }

    if (name.includes('bridge') || name.includes('border') || name.includes('crossing')) {
      return {
        type: 'border',
        name: location.name
      };
    }

    // Default to airport if unclear
    return {
      type: 'airport',
      name: location.name
    };
  }

  generateSimulatedSources() {
    const sourceTypes = ['news', 'social_media', 'official', 'witness'];
    const publications = [
      'Local News 24', 'European Aviation Daily', 'Security Watch',
      'Regional Times', 'Aviation Safety Report', 'Defense Newsletter'
    ];

    const numSources = Math.random() < 0.3 ? 1 : Math.random() < 0.7 ? 2 : 3;
    const sources = [];

    for (let i = 0; i < numSources; i++) {
      sources.push({
        type: sourceTypes[Math.floor(Math.random() * sourceTypes.length)],
        publication: publications[Math.floor(Math.random() * publications.length)],
        url: `https://example.com/news/${Math.random().toString(36).substring(7)}`,
        title: this.generateSourceTitle(),
        published_at: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString()
      });
    }

    return sources;
  }

  generateSourceTitle() {
    const templates = [
      'Drone Sighting Reported Near {location}',
      'Unauthorized UAV Activity Detected at {location}',
      'Airport Operations Disrupted by Drone Incident',
      'Security Alert: Unmanned Aircraft Spotted',
      'Investigation Launched into Drone Intrusion',
      'Witnesses Report Suspicious Drone Activity',
      'Aviation Authorities Investigate UAV Sighting',
      'Emergency Response to Drone Near Critical Infrastructure'
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateSimulatedContent(location, asset) {
    const scenarios = [
      `Multiple witnesses reported a drone hovering near ${location.name} at approximately ${this.randomTime()}. Security personnel were notified and are investigating the incident.`,

      `Air traffic control at ${location.name} temporarily suspended operations after radar detected an unidentified aircraft in restricted airspace. The object was later confirmed to be a drone.`,

      `Security footage captured an unmanned aerial vehicle operating near the perimeter of ${location.name}. Authorities are reviewing the incident and checking for any safety violations.`,

      `Local residents posted videos on social media showing what appears to be a drone flying near ${location.name}. Officials have not yet confirmed the sighting.`,

      `Emergency protocols were activated at ${location.name} following reports of unauthorized drone activity. The incident is under investigation by relevant authorities.`
    ];

    return {
      title: this.generateSourceTitle().replace('{location}', location.name),
      description: scenarios[Math.floor(Math.random() * scenarios.length)],
      content: `Full article content about drone incident at ${location.name}...`
    };
  }

  randomTime() {
    const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  generateIncidentId(location, asset, timestamp) {
    const date = new Date(timestamp).toISOString().split('T')[0];
    const locationSlug = location.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const assetSlug = asset.type.toLowerCase();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    return `sim-${location.country.toLowerCase()}-${locationSlug}-${assetSlug}-${date}-${randomSuffix}`;
  }

  async processIncidents(incidents) {
    const processedIncidents = [];

    for (const incident of incidents) {
      try {
        // Classify evidence
        let processed = this.classifier.classifyIncident(incident);

        // Enhance with geographic intelligence
        processed = await this.geoIntel.enrichIncident(processed);

        processedIncidents.push(processed);
      } catch (error) {
        console.error(`Error processing incident ${incident.id}:`, error.message);
        // Still include the incident but with minimal processing
        processedIncidents.push({
          ...incident,
          evidence: { strength: 0, attribution: 'unconfirmed' },
          confidence_score: 0.3
        });
      }
    }

    return processedIncidents;
  }

  deduplicateIncidents(incidents) {
    const unique = [];
    const seen = new Map();

    for (const incident of incidents) {
      // Create a key based on location, asset type, and date
      const date = new Date(incident.first_seen_utc).toISOString().split('T')[0];
      const key = `${incident.location?.name}-${incident.asset?.type}-${date}`;

      const existing = seen.get(key);

      if (!existing) {
        seen.set(key, incident);
        unique.push(incident);
      } else {
        // Merge sources and keep higher confidence incident
        existing.sources = [...(existing.sources || []), ...(incident.sources || [])];
        if ((incident.confidence_score || 0) > (existing.confidence_score || 0)) {
          seen.set(key, incident);
          const index = unique.findIndex(inc => inc.id === existing.id);
          if (index !== -1) unique[index] = incident;
        }
      }
    }

    return unique;
  }

  analyzeDistribution(incidents) {
    const distribution = { 0: 0, 1: 0, 2: 0, 3: 0 };

    incidents.forEach(incident => {
      const level = incident.evidence?.strength || 0;
      distribution[level]++;
    });

    return {
      'Evidence 0 (unconfirmed)': distribution[0],
      'Evidence 1 (single-source)': distribution[1],
      'Evidence 2 (suspected)': distribution[2],
      'Evidence 3 (confirmed)': distribution[3],
      total: incidents.length
    };
  }

  async saveIncidents(incidents, outputPath = '/root/repo/public/incidents.json') {
    const formattedIncidents = incidents.map(incident => ({
      id: incident.id,
      first_seen_utc: incident.first_seen_utc,
      asset: {
        type: incident.asset.type,
        name: incident.asset.name,
        ...(incident.asset.icao && { icao: incident.asset.icao }),
        ...(incident.asset.iata && { iata: incident.asset.iata })
      },
      location: {
        name: incident.location.name,
        country: incident.location.country,
        coordinates: incident.location.coordinates
      },
      evidence: {
        strength: incident.evidence.strength,
        attribution: incident.evidence.attribution
      },
      risk_level: incident.risk_assessment?.level || 'low',
      ...(incident.nearby_assets && { nearby_assets_count: incident.nearby_assets.length }),
      ...(incident.sources && { source_count: incident.sources.length })
    }));

    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, JSON.stringify(formattedIncidents, null, 2));

    console.log(`Saved ${formattedIncidents.length} incidents to ${outputPath}`);
    return formattedIncidents;
  }
}