#!/usr/bin/env node

import { AutomationScheduler } from './scheduler.js';
import { IncidentGenerator } from './incident-generator.js';
import { QualityController } from './quality-controller.js';

class DroneIncidentAutomation {
  constructor() {
    this.scheduler = new AutomationScheduler();
    this.generator = new IncidentGenerator();
    this.qualityController = new QualityController();
  }

  async start() {
    console.log('🚁 Drone Incident Automation System Starting...\n');

    console.log('Features:');
    console.log('✅ Automated news/media scraping');
    console.log('✅ NOTAM/official source monitoring');
    console.log('✅ Evidence classification (0-3 levels)');
    console.log('✅ Geographic intelligence enrichment');
    console.log('✅ Quality control and review');
    console.log('✅ Scheduled updates every 6 hours');
    console.log('✅ Proper evidence distribution maintenance');
    console.log('');

    this.scheduler.start();
  }

  async runOnce(options = {}) {
    console.log('🔄 Running single incident collection cycle...\n');

    const result = await this.scheduler.runManual(options);

    console.log('✅ Manual run completed');
    console.log('Status:', result);

    return result;
  }

  async generateTestData(count = 10) {
    console.log(`🧪 Generating ${count} test incidents...\n`);

    const incidents = await this.generator.generateIncidents({
      daysBack: 30,
      maxIncidents: count,
      enableRealData: false,
      supplementWithSimulated: true
    });

    console.log(`✅ Generated ${incidents.length} test incidents`);

    const distribution = incidents.reduce((acc, inc) => {
      const level = inc.evidence?.strength || 0;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    console.log('Evidence distribution:', distribution);

    return incidents;
  }

  async auditData() {
    console.log('🔍 Running data quality audit...\n');

    try {
      const fs = await import('fs/promises');
      const currentData = JSON.parse(await fs.readFile('/root/repo/public/incidents.json', 'utf-8'));

      const audit = await this.qualityController.auditDataset(currentData);

      console.log('✅ Audit completed');
      console.log('Issues found:', audit.issues.length);
      console.log('Recommendations:', audit.recommendations.length);

      return audit;
    } catch (error) {
      console.error('❌ Audit failed:', error.message);
      throw error;
    }
  }

  getStatus() {
    return this.scheduler.getStatus();
  }

  stop() {
    console.log('🛑 Stopping automation system...');
    process.exit(0);
  }
}

// CLI Interface
async function main() {
  const automation = new DroneIncidentAutomation();

  const command = process.argv[2];

  switch (command) {
    case 'start':
      await automation.start();
      break;

    case 'run':
      await automation.runOnce();
      process.exit(0);
      break;

    case 'test':
      const count = parseInt(process.argv[3]) || 10;
      await automation.generateTestData(count);
      process.exit(0);
      break;

    case 'audit':
      await automation.auditData();
      process.exit(0);
      break;

    case 'status':
      console.log(automation.getStatus());
      process.exit(0);
      break;

    case 'help':
    case '--help':
    case '-h':
      console.log(`
🚁 Drone Incident Automation System

Usage: node automation/index.js <command>

Commands:
  start     Start the automation system with scheduled runs
  run       Run a single collection cycle and exit
  test [n]  Generate n test incidents (default: 10)
  audit     Run quality audit on current dataset
  status    Show current system status
  help      Show this help message

Examples:
  node automation/index.js start          # Start continuous automation
  node automation/index.js run            # Single manual run
  node automation/index.js test 25        # Generate 25 test incidents
  node automation/index.js audit          # Audit data quality

Environment Variables:
  NEWS_API_KEY        - NewsAPI key for real news scraping
  AUTO_DEPLOY=true    - Enable automatic git commits and deployments
  NODE_ENV=production - Enable production features

The system maintains proper evidence level distribution:
- Evidence 0 (unconfirmed): 20% - Social media, unverified
- Evidence 1 (single-source): 25% - Local news, single witness
- Evidence 2 (suspected): 40% - Multiple sources, circumstantial
- Evidence 3 (confirmed): 15% - Official statements, NOTAM/NAVTEX
      `);
      process.exit(0);
      break;

    default:
      console.log('❌ Unknown command. Use "help" for usage information.');
      process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Only run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { DroneIncidentAutomation };