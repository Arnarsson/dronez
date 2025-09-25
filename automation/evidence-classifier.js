import { CONFIG } from './config.js';

export class EvidenceClassifier {
  constructor() {
    this.rules = CONFIG.evidenceRules;
    this.targetDistribution = CONFIG.targetDistribution;
  }

  classifyIncident(incident) {
    const classification = this.analyzeEvidence(incident);
    return {
      ...incident,
      evidence: classification,
      confidence_score: this.calculateConfidenceScore(incident, classification)
    };
  }

  analyzeEvidence(incident) {
    const sources = incident.sources || [];
    const content = this.extractTextContent(incident);

    // Multi-factor evidence analysis
    const factors = {
      sourceCredibility: this.analyzeSourceCredibility(sources),
      contentAnalysis: this.analyzeContent(content),
      temporalFactors: this.analyzeTemporalFactors(incident),
      geographicFactors: this.analyzeGeographicFactors(incident)
    };

    const evidenceLevel = this.determineEvidenceLevel(factors);
    const attribution = this.generateAttribution(evidenceLevel, factors);

    return {
      strength: evidenceLevel,
      attribution: attribution,
      factors: factors,
      reasoning: this.generateReasoning(evidenceLevel, factors)
    };
  }

  extractTextContent(incident) {
    let content = '';

    if (incident.raw_data) {
      content += `${incident.raw_data.title || ''} ${incident.raw_data.description || ''} ${incident.raw_data.content || ''}`;
    }

    if (incident.sources) {
      incident.sources.forEach(source => {
        content += ` ${source.title || ''} ${source.content || ''}`;
      });
    }

    return content.toLowerCase().trim();
  }

  analyzeSourceCredibility(sources) {
    let totalScore = 0;
    let maxScore = 0;

    const sourceScores = {
      'notam': 10,
      'navtex': 10,
      'official': 9,
      'authority': 9,
      'police': 8,
      'news': 6,
      'media': 6,
      'journalist': 6,
      'local news': 4,
      'regional media': 4,
      'social media': 2,
      'twitter': 2,
      'facebook': 2,
      'reddit': 1
    };

    sources.forEach(source => {
      const sourceType = source.type?.toLowerCase() || '';
      const publication = source.publication?.toLowerCase() || '';

      let score = 0;

      // Check source type
      for (const [type, value] of Object.entries(sourceScores)) {
        if (sourceType.includes(type) || publication.includes(type)) {
          score = Math.max(score, value);
        }
      }

      // Bonus for known reputable publications
      const reputableSources = ['bbc', 'reuters', 'associated press', 'guardian', 'times'];
      if (reputableSources.some(rep => publication.includes(rep))) {
        score += 2;
      }

      totalScore += score;
      maxScore = Math.max(maxScore, score);
    });

    return {
      averageScore: sources.length > 0 ? totalScore / sources.length : 0,
      maxScore: maxScore,
      sourceCount: sources.length,
      hasOfficialSource: maxScore >= 8
    };
  }

  analyzeContent(content) {
    const analysis = {
      confirmationKeywords: 0,
      uncertaintyKeywords: 0,
      officialLanguage: 0,
      technicalDetail: 0,
      emotionalLanguage: 0
    };

    // Confirmation indicators
    const confirmationWords = ['confirmed', 'verified', 'investigated', 'arrested', 'charged', 'official', 'authority'];
    analysis.confirmationKeywords = confirmationWords.filter(word => content.includes(word)).length;

    // Uncertainty indicators
    const uncertaintyWords = ['allegedly', 'reportedly', 'might', 'could', 'possibly', 'unconfirmed', 'rumored'];
    analysis.uncertaintyKeywords = uncertaintyWords.filter(word => content.includes(word)).length;

    // Official language patterns
    const officialPhrases = ['according to authorities', 'police statement', 'official investigation', 'press release'];
    analysis.officialLanguage = officialPhrases.filter(phrase => content.includes(phrase)).length;

    // Technical detail level
    const technicalTerms = ['altitude', 'flight path', 'airspace', 'radar', 'atc', 'notam', 'restricted zone'];
    analysis.technicalDetail = technicalTerms.filter(term => content.includes(term)).length;

    // Emotional/sensational language
    const emotionalWords = ['shocking', 'terrifying', 'dramatic', 'panic', 'chaos', 'mysterious'];
    analysis.emotionalLanguage = emotionalWords.filter(word => content.includes(word)).length;

    return analysis;
  }

  analyzeTemporalFactors(incident) {
    const incidentTime = new Date(incident.first_seen_utc);
    const now = new Date();
    const ageHours = (now - incidentTime) / (1000 * 60 * 60);

    return {
      ageHours: ageHours,
      recency: ageHours < 24 ? 'recent' : ageHours < 168 ? 'current' : 'historical',
      timeOfDay: this.categorizeTimeOfDay(incidentTime),
      dayOfWeek: incidentTime.getDay()
    };
  }

  analyzeGeographicFactors(incident) {
    const analysis = {
      assetType: incident.asset?.type || 'unknown',
      assetImportance: this.categorizeAssetImportance(incident.asset),
      locationSpecificity: this.analyzeLocationSpecificity(incident.location)
    };

    return analysis;
  }

  categorizeAssetImportance(asset) {
    const importance = {
      'nuclear': 'critical',
      'military': 'high',
      'airport': 'high',
      'harbour': 'medium',
      'rail': 'medium',
      'border': 'medium',
      'unknown': 'low'
    };

    return importance[asset?.type] || 'low';
  }

  analyzeLocationSpecificity(location) {
    let specificity = 0;

    if (location?.coordinates) specificity += 3;
    if (location?.icao || location?.iata) specificity += 2;
    if (location?.name) specificity += 1;

    return {
      score: specificity,
      level: specificity >= 5 ? 'high' : specificity >= 3 ? 'medium' : 'low'
    };
  }

  categorizeTimeOfDay(date) {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  determineEvidenceLevel(factors) {
    let score = 0;

    // Source credibility (0-4 points)
    if (factors.sourceCredibility.hasOfficialSource) {
      score += 4;
    } else if (factors.sourceCredibility.maxScore >= 6) {
      score += 3;
    } else if (factors.sourceCredibility.maxScore >= 4) {
      score += 2;
    } else if (factors.sourceCredibility.maxScore >= 2) {
      score += 1;
    }

    // Content analysis (0-3 points)
    if (factors.contentAnalysis.confirmationKeywords >= 2) {
      score += 2;
    } else if (factors.contentAnalysis.confirmationKeywords >= 1) {
      score += 1;
    }

    if (factors.contentAnalysis.officialLanguage >= 1) {
      score += 1;
    }

    // Penalty for uncertainty
    if (factors.contentAnalysis.uncertaintyKeywords >= 2) {
      score -= 1;
    }

    // Multiple source bonus
    if (factors.sourceCredibility.sourceCount >= 3) {
      score += 1;
    } else if (factors.sourceCredibility.sourceCount >= 2) {
      score += 0.5;
    }

    // Asset importance modifier
    if (factors.geographicFactors.assetImportance === 'critical') {
      score += 0.5;
    }

    // Convert score to evidence level
    if (score >= 6) return 3; // Confirmed
    if (score >= 4) return 2; // Suspected
    if (score >= 2) return 1; // Single source
    return 0; // Unconfirmed
  }

  generateAttribution(evidenceLevel, factors) {
    const attributions = {
      3: 'confirmed',
      2: 'suspected',
      1: 'single-source',
      0: 'unconfirmed'
    };

    return attributions[evidenceLevel];
  }

  generateReasoning(evidenceLevel, factors) {
    const reasons = [];

    if (factors.sourceCredibility.hasOfficialSource) {
      reasons.push('Official source available');
    }

    if (factors.sourceCredibility.sourceCount > 1) {
      reasons.push(`Multiple sources (${factors.sourceCredibility.sourceCount})`);
    }

    if (factors.contentAnalysis.confirmationKeywords > 0) {
      reasons.push('Contains confirmation keywords');
    }

    if (factors.contentAnalysis.uncertaintyKeywords > 0) {
      reasons.push('Contains uncertainty language');
    }

    if (factors.geographicFactors.assetImportance === 'critical') {
      reasons.push('Critical infrastructure involved');
    }

    return reasons.join('; ');
  }

  calculateConfidenceScore(incident, classification) {
    // Calculate overall confidence in the classification (0-1)
    let confidence = 0.5; // Base confidence

    const factors = classification.factors;

    // Source quality contribution (0-0.3)
    confidence += (factors.sourceCredibility.averageScore / 10) * 0.3;

    // Source count contribution (0-0.2)
    confidence += Math.min(factors.sourceCredibility.sourceCount / 5, 1) * 0.2;

    // Location specificity contribution (0-0.1)
    confidence += (factors.geographicFactors.locationSpecificity.score / 6) * 0.1;

    // Temporal relevance contribution (0-0.1)
    if (factors.temporalFactors.ageHours < 48) {
      confidence += 0.1;
    } else if (factors.temporalFactors.ageHours < 168) {
      confidence += 0.05;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  balanceEvidenceDistribution(incidents) {
    // Ensure incidents match target evidence distribution
    const currentDistribution = this.analyzeCurrentDistribution(incidents);
    const adjustedIncidents = [];

    const totalTarget = Object.values(this.targetDistribution).reduce((sum, dist) => sum + dist.max, 0);

    for (const [level, config] of Object.entries(this.targetDistribution)) {
      const levelNum = parseInt(level.replace('evidence', ''));
      const currentCount = currentDistribution[levelNum] || 0;
      const targetCount = Math.min(config.max, Math.ceil(incidents.length * config.percentage / 100));

      // Get incidents at this level
      const levelIncidents = incidents.filter(inc => inc.evidence.strength === levelNum);

      if (currentCount < targetCount) {
        // Need more incidents at this level - upgrade some from lower levels
        const deficit = targetCount - currentCount;
        const upgradeCandidates = this.findUpgradeCandidates(incidents, levelNum, deficit);
        upgradeCandidates.forEach(incident => {
          incident.evidence.strength = levelNum;
          incident.evidence.attribution = this.generateAttribution(levelNum, incident.evidence.factors);
        });
      } else if (currentCount > targetCount) {
        // Too many at this level - downgrade some
        const excess = currentCount - targetCount;
        const downgradeCandidates = levelIncidents
          .sort((a, b) => a.confidence_score - b.confidence_score)
          .slice(0, excess);

        downgradeCandidates.forEach(incident => {
          incident.evidence.strength = Math.max(0, levelNum - 1);
          incident.evidence.attribution = this.generateAttribution(incident.evidence.strength, incident.evidence.factors);
        });
      }
    }

    return incidents;
  }

  analyzeCurrentDistribution(incidents) {
    const distribution = { 0: 0, 1: 0, 2: 0, 3: 0 };

    incidents.forEach(incident => {
      const level = incident.evidence?.strength || 0;
      distribution[level]++;
    });

    return distribution;
  }

  findUpgradeCandidates(incidents, targetLevel, count) {
    // Find incidents with highest confidence scores at lower levels
    return incidents
      .filter(inc => inc.evidence.strength < targetLevel)
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, count);
  }
}