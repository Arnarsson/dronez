import { CONFIG } from './config.js';

export class QualityController {
  constructor() {
    this.reviewRules = this.initializeReviewRules();
    this.approvalThreshold = 0.7;
  }

  initializeReviewRules() {
    return {
      // Geographic validation rules
      coordinate_bounds: {
        europe: {
          min_lat: 35.0, max_lat: 71.0,
          min_lon: -25.0, max_lon: 45.0
        }
      },

      // Asset validation rules
      required_asset_fields: ['type', 'name'],
      valid_asset_types: ['airport', 'nuclear', 'military', 'harbour', 'rail', 'border'],

      // Evidence validation rules
      valid_evidence_levels: [0, 1, 2, 3],
      valid_attributions: ['unconfirmed', 'single-source', 'suspected', 'confirmed'],

      // Content quality rules
      min_content_length: 10,
      required_incident_fields: ['id', 'first_seen_utc', 'asset', 'location', 'evidence'],

      // Temporal validation rules
      max_future_hours: 1, // Incidents can't be more than 1 hour in the future
      max_past_days: CONFIG.processing.maxAge || 90,

      // Source validation rules
      min_sources: 1,
      max_sources_per_incident: 10,

      // Duplicate detection rules
      duplicate_threshold: CONFIG.processing.duplicateThreshold || 0.8,
      geo_radius: CONFIG.processing.geoRadius || 5000
    };
  }

  async reviewIncidents(incidents) {
    console.log(`\n=== Quality Control Review: ${incidents.length} incidents ===`);

    const results = {
      approved: [],
      rejected: [],
      flagged: [],
      statistics: {
        total: incidents.length,
        approved_count: 0,
        rejected_count: 0,
        flagged_count: 0,
        quality_scores: []
      }
    };

    for (const incident of incidents) {
      const review = await this.reviewSingleIncident(incident);
      results.statistics.quality_scores.push(review.quality_score);

      if (review.approved) {
        results.approved.push({
          ...incident,
          quality_review: review
        });
        results.statistics.approved_count++;
      } else if (review.flagged) {
        results.flagged.push({
          ...incident,
          quality_review: review
        });
        results.statistics.flagged_count++;
      } else {
        results.rejected.push({
          ...incident,
          quality_review: review
        });
        results.statistics.rejected_count++;
      }
    }

    // Calculate summary statistics
    results.statistics.average_quality_score =
      results.statistics.quality_scores.reduce((a, b) => a + b, 0) / results.statistics.quality_scores.length;

    results.statistics.approval_rate =
      results.statistics.approved_count / results.statistics.total;

    console.log('Quality Control Results:', {
      approved: results.statistics.approved_count,
      rejected: results.statistics.rejected_count,
      flagged: results.statistics.flagged_count,
      approval_rate: `${(results.statistics.approval_rate * 100).toFixed(1)}%`,
      avg_quality: results.statistics.average_quality_score.toFixed(2)
    });

    // Auto-approve flagged incidents if they meet certain criteria
    const autoApproved = await this.autoApproveFlagged(results.flagged);
    results.approved.push(...autoApproved);
    results.flagged = results.flagged.filter(inc => !autoApproved.includes(inc));

    console.log(`Auto-approved ${autoApproved.length} flagged incidents`);
    console.log(`Final approved count: ${results.approved.length}`);

    return results.approved;
  }

  async reviewSingleIncident(incident) {
    const review = {
      incident_id: incident.id,
      quality_score: 0,
      approved: false,
      flagged: false,
      issues: [],
      warnings: [],
      checks: {}
    };

    // Run all validation checks
    await this.validateRequired(incident, review);
    await this.validateGeographic(incident, review);
    await this.validateTemporal(incident, review);
    await this.validateAsset(incident, review);
    await this.validateEvidence(incident, review);
    await this.validateSources(incident, review);
    await this.validateContent(incident, review);

    // Calculate overall quality score (0-1)
    review.quality_score = this.calculateQualityScore(review.checks);

    // Make approval decision
    if (review.quality_score >= this.approvalThreshold && review.issues.length === 0) {
      review.approved = true;
    } else if (review.quality_score >= 0.5 && review.issues.length <= 2) {
      review.flagged = true; // Needs human review or can be auto-approved
    } else {
      review.approved = false; // Rejected
    }

    return review;
  }

  async validateRequired(incident, review) {
    const required = this.reviewRules.required_incident_fields;
    let score = 0;

    for (const field of required) {
      if (this.hasValidField(incident, field)) {
        score++;
      } else {
        review.issues.push(`Missing required field: ${field}`);
      }
    }

    review.checks.required_fields = score / required.length;
  }

  async validateGeographic(incident, review) {
    let score = 0;
    const maxScore = 3;

    // Check if location exists
    if (incident.location) {
      score++;

      // Check coordinates
      if (incident.location.coordinates && Array.isArray(incident.location.coordinates)) {
        const [lat, lon] = incident.location.coordinates;
        const bounds = this.reviewRules.coordinate_bounds.europe;

        if (lat >= bounds.min_lat && lat <= bounds.max_lat &&
            lon >= bounds.min_lon && lon <= bounds.max_lon) {
          score++;
        } else {
          review.warnings.push('Coordinates outside European bounds');
        }
      } else {
        review.warnings.push('Missing or invalid coordinates');
      }

      // Check country code
      if (incident.location.country && incident.location.country.length === 2) {
        score++;
      } else {
        review.warnings.push('Invalid or missing country code');
      }
    } else {
      review.issues.push('Missing location data');
    }

    review.checks.geographic = score / maxScore;
  }

  async validateTemporal(incident, review) {
    let score = 0;
    const maxScore = 2;

    const incidentTime = new Date(incident.first_seen_utc);
    const now = new Date();

    // Check if date is valid
    if (!isNaN(incidentTime.getTime())) {
      score++;

      // Check if not too far in the future
      const hoursDiff = (incidentTime - now) / (1000 * 60 * 60);
      if (hoursDiff <= this.reviewRules.max_future_hours) {
        score++;
      } else {
        review.issues.push('Incident time is in the future');
      }

      // Check if not too old
      const daysDiff = (now - incidentTime) / (1000 * 60 * 60 * 24);
      if (daysDiff > this.reviewRules.max_past_days) {
        review.warnings.push('Incident is very old');
      }
    } else {
      review.issues.push('Invalid timestamp format');
    }

    review.checks.temporal = score / maxScore;
  }

  async validateAsset(incident, review) {
    let score = 0;
    const maxScore = 3;

    if (incident.asset) {
      // Check required fields
      const required = this.reviewRules.required_asset_fields;
      const hasRequired = required.every(field => incident.asset[field]);

      if (hasRequired) {
        score++;
      } else {
        review.issues.push('Asset missing required fields');
      }

      // Check asset type validity
      if (this.reviewRules.valid_asset_types.includes(incident.asset.type)) {
        score++;
      } else {
        review.issues.push(`Invalid asset type: ${incident.asset.type}`);
      }

      // Check asset name quality
      if (incident.asset.name && incident.asset.name.length > 3) {
        score++;
      } else {
        review.warnings.push('Asset name too short or missing');
      }
    } else {
      review.issues.push('Missing asset data');
    }

    review.checks.asset = score / maxScore;
  }

  async validateEvidence(incident, review) {
    let score = 0;
    const maxScore = 3;

    if (incident.evidence) {
      // Check evidence strength
      if (this.reviewRules.valid_evidence_levels.includes(incident.evidence.strength)) {
        score++;
      } else {
        review.issues.push(`Invalid evidence strength: ${incident.evidence.strength}`);
      }

      // Check attribution
      if (this.reviewRules.valid_attributions.includes(incident.evidence.attribution)) {
        score++;
      } else {
        review.issues.push(`Invalid evidence attribution: ${incident.evidence.attribution}`);
      }

      // Check consistency between strength and attribution
      const expectedAttributions = {
        0: 'unconfirmed',
        1: 'single-source',
        2: 'suspected',
        3: 'confirmed'
      };

      if (expectedAttributions[incident.evidence.strength] === incident.evidence.attribution) {
        score++;
      } else {
        review.warnings.push('Evidence strength and attribution mismatch');
      }
    } else {
      review.issues.push('Missing evidence data');
    }

    review.checks.evidence = score / maxScore;
  }

  async validateSources(incident, review) {
    let score = 0;
    const maxScore = 2;

    if (incident.sources && Array.isArray(incident.sources)) {
      const sourceCount = incident.sources.length;

      // Check source count
      if (sourceCount >= this.reviewRules.min_sources &&
          sourceCount <= this.reviewRules.max_sources_per_incident) {
        score++;
      } else {
        review.warnings.push(`Source count (${sourceCount}) outside acceptable range`);
      }

      // Check source quality
      const validSources = incident.sources.filter(source =>
        source.type && source.title && source.title.length > 5
      );

      if (validSources.length === sourceCount) {
        score++;
      } else {
        review.warnings.push('Some sources missing required fields');
      }
    } else {
      review.warnings.push('Missing or invalid sources array');
    }

    review.checks.sources = score / maxScore;
  }

  async validateContent(incident, review) {
    let score = 0;
    const maxScore = 2;

    // Check if there's meaningful content
    const contentFields = [
      incident.raw_data?.title,
      incident.raw_data?.description,
      incident.raw_data?.content
    ].filter(Boolean);

    if (contentFields.length > 0) {
      const totalContent = contentFields.join(' ');
      if (totalContent.length >= this.reviewRules.min_content_length) {
        score++;
      } else {
        review.warnings.push('Insufficient content detail');
      }
    }

    // Check for spam/low quality indicators
    const spamIndicators = ['click here', 'buy now', 'free money', 'urgent!!!'];
    const hasSpam = contentFields.some(content =>
      spamIndicators.some(spam => content?.toLowerCase().includes(spam))
    );

    if (!hasSpam) {
      score++;
    } else {
      review.issues.push('Content contains spam indicators');
    }

    review.checks.content = score / maxScore;
  }

  hasValidField(obj, fieldPath) {
    const fields = fieldPath.split('.');
    let current = obj;

    for (const field of fields) {
      if (!current || current[field] === undefined || current[field] === null) {
        return false;
      }
      current = current[field];
    }

    return true;
  }

  calculateQualityScore(checks) {
    const weights = {
      required_fields: 0.25,
      geographic: 0.15,
      temporal: 0.10,
      asset: 0.20,
      evidence: 0.15,
      sources: 0.10,
      content: 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [check, weight] of Object.entries(weights)) {
      if (checks[check] !== undefined) {
        totalScore += checks[check] * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  async autoApproveFlagged(flaggedIncidents) {
    const autoApproved = [];

    for (const incident of flaggedIncidents) {
      const review = incident.quality_review;

      // Auto-approve if high quality score with only warnings
      if (review.quality_score >= 0.65 && review.issues.length === 0) {
        autoApproved.push(incident);
        continue;
      }

      // Auto-approve if it's a simulated incident with minor issues
      if (incident.id.startsWith('sim-') && review.quality_score >= 0.6) {
        autoApproved.push(incident);
        continue;
      }

      // Auto-approve if it has confirmed evidence and decent quality
      if (incident.evidence?.strength >= 3 && review.quality_score >= 0.6) {
        autoApproved.push(incident);
        continue;
      }
    }

    return autoApproved;
  }

  async auditDataset(incidents) {
    console.log(`\n=== Dataset Quality Audit: ${incidents.length} incidents ===`);

    const audit = {
      timestamp: new Date().toISOString(),
      total_incidents: incidents.length,
      issues: [],
      statistics: {
        evidence_distribution: {},
        quality_metrics: {},
        geographic_coverage: {},
        temporal_distribution: {}
      },
      recommendations: []
    };

    // Analyze evidence distribution
    const evidenceDistribution = {};
    incidents.forEach(inc => {
      const level = inc.evidence?.strength || 0;
      evidenceDistribution[level] = (evidenceDistribution[level] || 0) + 1;
    });
    audit.statistics.evidence_distribution = evidenceDistribution;

    // Check if distribution matches target
    const totalIncidents = incidents.length;
    for (const [level, config] of Object.entries(CONFIG.targetDistribution)) {
      const levelNum = parseInt(level.replace('evidence', ''));
      const current = evidenceDistribution[levelNum] || 0;
      const currentPercentage = (current / totalIncidents) * 100;
      const targetPercentage = config.percentage;

      if (Math.abs(currentPercentage - targetPercentage) > 5) {
        audit.issues.push({
          type: 'distribution_imbalance',
          level: levelNum,
          current: currentPercentage,
          target: targetPercentage,
          severity: 'medium'
        });
      }
    }

    // Check for duplicates
    const duplicates = this.findDuplicates(incidents);
    if (duplicates.length > 0) {
      audit.issues.push({
        type: 'duplicates',
        count: duplicates.length,
        severity: 'high'
      });
    }

    // Check geographic coverage
    const countries = {};
    incidents.forEach(inc => {
      const country = inc.location?.country;
      if (country) {
        countries[country] = (countries[country] || 0) + 1;
      }
    });
    audit.statistics.geographic_coverage = countries;

    // Generate recommendations
    if (Object.keys(countries).length < 10) {
      audit.recommendations.push('Increase geographic diversity - currently covering only ' + Object.keys(countries).length + ' countries');
    }

    if (audit.issues.length === 0) {
      audit.recommendations.push('Dataset quality is good - no major issues detected');
    }

    console.log('Audit completed:', {
      total_issues: audit.issues.length,
      countries_covered: Object.keys(countries).length,
      evidence_levels: Object.keys(evidenceDistribution).length
    });

    return audit;
  }

  findDuplicates(incidents) {
    const duplicates = [];
    const seen = new Map();

    for (const incident of incidents) {
      const key = this.generateDuplicateKey(incident);
      if (seen.has(key)) {
        duplicates.push({
          original: seen.get(key),
          duplicate: incident
        });
      } else {
        seen.set(key, incident);
      }
    }

    return duplicates;
  }

  generateDuplicateKey(incident) {
    const location = incident.location?.name || 'unknown';
    const asset = incident.asset?.type || 'unknown';
    const date = new Date(incident.first_seen_utc).toISOString().split('T')[0];

    return `${location}-${asset}-${date}`;
  }

  async autoFixIssues(incidents, issues) {
    let fixedIncidents = [...incidents];

    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'duplicates':
            fixedIncidents = this.removeDuplicates(fixedIncidents);
            break;

          case 'distribution_imbalance':
            fixedIncidents = await this.rebalanceDistribution(fixedIncidents);
            break;

          default:
            console.log(`No auto-fix available for issue type: ${issue.type}`);
        }
      } catch (error) {
        console.error(`Failed to fix issue ${issue.type}:`, error.message);
      }
    }

    return fixedIncidents;
  }

  removeDuplicates(incidents) {
    const unique = [];
    const seen = new Set();

    for (const incident of incidents) {
      const key = this.generateDuplicateKey(incident);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(incident);
      }
    }

    return unique;
  }

  async rebalanceDistribution(incidents) {
    // This would implement smart rebalancing logic
    // For now, just return the incidents as-is
    // Full implementation would adjust evidence levels intelligently
    return incidents;
  }
}