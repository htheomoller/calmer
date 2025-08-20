#!/usr/bin/env tsx

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import { UsageStats } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');

// Ensure artifacts directories
await fs.mkdir(path.resolve(PROJECT_ROOT, 'tmp/audit'), { recursive: true });
await fs.mkdir(path.resolve(PROJECT_ROOT, 'docs/cleanup'), { recursive: true });
await fs.mkdir(path.resolve(PROJECT_ROOT, 'docs/cleanup/sql'), { recursive: true }).catch(() => {});

const OUTPUT_DIR = path.join(PROJECT_ROOT, 'tmp/audit');

function ensureDir(dir: string) {
  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true });
  }
}

async function queryUsage(): Promise<UsageStats[]> {
  try {
    // Only attempt DB queries if we have a service role key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.debug('⚠️ No service key available, skipping usage queries');
      return [];
    }

    // Dynamic import to avoid issues in environments without supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      serviceKey
    );

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Query events for sandbox activity
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('type, created_at')
      .gte('created_at', fourteenDaysAgo.toISOString());

    if (eventsError) {
      console.debug('⚠️ Error querying events:', eventsError.message);
      return [];
    }

    // Query dev_breadcrumbs for development activity
    const { data: breadcrumbs, error: breadcrumbsError } = await supabase
      .from('dev_breadcrumbs')
      .select('scope, created_at')
      .gte('created_at', fourteenDaysAgo.toISOString());

    if (breadcrumbsError) {
      console.debug('⚠️ Error querying breadcrumbs:', breadcrumbsError.message);
    }

    // Process sandbox events
    const sandboxEvents = (events || []).filter(e => 
      e.type?.startsWith('sandbox_') || e.type?.includes('waitlist')
    );

    const sandboxCounts: Record<string, number> = {};
    let lastSandboxActivity: string | null = null;

    sandboxEvents.forEach(event => {
      sandboxCounts[event.type] = (sandboxCounts[event.type] || 0) + 1;
      if (!lastSandboxActivity || event.created_at > lastSandboxActivity) {
        lastSandboxActivity = event.created_at;
      }
    });

    // Process waitlist events
    const waitlistEvents = (events || []).filter(e => 
      e.type?.includes('waitlist') || e.type?.includes('SUBSCRIBED')
    );

    const waitlistCounts: Record<string, number> = {};
    let lastWaitlistActivity: string | null = null;

    waitlistEvents.forEach(event => {
      waitlistCounts[event.type] = (waitlistCounts[event.type] || 0) + 1;
      if (!lastWaitlistActivity || event.created_at > lastWaitlistActivity) {
        lastWaitlistActivity = event.created_at;
      }
    });

    // Process dev breadcrumbs by scope
    const breadcrumbScopes: Record<string, number> = {};
    let lastDevActivity: string | null = null;

    (breadcrumbs || []).forEach(bc => {
      breadcrumbScopes[bc.scope] = (breadcrumbScopes[bc.scope] || 0) + 1;
      if (!lastDevActivity || bc.created_at > lastDevActivity) {
        lastDevActivity = bc.created_at;
      }
    });

    return [
      {
        feature: 'sandbox',
        period_days: 14,
        event_counts: sandboxCounts,
        last_activity: lastSandboxActivity
      },
      {
        feature: 'waitlist',
        period_days: 14,
        event_counts: waitlistCounts,
        last_activity: lastWaitlistActivity
      },
      {
        feature: 'self-test',
        period_days: 14,
        event_counts: breadcrumbScopes,
        last_activity: lastDevActivity
      }
    ];

  } catch (error) {
    console.debug('⚠️ Error in usage analysis:', error);
    return [];
  }
}

async function main() {
  console.debug('📊 Analyzing usage patterns...');
  
  ensureDir(OUTPUT_DIR);
  
  const usage = await queryUsage();
  
  fsSync.writeFileSync(
    path.join(OUTPUT_DIR, 'usage.json'),
    JSON.stringify(usage, null, 2)
  );
  
  console.debug(`✅ Usage analysis complete. Found data for ${usage.length} features.`);
  
  // Log summary
  usage.forEach(stat => {
    const totalEvents = Object.values(stat.event_counts).reduce((a, b) => a + b, 0);
    console.debug(`  ${stat.feature}: ${totalEvents} events, last activity: ${stat.last_activity || 'none'}`);
  });
}

await main().catch(err => { console.error("Audit failed:", err); process.exit(1) });

export { main as runUsage };