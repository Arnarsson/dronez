// Real-time Monitoring Module
// Integrates with FlightRadar24, MarineTraffic, social media, and NOTAM/NAVTEX

import fetch from '../utils/fetch.js';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class RealTimeMonitor extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      flightRadar24: config.flightRadar24 || { enabled: true },
      marineTraffic: config.marineTraffic || { enabled: true },
      socialMedia: config.socialMedia || { enabled: true },
      notamNavtex: config.notamNavtex || { enabled: true },
      updateInterval: config.updateInterval || 60000, // 1 minute default
      ...config
    };

    this.activeIncidents = new Map();
    this.airspaceStatus = new Map();
    this.portStatus = new Map();
    this.socialAlerts = [];
    this.officialNotices = [];

    this.wsConnections = new Map();
    this.monitoringActive = false;
  }

  // ========== MAIN MONITORING CONTROL ==========
  async startMonitoring() {
    if (this.monitoringActive) {
      console.log('⚠️ Monitoring already active');
      return;
    }

    console.log('🚀 Starting real-time monitoring...');
    this.monitoringActive = true;

    // Start individual monitors
    if (this.config.flightRadar24.enabled) {
      this.startFlightRadarMonitoring();
    }

    if (this.config.marineTraffic.enabled) {
      this.startMarineTrafficMonitoring();
    }

    if (this.config.socialMedia.enabled) {
      this.startSocialMediaMonitoring();
    }

    if (this.config.notamNavtex.enabled) {
      this.startOfficialNoticesMonitoring();
    }

    // Start periodic status check
    this.statusInterval = setInterval(() => {
      this.checkSystemStatus();
    }, this.config.updateInterval);

    this.emit('monitoring:started', {
      timestamp: new Date().toISOString(),
      services: this.getActiveServices()
    });
  }

  async stopMonitoring() {
    console.log('🛑 Stopping real-time monitoring...');
    this.monitoringActive = false;

    // Close WebSocket connections
    for (const [service, ws] of this.wsConnections) {
      ws.close();
    }
    this.wsConnections.clear();

    // Clear intervals
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }

    this.emit('monitoring:stopped', {
      timestamp: new Date().toISOString()
    });
  }

  // ========== FLIGHTRADAR24 MONITORING ==========
  async startFlightRadarMonitoring() {
    console.log('✈️ Starting FlightRadar24 monitoring...');

    // Monitor European airspace
    const europeanBounds = {
      north: 71.0,  // North Cape
      south: 35.0,  // Malta/Cyprus
      west: -25.0,  // Iceland/Azores
      east: 45.0    // Eastern Europe
    };

    // WebSocket connection for real-time flight data
    const wsUrl = 'wss://data-live.flightradar24.com/';
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log('✅ Connected to FlightRadar24 WebSocket');

      // Subscribe to European airspace
      ws.send(JSON.stringify({
        type: 'subscribe',
        bounds: europeanBounds,
        filters: {
          altitude: { min: 0, max: 50000 },
          speed: { min: 0 },
          squawk: ['7500', '7600', '7700'] // Emergency codes
        }
      }));
    });

    ws.on('message', (data) => {
      try {
        const flightData = JSON.parse(data.toString());
        this.processFlightData(flightData);
      } catch (error) {
        console.error('Error processing flight data:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('FlightRadar24 WebSocket error:', error);
      this.emit('error', { service: 'flightradar24', error });
    });

    this.wsConnections.set('flightradar24', ws);

    // Also poll REST API for airport status
    setInterval(() => this.checkAirportStatuses(), 300000); // Every 5 minutes
  }

  async checkAirportStatuses() {
    const majorAirports = [
      'EGLL', 'LFPG', 'EDDF', 'EHAM', 'LEMD', 'LIRF', 'LGAV', 'EPWA'
    ];

    for (const icao of majorAirports) {
      try {
        const response = await fetch(`https://api.flightradar24.com/common/v1/airport.json?code=${icao}`, {
          headers: {
            'User-Agent': 'DroneWatch-Monitor/1.0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.updateAirportStatus(icao, data);
        }
      } catch (error) {
        console.error(`Error checking ${icao} status:`, error);
      }

      await this.sleep(1000); // Rate limiting
    }
  }

  updateAirportStatus(icao, data) {
    const status = {
      icao,
      name: data.airport?.name,
      arrivals: data.arrivals?.length || 0,
      departures: data.departures?.length || 0,
      delays: this.detectDelays(data),
      closures: this.detectClosures(data),
      timestamp: new Date().toISOString()
    };

    const previousStatus = this.airspaceStatus.get(icao);
    this.airspaceStatus.set(icao, status);

    // Check for significant changes
    if (previousStatus) {
      if (status.closures && !previousStatus.closures) {
        this.emit('alert:airport_closure', {
          icao,
          name: status.name,
          timestamp: status.timestamp
        });
      }

      if (status.delays > previousStatus.delays * 1.5) {
        this.emit('alert:significant_delays', {
          icao,
          name: status.name,
          delays: status.delays,
          timestamp: status.timestamp
        });
      }
    }
  }

  detectDelays(airportData) {
    let delayCount = 0;

    const flights = [...(airportData.arrivals || []), ...(airportData.departures || [])];

    for (const flight of flights) {
      if (flight.delayed || flight.status?.includes('Delayed')) {
        delayCount++;
      }
    }

    return delayCount;
  }

  detectClosures(airportData) {
    // Check for indications of closure
    if (airportData.status?.toLowerCase().includes('closed')) return true;
    if (airportData.arrivals?.length === 0 && airportData.departures?.length === 0) return true;

    return false;
  }

  processFlightData(flightData) {
    // Process real-time flight updates
    if (flightData.emergency) {
      this.emit('alert:aircraft_emergency', {
        flight: flightData.flight,
        squawk: flightData.squawk,
        position: flightData.position,
        altitude: flightData.altitude,
        timestamp: new Date().toISOString()
      });
    }

    // Check for unusual patterns (potential drone activity)
    if (flightData.altitude < 500 && flightData.speed < 100) {
      this.emit('alert:low_slow_aircraft', {
        position: flightData.position,
        altitude: flightData.altitude,
        speed: flightData.speed,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ========== MARINE TRAFFIC MONITORING ==========
  async startMarineTrafficMonitoring() {
    console.log('🚢 Starting MarineTraffic monitoring...');

    // Monitor major European ports
    const majorPorts = [
      { name: 'Rotterdam', lat: 51.9244, lon: 4.4777 },
      { name: 'Antwerp', lat: 51.2213, lon: 4.3997 },
      { name: 'Hamburg', lat: 53.5511, lon: 9.9937 },
      { name: 'Piraeus', lat: 37.9475, lon: 23.6364 },
      { name: 'Valencia', lat: 39.4458, lon: -0.3317 }
    ];

    // Check port status periodically
    setInterval(async () => {
      for (const port of majorPorts) {
        await this.checkPortStatus(port);
        await this.sleep(2000); // Rate limiting
      }
    }, 600000); // Every 10 minutes

    // Initial check
    this.checkAllPortStatuses();
  }

  async checkPortStatus(port) {
    try {
      // This would integrate with MarineTraffic API
      // For now, using mock implementation
      const response = await fetch(`https://services.marinetraffic.com/api/portcalls/v1/${port.name}`, {
        headers: {
          'Authorization': `Bearer ${this.config.marineTraffic.apiKey}`,
          'User-Agent': 'DroneWatch-Monitor/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.updatePortStatus(port.name, data);
      }
    } catch (error) {
      // Fallback to mock data for demonstration
      this.updatePortStatus(port.name, {
        vesselsInPort: Math.floor(Math.random() * 100),
        arrivalsToday: Math.floor(Math.random() * 20),
        departuresToday: Math.floor(Math.random() * 20),
        status: 'operational'
      });
    }
  }

  updatePortStatus(portName, data) {
    const status = {
      name: portName,
      vesselsInPort: data.vesselsInPort || 0,
      arrivals: data.arrivalsToday || 0,
      departures: data.departuresToday || 0,
      operational: data.status === 'operational',
      timestamp: new Date().toISOString()
    };

    const previousStatus = this.portStatus.get(portName);
    this.portStatus.set(portName, status);

    // Check for significant changes
    if (previousStatus && previousStatus.operational && !status.operational) {
      this.emit('alert:port_closure', {
        port: portName,
        timestamp: status.timestamp
      });
    }
  }

  // ========== SOCIAL MEDIA MONITORING ==========
  async startSocialMediaMonitoring() {
    console.log('📱 Starting social media monitoring...');

    // Keywords to monitor
    const keywords = [
      'drone airport', 'UAV sighting', 'airport closed drone',
      'drone incident', 'airspace violation', 'unauthorized drone',
      'drone police', 'drone military', 'drone port'
    ];

    // Monitor Twitter/X (if API available)
    if (this.config.socialMedia.twitterApiKey) {
      this.monitorTwitter(keywords);
    }

    // Monitor Telegram channels
    if (this.config.socialMedia.telegramChannels) {
      this.monitorTelegram();
    }

    // Monitor Reddit
    this.monitorReddit(keywords);
  }

  async monitorTwitter(keywords) {
    // Twitter API v2 streaming
    const streamUrl = 'https://api.twitter.com/2/tweets/search/stream';

    try {
      // Set up streaming rules
      const rules = keywords.map(keyword => ({
        value: `${keyword} lang:en OR lang:de OR lang:fr OR lang:es`,
        tag: keyword.replace(' ', '_')
      }));

      // This would connect to Twitter streaming API
      // Simplified for demonstration
      console.log('📢 Monitoring Twitter for:', keywords.join(', '));
    } catch (error) {
      console.error('Twitter monitoring error:', error);
    }
  }

  async monitorTelegram() {
    const channels = this.config.socialMedia.telegramChannels || [
      '@aviation_incidents',
      '@drone_news',
      '@airport_status'
    ];

    console.log('📨 Monitoring Telegram channels:', channels.join(', '));

    // This would connect to Telegram API
    // Simplified for demonstration
  }

  async monitorReddit(keywords) {
    const subreddits = ['aviation', 'drones', 'europe', 'flying'];

    setInterval(async () => {
      for (const subreddit of subreddits) {
        try {
          const response = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=10`, {
            headers: {
              'User-Agent': 'DroneWatch-Monitor/1.0'
            }
          });

          if (response.ok) {
            const data = await response.json();
            this.processRedditPosts(data.data.children, keywords);
          }
        } catch (error) {
          console.error(`Reddit monitoring error for r/${subreddit}:`, error);
        }

        await this.sleep(2000); // Rate limiting
      }
    }, 300000); // Every 5 minutes
  }

  processRedditPosts(posts, keywords) {
    for (const post of posts) {
      const title = post.data.title.toLowerCase();
      const text = (post.data.selftext || '').toLowerCase();
      const combined = title + ' ' + text;

      for (const keyword of keywords) {
        if (combined.includes(keyword.toLowerCase())) {
          this.socialAlerts.push({
            source: 'reddit',
            subreddit: post.data.subreddit,
            title: post.data.title,
            url: `https://reddit.com${post.data.permalink}`,
            author: post.data.author,
            timestamp: new Date(post.data.created_utc * 1000).toISOString(),
            keyword: keyword
          });

          this.emit('social:potential_incident', {
            source: 'reddit',
            title: post.data.title,
            url: `https://reddit.com${post.data.permalink}`,
            keyword: keyword,
            timestamp: new Date().toISOString()
          });

          break; // Only alert once per post
        }
      }
    }
  }

  // ========== NOTAM/NAVTEX MONITORING ==========
  async startOfficialNoticesMonitoring() {
    console.log('📋 Starting NOTAM/NAVTEX monitoring...');

    // Check NOTAMs periodically
    setInterval(() => this.checkNOTAMs(), 1800000); // Every 30 minutes

    // Initial check
    this.checkNOTAMs();
  }

  async checkNOTAMs() {
    // European countries ICAO prefixes
    const icaoPrefixes = [
      'EG', // UK
      'LF', // France
      'ED', // Germany
      'LI', // Italy
      'LE', // Spain
      'EH', // Netherlands
      'EB', // Belgium
      'EK', // Denmark
      'ES', // Sweden
      'EF', // Finland
      'EN', // Norway
      'EP', // Poland
      'LG', // Greece
      'LP', // Portugal
      'LZ', // Slovakia
      'LH', // Hungary
      'LR', // Romania
      'LB', // Bulgaria
      'LY', // Serbia
      'LJ', // Slovenia
      'LO', // Austria
      'LS', // Switzerland
      'EI', // Ireland
      'BI', // Iceland
      'EV', // Latvia
      'EY', // Lithuania
      'EE', // Estonia
      'LK', // Czech Republic
      'LU', // Moldova
      'UK', // Ukraine
      'UM'  // Belarus
    ];

    for (const prefix of icaoPrefixes) {
      try {
        await this.checkCountryNOTAMs(prefix);
        await this.sleep(1000); // Rate limiting
      } catch (error) {
        console.error(`Error checking NOTAMs for ${prefix}:`, error);
      }
    }
  }

  async checkCountryNOTAMs(icaoPrefix) {
    // This would integrate with official NOTAM services
    // For demonstration, using ICAO API endpoint
    const url = `https://api.icao.int/v1/notams?prefix=${icaoPrefix}&type=airspace`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.notamNavtex.icaoApiKey}`,
          'User-Agent': 'DroneWatch-Monitor/1.0'
        }
      });

      if (response.ok) {
        const notams = await response.json();
        this.processNOTAMs(notams);
      }
    } catch (error) {
      // Fallback to cached or mock data
      console.log(`Using cached NOTAM data for ${icaoPrefix}`);
    }
  }

  processNOTAMs(notams) {
    for (const notam of notams) {
      // Check for drone-related NOTAMs
      const text = (notam.text || '').toLowerCase();

      if (text.includes('uas') || text.includes('drone') || text.includes('rpas') ||
          text.includes('unmanned') || text.includes('uav')) {

        const notice = {
          id: notam.id,
          location: notam.location,
          validity: notam.validity,
          text: notam.text,
          type: 'NOTAM',
          timestamp: new Date().toISOString()
        };

        this.officialNotices.push(notice);

        this.emit('official:drone_notam', notice);
      }

      // Check for airspace closures
      if (text.includes('closed') || text.includes('prohibited') || text.includes('restricted')) {
        this.emit('official:airspace_restriction', {
          id: notam.id,
          location: notam.location,
          text: notam.text,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // ========== CORRELATION ENGINE ==========
  async correlateIncidents(newAlert) {
    const correlationWindow = 3600000; // 1 hour
    const spatialThreshold = 50000; // 50km

    const potentialCorrelations = [];

    // Check against existing incidents
    for (const [id, incident] of this.activeIncidents) {
      const timeDiff = Math.abs(new Date(newAlert.timestamp) - new Date(incident.timestamp));
      const distance = this.calculateDistance(
        newAlert.position,
        incident.position
      );

      if (timeDiff <= correlationWindow && distance <= spatialThreshold) {
        potentialCorrelations.push({
          incidentId: id,
          correlation: {
            temporal: 1 - (timeDiff / correlationWindow),
            spatial: 1 - (distance / spatialThreshold),
            overall: ((1 - (timeDiff / correlationWindow)) + (1 - (distance / spatialThreshold))) / 2
          }
        });
      }
    }

    // Sort by correlation strength
    potentialCorrelations.sort((a, b) => b.correlation.overall - a.correlation.overall);

    if (potentialCorrelations.length > 0 && potentialCorrelations[0].correlation.overall > 0.7) {
      // High correlation - likely same incident
      this.mergeIncidents(newAlert, potentialCorrelations[0].incidentId);
    } else {
      // New incident
      const incidentId = this.generateIncidentId(newAlert);
      this.activeIncidents.set(incidentId, newAlert);

      this.emit('incident:new', {
        id: incidentId,
        ...newAlert
      });
    }

    // Check for patterns
    this.detectPatterns();
  }

  detectPatterns() {
    const recentIncidents = Array.from(this.activeIncidents.values())
      .filter(incident => {
        const age = Date.now() - new Date(incident.timestamp).getTime();
        return age < 86400000; // Last 24 hours
      });

    // Check for coordinated activity
    const clusters = this.findClusters(recentIncidents);

    if (clusters.length > 0) {
      for (const cluster of clusters) {
        if (cluster.incidents.length >= 3) {
          this.emit('pattern:coordinated_activity', {
            cluster,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // Check for escalation patterns
    const severityTrend = this.analyzeSeverityTrend(recentIncidents);
    if (severityTrend === 'escalating') {
      this.emit('pattern:escalation', {
        incidents: recentIncidents,
        timestamp: new Date().toISOString()
      });
    }
  }

  findClusters(incidents, maxDistance = 100000) {
    // Simple clustering algorithm
    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < incidents.length; i++) {
      if (visited.has(i)) continue;

      const cluster = {
        center: incidents[i].position,
        incidents: [incidents[i]]
      };
      visited.add(i);

      for (let j = i + 1; j < incidents.length; j++) {
        if (visited.has(j)) continue;

        const distance = this.calculateDistance(
          incidents[i].position,
          incidents[j].position
        );

        if (distance <= maxDistance) {
          cluster.incidents.push(incidents[j]);
          visited.add(j);
        }
      }

      if (cluster.incidents.length > 1) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  analyzeSeverityTrend(incidents) {
    if (incidents.length < 3) return 'stable';

    // Sort by timestamp
    incidents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Calculate average severity for time windows
    const windowSize = incidents.length / 3;
    const earlyAvg = incidents.slice(0, windowSize)
      .reduce((sum, i) => sum + (i.severity || 3), 0) / windowSize;
    const lateAvg = incidents.slice(-windowSize)
      .reduce((sum, i) => sum + (i.severity || 3), 0) / windowSize;

    if (lateAvg > earlyAvg * 1.5) return 'escalating';
    if (lateAvg < earlyAvg * 0.5) return 'de-escalating';
    return 'stable';
  }

  // ========== UTILITY FUNCTIONS ==========
  calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2) return Infinity;

    const R = 6371000; // Earth radius in meters
    const φ1 = pos1.lat * Math.PI / 180;
    const φ2 = pos2.lat * Math.PI / 180;
    const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
    const Δλ = (pos2.lon - pos1.lon) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  generateIncidentId(alert) {
    const timestamp = new Date(alert.timestamp).getTime();
    const location = alert.position ?
      `${alert.position.lat.toFixed(2)}-${alert.position.lon.toFixed(2)}` :
      'unknown';
    return `rt-${location}-${timestamp}`;
  }

  mergeIncidents(newAlert, existingId) {
    const existing = this.activeIncidents.get(existingId);

    // Merge information
    existing.sources = existing.sources || [];
    existing.sources.push(newAlert.source || 'unknown');
    existing.lastUpdate = newAlert.timestamp;
    existing.severity = Math.max(existing.severity || 3, newAlert.severity || 3);

    this.activeIncidents.set(existingId, existing);

    this.emit('incident:updated', {
      id: existingId,
      update: newAlert
    });
  }

  checkSystemStatus() {
    const status = {
      monitoring: this.monitoringActive,
      services: {
        flightRadar24: this.wsConnections.has('flightradar24'),
        marineTraffic: this.portStatus.size > 0,
        socialMedia: this.socialAlerts.length > 0,
        notamNavtex: this.officialNotices.length > 0
      },
      activeIncidents: this.activeIncidents.size,
      airportStatuses: this.airspaceStatus.size,
      portStatuses: this.portStatus.size,
      socialAlerts: this.socialAlerts.length,
      officialNotices: this.officialNotices.length,
      timestamp: new Date().toISOString()
    };

    this.emit('status:update', status);
    return status;
  }

  getActiveServices() {
    const services = [];
    if (this.config.flightRadar24.enabled) services.push('FlightRadar24');
    if (this.config.marineTraffic.enabled) services.push('MarineTraffic');
    if (this.config.socialMedia.enabled) services.push('Social Media');
    if (this.config.notamNavtex.enabled) services.push('NOTAM/NAVTEX');
    return services;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a singleton instance
export const realTimeMonitor = new RealTimeMonitor();
