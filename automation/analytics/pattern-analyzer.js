// Pattern Analysis and Intelligence Engine
// Detects patterns, predicts threats, and provides analytical insights

import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';

export class PatternAnalyzer extends EventEmitter {
  constructor() {
    super();

    this.incidents = [];
    this.patterns = new Map();
    this.predictions = new Map();
    this.riskZones = new Map();
    this.threatModel = null;

    // Analysis configuration
    this.config = {
      minIncidentsForPattern: 3,
      correlationTimeWindow: 3600000, // 1 hour
      correlationDistanceThreshold: 50000, // 50km
      predictionHorizon: 86400000, // 24 hours
      riskRadiusMultiplier: 1.5,
      confidenceThreshold: 0.7
    };

    // Pattern types
    this.patternTypes = {
      COORDINATED: 'coordinated_attack',
      ESCALATING: 'escalating_threat',
      MIGRATION: 'threat_migration',
      RECURRING: 'recurring_pattern',
      TESTING: 'capability_testing',
      SWARM: 'swarm_activity',
      INFRASTRUCTURE: 'infrastructure_targeting'
    };

    // Initialize ML model for threat prediction
    this.initializeThreatModel();
  }

  // ========== MAIN ANALYSIS FUNCTIONS ==========
  async analyzeIncident(incident) {
    // Add to incident history
    this.incidents.push(incident);

    // Perform various analyses
    const analyses = await Promise.all([
      this.detectCoordinatedActivity(incident),
      this.analyzeTemporalPatterns(incident),
      this.analyzeSpatialPatterns(incident),
      this.assessThreatLevel(incident),
      this.predictNextTarget(incident),
      this.analyzeInfrastructureTargeting(incident)
    ]);

    // Combine results
    const analysisResult = {
      incident: incident.id,
      timestamp: new Date().toISOString(),
      patterns: analyses.filter(a => a !== null),
      overallThreatLevel: this.calculateOverallThreatLevel(analyses),
      recommendations: this.generateRecommendations(analyses)
    };

    // Emit analysis complete event
    this.emit('analysis:complete', analysisResult);

    return analysisResult;
  }

  // ========== COORDINATED ACTIVITY DETECTION ==========
  async detectCoordinatedActivity(incident) {
    const timeWindow = this.config.correlationTimeWindow;
    const distanceThreshold = this.config.correlationDistanceThreshold;

    // Get recent incidents within time window
    const recentIncidents = this.incidents.filter(i => {
      const timeDiff = Math.abs(new Date(incident.timestamp) - new Date(i.timestamp));
      return timeDiff <= timeWindow && i.id !== incident.id;
    });

    // Check spatial-temporal correlation
    const correlatedIncidents = [];
    for (const recentIncident of recentIncidents) {
      const distance = this.calculateDistance(incident.location, recentIncident.location);

      if (distance <= distanceThreshold) {
        const correlation = this.calculateCorrelation(incident, recentIncident);

        if (correlation.overall >= this.config.confidenceThreshold) {
          correlatedIncidents.push({
            incident: recentIncident,
            correlation
          });
        }
      }
    }

    if (correlatedIncidents.length >= this.config.minIncidentsForPattern - 1) {
      const pattern = {
        type: this.patternTypes.COORDINATED,
        confidence: this.calculatePatternConfidence(correlatedIncidents),
        incidents: [incident.id, ...correlatedIncidents.map(c => c.incident.id)],
        characteristics: {
          timeSpan: timeWindow,
          geographicSpread: this.calculateGeographicSpread(correlatedIncidents),
          commonTargets: this.identifyCommonTargets(correlatedIncidents)
        },
        threat: 'HIGH',
        message: `Coordinated drone activity detected involving ${correlatedIncidents.length + 1} incidents`
      };

      this.patterns.set(`coord-${Date.now()}`, pattern);
      this.emit('pattern:detected', pattern);

      return pattern;
    }

    return null;
  }

  // ========== TEMPORAL PATTERN ANALYSIS ==========
  async analyzeTemporalPatterns(incident) {
    const hourOfDay = new Date(incident.timestamp).getHours();
    const dayOfWeek = new Date(incident.timestamp).getDay();

    // Analyze time-based patterns
    const timePatterns = this.incidents.reduce((acc, inc) => {
      const h = new Date(inc.timestamp).getHours();
      const d = new Date(inc.timestamp).getDay();

      acc.hourly[h] = (acc.hourly[h] || 0) + 1;
      acc.daily[d] = (acc.daily[d] || 0) + 1;

      return acc;
    }, { hourly: new Array(24).fill(0), daily: new Array(7).fill(0) });

    // Detect peak activity times
    const avgHourly = timePatterns.hourly.reduce((a, b) => a + b, 0) / 24;
    const avgDaily = timePatterns.daily.reduce((a, b) => a + b, 0) / 7;

    if (timePatterns.hourly[hourOfDay] > avgHourly * 2) {
      const pattern = {
        type: this.patternTypes.RECURRING,
        subtype: 'temporal',
        confidence: timePatterns.hourly[hourOfDay] / this.incidents.length,
        peakHours: this.identifyPeakHours(timePatterns.hourly),
        peakDays: this.identifyPeakDays(timePatterns.daily),
        message: `Increased activity detected during hour ${hourOfDay}:00-${hourOfDay}:59`
      };

      this.emit('pattern:temporal', pattern);
      return pattern;
    }

    return null;
  }

  // ========== SPATIAL PATTERN ANALYSIS ==========
  async analyzeSpatialPatterns(incident) {
    // Create spatial clusters
    const clusters = this.createSpatialClusters(this.incidents);

    // Find which cluster this incident belongs to
    let targetCluster = null;
    let maxIncidents = 0;

    for (const cluster of clusters) {
      const distance = this.calculateDistance(incident.location, cluster.center);

      if (distance <= cluster.radius && cluster.incidents.length > maxIncidents) {
        targetCluster = cluster;
        maxIncidents = cluster.incidents.length;
      }
    }

    if (targetCluster && targetCluster.incidents.length >= this.config.minIncidentsForPattern) {
      // Analyze cluster characteristics
      const pattern = {
        type: this.patternTypes.INFRASTRUCTURE,
        subtype: 'spatial_cluster',
        confidence: targetCluster.incidents.length / this.incidents.length,
        cluster: {
          center: targetCluster.center,
          radius: targetCluster.radius,
          incidentCount: targetCluster.incidents.length,
          assetTypes: this.identifyAssetTypes(targetCluster.incidents),
          severity: this.calculateClusterSeverity(targetCluster)
        },
        message: `Hot zone identified with ${targetCluster.incidents.length} incidents`
      };

      // Check if it's a migration pattern
      if (this.isPatternMigrating(targetCluster)) {
        pattern.type = this.patternTypes.MIGRATION;
        pattern.migration = this.calculateMigrationVector(targetCluster);
        pattern.message = `Threat migration detected - pattern moving ${pattern.migration.direction}`;
      }

      this.emit('pattern:spatial', pattern);
      return pattern;
    }

    return null;
  }

  // ========== THREAT ASSESSMENT ==========
  async assessThreatLevel(incident) {
    const factors = {
      severity: incident.severity || 3,
      assetCriticality: this.getAssetCriticality(incident.asset),
      frequency: this.calculateLocalFrequency(incident.location),
      escalation: this.detectEscalation(),
      coordination: this.patterns.has('coordinated') ? 10 : 0,
      persistence: this.calculatePersistence(incident.location)
    };

    // Calculate weighted threat score
    const weights = {
      severity: 0.2,
      assetCriticality: 0.3,
      frequency: 0.15,
      escalation: 0.15,
      coordination: 0.1,
      persistence: 0.1
    };

    let threatScore = 0;
    for (const [factor, value] of Object.entries(factors)) {
      threatScore += (value / 10) * weights[factor];
    }

    const threatLevel = {
      score: threatScore,
      level: this.categorizeThreatLevel(threatScore),
      factors,
      confidence: this.calculateConfidence(factors),
      timestamp: new Date().toISOString()
    };

    // Update risk zones
    this.updateRiskZones(incident.location, threatLevel);

    this.emit('threat:assessed', {
      incident: incident.id,
      threatLevel
    });

    return threatLevel;
  }

  // ========== PREDICTIVE ANALYTICS ==========
  async predictNextTarget(incident) {
    if (!this.threatModel) {
      await this.initializeThreatModel();
    }

    // Prepare features for prediction
    const features = this.extractFeatures(incident);

    // Get nearby potential targets
    const potentialTargets = this.identifyPotentialTargets(incident.location, 100000); // 100km radius

    const predictions = [];

    for (const target of potentialTargets) {
      const targetFeatures = this.extractTargetFeatures(target, incident);
      const combinedFeatures = [...features, ...targetFeatures];

      // Run prediction
      const prediction = await this.runPrediction(combinedFeatures);

      predictions.push({
        target,
        probability: prediction,
        timeframe: this.estimateTimeframe(incident.location, target.location),
        confidence: this.calculatePredictionConfidence(prediction, incident, target)
      });
    }

    // Sort by probability
    predictions.sort((a, b) => b.probability - a.probability);

    // Get top predictions
    const topPredictions = predictions.slice(0, 5);

    if (topPredictions[0]?.probability > this.config.confidenceThreshold) {
      const alert = {
        type: 'predicted_target',
        predictions: topPredictions,
        message: `High probability (${(topPredictions[0].probability * 100).toFixed(1)}%) of activity at ${topPredictions[0].target.name}`,
        recommendedActions: this.generatePreventiveActions(topPredictions[0])
      };

      this.emit('prediction:next_target', alert);
      return alert;
    }

    return null;
  }

  // ========== INFRASTRUCTURE TARGETING ANALYSIS ==========
  async analyzeInfrastructureTargeting(incident) {
    // Check if targeting specific infrastructure types
    const targetedTypes = new Map();

    for (const inc of this.incidents) {
      const type = inc.asset?.type;
      if (type) {
        targetedTypes.set(type, (targetedTypes.get(type) || 0) + 1);
      }
    }

    // Check for infrastructure preference
    const totalIncidents = this.incidents.length;
    const preferences = [];

    for (const [type, count] of targetedTypes) {
      const percentage = (count / totalIncidents) * 100;

      if (percentage > 20) { // If more than 20% target same type
        preferences.push({
          type,
          count,
          percentage,
          severity: this.calculateTypeAverageSeverity(type)
        });
      }
    }

    if (preferences.length > 0) {
      const pattern = {
        type: this.patternTypes.INFRASTRUCTURE,
        preferences,
        confidence: Math.max(...preferences.map(p => p.percentage)) / 100,
        message: `Infrastructure targeting pattern detected - Primary target: ${preferences[0].type}`,
        recommendations: this.generateInfrastructureRecommendations(preferences)
      };

      this.emit('pattern:infrastructure', pattern);
      return pattern;
    }

    return null;
  }

  // ========== SWARM DETECTION ==========
  detectSwarmActivity() {
    const swarmTimeWindow = 600000; // 10 minutes
    const swarmDistanceThreshold = 10000; // 10km

    const now = Date.now();
    const recentIncidents = this.incidents.filter(i => {
      return (now - new Date(i.timestamp).getTime()) <= swarmTimeWindow;
    });

    if (recentIncidents.length >= 5) { // Minimum 5 for swarm
      // Check if they're clustered
      const center = this.calculateCentroid(recentIncidents.map(i => i.location));
      const distances = recentIncidents.map(i =>
        this.calculateDistance(i.location, center)
      );

      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;

      if (avgDistance <= swarmDistanceThreshold) {
        const swarmPattern = {
          type: this.patternTypes.SWARM,
          incidentCount: recentIncidents.length,
          center,
          radius: Math.max(...distances),
          confidence: 0.9,
          severity: 'CRITICAL',
          message: `Swarm activity detected - ${recentIncidents.length} drones active`,
          incidents: recentIncidents.map(i => i.id)
        };

        this.patterns.set(`swarm-${now}`, swarmPattern);
        this.emit('pattern:swarm', swarmPattern);

        return swarmPattern;
      }
    }

    return null;
  }

  // ========== MACHINE LEARNING MODEL ==========
  async initializeThreatModel() {
    // Create a simple neural network for threat prediction
    this.threatModel = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    this.threatModel.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Train with historical data if available
    if (this.incidents.length > 100) {
      await this.trainModel();
    }
  }

  async trainModel() {
    // Prepare training data
    const features = [];
    const labels = [];

    for (let i = 0; i < this.incidents.length - 1; i++) {
      const incident = this.incidents[i];
      const nextIncident = this.incidents[i + 1];

      // Extract features
      const feature = this.extractFeatures(incident);
      features.push(feature);

      // Create label (1 if escalation, 0 otherwise)
      const label = nextIncident.severity > incident.severity ? 1 : 0;
      labels.push(label);
    }

    // Convert to tensors
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    // Train model
    await this.threatModel.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Training epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
          }
        }
      }
    });

    // Clean up tensors
    xs.dispose();
    ys.dispose();
  }

  async runPrediction(features) {
    const input = tf.tensor2d([features]);
    const prediction = await this.threatModel.predict(input);
    const result = await prediction.data();

    input.dispose();
    prediction.dispose();

    return result[0];
  }

  extractFeatures(incident) {
    const now = new Date();
    const incidentTime = new Date(incident.timestamp);

    return [
      // Temporal features
      incidentTime.getHours() / 24,
      incidentTime.getDay() / 7,
      incidentTime.getMonth() / 12,

      // Spatial features
      incident.location.lat / 90,
      incident.location.lon / 180,

      // Incident features
      (incident.severity || 3) / 10,
      (incident.duration || 60) / 1440,
      (incident.uav_count || 1) / 10,

      // Asset features
      this.encodeAssetType(incident.asset?.type) / 10,
      this.getAssetCriticality(incident.asset) / 10,

      // Historical features
      this.calculateLocalFrequency(incident.location) / 10,
      this.detectEscalation() ? 1 : 0,
      this.calculatePersistence(incident.location) / 10,

      // Pattern features
      this.patterns.size / 10,
      this.getActivePatternCount() / 5,

      // Environmental features (placeholder)
      Math.random(), // Would be weather data
      Math.random(), // Would be time since last incident
      Math.random(), // Would be regional threat level
      Math.random(), // Would be holiday/event indicator
      Math.random()  // Would be border proximity
    ];
  }

  extractTargetFeatures(target, incident) {
    return [
      // Distance from incident
      this.calculateDistance(incident.location, target.location) / 100000,

      // Target characteristics
      this.getAssetCriticality(target) / 10,
      this.encodeAssetType(target.type) / 10,

      // Historical targeting
      this.getTargetHistory(target) / 10,

      // Vulnerability score (simplified)
      Math.random()
    ];
  }

  // ========== UTILITY FUNCTIONS ==========
  calculateDistance(loc1, loc2) {
    if (!loc1 || !loc2) return Infinity;

    const R = 6371000; // Earth radius in meters
    const φ1 = loc1.lat * Math.PI / 180;
    const φ2 = loc2.lat * Math.PI / 180;
    const Δφ = (loc2.lat - loc1.lat) * Math.PI / 180;
    const Δλ = (loc2.lon - loc1.lon) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  calculateCorrelation(incident1, incident2) {
    const timeDiff = Math.abs(new Date(incident1.timestamp) - new Date(incident2.timestamp));
    const distance = this.calculateDistance(incident1.location, incident2.location);

    const temporal = Math.max(0, 1 - (timeDiff / this.config.correlationTimeWindow));
    const spatial = Math.max(0, 1 - (distance / this.config.correlationDistanceThreshold));
    const severity = 1 - Math.abs((incident1.severity || 3) - (incident2.severity || 3)) / 10;

    return {
      temporal,
      spatial,
      severity,
      overall: (temporal + spatial + severity) / 3
    };
  }

  calculatePatternConfidence(correlatedIncidents) {
    const avgCorrelation = correlatedIncidents.reduce((sum, c) =>
      sum + c.correlation.overall, 0
    ) / correlatedIncidents.length;

    const sizeBonus = Math.min(correlatedIncidents.length / 10, 1);

    return (avgCorrelation + sizeBonus) / 2;
  }

  calculateGeographicSpread(incidents) {
    if (incidents.length < 2) return 0;

    const center = this.calculateCentroid(incidents.map(i => i.location || i.incident.location));
    const distances = incidents.map(i => {
      const loc = i.location || i.incident.location;
      return this.calculateDistance(loc, center);
    });

    return Math.max(...distances);
  }

  calculateCentroid(locations) {
    const validLocs = locations.filter(l => l && l.lat && l.lon);
    if (validLocs.length === 0) return { lat: 0, lon: 0 };

    const sumLat = validLocs.reduce((sum, loc) => sum + loc.lat, 0);
    const sumLon = validLocs.reduce((sum, loc) => sum + loc.lon, 0);

    return {
      lat: sumLat / validLocs.length,
      lon: sumLon / validLocs.length
    };
  }

  identifyCommonTargets(incidents) {
    const targets = new Map();

    for (const inc of incidents) {
      const asset = inc.incident?.asset || inc.asset;
      if (asset?.type) {
        targets.set(asset.type, (targets.get(asset.type) || 0) + 1);
      }
    }

    return Array.from(targets.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));
  }

  identifyPeakHours(hourlyData) {
    const avg = hourlyData.reduce((a, b) => a + b, 0) / 24;
    return hourlyData
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > avg * 1.5)
      .map(h => h.hour);
  }

  identifyPeakDays(dailyData) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const avg = dailyData.reduce((a, b) => a + b, 0) / 7;

    return dailyData
      .map((count, day) => ({ day: days[day], count }))
      .filter(d => d.count > avg * 1.5)
      .map(d => d.day);
  }

  createSpatialClusters(incidents, eps = 50000) { // 50km radius
    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < incidents.length; i++) {
      if (visited.has(i)) continue;
      if (!incidents[i].location) continue;

      const cluster = {
        incidents: [incidents[i]],
        center: incidents[i].location
      };
      visited.add(i);

      for (let j = 0; j < incidents.length; j++) {
        if (i === j || visited.has(j)) continue;
        if (!incidents[j].location) continue;

        const distance = this.calculateDistance(cluster.center, incidents[j].location);

        if (distance <= eps) {
          cluster.incidents.push(incidents[j]);
          visited.add(j);
        }
      }

      if (cluster.incidents.length >= this.config.minIncidentsForPattern) {
        // Recalculate center
        cluster.center = this.calculateCentroid(cluster.incidents.map(i => i.location));
        cluster.radius = Math.max(
          ...cluster.incidents.map(i => this.calculateDistance(i.location, cluster.center))
        );
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  identifyAssetTypes(incidents) {
    const types = new Map();

    for (const inc of incidents) {
      const type = inc.asset?.type;
      if (type) {
        types.set(type, (types.get(type) || 0) + 1);
      }
    }

    return Array.from(types.keys());
  }

  calculateClusterSeverity(cluster) {
    const severities = cluster.incidents.map(i => i.severity || 3);
    return severities.reduce((a, b) => a + b, 0) / severities.length;
  }

  isPatternMigrating(cluster) {
    // Sort incidents by time
    const sorted = cluster.incidents.sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    if (sorted.length < 3) return false;

    // Check if center of mass is moving
    const earlyCenter = this.calculateCentroid(sorted.slice(0, Math.floor(sorted.length / 2)).map(i => i.location));
    const lateCenter = this.calculateCentroid(sorted.slice(Math.floor(sorted.length / 2)).map(i => i.location));

    const migration = this.calculateDistance(earlyCenter, lateCenter);

    return migration > 10000; // 10km migration
  }

  calculateMigrationVector(cluster) {
    const sorted = cluster.incidents.sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    const earlyCenter = this.calculateCentroid(sorted.slice(0, Math.floor(sorted.length / 2)).map(i => i.location));
    const lateCenter = this.calculateCentroid(sorted.slice(Math.floor(sorted.length / 2)).map(i => i.location));

    const bearing = this.calculateBearing(earlyCenter, lateCenter);
    const distance = this.calculateDistance(earlyCenter, lateCenter);
    const speed = distance / (new Date(sorted[sorted.length - 1].timestamp) - new Date(sorted[0].timestamp)) * 3600000; // km/h

    return {
      from: earlyCenter,
      to: lateCenter,
      bearing,
      direction: this.bearingToDirection(bearing),
      distance,
      speed
    };
  }

  calculateBearing(from, to) {
    const φ1 = from.lat * Math.PI / 180;
    const φ2 = to.lat * Math.PI / 180;
    const Δλ = (to.lon - from.lon) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);

    return (θ * 180 / Math.PI + 360) % 360;
  }

  bearingToDirection(bearing) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  getAssetCriticality(asset) {
    const criticality = {
      'nuclear': 10,
      'military': 9,
      'parliament': 9,
      'airport': 7,
      'harbour': 6,
      'energy': 8,
      'rail_station': 5,
      'bridge': 6,
      'tunnel': 7,
      'data_center': 8
    };

    return criticality[asset?.type] || 3;
  }

  calculateLocalFrequency(location, radius = 50000) {
    if (!location) return 0;

    const nearbyIncidents = this.incidents.filter(i => {
      if (!i.location) return false;
      return this.calculateDistance(location, i.location) <= radius;
    });

    return nearbyIncidents.length;
  }

  detectEscalation() {
    if (this.incidents.length < 3) return false;

    const recent = this.incidents.slice(-10);
    const older = this.incidents.slice(-20, -10);

    const recentAvgSeverity = recent.reduce((sum, i) => sum + (i.severity || 3), 0) / recent.length;
    const olderAvgSeverity = older.reduce((sum, i) => sum + (i.severity || 3), 0) / Math.max(older.length, 1);

    return recentAvgSeverity > olderAvgSeverity * 1.3;
  }

  calculatePersistence(location) {
    if (!location) return 0;

    const nearbyIncidents = this.incidents.filter(i => {
      if (!i.location) return false;
      return this.calculateDistance(location, i.location) <= 50000;
    });

    if (nearbyIncidents.length < 2) return 0;

    // Calculate time span
    const timestamps = nearbyIncidents.map(i => new Date(i.timestamp).getTime());
    const timeSpan = Math.max(...timestamps) - Math.min(...timestamps);

    // Persistence score: incidents per day
    return (nearbyIncidents.length / Math.max(1, timeSpan / 86400000)) * 10;
  }

  calculateConfidence(factors) {
    // Simple confidence based on data completeness
    let confidence = 0;
    let count = 0;

    for (const value of Object.values(factors)) {
      if (value !== null && value !== undefined && value !== 0) {
        confidence += 1;
      }
      count += 1;
    }

    return confidence / count;
  }

  categorizeThreatLevel(score) {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    if (score >= 0.2) return 'LOW';
    return 'MINIMAL';
  }

  updateRiskZones(location, threatLevel) {
    if (!location) return;

    const zoneId = `${Math.floor(location.lat)}-${Math.floor(location.lon)}`;
    const existingZone = this.riskZones.get(zoneId) || {
      center: location,
      threatLevels: [],
      averageThreat: 0
    };

    existingZone.threatLevels.push(threatLevel);

    // Keep only recent assessments
    if (existingZone.threatLevels.length > 100) {
      existingZone.threatLevels.shift();
    }

    // Calculate average
    const sum = existingZone.threatLevels.reduce((s, t) => s + t.score, 0);
    existingZone.averageThreat = sum / existingZone.threatLevels.length;

    this.riskZones.set(zoneId, existingZone);
  }

  identifyPotentialTargets(location, radius) {
    // This would query all assets within radius
    // Simplified for demonstration
    return [
      { name: 'Nearby Airport', location: { lat: location.lat + 0.1, lon: location.lon + 0.1 }, type: 'airport' },
      { name: 'Port Facility', location: { lat: location.lat - 0.1, lon: location.lon + 0.1 }, type: 'harbour' },
      { name: 'Power Plant', location: { lat: location.lat + 0.05, lon: location.lon - 0.05 }, type: 'energy' }
    ];
  }

  estimateTimeframe(from, to) {
    const distance = this.calculateDistance(from, to);
    const avgSpeed = 50; // km/h average drone speed

    return (distance / 1000 / avgSpeed) * 3600000; // milliseconds
  }

  calculatePredictionConfidence(probability, incident, target) {
    // Factors affecting confidence
    const dataQuality = this.incidents.length > 100 ? 1 : this.incidents.length / 100;
    const patternStrength = this.patterns.size / 10;
    const targetHistory = this.getTargetHistory(target) / 10;

    return (probability + dataQuality + patternStrength + targetHistory) / 4;
  }

  generatePreventiveActions(prediction) {
    const actions = [];

    if (prediction.probability > 0.8) {
      actions.push('Immediate security deployment');
      actions.push('Activate anti-drone systems');
      actions.push('Issue NOTAM for airspace restriction');
    } else if (prediction.probability > 0.6) {
      actions.push('Increase security patrols');
      actions.push('Alert local authorities');
      actions.push('Monitor approach vectors');
    } else {
      actions.push('Maintain heightened awareness');
      actions.push('Review security protocols');
    }

    return actions;
  }

  encodeAssetType(type) {
    const encoding = {
      'airport': 1, 'harbour': 2, 'military': 3, 'energy': 4,
      'nuclear': 5, 'government': 6, 'rail': 7, 'bridge': 8,
      'tunnel': 9, 'data_center': 10
    };

    return encoding[type] || 0;
  }

  getTargetHistory(target) {
    return this.incidents.filter(i =>
      i.asset?.name === target.name
    ).length;
  }

  calculateTypeAverageSeverity(type) {
    const typeIncidents = this.incidents.filter(i => i.asset?.type === type);
    if (typeIncidents.length === 0) return 3;

    return typeIncidents.reduce((sum, i) => sum + (i.severity || 3), 0) / typeIncidents.length;
  }

  getActivePatternCount() {
    const activeTimeWindow = 86400000; // 24 hours
    const now = Date.now();

    return Array.from(this.patterns.values()).filter(p => {
      const patternTime = parseInt(p.id?.split('-')[1] || '0');
      return (now - patternTime) <= activeTimeWindow;
    }).length;
  }

  generateInfrastructureRecommendations(preferences) {
    const recommendations = [];

    for (const pref of preferences) {
      if (pref.type === 'airport') {
        recommendations.push('Enhance airport perimeter security');
        recommendations.push('Deploy counter-UAS systems at major airports');
      } else if (pref.type === 'nuclear' || pref.type === 'energy') {
        recommendations.push('Critical infrastructure alert - maximize security');
        recommendations.push('Coordinate with military for air defense');
      } else if (pref.type === 'military') {
        recommendations.push('Elevate force protection levels');
        recommendations.push('Activate military counter-drone protocols');
      }
    }

    return recommendations;
  }

  calculateOverallThreatLevel(analyses) {
    const scores = analyses
      .filter(a => a && a.confidence)
      .map(a => a.confidence);

    if (scores.length === 0) return 'LOW';

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (avgScore > 0.8) return 'CRITICAL';
    if (avgScore > 0.6) return 'HIGH';
    if (avgScore > 0.4) return 'MEDIUM';
    return 'LOW';
  }

  generateRecommendations(analyses) {
    const recommendations = new Set();

    for (const analysis of analyses) {
      if (!analysis) continue;

      if (analysis.type === this.patternTypes.COORDINATED) {
        recommendations.add('Activate multi-agency coordination');
        recommendations.add('Deploy rapid response teams');
      }

      if (analysis.type === this.patternTypes.SWARM) {
        recommendations.add('Activate swarm countermeasures');
        recommendations.add('Request military assistance');
      }

      if (analysis.type === this.patternTypes.INFRASTRUCTURE) {
        recommendations.add('Harden critical infrastructure');
        recommendations.add('Increase security at identified targets');
      }

      if (analysis.recommendations) {
        analysis.recommendations.forEach(r => recommendations.add(r));
      }
    }

    return Array.from(recommendations);
  }
}

// Export singleton instance
export const patternAnalyzer = new PatternAnalyzer();