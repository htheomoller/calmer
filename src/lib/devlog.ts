import { createClient } from '@supabase/supabase-js';

type Breadcrumb = {
  scope: string;
  summary: string;
  details?: Record<string, unknown> | null;
  tags?: string[] | null;
  at?: string | null;
};

// DEV/Preview client (ANON) – safe for non-sensitive dev logs only
const supabaseUrl = 'https://upzjnifdcmevsdfmzwzw.supabase.co';
const supabaseAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwempuaWZkY21ldnNkZm16d3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjc5MDUsImV4cCI6MjA3MDYwMzkwNX0.s136RNSm8DfsE_qC_llnaQY2nmbwH0vxhYq84MypTg0';
const supabase = createClient(supabaseUrl, supabaseAnon);

export async function logBreadcrumb(b: Breadcrumb): Promise<{ ok: boolean; error?: string }> {
  // No-op in production to avoid leaking dev logs
  if (import.meta.env.PROD) return { ok: true };

  try {
    // Try to attach user_id + author_email when possible
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user || null;

    const row = {
      scope: b.scope,
      summary: b.summary,
      details: b.details ?? null,
      tags: b.tags ?? null,
      at: b.at ?? new Date().toISOString(),
      // Optional metadata — RLS can still require auth.uid() for INSERT
      user_id: user?.id ?? null,
      author_email: (user?.email as string | null) ?? null,
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