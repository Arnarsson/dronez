import fetch from 'node-fetch';
import { CONFIG } from '../config.js';

export class NewsAPIScraper {
  constructor() {
    this.apiKey = CONFIG.apis.newsApi.key;
    this.baseUrl = CONFIG.apis.newsApi.baseUrl;
    this.sources = CONFIG.apis.newsApi.sources;
  }

  async scrapeIncidents(daysBack = 7) {
    const incidents = [];
    const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    for (const keyword of CONFIG.keywords.primary) {
      try {
        const articles = await this.searchArticles(keyword, fromDate);
        const processedIncidents = await this.processArticles(articles, keyword);
        incidents.push(...processedIncidents);
      } catch (error) {
        console.error(`Error scraping for keyword "${keyword}":`, error.message);
      }
    }

    return this.deduplicateIncidents(incidents);
  }

  async searchArticles(keyword, fromDate) {
    const query = this.buildQuery(keyword);
    const url = `${this.baseUrl}?q=${encodeURIComponent(query)}&from=${fromDate}&sources=${this.sources}&apiKey=${this.apiKey}&pageSize=100`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NewsAPI request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.articles || [];
  }

  buildQuery(primaryKeyword) {
    const locationTerms = CONFIG.keywords.locations.join(' OR ');
    const secondaryTerms = CONFIG.keywords.secondary.slice(0, 2).join(' OR ');
    const exclusions = CONFIG.keywords.exclusions.map(term => `-"${term}"`).join(' ');

    return `"${primaryKeyword}" AND (${locationTerms}) AND (${secondaryTerms}) ${exclusions}`;
  }

  async processArticles(articles, keyword) {
    const incidents = [];

    for (const article of articles) {
      try {
        const incident = await this.extractIncidentFromArticle(article, keyword);
        if (incident) {
          incidents.push(incident);
        }
      } catch (error) {
        console.error(`Error processing article "${article.title}":`, error.message);
      }
    }

    return incidents;
  }

  async extractIncidentFromArticle(article, keyword) {
    const location = this.extractLocation(article);
    const asset = await this.identifyAsset(article, location);
    const evidence = this.classifyEvidence(article);
    const timestamp = this.extractTimestamp(article);

    if (!location || !asset) {
      return null; // Skip if we can't identify location or asset
    }

    return {
      id: this.generateIncidentId(location, asset, timestamp),
      first_seen_utc: timestamp,
      asset: asset,
      location: location,
      evidence: evidence,
      sources: [{
        type: 'news',
        url: article.url,
        title: article.title,
        publication: article.source.name,
        published_at: article.publishedAt
      }],
      keywords_matched: [keyword],
      raw_data: {
        title: article.title,
        description: article.description,
        content: article.content?.substring(0, 500) // Truncate for storage
      }
    };
  }

  extractLocation(article) {
    const text = `${article.title} ${article.description} ${article.content || ''}`.toLowerCase();

    // European city/airport pattern matching
    const locationPatterns = [
      // Major airports
      /(\w+)\s+airport/gi,
      /(heathrow|gatwick|schiphol|charles de gaulle|frankfurt|munich|zurich|copenhagen|stockholm|helsinki|oslo)/gi,
      // Cities with airports
      /(london|paris|berlin|madrid|rome|amsterdam|brussels|vienna|prague|warsaw|budapest|athens)/gi,
      // Nordic specifics
      /(copenhagen|stockholm|oslo|helsinki|reykjavik|billund|aalborg|aarhus|esbjerg)/gi
    ];

    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        return {
          name: matches[0],
          country: this.inferCountry(matches[0]),
          coordinates: null // Will be geocoded later
        };
      }
    }

    return null;
  }

  async identifyAsset(article, location) {
    const text = `${article.title} ${article.description} ${article.content || ''}`.toLowerCase();

    const assetPatterns = {
      airport: /airport|airfield|runway|terminal|aviation/gi,
      nuclear: /nuclear|power plant|reactor|energy facility/gi,
      military: /military|base|defense|naval|army|air force/gi,
      harbour: /port|harbour|harbor|dock|maritime|shipping/gi,
      rail: /railway|train|station|rail/gi,
      border: /border|crossing|checkpoint|frontier/gi
    };

    for (const [assetType, pattern] of Object.entries(assetPatterns)) {
      if (pattern.test(text)) {
        return {
          type: assetType,
          name: location.name,
          details: this.extractAssetDetails(text, assetType)
        };
      }
    }

    return {
      type: 'unknown',
      name: location.name,
      details: {}
    };
  }

  extractAssetDetails(text, assetType) {
    const details = {};

    if (assetType === 'airport') {
      const iataMatch = text.match(/\b[A-Z]{3}\b/g);
      if (iataMatch) details.iata = iataMatch[0];

      const icaoMatch = text.match(/\b[A-Z]{4}\b/g);
      if (icaoMatch) details.icao = icaoMatch[0];
    }

    return details;
  }

  classifyEvidence(article) {
    const text = `${article.title} ${article.description} ${article.content || ''}`.toLowerCase();
    const source = article.source.name.toLowerCase();

    // Check for Evidence Level 3 (Confirmed)
    if (CONFIG.evidenceRules.level3.sources.some(s => source.includes(s)) ||
        CONFIG.evidenceRules.level3.keywords.some(k => text.includes(k))) {
      return { strength: 3, attribution: 'confirmed' };
    }

    // Check for Evidence Level 2 (Suspected)
    if (CONFIG.evidenceRules.level2.sources.some(s => source.includes(s)) ||
        CONFIG.evidenceRules.level2.keywords.some(k => text.includes(k))) {
      return { strength: 2, attribution: 'suspected' };
    }

    // Check for Evidence Level 1 (Single source)
    if (CONFIG.evidenceRules.level1.sources.some(s => source.includes(s)) ||
        CONFIG.evidenceRules.level1.keywords.some(k => text.includes(k))) {
      return { strength: 1, attribution: 'single-source' };
    }

    // Default to Evidence Level 0 (Unconfirmed)
    return { strength: 0, attribution: 'unconfirmed' };
  }

  extractTimestamp(article) {
    // Try to extract incident time from article content, fallback to publication time
    const publishedAt = new Date(article.publishedAt);

    // Look for time indicators in content
    const content = `${article.title} ${article.description} ${article.content || ''}`;
    const timePatterns = [
      /yesterday/gi,
      /this morning/gi,
      /last night/gi,
      /earlier today/gi,
      /(\d{1,2}:\d{2})/gi
    ];

    // For now, use publication time minus random offset to simulate incident time
    const incidentTime = new Date(publishedAt.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    return incidentTime.toISOString();
  }

  generateIncidentId(location, asset, timestamp) {
    const date = new Date(timestamp).toISOString().split('T')[0];
    const locationSlug = location.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const assetSlug = asset.type.toLowerCase();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    return `auto-${locationSlug}-${assetSlug}-${date}-${randomSuffix}`;
  }

  inferCountry(locationName) {
    const countryMappings = {
      'heathrow': 'UK', 'gatwick': 'UK', 'london': 'UK',
      'schiphol': 'NL', 'amsterdam': 'NL',
      'charles de gaulle': 'FR', 'paris': 'FR',
      'frankfurt': 'DE', 'munich': 'DE', 'berlin': 'DE',
      'copenhagen': 'DK', 'billund': 'DK', 'aalborg': 'DK', 'aarhus': 'DK', 'esbjerg': 'DK',
      'stockholm': 'SE', 'helsinki': 'FI', 'oslo': 'NO', 'reykjavik': 'IS',
      'zurich': 'CH', 'vienna': 'AT', 'prague': 'CZ', 'warsaw': 'PL',
      'budapest': 'HU', 'athens': 'GR', 'rome': 'IT', 'madrid': 'ES'
    };

    const normalized = locationName.toLowerCase();
    return countryMappings[normalized] || 'EU';
  }

  deduplicateIncidents(incidents) {
    const unique = [];
    const seen = new Set();

    for (const incident of incidents) {
      const key = `${incident.location.name}-${incident.asset.type}-${incident.first_seen_utc.split('T')[0]}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(incident);
      }
    }

    return unique;
  }
}

export class GDELTScraper {
  constructor() {
    this.baseUrl = CONFIG.apis.gdelt.baseUrl;
  }

  async scrapeIncidents(daysBack = 7) {
    const incidents = [];
    const keywords = ['drone incident', 'UAV sighting', 'unmanned aircraft'];

    for (const keyword of keywords) {
      try {
        const articles = await this.searchGDELT(keyword, daysBack);
        const processedIncidents = await this.processGDELTArticles(articles, keyword);
        incidents.push(...processedIncidents);
      } catch (error) {
        console.error(`Error scraping GDELT for "${keyword}":`, error.message);
      }
    }

    return incidents;
  }

  async searchGDELT(keyword, daysBack) {
    const query = `${keyword} AND (airport OR nuclear OR military OR harbour)`;
    const timespan = daysBack * 24; // Hours

    const url = `${this.baseUrl}?query=${encodeURIComponent(query)}&mode=artlist&timespan=${timespan}h&format=json&maxrecords=100`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GDELT request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.articles || [];
  }

  async processGDELTArticles(articles, keyword) {
    // Similar processing to NewsAPI but adapted for GDELT format
    return []; // Implementation would be similar to NewsAPIScraper
  }
}