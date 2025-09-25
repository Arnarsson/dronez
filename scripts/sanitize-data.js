#!/usr/bin/env node

/**
 * Data Sanitization Script
 * Converts potentially misleading real-source attributions to clear demo labels
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INCIDENTS_FILE = path.join(__dirname, '../public/incidents.json');
const BACKUP_FILE = path.join(__dirname, '../public/incidents.backup.json');

function sanitizeIncidents() {
  console.log('🔍 Starting data sanitization...');

  // Create backup
  const originalData = fs.readFileSync(INCIDENTS_FILE, 'utf8');
  fs.writeFileSync(BACKUP_FILE, originalData);
  console.log('📋 Created backup at incidents.backup.json');

  const data = JSON.parse(originalData);

  // Add global disclaimer
  data.data_notice = "DEMONSTRATION DATA: All incidents are simulated for security research and system testing. No real events or sources are represented.";

  let sanitizedCount = 0;

  // Process each incident
  data.incidents = data.incidents.map(incident => {
    let wasSanitized = false;

    // Add demo prefix to ID if not already present
    if (!incident.id.startsWith('demo-')) {
      incident.id = 'demo-' + incident.id;
      wasSanitized = true;
    }

    // Mark as simulated data
    incident.data_type = 'simulated';

    // Add demo tags
    if (!incident.tags) incident.tags = [];
    if (!incident.tags.includes('demo-data')) {
      incident.tags.push('demo-data', 'simulation', 'testing');
      wasSanitized = true;
    }

    // Sanitize sources
    if (incident.evidence?.sources) {
      incident.evidence.sources = incident.evidence.sources.map(source => {
        if (!source.publisher.startsWith('Demo ') && !source.publisher.includes('Simulation')) {
          const originalPublisher = source.publisher;
          source.publisher = `Demo Source (${originalPublisher} Style)`;
          source.url = source.url.replace(/^https?:\/\/[^\/]+/, 'https://demo-sources.example.com');
          source.note = 'SIMULATED SOURCE - Not a real news report';
          wasSanitized = true;
        }
        return source;
      });
    }

    // Sanitize NOTAMs
    if (incident.evidence?.notam_navtex_ids) {
      incident.evidence.notam_navtex_ids = incident.evidence.notam_navtex_ids.map(notam => {
        if (!notam.startsWith('DEMO-')) {
          wasSanitized = true;
          return 'DEMO-' + notam;
        }
        return notam;
      });
    }

    // Update narrative to be clearly fictional
    if (incident.incident?.narrative && !incident.incident.narrative.includes('Simulated')) {
      incident.incident.narrative = `Simulated scenario: ${incident.incident.narrative}`;
      wasSanitized = true;
    }

    if (wasSanitized) sanitizedCount++;
    return incident;
  });

  // Write sanitized data
  fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(data, null, 2));

  console.log(`✅ Sanitization complete:`);
  console.log(`   - ${sanitizedCount} incidents sanitized`);
  console.log(`   - ${data.incidents.length} total incidents`);
  console.log(`   - All sources marked as demonstration data`);
  console.log(`   - Backup created at incidents.backup.json`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    sanitizeIncidents();
  } catch (error) {
    console.error('❌ Sanitization failed:', error.message);
    process.exit(1);
  }
}

export { sanitizeIncidents };