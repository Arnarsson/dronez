import cron from 'node-cron';
import { IncidentGenerator } from './incident-generator.js';
import { QualityController } from './quality-controller.js';
import { CONFIG } from './config.js';

export class AutomationScheduler {
  constructor() {
    this.generator = new IncidentGenerator();
    this.qualityController = new QualityController();
    this.isRunning = false;
    this.lastUpdate = null;
    this.statistics = {
      runs: 0,
      incidents_generated: 0,
      incidents_approved: 0,
      last_error: null
    };
  }

  start() {
    console.log('Starting automated drone incident collection system...');

    // Main collection job - every 6 hours
    cron.schedule(CONFIG.processing.updateFrequency, async () => {
      await this.runIncidentCollection();
    });

    // Quality check job - daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.runQualityCheck();
    });

    // Statistics report job - daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      await this.generateReport();
    });

    // Cleanup job - weekly on Sunday at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      await this.runCleanup();
    });

    console.log('Automated schedules activated:');
    console.log('- Incident collection: Every 6 hours');
    console.log('- Quality checks: Daily at 2 AM');
    console.log('- Statistics reports: Daily at 9 AM');
    console.log('- Cleanup: Weekly on Sunday at 3 AM');

    // Run initial collection
    setTimeout(() => this.runIncidentCollection(), 5000);
  }

  async runIncidentCollection() {
    if (this.isRunning) {
      console.log('Collection already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log(`\n=== Starting incident collection cycle at ${new Date().toISOString()} ===`);

    try {
      const options = {
        daysBack: 7,
        maxIncidents: CONFIG.processing.maxIncidentsPerRun,
        targetDistribution: CONFIG.targetDistribution,
        enableRealData: true,
        supplementWithSimulated: true
      };

      // Generate new incidents
      const incidents = await this.generator.generateIncidents(options);
      this.statistics.incidents_generated += incidents.length;

      console.log(`Generated ${incidents.length} incidents`);

      // Quality control
      const approvedIncidents = await this.qualityController.reviewIncidents(incidents);
      this.statistics.incidents_approved += approvedIncidents.length;

      console.log(`Approved ${approvedIncidents.length} incidents after quality control`);

      // Save to production
      await this.deployIncidents(approvedIncidents);

      this.statistics.runs++;
      this.lastUpdate = new Date();

      console.log('=== Collection cycle completed successfully ===\n');

    } catch (error) {
      console.error('Collection cycle failed:', error);
      this.statistics.last_error = {
        message: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isRunning = false;
    }
  }

  async runQualityCheck() {
    console.log('\n=== Running daily quality check ===');

    try {
      // Load current production data
      const fs = await import('fs/promises');
      const currentData = JSON.parse(await fs.readFile('/root/repo/public/incidents.json', 'utf-8'));

      // Run quality analysis
      const qualityReport = await this.qualityController.auditDataset(currentData);

      console.log('Quality Report:', qualityReport);

      // Auto-fix issues if possible
      if (qualityReport.issues.length > 0) {
        const fixedData = await this.qualityController.autoFixIssues(currentData, qualityReport.issues);
        if (fixedData.length !== currentData.length) {
          await this.deployIncidents(fixedData, 'quality-fix');
          console.log(`Auto-fixed ${qualityReport.issues.length} issues`);
        }
      }

    } catch (error) {
      console.error('Quality check failed:', error);
    }

    console.log('=== Quality check completed ===\n');
  }

  async generateReport() {
    console.log('\n=== Generating daily statistics report ===');

    try {
      const report = {
        timestamp: new Date().toISOString(),
        system_statistics: this.statistics,
        data_statistics: await this.analyzeCurrentData(),
        system_health: await this.checkSystemHealth()
      };

      // Save report
      const fs = await import('fs/promises');
      const reportsDir = '/root/repo/automation/reports';
      await fs.mkdir(reportsDir, { recursive: true });

      const reportFile = `${reportsDir}/daily-report-${new Date().toISOString().split('T')[0]}.json`;
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

      console.log('Daily report generated:', reportFile);
      console.log('Summary:', {
        total_runs: report.system_statistics.runs,
        incidents_in_production: report.data_statistics.total_incidents,
        system_health: report.system_health.status
      });

    } catch (error) {
      console.error('Report generation failed:', error);
    }

    console.log('=== Report generation completed ===\n');
  }

  async runCleanup() {
    console.log('\n=== Running weekly cleanup ===');

    try {
      // Clean old incidents (older than max age)
      const fs = await import('fs/promises');
      const currentData = JSON.parse(await fs.readFile('/root/repo/public/incidents.json', 'utf-8'));

      const maxAge = CONFIG.processing.maxAge * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(Date.now() - maxAge);

      const cleanedData = currentData.filter(incident =>
        new Date(incident.first_seen_utc) > cutoffDate
      );

      if (cleanedData.length !== currentData.length) {
        await this.deployIncidents(cleanedData, 'cleanup');
        console.log(`Removed ${currentData.length - cleanedData.length} old incidents`);
      }

      // Clean old reports (keep last 30 days)
      const reportsDir = '/root/repo/automation/reports';
      try {
        const files = await fs.readdir(reportsDir);
        const reportFiles = files.filter(f => f.startsWith('daily-report-'));

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        for (const file of reportFiles) {
          const dateMatch = file.match(/daily-report-(\d{4}-\d{2}-\d{2})\.json/);
          if (dateMatch) {
            const fileDate = new Date(dateMatch[1]);
            if (fileDate < thirtyDaysAgo) {
              await fs.unlink(`${reportsDir}/${file}`);
              console.log(`Cleaned old report: ${file}`);
            }
          }
        }
      } catch (error) {
        console.log('No reports directory or files to clean');
      }

    } catch (error) {
      console.error('Cleanup failed:', error);
    }

    console.log('=== Cleanup completed ===\n');
  }

  async deployIncidents(incidents, reason = 'scheduled-update') {
    try {
      // Save to incidents.json
      await this.generator.saveIncidents(incidents);

      // Copy to dist for production
      const fs = await import('fs/promises');
      await fs.copyFile('/root/repo/public/incidents.json', '/root/repo/dist/incidents.json');

      // Auto-commit and deploy if enabled
      if (process.env.AUTO_DEPLOY === 'true') {
        await this.autoCommitAndDeploy(incidents.length, reason);
      } else {
        console.log('Auto-deployment disabled. Manual commit required.');
      }

    } catch (error) {
      console.error('Deployment failed:', error);
      throw error;
    }
  }

  async autoCommitAndDeploy(incidentCount, reason) {
    try {
      const { execSync } = await import('child_process');

      // Build project
      execSync('npm run build', { cwd: '/root/repo' });

      // Git operations
      execSync('git add -A', { cwd: '/root/repo' });

      const commitMessage = `feat: automated incident update - ${incidentCount} incidents (${reason})

Evidence distribution maintained with comprehensive European coverage.
Generated via automated collection system.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

      execSync(`git commit -m "${commitMessage}"`, { cwd: '/root/repo' });
      execSync('git push origin main', { cwd: '/root/repo' });

      console.log(`Auto-deployed ${incidentCount} incidents to production`);

    } catch (error) {
      console.error('Auto-deployment failed:', error);
      // Don't throw - deployment failure shouldn't stop the collection process
    }
  }

  async analyzeCurrentData() {
    try {
      const fs = await import('fs/promises');
      const data = JSON.parse(await fs.readFile('/root/repo/public/incidents.json', 'utf-8'));

      const analysis = {
        total_incidents: data.length,
        evidence_distribution: {},
        country_distribution: {},
        asset_distribution: {},
        age_distribution: {
          last_24h: 0,
          last_week: 0,
          older: 0
        }
      };

      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const week = 7 * day;

      data.forEach(incident => {
        // Evidence distribution
        const evidence = incident.evidence?.strength || 0;
        analysis.evidence_distribution[evidence] = (analysis.evidence_distribution[evidence] || 0) + 1;

        // Country distribution
        const country = incident.location?.country || 'unknown';
        analysis.country_distribution[country] = (analysis.country_distribution[country] || 0) + 1;

        // Asset distribution
        const assetType = incident.asset?.type || 'unknown';
        analysis.asset_distribution[assetType] = (analysis.asset_distribution[assetType] || 0) + 1;

        // Age distribution
        const incidentTime = new Date(incident.first_seen_utc).getTime();
        const age = now - incidentTime;

        if (age < day) {
          analysis.age_distribution.last_24h++;
        } else if (age < week) {
          analysis.age_distribution.last_week++;
        } else {
          analysis.age_distribution.older++;
        }
      });

      return analysis;

    } catch (error) {
      return { error: error.message };
    }
  }

  async checkSystemHealth() {
    const health = {
      status: 'healthy',
      issues: [],
      last_successful_run: this.lastUpdate,
      next_scheduled_run: this.getNextScheduledRun()
    };

    // Check if last run was too long ago
    if (this.lastUpdate && (Date.now() - this.lastUpdate.getTime()) > 8 * 60 * 60 * 1000) {
      health.status = 'warning';
      health.issues.push('Last successful run was more than 8 hours ago');
    }

    // Check if there have been recent errors
    if (this.statistics.last_error &&
        (Date.now() - new Date(this.statistics.last_error.timestamp).getTime()) < 24 * 60 * 60 * 1000) {
      health.status = 'warning';
      health.issues.push(`Recent error: ${this.statistics.last_error.message}`);
    }

    // Check data file accessibility
    try {
      const fs = await import('fs/promises');
      await fs.access('/root/repo/public/incidents.json');
    } catch (error) {
      health.status = 'error';
      health.issues.push('Cannot access incidents.json file');
    }

    return health;
  }

  getNextScheduledRun() {
    // Calculate next run based on cron schedule (every 6 hours)
    const now = new Date();
    const nextHour = Math.ceil(now.getHours() / 6) * 6;
    const next = new Date(now);
    next.setHours(nextHour, 0, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
    }

    return next;
  }

  getStatus() {
    return {
      running: this.isRunning,
      last_update: this.lastUpdate,
      statistics: this.statistics,
      next_run: this.getNextScheduledRun()
    };
  }

  async runManual(options = {}) {
    console.log('Running manual incident collection...');
    await this.runIncidentCollection();
    return this.getStatus();
  }
}