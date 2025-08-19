// SANDBOX_START: self-test helpers
import { supabase } from "@/integrations/supabase/client";
import { WEBHOOK_COMMENTS_FN } from "@/config/functions";
import type { TestContext } from "./types";

/**
 * Force provider override to 'sandbox' mode
 */
export const ensureSandbox = async (): Promise<void> => {
  // Use the same mechanism as Health page
  localStorage.setItem('providerOverride', 'sandbox');
  
  // Verify it was set
  const override = localStorage.getItem('providerOverride');
  if (override !== 'sandbox') {
    throw new Error('Failed to set sandbox provider override');
  }
};

/**
 * Create or find a sandbox post with automation enabled
 */
export const ensureSandboxPost = async (): Promise<{ ig_post_id: string }> => {
  // Look for existing sandbox post with automation enabled
  const { data: posts, error: queryError } = await supabase
    .from('posts')
    .select('*')
    .eq('automation_enabled', true)
    .limit(1);

  if (queryError) {
    throw new Error(`Failed to query posts: ${queryError.message}`);
  }

  if (posts && posts.length > 0) {
    return { ig_post_id: posts[0].ig_post_id };
  }

  // Create a new sandbox post
  const sandboxPostId = `sandbox-post-${Date.now()}`;
  const { data: newPost, error: insertError } = await supabase
    .from('posts')
    .insert({
      ig_post_id: sandboxPostId,
      caption: 'Test post for sandbox',
      automation_enabled: true,
      trigger_mode: 'exact_phrase',
      trigger_list: ['LINK'],
      typo_tolerance: false
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create sandbox post: ${insertError.message}`);
  }

  return { ig_post_id: newPost.ig_post_id };
};

/**
 * Query recent activity from events table
 */
export const getRecentActivity = async (minutes: number, types?: string[]): Promise<any[]> => {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  
  let query = supabase
    .from('events')
    .select('*')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });

  if (types && types.length > 0) {
    query = query.in('type', types);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to query recent activity: ${error.message}`);
  }

  return data || [];
};

/**
 * Invoke webhook-comments function with error handling
 */
export const invokeWebhook = async (args: { ig_post_id: string; comment_text: string }): Promise<{ ok: boolean; code?: string; message?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke(WEBHOOK_COMMENTS_FN, {
      body: {
        provider: 'sandbox',
        ig_post_id: args.ig_post_id,
        comment_text: args.comment_text
      }
    });

    if (error) {
      // Extract error details using the same logic as Health page
      const ctx = error?.context ?? error?.details ?? {};
      let body = ctx.body ?? ctx.response ?? ctx.data ?? null;
      if (typeof body === 'string') {
        try { 
          body = JSON.parse(body); 
        } catch { 
          // keep as text 
        }
      }

      return {
        ok: false,
        code: body?.code ?? ctx.code ?? 'UNKNOWN',
        message: body?.message ?? error?.message ?? 'invoke failed'
      };
    }

    return {
      ok: true,
      code: data?.code,
      message: data?.message
    };
  } catch (error: any) {
    return {
      ok: false,
      code: 'EXCEPTION',
      message: error?.message ?? 'Unknown error'
    };
  }
};

/**
 * Create a TestContext with logging and helpers
 */
export const createTestContext = (log: (m: string, extra?: any) => void): TestContext => {
  return {
    supabase,
    now: Date.now(),
    log,
    ensureSandbox,
    ensureSandboxPost,
    getRecentActivity,
    invokeWebhook
  };
};
// SANDBOX_END
