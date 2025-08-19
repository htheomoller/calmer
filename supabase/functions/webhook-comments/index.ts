import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendInstagramDM, sendInstagramDMSandbox } from "../utils/gupshup-client.ts";

export const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin ?? '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  'Vary': 'Origin'
});

interface CommentWebhookPayload {
  ig_post_id: string;
  ig_user?: string;
  comment_text: string;
  provider?: string;
  debug?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('webhook-comments:start', { 
    method: req.method, 
    origin: req.headers.get('Origin') 
  });
  
  const origin = req.headers.get('Origin');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: cors(origin) 
    });
  }

  try {
    // Parse JSON safely
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    
    console.log('webhook-comments:input', { 
      hasBody: !!body, 
      keys: body ? Object.keys(body) : [] 
    });

    // SANDBOX_START - Debug switch for testing
    if (body?.debug === true) {
      return new Response(JSON.stringify({ 
        ok: true, 
        code: 'ECHO', 
        message: 'echo', 
        details: { received: body } 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
      });
    }
    // SANDBOX_END

    // Validate required fields
    const provider = body?.provider;
    const ig_post_id = body?.ig_post_id;
    const comment_text = body?.comment_text ?? 'LINK';

    if (!ig_post_id) {
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'MISSING_FIELDS', 
        message: 'ig_post_id required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
      });
    }

    // Use service-role client so RLS doesn't hide posts
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Lookup by the exact column used in Posts list (no mismatched names)
    const { data: posts, error: postErr } = await client
      .from('posts')
      .select(`
        *,
        accounts (
          default_link,
          reply_to_comments,
          comment_limit,
          dm_template
        )
      `)
      .eq('ig_post_id', ig_post_id)
      .limit(1);

    console.log('webhook-comments:db', {
      err: postErr?.message ?? null,
      found: posts?.length ?? 0,
      ig_post_id
    });

    if (postErr) {
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'DB_ERROR', 
        message: postErr.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
      });
    }
    
    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'POST_NOT_FOUND',
        message: 'No post for ig_post_id'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
      });
    }

    const post = posts[0];
    let autoEnabled = false;

    // Automation handling
    if (post.automation_enabled !== true) {
      if (provider === 'sandbox') {
        const { error: updErr } = await client
          .from('posts')
          .update({ automation_enabled: true })
          .eq('ig_post_id', ig_post_id);
        console.log('webhook-comments:auto_enable', { ok: !updErr, updErr: updErr?.message });
        autoEnabled = true;
        // Continue even if update failed; we still respond with a clear message
      } else {
        return new Response(JSON.stringify({ 
          ok: false, 
          code: 'AUTOMATION_DISABLED',
          message: 'Enable automation for this post'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...cors(origin) },
        });
      }
    }

    const account = post.accounts;
    if (!account) {
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found for post'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
      });
    }

    // Resolve link: prefer post.link, else default from settings
    const link = post.link ?? account.default_link;
    if (!link) {
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'NO_LINK_AVAILABLE',
        message: 'Add a link in Settings or Post'
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
      });
    }

    // (Sandbox) Log the DM payload to Activity; do not send
    const ig_user = `test_user_${Date.now()}`;
    await client.from('events').insert({
      type: 'sandbox_dm',
      ig_user,
      ig_post_id,
      comment_text,
      matched: true,
      sent_dm: true
    });

    return new Response(JSON.stringify({ 
      ok: true, 
      code: 'SANDBOX_DM_LOGGED', 
      message: autoEnabled ? 'Automation was off; enabled and simulated' : 'Sandbox DM generated (logged)',
      details: {
        link,
        autoEnabled
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors(origin) },
    });

  } catch (e) {
    console.log('webhook-comments:catch', { error: String(e) });
    return new Response(JSON.stringify({ 
      ok: false, 
      code: 'UNEXPECTED', 
      message: String(e) 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors(origin) },
    });
  }
};

serve(handler);