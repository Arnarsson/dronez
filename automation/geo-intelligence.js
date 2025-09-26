import fetch from './utils/fetch.js';
import { CONFIG } from './config.js';

export class GeographicIntelligence {
  constructor() {
    this.overpassUrl = CONFIG.apis.osm.overpass;
    this.assetCache = new Map();
    this.geocodeCache = new Map();
  }

  async enrichIncident(incident) {
    const enrichedIncident = { ...incident };

    // Geocode location if coordinates missing
    if (!incident.location?.coordinates && incident.location?.name) {
      const coordinates = await this.geocodeLocation(incident.location.name, incident.location.country);
      if (coordinates) {
        enrichedIncident.location = {
          ...enrichedIncident.location,
          coordinates: coordinates
        };
      }
    }

    // Enhance asset information
    if (enrichedIncident.asset && enrichedIncident.location?.coordinates) {
      const assetDetails = await this.getAssetDetails(
        enrichedIncident.asset.type,
        enrichedIncident.location.coordinates,
        enrichedIncident.asset.name
      );

      if (assetDetails) {
        enrichedIncident.asset = {
          ...enrichedIncident.asset,
          ...assetDetails
        };
      }
    }

    // Add nearby critical infrastructure
    if (enrichedIncident.location?.coordinates) {
      const nearbyAssets = await this.findNearbyAssets(
        enrichedIncident.location.coordinates,
        5000 // 5km radius
      );
      enrichedIncident.nearby_assets = nearbyAssets;
    }

    // Add risk assessment
    enrichedIncident.risk_assessment = this.assessRisk(enrichedIncident);

    return enrichedIncident;
  }

  async geocodeLocation(locationName, country) {
    const cacheKey = `${locationName}-${country}`;

    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey);
    }

    try {
      // Try multiple geocoding strategies
      let coordinates = await this.geocodeWithNominatim(locationName, country);

      if (!coordinates) {
        coordinates = await this.geocodeWithPattern(locationName, country);
      }

      if (coordinates) {
        this.geocodeCache.set(cacheKey, coordinates);
      }

      return coordinates;
    } catch (error) {
      console.error(`Geocoding failed for ${locationName}, ${country}:`, error.message);
      return null;
    }
  }

  async geocodeWithNominatim(locationName, country) {
    const query = `${locationName}, ${country}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'DroneIncidentTracker/1.0' }
      });

      if (!response.ok) return null;

      const results = await response.json();
      if (results.length > 0) {
        return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
      }
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
    }

    return null;
  }

  async geocodeWithPattern(locationName, country) {
    // Fallback geocoding using known patterns
    const knownLocations = {
      'copenhagen airport': [55.6180, 12.6560],
      'billund airport': [55.7403, 9.1522],
      'aalborg airport': [57.0927, 9.8492],
      'aarhus airport': [56.3000, 10.6190],
      'esbjerg airport': [55.5259, 8.5535],
      'heathrow': [51.4700, -0.4543],
      'gatwick': [51.1481, -0.1903],
      'schiphol': [52.3105, 4.7683],
      'charles de gaulle': [49.0097, 2.5479],
      'frankfurt airport': [50.0379, 8.5622]
    };

    const normalizedName = locationName.toLowerCase();
    return knownLocations[normalizedName] || null;
  }

  async getAssetDetails(assetType, coordinates, assetName) {
    const cacheKey = `${assetType}-${coordinates[0]}-${coordinates[1]}`;

    if (this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey);
    }

    try {
      const query = this.buildOverpassQuery(assetType, coordinates);
      const assets = await this.queryOverpass(query);

      // Find the closest matching asset
      const matchingAsset = this.findBestMatch(assets, coordinates, assetName);

      if (matchingAsset) {
        this.assetCache.set(cacheKey, matchingAsset);
        return matchingAsset;
      }
    } catch (error) {
      console.error(`Asset detail lookup failed for ${assetType}:`, error.message);
    }

    return null;
  }

  buildOverpassQuery(assetType, coordinates, radius = 5000) {
    const [lat, lon] = coordinates;
    const bbox = this.calculateBoundingBox(lat, lon, radius);

    const queries = {
      airport: `
        [out:json][timeout:25];
        (
          node["aeroway"="aerodrome"](${bbox});
          way["aeroway"="aerodrome"](${bbox});
          relation["aeroway"="aerodrome"](${bbox});
        );
        out center tags;
      `,
      nuclear: `
        [out:json][timeout:25];
        (
          node["power"="plant"]["plant:source"="nuclear"](${bbox});
          way["power"="plant"]["plant:source"="nuclear"](${bbox});
          relation["power"="plant"]["plant:source"="nuclear"](${bbox});
        );
        out center tags;
      `,
      military: `
        [out:json][timeout:25];
        (
          node["landuse"="military"](${bbox});
          way["landuse"="military"](${bbox});
          relation["landuse"="military"](${bbox});
        );
        out center tags;
      `,
      harbour: `
        [out:json][timeout:25];
        (
          node["harbour"="yes"](${bbox});
          way["harbour"="yes"](${bbox});
          relation["harbour"="yes"](${bbox});
          node["amenity"="ferry_terminal"](${bbox});
          way["amenity"="ferry_terminal"](${bbox});
        );
        out center tags;
      `,
      rail: `
        [out:json][timeout:25];
        (
          node["railway"="station"](${bbox});
          way["railway"="station"](${bbox});
          relation["railway"="station"](${bbox});
        );
        out center tags;
      `,
      border: `
        [out:json][timeout:25];
        (
          node["barrier"="border_control"](${bbox});
          way["barrier"="border_control"](${bbox});
          node["amenity"="customs"](${bbox});
        );
        out center tags;
      `
    };

    return queries[assetType] || queries.airport;
  }

  calculateBoundingBox(lat, lon, radiusMeters) {
    const latDelta = radiusMeters / 111320; // Approximate meters per degree latitude
    const lonDelta = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));

    const south = lat - latDelta;
    const north = lat + latDelta;
    const west = lon - lonDelta;
    const east = lon + lonDelta;

    return `${south},${west},${north},${east}`;
  }

  async queryOverpass(query) {
    try {
      const response = await fetch(this.overpassUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: query
      });

      if (!response.ok) {
        throw new Error(`Overpass API returned ${response.status}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Overpass query failed:', error);
      return [];
    }
  }

  findBestMatch(assets, targetCoordinates, assetName) {
    if (!assets.length) return null;

    let bestMatch = null;
    let bestScore = -1;

    for (const asset of assets) {
      const score = this.calculateMatchScore(asset, targetCoordinates, assetName);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = asset;
      }
    }

    return bestMatch ? this.formatAssetDetails(bestMatch) : null;
  }

  calculateMatchScore(asset, targetCoordinates, assetName) {
    let score = 0;

    // Distance score (closer is better)
    const assetCoords = this.getAssetCoordinates(asset);
    if (assetCoords) {
      const distance = this.calculateDistance(targetCoordinates, assetCoords);
      score += Math.max(0, 100 - distance / 50); // Max 100 points, decreases with distance
    }

    // Name matching score
    if (assetName && asset.tags) {
      const assetNames = [
        asset.tags.name,
        asset.tags['name:en'],
        asset.tags.official_name,
        asset.tags.iata,
        asset.tags.icao
      ].filter(Boolean);

      const nameMatch = assetNames.some(name =>
        name.toLowerCase().includes(assetName.toLowerCase()) ||
        assetName.toLowerCase().includes(name.toLowerCase())
      );

      if (nameMatch) score += 50;
    }

    return score;
  }

  getAssetCoordinates(asset) {
    if (asset.lat && asset.lon) {
      return [asset.lat, asset.lon];
    }
    if (asset.center) {
      return [asset.center.lat, asset.center.lon];
    }
    return null;
  }

  calculateDistance(coords1, coords2) {
    const [lat1, lon1] = coords1;
    const [lat2, lon2] = coords2;

    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  formatAssetDetails(asset) {
    const details = {
      osm_id: asset.id,
      osm_type: asset.type
    };

    if (asset.tags) {
      const tags = asset.tags;

      // Common details
      if (tags.name) details.name = tags.name;
      if (tags['name:en']) details.name_en = tags['name:en'];

      // Airport-specific details
      if (tags.iata) details.iata = tags.iata;
      if (tags.icao) details.icao = tags.icao;
      if (tags.operator) details.operator = tags.operator;

      // Nuclear facility details
      if (tags['power:output']) details.power_output = tags['power:output'];
      if (tags['plant:output:electricity']) details.electricity_output = tags['plant:output:electricity'];

      // Military facility details
      if (tags.military) details.military_type = tags.military;

      // Port/harbour details
      if (tags.harbour) details.harbour_type = tags.harbour;
      if (tags['seamark:type']) details.seamark_type = tags['seamark:type'];
    }

    return details;
  }

  async findNearbyAssets(coordinates, radius) {
    const nearbyAssets = [];
    const assetTypes = ['airport', 'nuclear', 'military', 'harbour', 'rail', 'border'];

    for (const assetType of assetTypes) {
      try {
        const query = this.buildOverpassQuery(assetType, coordinates, radius);
        const assets = await this.queryOverpass(query);

        assets.forEach(asset => {
          const assetCoords = this.getAssetCoordinates(asset);
          if (assetCoords) {
            const distance = this.calculateDistance(coordinates, assetCoords);
            nearbyAssets.push({
              type: assetType,
              name: asset.tags?.name || `${assetType} facility`,
              distance: Math.round(distance),
              coordinates: assetCoords,
              details: this.formatAssetDetails(asset)
            });
          }
        });
      } catch (error) {
        console.error(`Error finding nearby ${assetType} assets:`, error.message);
      }
    }

    // Sort by distance and return closest 10
    return nearbyAssets
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  }

  assessRisk(incident) {
    const risk = {
      level: 'low',
      factors: [],
      score: 0
    };

    // Asset type risk
    const assetRisks = {
      'nuclear': 10,
      'military': 8,
      'airport': 7,
      'harbour': 5,
      'rail': 4,
      'border': 6
    };

    const assetRisk = assetRisks[incident.asset?.type] || 1;
    risk.score += assetRisk;
    if (assetRisk >= 7) risk.factors.push('critical-infrastructure');

    // Evidence strength risk
    risk.score += incident.evidence?.strength * 2;
    if (incident.evidence?.strength >= 3) risk.factors.push('confirmed-incident');

    // Time of day risk (night operations more concerning)
    if (incident.first_seen_utc) {
      const hour = new Date(incident.first_seen_utc).getHours();
      if (hour >= 22 || hour <= 6) {
        risk.score += 2;
        risk.factors.push('night-operation');
      }
    }

    // Nearby assets amplify risk
    if (incident.nearby_assets?.length > 0) {
      const criticalNearby = incident.nearby_assets.filter(a =>
        ['nuclear', 'military', 'airport'].includes(a.type)
      ).length;

      if (criticalNearby > 0) {
        risk.score += criticalNearby;
        risk.factors.push('multiple-critical-assets');
      }
    }

    // Determine risk level
    if (risk.score >= 15) {
      risk.level = 'critical';
    } else if (risk.score >= 10) {
      risk.level = 'high';
    } else if (risk.score >= 6) {
      risk.level = 'medium';
    }

    return risk;
  }
}
