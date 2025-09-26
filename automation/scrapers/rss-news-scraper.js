import fetch from '../utils/fetch.js';
import { parseStringPromise } from 'xml2js';
import { europeanInfrastructure } from '../data/european-infrastructure.js';
import { europeanNewsSources } from '../data/european-news-sources.js';
import { criticalInfrastructure } from '../data/critical-infrastructure.js';

export class RSSNewsScraper {
  constructor() {
    this.rssSources = europeanNewsSources;

    // Combine all infrastructure
    this.allAssets = {
      ...europeanInfrastructure.airports,
      ...europeanInfrastructure.harbors,
      ...europeanInfrastructure.militaryBases,
      ...europeanInfrastructure.energyInfrastructure,
      ...criticalInfrastructure.transportHubs,
      ...criticalInfrastructure.governmentFacilities,
      ...criticalInfrastructure.telecomInfrastructure,
      ...criticalInfrastructure.financialCenters,
      ...criticalInfrastructure.researchFacilities
    };

    // Keywords for drone incident detection
    this.droneKeywords = [
      'drone', 'drones', 'UAV', 'UAS', 'unmanned aircraft', 'unmanned aerial',
      'quadcopter', 'multirotor', 'RPAS', 'remotely piloted', 'unmanned system',
      'aerial vehicle', 'flying object'
    ];

    this.incidentKeywords = [
      'airport', 'airfield', 'airspace', 'runway', 'flight', 'aviation',
      'closed', 'closure', 'shutdown', 'disruption', 'suspended', 'grounded',
      'security', 'threat', 'incident', 'breach', 'violation', 'unauthorized',
      'sighting', 'spotted', 'detected', 'intercepted', 'emergency',
      'harbor', 'harbour', 'port', 'seaport', 'naval', 'maritime', 'vessel',
      'military', 'base', 'defense', 'defence', 'infrastructure',
      'power plant', 'nuclear', 'energy', 'LNG', 'terminal',
      'airbase', 'air force', 'navy', 'army', 'NATO'
    ];

    // Enhanced exclusion for simulations
    this.simulationKeywords = [
      'simulation', 'simulated', 'exercise', 'drill', 'training', 'test', 'testing',
      'hypothetical', 'scenario', 'demonstration', 'demo', 'mock', 'practice',
      'rehearsal', 'war game', 'wargame', 'tabletop', 'planned', 'scheduled',
      'routine', 'annual', 'quarterly', 'monthly', 'preparedness', 'readiness',
      'capability', 'assessment', 'evaluation', 'certification'
    ];

    // Real incident indicators
    this.realIncidentIndicators = [
      'reported', 'spotted', 'detected', 'sighted', 'caused', 'forced',
      'closed', 'suspended', 'investigated', 'responded', 'intercepted',
      'authorities', 'police', 'security', 'military', 'emergency',
      'confirmed', 'witnessed', 'observed', 'disrupted', 'halted',
      'evacuated', 'diverted', 'delayed', 'grounded', 'scrambled',
      'arrested', 'detained', 'shot down', 'neutralized'
    ];

    // Credibility scoring for sources
    this.sourceCredibility = {
      // National broadcasters - highest credibility
      'BBC': 5, 'CNN': 5, 'Reuters': 5, 'AP News': 5, 'Bloomberg': 5,
      'RTE': 5, 'RAI News': 5, 'RTVE': 5, 'ARD': 5, 'France24': 5,
      'NOS Netherlands': 5, 'ERR Estonia': 5, 'YLE Finland': 5,

      // Major newspapers - high credibility
      'The Guardian': 4, 'Financial Times': 4, 'The Times': 4,
      'Le Monde': 4, 'El País': 4, 'Corriere della Sera': 4,
      'Der Spiegel': 4, 'Die Zeit': 4, 'NRC': 4,

      // Aviation/Defense specific - very high for relevant news
      'Aviation Herald': 5, 'Defense News': 5, 'Jane\'s Defence': 5,
      'FlightGlobal': 5, 'NATO News': 5,

      // Regional/Local - medium credibility
      'The Local': 3, 'Regional': 3,

      // Default credibility
      'default': 3
    };
  }

  async scrapeIncidents(daysBack = 7) {
    console.log(`🗞️ Enhanced RSS Scraper: Collecting REAL incidents from ${Object.keys(this.rssSources).length} news sources`);
    console.log(`📍 Monitoring ${Object.keys(this.allAssets).length} assets across Europe`);

    const incidents = [];
    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const processedUrls = new Set(); // Avoid duplicate articles

    // Process sources in batches for better performance
    const batchSize = 10;
    const sourceEntries = Object.entries(this.rssSources);

    for (let i = 0; i < sourceEntries.length; i += batchSize) {
      const batch = sourceEntries.slice(i, i + batchSize);

      const batchPromises = batch.map(async ([sourceName, rssUrl]) => {
        try {
          console.log(`📡 Scraping ${sourceName}...`);
          const articles = await this.fetchRSSFeed(rssUrl, sourceName);

          // Filter for drone incidents
          const droneArticles = this.filterDroneIncidents(articles, cutoffDate);

          // Validate against simulations
          const realIncidents = droneArticles.filter(article => {
            if (!article.link || processedUrls.has(article.link)) return false;
            processedUrls.add(article.link);
            return this.validateRealIncident(article);
          });

          // Convert to incident objects
          const sourceIncidents = await this.processArticles(realIncidents, sourceName);
          return sourceIncidents;
        } catch (error) {
          console.error(`❌ Error scraping ${sourceName}:`, error.message);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(results => incidents.push(...results));

      // Rate limiting
      if (i + batchSize < sourceEntries.length) {
        await this.sleep(500); // Shorter delay between batches
      }
    }

    // De-duplicate and merge similar incidents
    const mergedIncidents = this.mergeIncidents(incidents);

    console.log(`📊 Enhanced Scraper: Found ${mergedIncidents.length} unique REAL incidents from ${incidents.length} total reports`);
    return mergedIncidents;
  }

  async fetchRSSFeed(url, sourceName) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DroneWatch-Europe/2.0 (Security Monitoring)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${sourceName}`);
      }

      const xmlContent = await response.text();
      const parsedFeed = await parseStringPromise(xmlContent);

      // Handle different RSS formats
      const items = parsedFeed?.rss?.channel?.[0]?.item ||
                   parsedFeed?.feed?.entry ||
                   parsedFeed?.rdf?.item ||
                   [];

      return items.map(item => ({
        title: this.extractText(item.title),
        description: this.extractText(item.description || item.summary || item.content),
        link: this.extractLink(item),
        pubDate: this.extractDate(item.pubDate || item.published || item.date || item.updated),
        guid: this.extractText(item.guid || item.id),
        source: sourceName
      }));

    } catch (error) {
      console.error(`RSS fetch error for ${sourceName}:`, error.message);
      return [];
    }
  }

  extractLink(item) {
    if (!item) return '';
    if (typeof item.link === 'string') return item.link;
    if (Array.isArray(item.link)) {
      const link = item.link[0];
      if (typeof link === 'string') return link;
      if (link.$ && link.$.href) return link.$.href;
      if (link._) return link._;
    }
    if (item.link && item.link.$) return item.link.$.href || '';
    if (item.guid && typeof item.guid === 'string' && item.guid.startsWith('http')) return item.guid;
    return '';
  }

  extractText(field) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) return this.extractText(field[0]);
    if (field._) return field._;
    if (field.$?.href) return field.$.href;
    if (field.$ && field.$.type === 'html') return field._ || '';
    return String(field);
  }

  extractDate(dateField) {
    if (!dateField) return new Date();
    const dateStr = this.extractText(dateField);
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  filterDroneIncidents(articles, cutoffDate) {
    return articles.filter(article => {
      // Check if article is recent enough
      if (article.pubDate < cutoffDate) return false;

      const text = (article.title + ' ' + article.description).toLowerCase();

      // Must contain drone keywords
      const hasDroneKeyword = this.droneKeywords.some(keyword =>
        text.includes(keyword.toLowerCase())
      );
      if (!hasDroneKeyword) return false;

      // Must contain incident keywords
      const hasIncidentKeyword = this.incidentKeywords.some(keyword =>
        text.includes(keyword.toLowerCase())
      );
      if (!hasIncidentKeyword) return false;

      return true;
    });
  }

  validateRealIncident(article) {
    const text = (article.title + ' ' + article.description).toLowerCase();

    // Check for simulation keywords
    const isSimulation = this.simulationKeywords.some(keyword =>
      text.includes(keyword.toLowerCase())
    );

    // If it contains simulation keywords, check if it's explicitly marked as real
    if (isSimulation) {
      const explicitlyReal = text.includes('real incident') ||
                            text.includes('actual incident') ||
                            text.includes('not a drill') ||
                            text.includes('not an exercise');

      if (!explicitlyReal) {
        console.log(`⚠️ Excluding simulation/exercise: ${article.title.substring(0, 60)}...`);
        return false;
      }
    }

    // Must have real incident indicators
    const hasRealIndicator = this.realIncidentIndicators.some(keyword =>
      text.includes(keyword.toLowerCase())
    );

    if (!hasRealIndicator) {
      console.log(`⚠️ No real incident indicators found: ${article.title.substring(0, 60)}...`);
      return false;
    }

    // Additional validation: Check for future dates (scheduled exercises)
    const futureIndicators = ['will be', 'to be held', 'scheduled for', 'planning to',
                             'next week', 'next month', 'upcoming', 'future'];
    const isFuture = futureIndicators.some(indicator => text.includes(indicator));

    if (isFuture && !text.includes('was scheduled')) {
      console.log(`⚠️ Excluding future/planned event: ${article.title.substring(0, 60)}...`);
      return false;
    }

    // Check for press release about capabilities/products
    const isPR = ['unveils', 'announces', 'launches', 'introduces', 'presents',
                  'showcases', 'demonstrates new', 'reveals'].some(keyword =>
      text.includes(keyword)
    );

    if (isPR && !text.includes('incident')) {
      console.log(`⚠️ Excluding product announcement: ${article.title.substring(0, 60)}...`);
      return false;
    }

    return true;
  }

  async processArticles(articles, sourceName) {
    const incidents = [];

    for (const article of articles) {
      try {
        const incident = await this.createIncidentFromArticle(article, sourceName);
        if (incident) incidents.push(incident);
      } catch (error) {
        console.error(`Error processing article: ${error.message}`);
      }
    }

    return incidents;
  }

  async createIncidentFromArticle(article, sourceName) {
    const text = article.title + ' ' + article.description;

    // Extract location information
    const location = this.extractLocationInfo(text);
    if (!location) return null;

    // Generate incident ID
    const incidentId = this.generateIncidentId(article, location);

    // Determine incident category and severity
    const category = this.categorizeIncident(text);
    const severity = this.assessSeverity(text, category, location);

    // Calculate credibility
    const credibility = this.sourceCredibility[sourceName] || this.sourceCredibility['default'];

    const incident = {
      id: incidentId,
      first_seen_utc: article.pubDate.toISOString(),
      last_update_utc: article.pubDate.toISOString(),
      asset: {
        type: location.type || 'unknown',
        name: location.name,
        iata: location.iata || null,
        icao: location.icao || null,
        lat: location.lat || 0,
        lon: location.lon || 0,
        country: location.country || 'Unknown'
      },
      incident: {
        category: category,
        status: this.determineStatus(text),
        duration_min: this.estimateDuration(text),
        uav_count: this.estimateUAVCount(text),
        uav_characteristics: this.extractUAVCharacteristics(text),
        response: this.extractResponseTeams(text),
        narrative: this.createNarrative(article.title, location.name, text)
      },
      evidence: {
        strength: Math.min(3, Math.floor(credibility / 2)),
        attribution: this.determineAttribution(text),
        sources: [{
          url: article.link,
          publisher: sourceName,
          title: article.title,
          snippet: (article.description || '').substring(0, 300) + '...',
          first_seen: article.pubDate.toISOString(),
          credibility: credibility,
          note: 'Real news article - validated'
        }]
      },
      scores: {
        severity: severity,
        risk_radius_m: this.calculateRiskRadius(severity, location.type),
        credibility: credibility
      },
      tags: this.generateTags(text, category, location),
      keywords_matched: this.extractMatchedKeywords(text),
      data_type: 'real',
      source_type: 'news',
      validation_status: 'verified',
      collection_timestamp: new Date().toISOString()
    };

    return incident;
  }

  extractLocationInfo(text) {
    const lowerText = text.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    // Search through all assets
    for (const [key, asset] of Object.entries(this.allAssets)) {
      let score = 0;

      // Check for name match
      if (asset.name && lowerText.includes(asset.name.toLowerCase())) {
        score += 10;
      }

      // Check for IATA/ICAO codes (for airports)
      if (asset.iata && lowerText.includes(asset.iata.toLowerCase())) {
        score += 8;
      }
      if (asset.icao && text.includes(asset.icao)) {
        score += 8;
      }

      // Check for city name (derived from key)
      const cityName = key.replace(/_/g, ' ').replace(/\d+/g, '').trim();
      if (lowerText.includes(cityName)) {
        score += 5;
      }

      // Check for country mention
      if (asset.country && lowerText.includes(asset.country.toLowerCase())) {
        score += 2;
      }

      // Type-specific checks
      if (asset.type === 'nuclear' && lowerText.includes('nuclear')) {
        score += 3;
      }
      if (asset.type === 'lng' && (lowerText.includes('lng') || lowerText.includes('gas terminal'))) {
        score += 3;
      }
      if ((key.includes('harbor') || key.includes('port')) &&
          (lowerText.includes('port') || lowerText.includes('harbor') || lowerText.includes('harbour'))) {
        score += 3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { ...asset, matchScore: score };
      }
    }

    // Require minimum score for match
    return bestScore >= 5 ? bestMatch : null;
  }

  categorizeIncident(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('closed') || lowerText.includes('shutdown') ||
        lowerText.includes('suspended') || lowerText.includes('halted')) {
      return 'closure';
    } else if (lowerText.includes('disruption') || lowerText.includes('delay') ||
               lowerText.includes('diverted')) {
      return 'disruption';
    } else if (lowerText.includes('breach') || lowerText.includes('violation') ||
               lowerText.includes('unauthorized') || lowerText.includes('intrusion')) {
      return 'breach';
    } else if (lowerText.includes('threat') || lowerText.includes('hostile') ||
               lowerText.includes('attack')) {
      return 'threat';
    } else {
      return 'sighting';
    }
  }

  determineStatus(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('resolved') || lowerText.includes('reopened') ||
        lowerText.includes('resumed') || lowerText.includes('cleared')) {
      return 'resolved';
    } else if (lowerText.includes('ongoing') || lowerText.includes('continuing') ||
               lowerText.includes('active')) {
      return 'active';
    } else {
      return 'resolved'; // Default for past incidents
    }
  }

  determineAttribution(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('claimed responsibility') || lowerText.includes('took credit')) {
      return 'claimed';
    } else if (lowerText.includes('suspected') || lowerText.includes('believed to be') ||
               lowerText.includes('attributed to')) {
      return 'suspected';
    } else {
      return 'none';
    }
  }

  assessSeverity(text, category, location) {
    const lowerText = text.toLowerCase();
    let severity = 3; // Base severity

    // Category-based severity
    if (category === 'closure') severity += 3;
    if (category === 'breach') severity += 2;
    if (category === 'threat') severity += 2;
    if (category === 'disruption') severity += 1;

    // Location type severity modifiers
    if (location.type === 'nuclear') severity += 3;
    if (location.type === 'military' || location.type?.includes('USAF') || location.type?.includes('NATO')) severity += 2;
    if (location.type === 'lng') severity += 2;
    if (location.type === 'airport' && location.name?.includes('International')) severity += 1;

    // Incident characteristics
    if (lowerText.includes('emergency')) severity += 2;
    if (lowerText.includes('evacuat')) severity += 2;
    if (lowerText.includes('military') || lowerText.includes('fighter') || lowerText.includes('scrambl')) severity += 2;
    if (lowerText.includes('multiple') || lowerText.includes('swarm')) severity += 1;
    if (lowerText.includes('shot down') || lowerText.includes('neutraliz')) severity += 1;
    if (lowerText.includes('arrest') || lowerText.includes('detain')) severity += 1;

    return Math.min(10, severity);
  }

  calculateRiskRadius(severity, assetType) {
    let baseRadius = severity * 1000;

    // Adjust based on asset type
    if (assetType === 'nuclear') baseRadius *= 3;
    if (assetType === 'military') baseRadius *= 2;
    if (assetType === 'airport') baseRadius *= 1.5;
    if (assetType === 'lng') baseRadius *= 2;
    if (assetType === 'harbour') baseRadius *= 1.2;

    return Math.min(50000, baseRadius); // Cap at 50km
  }

  estimateDuration(text) {
    const lowerText = text.toLowerCase();

    // Look for specific duration mentions
    const hourMatch = text.match(/(\d+)\s*hour/i);
    if (hourMatch) return parseInt(hourMatch[1]) * 60;

    const minuteMatch = text.match(/(\d+)\s*minute/i);
    if (minuteMatch) return parseInt(minuteMatch[1]);

    // Estimate based on incident type
    if (lowerText.includes('brief')) return 30;
    if (lowerText.includes('closed')) return 120;
    if (lowerText.includes('suspended')) return 90;
    if (lowerText.includes('disrupted')) return 60;

    return 60; // Default 1 hour
  }

  estimateUAVCount(text) {
    const lowerText = text.toLowerCase();

    const match = text.match(/(\d+)\s*(drone|uav)/i);
    if (match) return parseInt(match[1]);

    if (lowerText.includes('multiple') || lowerText.includes('several')) return 3;
    if (lowerText.includes('swarm')) return 5;
    if (lowerText.includes('two') || lowerText.includes('pair')) return 2;

    return 1;
  }

  extractUAVCharacteristics(text) {
    const characteristics = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('large')) characteristics.push('large');
    if (lowerText.includes('small')) characteristics.push('small');
    if (lowerText.includes('commercial')) characteristics.push('commercial');
    if (lowerText.includes('military-grade')) characteristics.push('military-grade');
    if (lowerText.includes('fixed-wing')) characteristics.push('fixed-wing');
    if (lowerText.includes('quadcopter') || lowerText.includes('multirotor')) characteristics.push('multirotor');
    if (lowerText.includes('light')) characteristics.push('lights visible');
    if (lowerText.includes('silent') || lowerText.includes('quiet')) characteristics.push('low noise');

    return characteristics.join(', ') || 'unidentified drone';
  }

  extractResponseTeams(text) {
    const teams = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('police')) teams.push('police');
    if (lowerText.includes('military')) teams.push('military');
    if (lowerText.includes('air force')) teams.push('air force');
    if (lowerText.includes('navy')) teams.push('navy');
    if (lowerText.includes('coast guard')) teams.push('coast guard');
    if (lowerText.includes('security')) teams.push('security');
    if (lowerText.includes('emergency')) teams.push('emergency services');
    if (lowerText.includes('fighter') || lowerText.includes('scrambl')) teams.push('fighter jets');
    if (lowerText.includes('air traffic') || lowerText.includes('atc')) teams.push('ATC');

    return teams.length > 0 ? teams : ['security'];
  }

  createNarrative(title, locationName, fullText) {
    const lowerText = fullText.toLowerCase();

    // Extract key action from text
    let action = 'reported';
    if (lowerText.includes('closed')) action = 'forced closure';
    if (lowerText.includes('suspended')) action = 'suspended operations';
    if (lowerText.includes('disrupted')) action = 'disrupted';
    if (lowerText.includes('intercepted')) action = 'intercepted';
    if (lowerText.includes('shot down')) action = 'neutralized';

    // Extract outcome
    let outcome = '';
    if (lowerText.includes('resolved')) outcome = ' Incident has been resolved.';
    if (lowerText.includes('ongoing')) outcome = ' Situation ongoing.';
    if (lowerText.includes('investigation')) outcome = ' Under investigation.';

    // Build narrative
    const cleanTitle = title.replace(/\s+/g, ' ').trim();
    if (cleanTitle.length < 120) {
      return cleanTitle + outcome;
    }

    return `Drone incident ${action} at ${locationName}.${outcome}`;
  }

  generateTags(text, category, location) {
    const tags = [];
    const lowerText = text.toLowerCase();

    // Category tag
    tags.push(category);

    // Location type tag
    if (location.type) tags.push(location.type);

    // Country tag
    if (location.country) tags.push(location.country.toLowerCase().replace(/ /g, '-'));

    // Time of day
    if (lowerText.includes('night') || lowerText.includes('evening')) tags.push('night');
    if (lowerText.includes('morning')) tags.push('morning');
    if (lowerText.includes('afternoon')) tags.push('afternoon');

    // Severity indicators
    if (lowerText.includes('emergency')) tags.push('emergency');
    if (lowerText.includes('military')) tags.push('military-response');

    // Verification status
    tags.push('real-incident');
    tags.push('verified');

    return tags;
  }

  extractMatchedKeywords(text) {
    const matched = [];
    const lowerText = text.toLowerCase();

    this.droneKeywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    });

    // Limit to 10 most relevant
    return matched.slice(0, 10);
  }

  generateIncidentId(article, location) {
    const date = article.pubDate.toISOString().slice(0, 10);
    const locationCode = location.icao || location.iata || location.name.substring(0, 4).toUpperCase();
    const hash = this.hashCode(article.link || article.title);
    return `rss-${locationCode}-${date}-${hash}`.toLowerCase();
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 6);
  }

  mergeIncidents(incidents) {
    const incidentMap = new Map();

    incidents.forEach(incident => {
      const key = `${incident.asset.name}-${incident.incident.category}-${incident.first_seen_utc.slice(0, 10)}`;

      if (incidentMap.has(key)) {
        const existing = incidentMap.get(key);

        // Merge sources
        incident.evidence.sources.forEach(source => {
          const isDuplicate = existing.evidence.sources.some(s =>
            s.url === source.url || s.title === source.title
          );
          if (!isDuplicate) {
            existing.evidence.sources.push(source);
          }
        });

        // Update credibility if higher
        if (incident.scores.credibility > existing.scores.credibility) {
          existing.scores.credibility = incident.scores.credibility;
          existing.evidence.strength = incident.evidence.strength;
        }

        // Update severity if higher
        if (incident.scores.severity > existing.scores.severity) {
          existing.scores.severity = incident.scores.severity;
          existing.scores.risk_radius_m = incident.scores.risk_radius_m;
        }

        // Merge tags
        incident.tags.forEach(tag => {
          if (!existing.tags.includes(tag)) {
            existing.tags.push(tag);
          }
        });

        // Update last seen time
        if (incident.last_update_utc > existing.last_update_utc) {
          existing.last_update_utc = incident.last_update_utc;
        }
      } else {
        incidentMap.set(key, incident);
      }
    });

    return Array.from(incidentMap.values());
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
