import { WebSearch } from '../services/websearch.js';
import { CONFIG } from '../config.js';

export class WebSearchScraper {
  constructor() {
    this.webSearch = new WebSearch();
    this.searchQueries = [
      // English queries
      'drone incident airport closure',
      'UAV sighting airspace violation',
      'unmanned aircraft security breach',
      'drone disruption flight operations',
      'airport closed drone activity',
      'drone near airport runway',
      'unauthorized drone restricted airspace',
      'drone threat aviation security',
      'UAV incident military base',
      'drone sighting critical infrastructure',

      // European language queries
      'drone incident flughafen', // German
      'incident drone aéroport', // French
      'drone aeroporto incidente', // Italian
      'drone incidente aeropuerto', // Spanish
      'drone incident luchthaven', // Dutch
      'drone hændelse lufthavn', // Danish
      'drone incident flygplats', // Swedish
      'drone hendelse flyplass', // Norwegian

      // Location-specific queries
      'drone Copenhagen airport EKCH',
      'drone Amsterdam Schiphol EHAM',
      'drone Frankfurt airport EDDF',
      'drone Paris Charles de Gaulle LFPG',
      'drone London Heathrow EGLL',
      'drone Madrid Barajas LEMD',
      'drone Rome Fiumicino LIRF',
      'drone Munich airport EDDM',
      'drone Zurich airport LSZH',
      'drone Vienna airport LOWW'
    ];
  }

  async scrapeIncidents(daysBack = 7) {
    const incidents = [];
    const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    console.log(`WebSearchScraper: Searching for incidents from ${fromDate.toISOString()}`);

    for (const query of this.searchQueries) {
      try {
        const results = await this.webSearch.search(query, {
          dateRestrict: `d${daysBack}`, // Last N days
          num: 20, // More results per query
          lr: 'lang_en|lang_de|lang_fr|lang_es|lang_it|lang_nl|lang_da|lang_sv|lang_no'
        });

        const processedResults = await this.processSearchResults(results, query, fromDate);
        incidents.push(...processedResults);

        // Rate limiting
        await this.sleep(500);
      } catch (error) {
        console.error(`WebSearch error for "${query}":`, error.message);
      }
    }

    // Deduplicate incidents
    const deduplicatedIncidents = this.deduplicateIncidents(incidents);
    console.log(`WebSearchScraper: Found ${incidents.length} raw, ${deduplicatedIncidents.length} unique incidents`);

    return deduplicatedIncidents;
  }

  async processSearchResults(results, query, fromDate) {
    const incidents = [];

    for (const result of results.items || []) {
      try {
        // Skip if result is too old
        if (result.publishedDate && new Date(result.publishedDate) < fromDate) {
          continue;
        }

        // Extract incident data from search result
        const incident = await this.extractIncidentFromResult(result, query);
        if (incident) {
          incidents.push(incident);
        }
      } catch (error) {
        console.error(`Error processing search result:`, error.message);
      }
    }

    return incidents;
  }

  async extractIncidentFromResult(result, query) {
    const { title, snippet, link, publishedDate } = result;

    // Check if this looks like a real drone incident
    const isDroneIncident = this.isDroneIncident(title + ' ' + snippet);
    if (!isDroneIncident) {
      return null;
    }

    // Extract location and airport information
    const locationInfo = this.extractLocationInfo(title + ' ' + snippet);
    if (!locationInfo) {
      return null;
    }

    // Create incident object
    const incident = {
      id: this.generateIncidentId(locationInfo, publishedDate || new Date()),
      first_seen_utc: (publishedDate || new Date()).toISOString(),
      asset: locationInfo.asset,
      location: locationInfo.location,
      sources: [{
        url: link,
        publisher: this.extractPublisher(link),
        title: title,
        snippet: snippet,
        first_seen: new Date().toISOString(),
        search_query: query
      }],
      keywords_matched: this.extractKeywords(title + ' ' + snippet),
      raw_data: {
        title,
        snippet,
        link,
        publishedDate,
        query
      }
    };

    return incident;
  }

  isDroneIncident(text) {
    const droneKeywords = [
      'drone', 'uav', 'unmanned aircraft', 'quadcopter', 'multirotor',
      'rpas', 'uas', 'drohne', 'dróne'
    ];

    const incidentKeywords = [
      'incident', 'sighting', 'closure', 'closed', 'disruption', 'security',
      'violation', 'breach', 'threat', 'alert', 'emergency', 'restricted',
      'unauthorized', 'illegal', 'suspicious'
    ];

    const locationKeywords = [
      'airport', 'airfield', 'airspace', 'runway', 'terminal', 'flight',
      'aviation', 'military', 'base', 'infrastructure', 'facility'
    ];

    const lowerText = text.toLowerCase();

    const hasDrone = droneKeywords.some(keyword => lowerText.includes(keyword));
    const hasIncident = incidentKeywords.some(keyword => lowerText.includes(keyword));
    const hasLocation = locationKeywords.some(keyword => lowerText.includes(keyword));

    return hasDrone && hasIncident && hasLocation;
  }

  extractLocationInfo(text) {
    // Airport ICAO codes
    const icaoMatch = text.match(/\b([A-Z]{4})\b/g);

    // Airport IATA codes
    const iataMatch = text.match(/\b([A-Z]{3})\b/g);

    // Known airports
    const airportNames = {
      'copenhagen': { name: 'Copenhagen Airport', iata: 'CPH', icao: 'EKCH', lat: 55.6181, lon: 12.6561 },
      'schiphol': { name: 'Amsterdam Schiphol Airport', iata: 'AMS', icao: 'EHAM', lat: 52.3086, lon: 4.7639 },
      'frankfurt': { name: 'Frankfurt Airport', iata: 'FRA', icao: 'EDDF', lat: 50.0264, lon: 8.5431 },
      'heathrow': { name: 'London Heathrow Airport', iata: 'LHR', icao: 'EGLL', lat: 51.4700, lon: -0.4543 },
      'charles de gaulle': { name: 'Paris Charles de Gaulle Airport', iata: 'CDG', icao: 'LFPG', lat: 49.0097, lon: 2.5479 },
      'barajas': { name: 'Madrid Barajas Airport', iata: 'MAD', icao: 'LEMD', lat: 40.4719, lon: -3.5626 },
      'fiumicino': { name: 'Rome Fiumicino Airport', iata: 'FCO', icao: 'LIRF', lat: 41.8003, lon: 12.2389 },
      'munich': { name: 'Munich Airport', iata: 'MUC', icao: 'EDDM', lat: 48.3538, lon: 11.7861 },
      'zurich': { name: 'Zurich Airport', iata: 'ZUR', icao: 'LSZH', lat: 47.4647, lon: 8.5492 },
      'vienna': { name: 'Vienna Airport', iata: 'VIE', icao: 'LOWW', lat: 48.1103, lon: 16.5697 },
      'billund': { name: 'Billund Airport', iata: 'BLL', icao: 'EKBI', lat: 55.7403, lon: 9.1522 },
      'aalborg': { name: 'Aalborg Airport', iata: 'AAL', icao: 'EKYT', lat: 57.0928, lon: 9.8492 },
      'oslo': { name: 'Oslo Airport', iata: 'OSL', icao: 'ENGM', lat: 60.1939, lon: 11.1004 },
      'stockholm': { name: 'Stockholm Arlanda Airport', iata: 'ARN', icao: 'ESSA', lat: 59.6519, lon: 17.9186 },
      'helsinki': { name: 'Helsinki Airport', iata: 'HEL', icao: 'EFHK', lat: 60.3172, lon: 24.9633 }
    };

    const lowerText = text.toLowerCase();

    // Try to match known airport names
    for (const [keyword, airport] of Object.entries(airportNames)) {
      if (lowerText.includes(keyword)) {
        return {
          asset: {
            type: 'airport',
            name: airport.name,
            iata: airport.iata,
            icao: airport.icao,
            lat: airport.lat,
            lon: airport.lon
          },
          location: {
            country: this.getCountryFromAirport(airport.icao),
            lat: airport.lat,
            lon: airport.lon
          }
        };
      }
    }

    // Try to match ICAO codes
    if (icaoMatch) {
      for (const icao of icaoMatch) {
        const airport = this.getAirportByICAO(icao);
        if (airport) {
          return {
            asset: airport,
            location: {
              country: this.getCountryFromAirport(icao),
              lat: airport.lat,
              lon: airport.lon
            }
          };
        }
      }
    }

    return null;
  }

  getAirportByICAO(icao) {
    // Basic ICAO to airport mapping
    const icaoMap = {
      'EKCH': { type: 'airport', name: 'Copenhagen Airport', iata: 'CPH', icao: 'EKCH', lat: 55.6181, lon: 12.6561 },
      'EHAM': { type: 'airport', name: 'Amsterdam Schiphol Airport', iata: 'AMS', icao: 'EHAM', lat: 52.3086, lon: 4.7639 },
      'EDDF': { type: 'airport', name: 'Frankfurt Airport', iata: 'FRA', icao: 'EDDF', lat: 50.0264, lon: 8.5431 },
      'EGLL': { type: 'airport', name: 'London Heathrow Airport', iata: 'LHR', icao: 'EGLL', lat: 51.4700, lon: -0.4543 },
      'LFPG': { type: 'airport', name: 'Paris Charles de Gaulle Airport', iata: 'CDG', icao: 'LFPG', lat: 49.0097, lon: 2.5479 }
    };

    return icaoMap[icao] || null;
  }

  getCountryFromAirport(icao) {
    const countryPrefixes = {
      'EK': 'Denmark',
      'EH': 'Netherlands',
      'ED': 'Germany',
      'EG': 'United Kingdom',
      'LF': 'France',
      'LE': 'Spain',
      'LI': 'Italy',
      'LS': 'Switzerland',
      'LO': 'Austria',
      'ES': 'Sweden',
      'EN': 'Norway',
      'EF': 'Finland'
    };

    const prefix = icao.substring(0, 2);
    return countryPrefixes[prefix] || 'Unknown';
  }

  extractKeywords(text) {
    const keywords = [];
    const lowerText = text.toLowerCase();

    const keywordPatterns = [
      'drone', 'uav', 'unmanned', 'quadcopter',
      'airport', 'runway', 'airspace', 'flight',
      'closure', 'closed', 'disruption', 'delay',
      'security', 'threat', 'breach', 'violation',
      'sighting', 'incident', 'emergency', 'alert'
    ];

    keywordPatterns.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    return keywords;
  }

  extractPublisher(url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '');

      const publishers = {
        'cnn.com': 'CNN',
        'bbc.com': 'BBC',
        'reuters.com': 'Reuters',
        'ap.org': 'Associated Press',
        'bloomberg.com': 'Bloomberg',
        'aljazeera.com': 'Al Jazeera',
        'nbcnews.com': 'NBC News',
        'abcnews.go.com': 'ABC News',
        'npr.org': 'NPR',
        'euronews.com': 'Euronews',
        'dw.com': 'Deutsche Welle',
        'france24.com': 'France 24',
        'theguardian.com': 'The Guardian',
        'independent.co.uk': 'The Independent',
        'telegraph.co.uk': 'The Telegraph',
        'spiegel.de': 'Der Spiegel',
        'lemonde.fr': 'Le Monde',
        'elpais.com': 'El País',
        'corriere.it': 'Corriere della Sera'
      };

      return publishers[domain] || domain;
    } catch (error) {
      return 'Unknown';
    }
  }

  generateIncidentId(locationInfo, date) {
    const airportCode = locationInfo.asset.icao || locationInfo.asset.iata || 'unknown';
    const dateStr = date.toISOString().split('T')[0];
    const hash = this.simpleHash(locationInfo.asset.name + dateStr);
    return `websearch-${airportCode.toLowerCase()}-${dateStr}-${hash}`;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 6);
  }

  deduplicateIncidents(incidents) {
    const seen = new Map();
    const unique = [];

    for (const incident of incidents) {
      // Create a deduplication key based on location and approximate time
      const key = `${incident.asset?.icao || incident.asset?.name}-${incident.first_seen_utc.split('T')[0]}`;

      if (!seen.has(key)) {
        seen.set(key, incident);
        unique.push(incident);
      } else {
        // Merge sources if duplicate found
        const existing = seen.get(key);
        existing.sources.push(...incident.sources);
        existing.keywords_matched.push(...incident.keywords_matched);
        existing.keywords_matched = [...new Set(existing.keywords_matched)];
      }
    }

    return unique;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}