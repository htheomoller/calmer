// SANDBOX_START: automatic breadcrumbs (client)
import { supabase } from '@/integrations/supabase/client';

type LogArgs = {
  scope: string;           // e.g., 'sandbox','waitlist','routing','selftest'
  summary: string;         // short line
  details?: any;           // any JSON or string
  tags?: string[];         // optional labels
};

const isDev = !import.meta.env.PROD;

export async function logBreadcrumb(args: LogArgs) {
  try {
    if (!isDev) return; // dev/preview only
    
    // No toasts, no blocking: fire and forget style with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 2500)
    );
    
    const invokePromise = supabase.functions.invoke('dev-breadcrumbs', {
      body: { action: 'add', ...args },
    });
    
    const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;
    
    // swallow errors silently; console only
    if (error) console.debug('devlog:invoke error', error);
    else console.debug('devlog:ok', data?.id);
  } catch (e) {
    console.debug('devlog:fail', e);
  }
}
// SANDBOX_END