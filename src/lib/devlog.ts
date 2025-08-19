// SANDBOX_START: automatic breadcrumbs (client direct insert)
import { supabase } from '@/integrations/supabase/client';

type LogArgs = {
  scope: string;           // e.g., 'sandbox','waitlist','routing','selftest'
  summary: string;         // short line
  details?: any;           // any JSON or string
  tags?: string[];         // optional labels
};

export async function logBreadcrumb(args: LogArgs) {
  try {
    if (import.meta.env.PROD) return; // dev only
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return; // must be logged in

    const row = {
      author_email: user.email,
      scope: args.scope,
      summary: args.summary,
      details: args.details ?? null,
      tags: args.tags ?? null,
    };

    // fire-and-forget: don't block UI, swallow errors
    const { error } = await supabase.from("dev_breadcrumbs").insert(row);
    if (error) console.debug("devlog insert error", error);
    else console.debug("devlog:ok");
  } catch {}
}
// SANDBOX_END