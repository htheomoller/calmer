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
export const ensureSandboxPost = async (): Promise<{ ig_post_id: string; account_id: string }> => {
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
    return { ig_post_id: posts[0].ig_post_id, account_id: posts[0].account_id };
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

  return { ig_post_id: newPost.ig_post_id, account_id: newPost.account_id };
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
export const invokeEdge = async (fnName: string, body: any): Promise<{ ok: boolean; code?: string; message?: string; status?: number; details?: any }> => {
  try {
    const { data, error } = await supabase.functions.invoke(fnName, { body });
    
    if (error) {
      // Try multiple extraction methods for the response body
      const ctx = error?.context ?? error?.details ?? {};
      let payload = null;
      let status = null;
      
      // Method 1: Direct response extraction
      if (ctx.response) {
        payload = ctx.response;
        status = ctx.status;
      }
      
      // Method 2: Body field extraction  
      if (!payload && ctx.body) {
        payload = ctx.body;
        status = ctx.status;
      }
      
      // Method 3: Parse error message if it contains JSON
      if (!payload && error.message) {
        try {
          // Sometimes the error message contains the full response
          if (error.message.includes('{') && error.message.includes('}')) {
            const jsonMatch = error.message.match(/\{[^}]*\}/);
            if (jsonMatch) {
              payload = JSON.parse(jsonMatch[0]);
            }
          }
        } catch {}
      }
      
      // Handle string JSON responses (common with 4xx/5xx responses)
      if (typeof payload === 'string') { 
        try { 
          payload = JSON.parse(payload); 
        } catch {} 
      }
      
      // Extract status code with multiple fallbacks
      if (!status) {
        status = ctx.status ?? ctx.response_status ?? 
                (error.message?.includes('429') ? 429 : 
                 error.message?.includes('404') ? 404 :
                 error.message?.includes('400') ? 400 : null);
      }
      
      // Temporary debug logging to see what we're getting
      console.log('invokeEdge error parsing:', {
        hasContext: !!ctx,
        hasResponse: !!ctx.response, 
        hasBody: !!ctx.body,
        status,
        payload,
        originalMessage: error.message
      });
      
      // Return the actual server response code when available, especially for rate limits
      return { 
        ok: false, 
        status: status,
        code: payload?.code ?? 'HTTP_ERROR', 
        message: payload?.message ?? error.message ?? 'invoke failed', 
        details: { 
          status: status, 
          payload: payload ?? null,
          originalError: error
        } 
      };
    }
    
    // data is JSON from the function - return as-is even if ok:false
    return { 
      ok: Boolean(data?.ok), 
      status: 200,
      code: data?.code ?? null, 
      message: data?.message ?? null, 
      details: data ?? null 
    };
  } catch (e) {
    return { 
      ok: false, 
      status: 0,
      code: 'NETWORK_ERROR', 
      message: String(e) 
    };
  }
};

/**
 * Invoke webhook-comments function with direct fetch to properly handle 429 responses
 */
export const invokeWebhook = async (args: { ig_post_id: string; comment_text: string; comment_id?: string; account_id?: string; provider?: string }): Promise<{ ok: boolean; code?: string; message?: string; status?: number }> => {
  try {
    // Use direct fetch instead of supabase.functions.invoke to properly handle 429 responses
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch(`https://upzjnifdcmevsdfmzwzw.supabase.co/functions/v1/${WEBHOOK_COMMENTS_FN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwempuaWZkY21ldnNkZm16d3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjc5MDUsImV4cCI6MjA3MDYwMzkwNX0.s136RNSm8DfsE_qC_llnaQY2nmbwH0vxhYq84MypTg0'
      },
      body: JSON.stringify({
        provider: args.provider || 'sandbox',
        ig_post_id: args.ig_post_id,
        comment_text: args.comment_text,
        comment_id: args.comment_id,
        account_id: args.account_id
      })
    });

    let responseBody: any = {};
    try {
      const text = await response.text();
      responseBody = text ? JSON.parse(text) : {};
    } catch {
      responseBody = { message: 'Failed to parse response body' };
    }

    return {
      ok: response.ok,
      status: response.status,
      code: responseBody.code || (response.ok ? 'SUCCESS' : 'HTTP_ERROR'),
      message: responseBody.message || `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      code: 'NETWORK_ERROR',
      message: String(error)
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
    invokeWebhook,
    invokeEdge
  };
};
// SANDBOX_END
