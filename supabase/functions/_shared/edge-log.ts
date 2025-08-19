// SANDBOX_START: automatic breadcrumbs (edge)
import { createClient } from 'jsr:@supabase/supabase-js@2';

export async function edgeLogBreadcrumb(args: {
  projectUrl?: string; // optional override
  serviceRoleKey?: string; // optional override
  scope: string;
  summary: string;
  details?: any;
  tags?: string[];
  author_email?: string; // default 'system@calmer'
}) {
  try {
    const url = args.projectUrl ?? Deno.env.get('SUPABASE_URL')!;
    const key = args.serviceRoleKey ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!url || !key) return;
    
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const row = {
      author_email: args.author_email ?? 'system@calmer',
      scope: args.scope,
      summary: args.summary,
      details: args.details ?? null,
      tags: args.tags ?? null,
    };
    
    await sb.from('dev_breadcrumbs').insert(row);
  } catch (_e) {
    // never throw from logger
  }
}
// SANDBOX_END