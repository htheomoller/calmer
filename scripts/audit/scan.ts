#!/usr/bin/env ts-node

import { mkdirSync } from 'node:fs';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import * as yaml from 'yaml';
import { FeatureManifest, ScanResult, AuditReport } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure artifact directories exist
mkdirSync('tmp/audit', { recursive: true });

const ROOT_DIR = path.resolve(__dirname, '../..');
const MANIFEST_DIR = path.join(ROOT_DIR, 'docs/feature-manifest');
const OUTPUT_DIR = path.join(ROOT_DIR, 'tmp/audit');

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

function findFiles(patterns: string[]): { found: string[], missing: string[] } {
  const found: string[] = [];
  const missing: string[] = [];
  
  for (const pattern of patterns) {
    const matches = glob.sync(pattern, { cwd: ROOT_DIR });
    if (matches.length > 0) {
      found.push(...matches.map(m => path.relative(ROOT_DIR, m)));
    } else {
      missing.push(pattern);
    }
  }
  
  return { found, missing };
}

function findFeatureTaggedFiles(): Record<string, string[]> {
  const featureFiles: Record<string, string[]> = {};
  const allFiles = glob.sync('src/**/*.{ts,tsx}', { cwd: ROOT_DIR });
  
  for (const file of allFiles) {
    const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
    const featureMatch = content.match(/^\/\/ FEATURE:(\w+)/m);
    if (featureMatch) {
      const feature = featureMatch[1];
      if (!featureFiles[feature]) featureFiles[feature] = [];
      featureFiles[feature].push(file);
    }
  }
  
  return featureFiles;
}

function countSandboxBlocks(filePaths: string[]): number {
  let count = 0;
  for (const file of filePaths) {
    try {
      const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
      const matches = content.match(/\/\/ SANDBOX_START/g);
      count += matches ? matches.length : 0;
    } catch (e) {
      // File not found or not readable
    }
  }
  return count;
}

function checkRoutes(routes: string[]): { found: string[], missing: string[] } {
  try {
    const appContent = fs.readFileSync(path.join(ROOT_DIR, 'src/App.tsx'), 'utf8');
    const found: string[] = [];
    const missing: string[] = [];
    
    for (const route of routes) {
      if (appContent.includes(`path="${route}"`) || appContent.includes(`path='${route}'`)) {
        found.push(route);
      } else {
        missing.push(route);
      }
    }
    
    return { found, missing };
  } catch (e) {
    return { found: [], missing: routes };
  }
}

function checkEdgeFunctions(functions: string[]): { found: string[], missing: string[] } {
  const found: string[] = [];
  const missing: string[] = [];
  
  for (const func of functions) {
    const funcPath = path.join(ROOT_DIR, 'supabase/functions', func, 'index.ts');
    if (fs.existsSync(funcPath)) {
      found.push(func);
    } else {
      missing.push(func);
    }
  }
  
  return { found, missing };
}

function scanFeature(manifest: FeatureManifest, taggedFiles: Record<string, string[]>): ScanResult {
  const fileCheck = findFiles(manifest.files);
  const routeCheck = checkRoutes(manifest.routes);
  const edgeFunctionCheck = checkEdgeFunctions(manifest.edge_functions);
  
  const manifestFiles = new Set(fileCheck.found);
  const taggedForFeature = taggedFiles[manifest.slug] || [];
  const extraFiles = taggedForFeature.filter(f => !manifestFiles.has(f));
  
  const allRelevantFiles = [...fileCheck.found, ...taggedForFeature];
  const sandboxBlocks = countSandboxBlocks(allRelevantFiles);
  
  return {
    feature: manifest.slug,
    listed_files_found: fileCheck.found,
    listed_files_missing: fileCheck.missing,
    extra_feature_files: extraFiles,
    routes_found: routeCheck.found,
    routes_missing: routeCheck.missing,
    edge_functions_found: edgeFunctionCheck.found,
    edge_functions_missing: edgeFunctionCheck.missing,
    sandbox_blocks: sandboxBlocks
  };
}

function generateMarkdownReport(report: AuditReport): string {
  let md = `# Audit Report\n\n`;
  md += `Generated: ${report.timestamp}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Features scanned:** ${report.summary.total_features}\n`;
  md += `- **Files with issues:** ${report.summary.files_with_issues}\n`;
  md += `- **Total sandbox blocks:** ${report.summary.sandbox_blocks_total}\n\n`;
  
  for (const result of report.features) {
    md += `## Feature: ${result.feature}\n\n`;
    
    if (result.listed_files_missing.length > 0) {
      md += `### ❌ Missing Files\n`;
      result.listed_files_missing.forEach(f => md += `- ${f}\n`);
      md += `\n`;
    }
    
    if (result.extra_feature_files.length > 0) {
      md += `### ⚠️ Extra Tagged Files\n`;
      result.extra_feature_files.forEach(f => md += `- ${f}\n`);
      md += `\n`;
    }
    
    if (result.routes_missing.length > 0) {
      md += `### 🔗 Missing Routes\n`;
      result.routes_missing.forEach(r => md += `- ${r}\n`);
      md += `\n`;
    }
    
    if (result.edge_functions_missing.length > 0) {
      md += `### ⚡ Missing Edge Functions\n`;
      result.edge_functions_missing.forEach(f => md += `- ${f}\n`);
      md += `\n`;
    }
    
    if (result.sandbox_blocks > 0) {
      md += `### 🏗️ Sandbox Blocks: ${result.sandbox_blocks}\n\n`;
    }
    
    md += `### ✅ Found\n`;
    md += `- **Files:** ${result.listed_files_found.length}\n`;
    md += `- **Routes:** ${result.routes_found.length}\n`;
    md += `- **Edge Functions:** ${result.edge_functions_found.length}\n\n`;
  }
  
  return md;
}

async function main() {
  console.debug('🔍 Starting audit scan...');
  
  // Ensure tmp/audit directory exists before writing
  mkdirSync('tmp/audit', { recursive: true });
  ensureDir(OUTPUT_DIR);
  
  const manifests = loadManifests();
  const taggedFiles = findFeatureTaggedFiles();
  
  console.debug(`Found ${manifests.length} feature manifests`);
  console.debug(`Found tagged files for features: ${Object.keys(taggedFiles).join(', ')}`);
  
  const results: ScanResult[] = [];
  let totalSandboxBlocks = 0;
  let filesWithIssues = 0;
  
  for (const manifest of manifests) {
    const result = scanFeature(manifest, taggedFiles);
    results.push(result);
    totalSandboxBlocks += result.sandbox_blocks;
    
    if (result.listed_files_missing.length > 0 || 
        result.extra_feature_files.length > 0 || 
        result.routes_missing.length > 0 || 
        result.edge_functions_missing.length > 0) {
      filesWithIssues++;
    }
  }
  
  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    features: results,
    usage: [], // Will be filled by usage.ts
    summary: {
      total_features: manifests.length,
      files_with_issues: filesWithIssues,
      sandbox_blocks_total: totalSandboxBlocks
    }
  };
  
  // Write JSON report
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'scan.json'),
    JSON.stringify(report, null, 2)
  );
  
  // Write Markdown report
  const markdown = generateMarkdownReport(report);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'report.md'),
    markdown
  );
  
  console.debug(`✅ Scan complete. Found ${totalSandboxBlocks} sandbox blocks across ${manifests.length} features.`);
  console.debug(`📄 Reports written to tmp/audit/`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { main as runScan };