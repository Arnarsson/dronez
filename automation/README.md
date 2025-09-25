# Automated Drone Incident Collection System

A comprehensive system for automatically collecting, classifying, and maintaining a European drone incident dataset with proper evidence level distribution.

## Features

- **Multi-Source Data Collection**: NewsAPI, GDELT, NOTAM/official sources
- **Evidence Classification**: 4-level evidence system (0-3) with intelligent classification
- **Geographic Intelligence**: OSM integration for asset details and nearby infrastructure
- **Quality Control**: Automated review with approval thresholds and human review queue
- **Scheduled Updates**: Cron-based automation running every 6 hours
- **Proper Distribution**: Maintains target evidence level percentages automatically

## Evidence Levels

| Level | Attribution | Percentage | Description |
|-------|------------|------------|-------------|
| 0 | Unconfirmed | 20% | Social media reports, unverified sightings |
| 1 | Single-source | 25% | Local news, single eyewitness reports |
| 2 | Suspected | 40% | Multiple sources, circumstantial evidence |
| 3 | Confirmed | 15% | Official statements, NOTAM/NAVTEX bulletins |

## Quick Start

### Install Dependencies
```bash
npm install
```

### Basic Usage
```bash
# Start continuous automation (runs every 6 hours)
npm run automation:start

# Run single collection cycle
npm run automation:run

# Generate test data (10 incidents)
npm run automation:test

# Audit current dataset quality
npm run automation:audit

# Check system status
npm run automation:status
```

### Advanced Usage
```bash
# Generate 50 test incidents
node automation/index.js test 50

# Run with environment variables
NEWS_API_KEY=your-key AUTO_DEPLOY=true npm run automation:start
```

## Architecture

### Core Components

1. **Scrapers** (`automation/scrapers/`)
   - `news-scraper.js`: NewsAPI and GDELT integration
   - `notam-scraper.js`: Aviation authority NOTAM parsing

2. **Processing** (`automation/`)
   - `evidence-classifier.js`: Multi-factor evidence analysis
   - `geo-intelligence.js`: Location enrichment and asset mapping
   - `quality-controller.js`: Automated quality assurance

3. **Automation** (`automation/`)
   - `scheduler.js`: Cron-based task scheduling
   - `incident-generator.js`: Main processing orchestration

### Data Flow

```
External Sources → Scrapers → Evidence Classifier → Geographic Intelligence → Quality Control → Production Dataset
```

## Configuration

Key settings in `automation/config.js`:

```javascript
// Target evidence distribution
targetDistribution: {
  evidence0: { percentage: 20 },  // Unconfirmed
  evidence1: { percentage: 25 },  // Single source
  evidence2: { percentage: 40 },  // Suspected
  evidence3: { percentage: 15 }   // Confirmed
}

// Processing limits
processing: {
  maxIncidentsPerRun: 50,
  updateFrequency: '0 */6 * * *',  // Every 6 hours
  maxAge: 90  // days
}
```

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEWS_API_KEY` | NewsAPI authentication | `your-newsapi-key` |
| `AUTO_DEPLOY` | Enable auto-commit/push | `true` |
| `NODE_ENV` | Environment mode | `production` |

## Monitoring

### Daily Reports
Generated at `/root/repo/automation/reports/daily-report-YYYY-MM-DD.json`

### Quality Metrics
- Approval rates
- Evidence distribution balance
- Geographic coverage
- Source diversity

### System Health Checks
- Last successful run timestamp
- Error tracking
- Data file accessibility
- Schedule adherence

## API Integration

### NewsAPI
Searches for drone incidents across European news sources with keyword filtering and relevance scoring.

### GDELT
Global event database monitoring for drone-related incidents with geopolitical context.

### NOTAM/Official Sources
Aviation authority bulletins and maritime safety broadcasts for confirmed incidents.

### OpenStreetMap
Asset details, coordinates, and nearby infrastructure mapping via Overpass API.

## Quality Control

### Automatic Review Criteria
- Geographic bounds validation (European coordinates)
- Temporal validation (not future-dated, within age limits)
- Asset type validation (airport, nuclear, military, etc.)
- Evidence consistency checks
- Source credibility scoring

### Approval Thresholds
- Quality score >= 0.7: Automatic approval
- Quality score >= 0.5: Flagged for review
- Quality score < 0.5: Rejected

### Auto-Fixes
- Duplicate removal
- Evidence distribution rebalancing
- Geographic coordinate validation

## Deployment Integration

When `AUTO_DEPLOY=true`:
1. Generates incidents
2. Runs quality control
3. Updates `public/incidents.json`
4. Builds production assets
5. Commits changes with automated message
6. Pushes to remote repository

## Error Handling

### Graceful Degradation
- API failures fall back to simulated data
- Individual scraper failures don't stop collection
- Quality control issues trigger warnings, not stops

### Logging
- Comprehensive error logging with timestamps
- Daily statistics and health reports
- Performance metrics tracking

## Customization

### Adding New Sources
1. Create scraper in `automation/scrapers/`
2. Implement standard interface: `scrapeIncidents(daysBack)`
3. Add to `IncidentGenerator.scrapers`

### Custom Evidence Rules
Modify `CONFIG.evidenceRules` in `config.js` for domain-specific classification logic.

### Geographic Extensions
Add new regions/countries in `CONFIG.regions` and update location patterns.

## Production Considerations

- **Rate Limiting**: Built-in delays for API calls
- **Resource Usage**: Configurable batch sizes and timeouts
- **Error Recovery**: Automatic retry logic with exponential backoff
- **Data Persistence**: Atomic file operations with backup retention
- **Security**: API key management and input sanitization

## Troubleshooting

### Common Issues

1. **No incidents generated**: Check API keys and network connectivity
2. **Quality control rejecting everything**: Adjust approval thresholds in config
3. **Evidence distribution imbalanced**: Review classification rules and target percentages
4. **Geographic errors**: Verify coordinate bounds and OSM API access

### Debug Commands
```bash
# Verbose logging
NODE_ENV=development npm run automation:run

# Test specific components
node -e "import('./automation/scrapers/news-scraper.js').then(m => new m.NewsAPIScraper().scrapeIncidents(1))"
```

This system provides a robust foundation for automated drone incident intelligence collection with built-in quality assurance and evidence-based classification.