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
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error(`Authentication required: ${userError?.message || 'No user found'}`);
  }

  // Look for existing sandbox post with automation enabled for this user
  const { data: posts, error: queryError } = await supabase
    .from('posts')
    .select('*')
    .eq('automation_enabled', true)
    .eq('account_id', user.id)
    .limit(1);

  if (queryError) {
    throw new Error(`Failed to query posts: ${queryError.message}`);
  }

  if (posts && posts.length > 0) {
    return { ig_post_id: posts[0].ig_post_id };
  }

  // Create a new sandbox post with explicit triggers
  const sandboxPostId = `sandbox-post-${Date.now()}`;
  const { data: newPost, error: insertError } = await supabase
    .from('posts')
    .insert({
      account_id: user.id,
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

  // Log the stored trigger fields for verification
  console.log('Created sandbox post with triggers:', {
    trigger_mode: newPost.trigger_mode,
    trigger_list: newPost.trigger_list,
    typo_tolerance: newPost.typo_tolerance
  });

  // Verify we can read it back
  const { data: verifyPost, error: verifyError } = await supabase
    .from('posts')
    .select('ig_post_id')
    .eq('id', newPost.id)
    .single();

  if (verifyError || !verifyPost) {
    throw new Error(`Failed to verify sandbox post: ${verifyError?.message || 'Post not found'}`);
  }

  return { ig_post_id: newPost.ig_post_id };
};

/**
 * Query recent activity from events table
 */
export const getRecentActivity = async (minutes: number, types?: string[]): Promise<any[]> => {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error(`Authentication required: ${userError?.message || 'No user found'}`);
  }

  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  
  // Query events that belong to posts owned by the current user
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
 * Generic edge function invoker with error handling
 */
export const invokeEdge = async (fnName: string, body: any): Promise<{ ok: boolean; code?: string; message?: string; details?: any }> => {
  try {
    const { data, error } = await supabase.functions.invoke(fnName, { body });
    
    if (error) {
      // Try to extract meaningful error from Supabase error object
      const ctx = error?.context ?? error?.details ?? {};
      let payload = ctx.body ?? ctx.response ?? null;
      
      if (typeof payload === 'string') { 
        try { 
          payload = JSON.parse(payload); 
        } catch {} 
      }
      
      return { 
        ok: false, 
        code: payload?.code ?? 'HTTP_ERROR', 
        message: payload?.message ?? error.message ?? 'invoke failed', 
        details: { 
          status: ctx.status ?? null, 
          payload: payload ?? null,
          originalError: error
        } 
      };
    }
    
    // data is JSON from the function
    return { 
      ok: Boolean(data?.ok), 
      code: data?.code ?? null, 
      message: data?.message ?? null, 
      details: data ?? null 
    };
  } catch (e) {
    return { 
      ok: false, 
      code: 'NETWORK_ERROR', 
      message: String(e) 
    };
  }
};

/**
 * Invoke webhook-comments function with error handling
 */
export const invokeWebhook = async (args: { ig_post_id: string; comment_text: string; comment_id?: string; account_id?: string; provider?: string }): Promise<{ ok: boolean; code?: string; message?: string }> => {
  const result = await invokeEdge(WEBHOOK_COMMENTS_FN, {
    provider: args.provider || 'sandbox',
    ig_post_id: args.ig_post_id,
    comment_text: args.comment_text,
    comment_id: args.comment_id,
    account_id: args.account_id
  });
  
  return {
    ok: result.ok,
    code: result.code,
    message: result.message
  };
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
    invokeWebhook,
    invokeEdge
  };
};
// SANDBOX_END
