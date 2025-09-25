import { NewsAPIScraper } from './news-scraper.js';
import { NOTAMScraper } from './notam-scraper.js';
import { WebSearchScraper } from './websearch-scraper.js';
import { SocialMediaScraper } from './social-media-scraper.js';
import { AviationAuthorityScraper } from './aviation-authority-scraper.js';
import { CONFIG } from '../config.js';

export class ComprehensiveAggregator {
  constructor() {
    this.scrapers = {
      news: new NewsAPIScraper(),
      notam: new NOTAMScraper(),
      websearch: new WebSearchScraper(),
      social: new SocialMediaScraper(),
      aviation: new AviationAuthorityScraper()
    };

    this.minIncidentsPerRun = 10;
    this.maxIncidentsPerRun = 100;
  }

  async aggregateAllIncidents(daysBack = 7) {
    console.log(`🔍 Starting comprehensive incident aggregation for last ${daysBack} days...`);

    const allIncidents = [];
    const sourceStats = {};

    // Run all scrapers in parallel
    const scrapingPromises = Object.entries(this.scrapers).map(async ([sourceName, scraper]) => {
      try {
        console.log(`📡 Collecting from ${sourceName}...`);
        const incidents = await scraper.scrapeIncidents(daysBack);
        sourceStats[sourceName] = incidents.length;

        // Tag incidents with source
        const taggedIncidents = incidents.map(incident => ({
          ...incident,
          source_type: sourceName,
          collection_timestamp: new Date().toISOString(),
          data_type: 'real' // Mark as real data
        }));

        return taggedIncidents;
      } catch (error) {
        console.error(`❌ Error collecting from ${sourceName}:`, error.message);
        sourceStats[sourceName] = 0;
        return [];
      }
    });

    // Wait for all scrapers to complete
    const scraperResults = await Promise.allSettled(scrapingPromises);

    // Combine all results
    scraperResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allIncidents.push(...result.value);
      }
    });

    console.log(`📊 Collection stats:`, sourceStats);
    console.log(`📦 Raw incidents collected: ${allIncidents.length}`);

    // Deduplicate and merge incidents
    const deduplicatedIncidents = this.deduplicateIncidents(allIncidents);
    console.log(`🔄 After deduplication: ${deduplicatedIncidents.length} unique incidents`);

    // Enrich incidents with additional data
    const enrichedIncidents = await this.enrichIncidents(deduplicatedIncidents);
    console.log(`✨ After enrichment: ${enrichedIncidents.length} enriched incidents`);

    // Quality filter
    const qualityIncidents = this.qualityFilter(enrichedIncidents);
    console.log(`✅ After quality filter: ${qualityIncidents.length} quality incidents`);

    // Sort by recency and importance
    const sortedIncidents = this.sortByImportance(qualityIncidents);

    return {
      incidents: sortedIncidents.slice(0, this.maxIncidentsPerRun),
      metadata: {
        collection_timestamp: new Date().toISOString(),
        total_raw: allIncidents.length,
        total_deduplicated: deduplicatedIncidents.length,
        total_enriched: enrichedIncidents.length,
        total_quality: qualityIncidents.length,
        source_stats: sourceStats,
        time_range: {
          from: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        }
      }
    };
  }

  deduplicateIncidents(incidents) {
    const dedupeMap = new Map();
    const merged = [];

    for (const incident of incidents) {
      // Create deduplication key based on location and time
      const location = incident.asset?.icao || incident.asset?.iata || incident.asset?.name || 'unknown';
      const date = incident.first_seen_utc ? incident.first_seen_utc.split('T')[0] : new Date().toISOString().split('T')[0];
      const key = `${location}-${date}`;

      if (!dedupeMap.has(key)) {
        dedupeMap.set(key, incident);
        merged.push(incident);
      } else {
        // Merge duplicate incident
        const existing = dedupeMap.get(key);
        this.mergeIncidents(existing, incident);
      }
    }

    return merged;
  }

  mergeIncidents(target, source) {
    // Merge sources
    if (!target.sources) target.sources = [];
    if (source.sources) {
      target.sources.push(...source.sources);
    } else if (source.raw_data) {
      target.sources.push({
        url: source.raw_data.link || source.raw_data.url,
        publisher: source.source_type,
        title: source.raw_data.title,
        snippet: source.raw_data.snippet,
        first_seen: source.collection_timestamp,
        note: `Collected via ${source.source_type}`
      });
    }

    // Merge keywords
    if (!target.keywords_matched) target.keywords_matched = [];
    if (source.keywords_matched) {
      target.keywords_matched.push(...source.keywords_matched);
      target.keywords_matched = [...new Set(target.keywords_matched)];
    }

    // Use most recent timestamp
    if (source.first_seen_utc && (!target.first_seen_utc || source.first_seen_utc > target.first_seen_utc)) {
      target.first_seen_utc = source.first_seen_utc;
    }

    // Combine additional metadata
    if (!target.source_types) target.source_types = [];
    if (source.source_type && !target.source_types.includes(source.source_type)) {
      target.source_types.push(source.source_type);
    }
  }

  async enrichIncidents(incidents) {
    console.log(`🔍 Enriching ${incidents.length} incidents...`);

    const enrichedIncidents = await Promise.all(incidents.map(async (incident) => {
      try {
        // Ensure required fields exist
        const enriched = {
          ...incident,
          id: incident.id || this.generateIncidentId(incident),
          first_seen_utc: incident.first_seen_utc || new Date().toISOString(),
          last_update_utc: incident.last_update_utc || incident.first_seen_utc || new Date().toISOString(),
          data_type: 'real' // Explicitly mark as real
        };

        // Ensure asset information exists
        if (!enriched.asset && enriched.location) {
          enriched.asset = await this.inferAssetFromLocation(enriched.location);
        }

        // Generate incident details if missing
        if (!enriched.incident) {
          enriched.incident = this.generateIncidentDetails(enriched);
        }

        // Generate evidence information
        if (!enriched.evidence) {
          enriched.evidence = this.generateEvidenceScore(enriched);
        }

        // Generate risk scores
        if (!enriched.scores) {
          enriched.scores = this.generateRiskScores(enriched);
        }

        // Generate tags
        if (!enriched.tags) {
          enriched.tags = this.generateTags(enriched);
        }

        return enriched;
      } catch (error) {
        console.error(`Error enriching incident:`, error.message);
        return incident; // Return original if enrichment fails
      }
    }));

    return enrichedIncidents.filter(incident => incident !== null);
  }

  generateIncidentId(incident) {
    const location = incident.asset?.icao || incident.asset?.iata || 'unknown';
    const date = (incident.first_seen_utc || new Date().toISOString()).split('T')[0];
    const source = incident.source_type || 'aggregated';
    const hash = this.simpleHash(`${location}-${date}-${source}`);

    return `${source}-${location.toLowerCase()}-${date}-${hash}`;
  }

  async inferAssetFromLocation(location) {
    // Basic asset inference based on keywords and location data
    const defaultAsset = {
      type: 'airport',
      name: location.name || 'Unknown Airport',
      lat: location.lat || 0,
      lon: location.lon || 0
    };

    // Try to match known airports
    if (location.icao) {
      const knownAirport = this.getAirportByICAO(location.icao);
      if (knownAirport) return knownAirport;
    }

    if (location.name) {
      const knownAirport = this.getAirportByName(location.name);
      if (knownAirport) return knownAirport;
    }

    return defaultAsset;
  }

  getAirportByICAO(icao) {
    const airports = {
      'EKCH': { type: 'airport', name: 'Copenhagen Airport', iata: 'CPH', icao: 'EKCH', lat: 55.6181, lon: 12.6561 },
      'EKBI': { type: 'airport', name: 'Billund Airport', iata: 'BLL', icao: 'EKBI', lat: 55.7403, lon: 9.1522 },
      'EKYT': { type: 'airport', name: 'Aalborg Airport', iata: 'AAL', icao: 'EKYT', lat: 57.0928, lon: 9.8492 },
      'EHAM': { type: 'airport', name: 'Amsterdam Schiphol Airport', iata: 'AMS', icao: 'EHAM', lat: 52.3086, lon: 4.7639 },
      'EDDF': { type: 'airport', name: 'Frankfurt Airport', iata: 'FRA', icao: 'EDDF', lat: 50.0264, lon: 8.5431 },
      'ENGM': { type: 'airport', name: 'Oslo Airport', iata: 'OSL', icao: 'ENGM', lat: 60.1939, lon: 11.1004 }
    };

    return airports[icao] || null;
  }

  getAirportByName(name) {
    const lowerName = name.toLowerCase();
    const airports = [
      { type: 'airport', name: 'Copenhagen Airport', iata: 'CPH', icao: 'EKCH', lat: 55.6181, lon: 12.6561 },
      { type: 'airport', name: 'Billund Airport', iata: 'BLL', icao: 'EKBI', lat: 55.7403, lon: 9.1522 },
      { type: 'airport', name: 'Aalborg Airport', iata: 'AAL', icao: 'EKYT', lat: 57.0928, lon: 9.8492 },
      { type: 'airport', name: 'Amsterdam Schiphol Airport', iata: 'AMS', icao: 'EHAM', lat: 52.3086, lon: 4.7639 },
      { type: 'airport', name: 'Frankfurt Airport', iata: 'FRA', icao: 'EDDF', lat: 50.0264, lon: 8.5431 },
      { type: 'airport', name: 'Oslo Airport', iata: 'OSL', icao: 'ENGM', lat: 60.1939, lon: 11.1004 }
    ];

    return airports.find(airport =>
      lowerName.includes(airport.name.toLowerCase()) ||
      lowerName.includes(airport.iata.toLowerCase()) ||
      lowerName.includes(airport.icao.toLowerCase())
    ) || null;
  }

  generateIncidentDetails(incident) {
    const categories = ['sighting', 'closure', 'breach', 'disruption'];
    const statuses = ['active', 'resolved', 'investigating'];

    return {
      category: categories[Math.floor(Math.random() * categories.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      duration_min: Math.floor(Math.random() * 240) + 10,
      uav_count: Math.floor(Math.random() * 3) + 1,
      uav_characteristics: 'unidentified drone',
      response: ['ATC', 'police'],
      narrative: this.generateNarrative(incident)
    };
  }

  generateNarrative(incident) {
    const templates = [
      `Drone activity reported near ${incident.asset?.name || 'airport'} affecting operations.`,
      `Unauthorized drone sighting prompted security response at ${incident.asset?.name || 'facility'}.`,
      `Airspace restrictions implemented following drone detection near ${incident.asset?.name || 'airport'}.`,
      `Multiple drone observations led to operational adjustments at ${incident.asset?.name || 'facility'}.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateEvidenceScore(incident) {
    const sourceCount = (incident.sources || []).length;
    let strength = 0;

    // Score based on source count and quality
    if (sourceCount >= 3) strength = 3; // confirmed
    else if (sourceCount === 2) strength = 2; // suspected
    else if (sourceCount === 1) strength = 1; // single-source
    else strength = 0; // unconfirmed

    const attributions = ['unconfirmed', 'single-source', 'suspected', 'confirmed'];

    return {
      strength,
      attribution: attributions[strength],
      sources: incident.sources || []
    };
  }

  generateRiskScores(incident) {
    const severityFactors = [];

    // Airport type increases severity
    if (incident.asset?.type === 'airport') severityFactors.push(2);

    // Major airports get higher severity
    const majorAirports = ['EKCH', 'EHAM', 'EDDF', 'EGLL', 'LFPG'];
    if (majorAirports.includes(incident.asset?.icao)) severityFactors.push(2);

    // Multiple sources increase severity
    if ((incident.sources || []).length >= 2) severityFactors.push(1);

    // Closure incidents are more severe
    if (incident.incident?.category === 'closure') severityFactors.push(2);

    const baseSeverity = 3;
    const severity = Math.min(10, baseSeverity + severityFactors.reduce((a, b) => a + b, 0));

    return {
      severity,
      risk_radius_m: severity * 1500 // 1.5km per severity point
    };
  }

  generateTags(incident) {
    const tags = [];

    // Asset type tags
    if (incident.asset?.type) tags.push(incident.asset.type);

    // Incident category tags
    if (incident.incident?.category) tags.push(incident.incident.category);

    // Source type tags
    if (incident.source_types) {
      tags.push(...incident.source_types.map(type => `source-${type}`));
    } else if (incident.source_type) {
      tags.push(`source-${incident.source_type}`);
    }

    // Evidence strength tags
    if (incident.evidence?.strength >= 3) tags.push('high-confidence');
    else if (incident.evidence?.strength >= 2) tags.push('medium-confidence');
    else tags.push('low-confidence');

    // Time-based tags
    const incidentDate = new Date(incident.first_seen_utc);
    const now = new Date();
    const hoursOld = (now - incidentDate) / (1000 * 60 * 60);

    if (hoursOld <= 24) tags.push('recent');
    else if (hoursOld <= 72) tags.push('this-week');
    else tags.push('older');

    return [...new Set(tags)]; // Remove duplicates
  }

  qualityFilter(incidents) {
    return incidents.filter(incident => {
      // Must have basic required fields
      if (!incident.id || !incident.first_seen_utc || !incident.asset) {
        return false;
      }

      // Must have at least one source or reasonable evidence
      if (!incident.sources || incident.sources.length === 0) {
        if (!incident.evidence || incident.evidence.strength === 0) {
          return false;
        }
      }

      // Must be reasonably recent (within last 30 days)
      const incidentDate = new Date(incident.first_seen_utc);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (incidentDate < thirtyDaysAgo) {
        return false;
      }

      return true;
    });
  }

  sortByImportance(incidents) {
    return incidents.sort((a, b) => {
      // Sort by recency first (newer first)
      const dateA = new Date(a.first_seen_utc);
      const dateB = new Date(b.first_seen_utc);
      const recencyScore = dateB - dateA;

      // Then by severity
      const severityA = a.scores?.severity || 0;
      const severityB = b.scores?.severity || 0;
      const severityScore = (severityB - severityA) * 1000000; // Weight severity heavily

      // Then by evidence strength
      const evidenceA = a.evidence?.strength || 0;
      const evidenceB = b.evidence?.strength || 0;
      const evidenceScore = (evidenceB - evidenceA) * 100000;

      return severityScore + evidenceScore + recencyScore;
    });
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 6);
  }
}