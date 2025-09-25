#!/usr/bin/env node

import { ComprehensiveAggregator } from './scrapers/comprehensive-aggregator.js';
import cron from 'node-cron';

export class ContinuousMonitor {
  constructor() {
    this.aggregator = new ComprehensiveAggregator();
    this.isRunning = false;
    this.lastRunTime = null;
    this.runCount = 0;
    this.errors = [];

    // Configuration
    this.config = {
      schedule: '0 */2 * * *', // Every 2 hours
      daysBack: 3, // Look back 3 days for incidents
      maxConsecutiveErrors: 5,
      retryDelay: 300000 // 5 minutes
    };
  }

  start() {
    console.log('🚀 Starting Continuous Drone Incident Monitor...');
    console.log(`📅 Schedule: Every 2 hours (${this.config.schedule})`);
    console.log(`🔍 Monitoring window: ${this.config.daysBack} days`);
    console.log('');

    // Initial run
    this.runCollection().catch(error => {
      console.error('❌ Error in initial run:', error.message);
    });

    // Schedule periodic runs
    cron.schedule(this.config.schedule, () => {
      this.runCollection().catch(error => {
        console.error('❌ Error in scheduled run:', error.message);
        this.errors.push({
          timestamp: new Date().toISOString(),
          error: error.message
        });

        // Stop if too many consecutive errors
        if (this.errors.length >= this.config.maxConsecutiveErrors) {
          console.error(`🚨 Too many consecutive errors (${this.errors.length}), stopping monitor`);
          this.stop();
        }
      });
    });

    // Status report every hour
    cron.schedule('0 * * * *', () => {
      this.logStatus();
    });

    this.isRunning = true;
    console.log('✅ Continuous monitor started successfully');
  }

  async runCollection() {
    if (this.isRunning) {
      console.log('⏭️  Collection already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.runCount++;

    try {
      console.log(`\n🔄 Starting collection run #${this.runCount} at ${new Date().toISOString()}`);

      const result = await this.aggregator.aggregateAllIncidents(this.config.daysBack);

      // Save incidents
      await this.saveIncidents(result.incidents, result.metadata);

      // Auto-deploy if configured
      if (process.env.AUTO_DEPLOY === 'true') {
        await this.autoDeploy();
      }

      this.lastRunTime = new Date().toISOString();
      this.errors = []; // Clear errors on successful run

      console.log(`✅ Collection run #${this.runCount} completed successfully`);
      console.log(`📊 Collected ${result.incidents.length} incidents from ${Object.keys(result.metadata.source_stats).length} sources`);

      return result;

    } catch (error) {
      console.error(`❌ Collection run #${this.runCount} failed:`, error.message);
      throw error;

    } finally {
      this.isRunning = false;
    }
  }

  async saveIncidents(incidents, metadata) {
    const fs = await import('fs/promises');
    const path = await import('path');

    const incidentsData = {
      generated_utc: new Date().toISOString(),
      incidents: incidents,
      data_notice: "LIVE DATA: Automatically collected drone incidents from multiple sources. Updated every 2 hours.",
      metadata: {
        collection_run: this.runCount,
        collection_timestamp: metadata.collection_timestamp,
        monitor_uptime: this.getUptime(),
        total_sources: Object.keys(metadata.source_stats).length,
        source_breakdown: metadata.source_stats,
        quality_pipeline: {
          raw_collected: metadata.total_raw,
          after_deduplication: metadata.total_deduplicated,
          after_enrichment: metadata.total_enriched,
          final_output: metadata.total_quality
        }
      }
    };

    // Save main file
    const filePath = path.join(process.cwd(), 'public', 'incidents.json');
    await fs.writeFile(filePath, JSON.stringify(incidentsData, null, 2));

    // Keep rotating backups (last 5 runs)
    const backupPath = path.join(process.cwd(), 'public', `incidents.backup.run${this.runCount}.json`);
    await fs.writeFile(backupPath, JSON.stringify(incidentsData, null, 2));

    // Clean old backups (keep only last 5)
    try {
      const files = await fs.readdir(path.join(process.cwd(), 'public'));
      const backupFiles = files
        .filter(f => f.startsWith('incidents.backup.run') && f.endsWith('.json'))
        .sort((a, b) => {
          const runA = parseInt(a.match(/run(\d+)/)?.[1] || '0');
          const runB = parseInt(b.match(/run(\d+)/)?.[1] || '0');
          return runB - runA;
        });

      // Delete old backups beyond the last 5
      for (let i = 5; i < backupFiles.length; i++) {
        await fs.unlink(path.join(process.cwd(), 'public', backupFiles[i]));
      }
    } catch (error) {
      console.warn('⚠️  Warning: Could not clean old backups:', error.message);
    }

    console.log(`💾 Saved ${incidents.length} incidents to ${filePath}`);
    console.log(`💾 Backup created: ${backupPath}`);
  }

  async autoDeploy() {
    if (!process.env.AUTO_DEPLOY || process.env.AUTO_DEPLOY !== 'true') {
      return;
    }

    try {
      console.log('🚀 Auto-deploying updates...');

      const { spawn } = await import('child_process');
      const util = await import('util');
      const exec = util.promisify(spawn);

      // Check if there are changes to commit
      const { stdout: status } = await exec('git', ['status', '--porcelain']);
      if (!status.trim()) {
        console.log('📝 No changes to deploy');
        return;
      }

      // Build, commit and push
      await exec('npm', ['run', 'build']);
      await exec('git', ['add', '-A']);
      await exec('git', ['commit', '-m', `chore: automated incident update run #${this.runCount}

Updated with ${this.lastRunData?.incidents.length || 'new'} incidents from comprehensive collection.
Sources: ${this.lastRunData?.metadata.source_stats ? Object.keys(this.lastRunData.metadata.source_stats).join(', ') : 'multiple'}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`]);

      await exec('git', ['push', 'origin', 'main']);

      console.log('✅ Auto-deployment completed');

    } catch (error) {
      console.error('❌ Auto-deployment failed:', error.message);
      // Don't throw - deployment failure shouldn't stop monitoring
    }
  }

  logStatus() {
    console.log('\n📊 Continuous Monitor Status:');
    console.log(`  🏃‍♂️ Running: ${this.isRunning ? 'Yes' : 'No'}`);
    console.log(`  🔢 Total runs: ${this.runCount}`);
    console.log(`  ⏰ Last run: ${this.lastRunTime || 'Never'}`);
    console.log(`  ⚠️  Recent errors: ${this.errors.length}`);
    console.log(`  ⏱️  Uptime: ${this.getUptime()}`);

    if (this.errors.length > 0) {
      console.log(`  🚨 Latest error: ${this.errors[this.errors.length - 1].error}`);
    }
  }

  getUptime() {
    if (!this.startTime) {
      this.startTime = Date.now();
    }

    const uptimeMs = Date.now() - this.startTime;
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  stop() {
    console.log('🛑 Stopping Continuous Monitor...');
    this.isRunning = false;
    process.exit(0);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new ContinuousMonitor();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down monitor...');
    monitor.stop();
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down monitor...');
    monitor.stop();
  });

  // Start the monitor
  monitor.start();
}