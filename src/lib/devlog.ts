import { createClient } from '@supabase/supabase-js';

type Breadcrumb = {
  scope: string;
  summary: string;
  details?: Record<string, any> | null;
  tags?: string[] | null;
  at?: string | null;
};

// DEV/Preview: write to dev_breadcrumbs
const supabaseUrl = 'https://upzjnifdcmevsdfmzwzw.supabase.co';
const supabaseAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwempuaWZkY21ldnNkZm16d3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjc5MDUsImV4cCI6MjA3MDYwMzkwNX0.s136RNSm8DfsE_qC_llnaQY2nmbwH0vxhYq84MypTg0';
const supabase = createClient(supabaseUrl, supabaseAnon);

export async function logBreadcrumb(b: Breadcrumb): Promise<{ok:boolean; error?:string}> {
  if (import.meta.env.PROD) return { ok: true };
  
  try {
    const row = {
      scope: b.scope,
      summary: b.summary,
      details: b.details ?? null,
      tags: b.tags ?? null,
      at: b.at ?? new Date().toISOString(),
    };
    const { error } = await supabase.from('dev_breadcrumbs').insert(row);
    if (error) {
      console.warn('[breadcrumb:insert:error]', error);
      return { ok: false, error: String(error.message || error) };
    }
    return { ok: true };
  } catch (err: any) {
    console.warn('[breadcrumb:insert:catch]', err);
    return { ok: false, error: String(err?.message || err) };
  }
}