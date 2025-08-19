#!/usr/bin/env ts-node

import { mkdirSync } from 'node:fs';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { FeatureManifest, AuditReport, UsageStats } from './types';

const ROOT_DIR = path.resolve(__dirname, '../..');
const MANIFEST_DIR = path.join(ROOT_DIR, 'docs/feature-manifest');
const AUDIT_DIR = path.join(ROOT_DIR, 'tmp/audit');
const CLEANUP_DIR = path.join(ROOT_DIR, 'docs/cleanup');
const CLEANUP_SQL_DIR = path.join(CLEANUP_DIR, 'sql');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadManifests(): FeatureManifest[] {
  const manifestFiles = fs.readdirSync(MANIFEST_DIR).filter(f => f.endsWith('.yaml'));
  return manifestFiles.map(file => {
    const content = fs.readFileSync(path.join(MANIFEST_DIR, file), 'utf8');
    return yaml.parse(content) as FeatureManifest;
  });
}

function loadAuditData(): { scan: AuditReport | null, usage: UsageStats[] } {
  let scan: AuditReport | null = null;
  let usage: UsageStats[] = [];

  try {
    const scanContent = fs.readFileSync(path.join(AUDIT_DIR, 'scan.json'), 'utf8');
    scan = JSON.parse(scanContent);
  } catch (e) {
    console.debug('⚠️ No scan.json found, generating plan without scan data');
  }

  try {
    const usageContent = fs.readFileSync(path.join(AUDIT_DIR, 'usage.json'), 'utf8');
    usage = JSON.parse(usageContent);
  } catch (e) {
    console.debug('⚠️ No usage.json found, generating plan without usage data');
  }

  return { scan, usage };
}

function analyzeFeatureReadiness(
  manifest: FeatureManifest, 
  usage: UsageStats | undefined
): { ready: boolean, reasons: string[] } {
  const reasons: string[] = [];
  
  // Check usage patterns
  if (usage) {
    const totalEvents = Object.values(usage.event_counts).reduce((a, b) => a + b, 0);
    const daysSinceActivity = usage.last_activity 
      ? Math.floor((Date.now() - new Date(usage.last_activity).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;
    
    if (totalEvents === 0) {
      reasons.push(`✅ No activity in last ${usage.period_days} days`);
    } else {
      reasons.push(`❌ ${totalEvents} events in last ${usage.period_days} days`);
    }
    
    if (daysSinceActivity > 7) {
      reasons.push(`✅ Last activity ${daysSinceActivity} days ago`);
    } else {
      reasons.push(`❌ Recent activity (${daysSinceActivity} days ago)`);
    }
  }
  
  // Core features should not be removed
  if (manifest.slug === 'routing-auth') {
    reasons.push('❌ Core authentication feature');
    return { ready: false, reasons };
  }
  
  // Check cleanup conditions from manifest
  const hasBlockingConditions = manifest.cleanup_ready_when.some(condition => 
    condition.toLowerCase().includes('todo') || 
    condition.toLowerCase().includes('unknown')
  );
  
  if (hasBlockingConditions) {
    reasons.push('❌ Cleanup conditions contain TODOs');
  }
  
  const ready = reasons.filter(r => r.startsWith('❌')).length === 0;
  return { ready, reasons };
}

function generateSQLCleanup(manifest: FeatureManifest): string {
  let sql = `-- Cleanup SQL for feature: ${manifest.name}\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- REVIEW CAREFULLY BEFORE EXECUTING\n\n`;
  
  // Drop dev-only tables
  const devTables = manifest.db.tables.filter(table => 
    table.includes('dev_') || table.includes('breadcrumb')
  );
  
  if (devTables.length > 0) {
    sql += `-- Drop dev-only tables\n`;
    devTables.forEach(table => {
      sql += `-- DROP TABLE IF EXISTS public.${table} CASCADE;\n`;
    });
    sql += `\n`;
  }
  
  // Drop policies
  if (manifest.db.policies.length > 0) {
    sql += `-- Drop RLS policies\n`;
    manifest.db.policies.forEach(policy => {
      if (policy.includes('dev_') || policy.includes('breadcrumb')) {
        sql += `-- DROP POLICY IF EXISTS "${policy}" ON public.${devTables[0] || 'table_name'};\n`;
      }
    });
    sql += `\n`;
  }
  
  sql += `-- NOTE: This file contains commented SQL for safety.\n`;
  sql += `-- Uncomment and review each statement before execution.\n`;
  
  return sql;
}

function generateCleanupPlan(
  manifests: FeatureManifest[], 
  scan: AuditReport | null, 
  usage: UsageStats[]
): string {
  let plan = `# Cleanup Plan\n\n`;
  plan += `Generated: ${new Date().toISOString()}\n\n`;
  plan += `This document provides a step-by-step plan for removing temporary features and development code.\n\n`;
  plan += `⚠️ **IMPORTANT**: This plan is for guidance only. Review each step carefully before execution.\n\n`;
  
  for (const manifest of manifests) {
    const featureUsage = usage.find(u => u.feature === manifest.slug);
    const readiness = analyzeFeatureReadiness(manifest, featureUsage);
    
    plan += `## ${manifest.name} (${manifest.slug})\n\n`;
    plan += `**Description**: ${manifest.description}\n\n`;
    
    plan += `### Readiness Assessment\n\n`;
    readiness.reasons.forEach(reason => {
      plan += `- ${reason}\n`;
    });
    plan += `\n`;
    
    if (readiness.ready) {
      plan += `### ✅ Cleanup Steps\n\n`;
    } else {
      plan += `### ⏳ Future Cleanup Steps (when ready)\n\n`;
    }
    
    let stepNum = 1;
    
    // Disable feature flags
    if (manifest.flags.length > 0) {
      plan += `${stepNum}. **Disable feature flags**\n`;
      manifest.flags.forEach(flag => {
        plan += `   - [ ] Remove or set \`${flag}\` to false\n`;
      });
      plan += `\n`;
      stepNum++;
    }
    
    // Remove routes
    if (manifest.routes.length > 0) {
      plan += `${stepNum}. **Remove routes from App.tsx**\n`;
      manifest.routes.forEach(route => {
        plan += `   - [ ] Remove route: \`${route}\`\n`;
      });
      plan += `\n`;
      stepNum++;
    }
    
    // Remove files with sandbox blocks
    const scanResult = scan?.features.find(f => f.feature === manifest.slug);
    if (scanResult && scanResult.sandbox_blocks > 0) {
      plan += `${stepNum}. **Remove sandbox code blocks**\n`;
      plan += `   - [ ] Remove ${scanResult.sandbox_blocks} \`// SANDBOX_START/END\` blocks\n`;
      plan += `   - [ ] Search for: \`SANDBOX_START\` in feature files\n`;
      plan += `\n`;
      stepNum++;
    }
    
    // Remove files
    if (manifest.files.length > 0) {
      plan += `${stepNum}. **Remove files**\n`;
      manifest.files.forEach(file => {
        if (file.includes('dev') || file.includes('sandbox') || file.includes('test')) {
          plan += `   - [ ] Delete: \`${file}\`\n`;
        } else {
          plan += `   - [ ] Review: \`${file}\` (may contain production code)\n`;
        }
      });
      plan += `\n`;
      stepNum++;
    }
    
    // Database cleanup
    if (manifest.db.tables.length > 0 || manifest.db.policies.length > 0) {
      plan += `${stepNum}. **Database cleanup**\n`;
      plan += `   - [ ] Review and execute SQL: \`docs/cleanup/sql/${manifest.slug}.sql\`\n`;
      plan += `   - [ ] Backup data if needed before dropping tables\n`;
      plan += `\n`;
      stepNum++;
    }
    
    // Remove edge functions
    if (manifest.edge_functions.length > 0) {
      plan += `${stepNum}. **Remove edge functions**\n`;
      manifest.edge_functions.forEach(func => {
        plan += `   - [ ] Delete: \`supabase/functions/${func}/\`\n`;
        plan += `   - [ ] Remove from \`supabase/config.toml\`\n`;
      });
      plan += `\n`;
      stepNum++;
    }
    
    plan += `### Verification Checklist\n\n`;
    plan += `- [ ] App builds without errors\n`;
    plan += `- [ ] All tests pass\n`;
    plan += `- [ ] No broken routes or dead links\n`;
    plan += `- [ ] Database queries work correctly\n`;
    plan += `- [ ] No console errors in production\n\n`;
    
    plan += `---\n\n`;
  }
  
  plan += `## Final Steps\n\n`;
  plan += `1. **Create cleanup PR**\n`;
  plan += `   - [ ] Create feature branch: \`cleanup/remove-temporary-features\`\n`;
  plan += `   - [ ] Implement changes step by step\n`;
  plan += `   - [ ] Test thoroughly in development\n`;
  plan += `   - [ ] Request code review\n\n`;
  
  plan += `2. **Monitor after deployment**\n`;
  plan += `   - [ ] Check error rates\n`;
  plan += `   - [ ] Verify core functionality\n`;
  plan += `   - [ ] Monitor for 24-48 hours\n\n`;
  
  return plan;
}

async function main() {
  console.debug('📋 Generating cleanup plan...');
  
  // Ensure directories exist before writing
  mkdirSync('tmp/audit', { recursive: true });
  mkdirSync('docs/cleanup', { recursive: true });
  mkdirSync('docs/cleanup/sql', { recursive: true });
  
  ensureDir(CLEANUP_DIR);
  ensureDir(CLEANUP_SQL_DIR);
  
  const manifests = loadManifests();
  const { scan, usage } = loadAuditData();
  
  // Generate SQL cleanup files
  for (const manifest of manifests) {
    const sql = generateSQLCleanup(manifest);
    fs.writeFileSync(
      path.join(CLEANUP_SQL_DIR, `${manifest.slug}.sql`),
      sql
    );
  }
  
  // Generate main cleanup plan
  const plan = generateCleanupPlan(manifests, scan, usage);
  fs.writeFileSync(
    path.join(CLEANUP_DIR, 'plan.md'),
    plan
  );
  
  console.debug(`✅ Cleanup plan generated`);
  console.debug(`📄 Plan: docs/cleanup/plan.md`);
  console.debug(`🗄️ SQL files: docs/cleanup/sql/`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { main as runPlan };