// SANDBOX_START: automatic breadcrumbs (client direct insert)
import { supabase } from '@/integrations/supabase/client';

type LogArgs = { 
  scope: string; 
  summary: string; 
  details?: any; 
  tags?: string[] 
};

export async function logBreadcrumb(args: LogArgs) {
  try {
    if (import.meta.env.PROD) return; // dev/preview only
    const { data } = await supabase.auth.getUser();
    const email = data?.user?.email;
    if (!email) return; // must be logged in

    const row = {
      author_email: email,
      scope: args.scope,
      summary: args.summary,
      details: args.details ?? null,
      tags: args.tags ?? null,
    };

    // Fire-and-forget: do not block, do not throw
    const insertPromise = supabase.from('dev_breadcrumbs').insert(row);
    void insertPromise.then(({ error }) => { 
      if (error) console.debug('devlog insert error', error); 
    });
  } catch {}
}
// SANDBOX_END