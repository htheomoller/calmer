import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendInstagramDM, sendInstagramDMSandbox } from "../utils/gupshup-client.ts";

// Normalization and matching utilities
function normalize(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s).split(/[^a-z0-9]+/).filter(Boolean);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function levenshtein1(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return true;
  
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  let differences = 0;
  let i = 0, j = 0;
  
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      i++;
      j++;
    } else {
      differences++;
      if (differences > 1) return false;
      
      if (shorter.length === longer.length) {
        i++;
        j++;
      } else {
        j++;
      }
    }
  }
  
  return differences + (longer.length - j) <= 1;
}

function matchesTriggers(
  commentText: string,
  triggerMode: string,
  triggerList: string[],
  typoTolerance: boolean
): { matched: boolean; matchedRule?: string } {
  const textStr = normalize(commentText);
  const commentTokens = tokens(commentText);
  
  // Filter and normalize triggers (min 2 chars, max 10 items)
  const list = triggerList
    .map(x => normalize(String(x)))
    .filter(x => x.length >= 2)
    .slice(0, 10);
    
  if (list.length === 0) {
    return { matched: false };
  }
  
  // Helper functions for presence checking
  function presentExactPhrase(phrase: string): boolean {
    if (!phrase) return false;
    const re = new RegExp(`(^|\\W)${escapeRegex(phrase)}(\\W|$)`, 'i');
    return re.test(textStr);
  }
  
  function presentWord(word: string): boolean {
    const ts = tokens(commentText);
    return ts.some(t => t === word || (typoTolerance && levenshtein1(t, word)));
  }
  
  let matched = false;
  let matched_rule: string | undefined;
  
  if (triggerMode === 'exact_phrase') {
    matched = list.some(p => presentExactPhrase(p) || (typoTolerance && commentTokens.some(t => levenshtein1(t, p))));
    if (matched) matched_rule = 'exact_phrase';
  } else if (triggerMode === 'any_keywords') {
    matched = list.some(w => presentWord(w));
    if (matched) matched_rule = 'any_keywords';
  } else { // 'all_words'
    matched = list.length > 0 && list.every(w => presentWord(w));
    if (matched) matched_rule = 'all_words';
  }
  
  return { matched, matchedRule: matched_rule };
}

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
  comment_id?: string;
  account_id?: string;
  provider?: string;
  debug?: boolean;
}

// --- MVP safety guards (best-effort, non-persistent) ---
const processedIds = new Set<string>();
const accountHits = new Map<string, number[]>();

function allowRequestForAccount(accountId: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const arr = accountHits.get(accountId) ?? [];
  const recent = arr.filter(t => now - t < windowMs);
  if (recent.length >= limit) return false;
  accountHits.set(accountId, [...recent, now]);
  return true;
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
    const body = await req.json().catch(() => ({}));
    const comment_id: string = body?.comment_id || '';
    
    // DUPLICATE CHECK FIRST (before any other branching)
    if (comment_id && processedIds.has(comment_id)) {
      return new Response(JSON.stringify({ ok: true, code: 'DUPLICATE_IGNORED' }), { status: 200, headers: cors(req.headers.get('Origin')) });
    }
    // Register the id immediately so a second call is recognized as duplicate
    if (comment_id) processedIds.add(comment_id);
    
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

    // TODO: Validate Gupshup webhook signature once key is configured.
    // if (!isValidSignature(req, rawBody, Deno.env.get('GUPSHUP_WEBHOOK_SECRET'))) {
    //   return new Response(JSON.stringify({ ok: false, code: 'INVALID_SIGNATURE' }), { status: 401, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
    // }

    // Validate required fields
    const provider = body?.provider;
    const comment_text = body?.comment_text ?? '';
    const account_id = body?.account_id;
    const ig_post_id = body?.ig_post_id;

    // Per-account rate limiting
    if (account_id && !allowRequestForAccount(account_id)) {
      return new Response(JSON.stringify({ ok: false, code: 'RATE_LIMITED' }), { 
        status: 429, 
        headers: { 'Content-Type': 'application/json', ...cors(origin) }
      });
    }

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
          dm_template,
          default_trigger_mode,
          default_trigger_list,
          default_typo_tolerance
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
    const account = post.accounts;
    let autoEnabled = false;

    // Compute triggers robustly with safe fallbacks
    const postMode = post.trigger_mode ?? account?.default_trigger_mode ?? 'exact_phrase';
    const postList = Array.isArray(post.trigger_list) && post.trigger_list.length > 0
        ? post.trigger_list
        : (Array.isArray(account?.default_trigger_list) && account.default_trigger_list.length > 0
            ? account.default_trigger_list
            : ['LINK']);
    const typo = typeof post.typo_tolerance === 'boolean'
        ? post.typo_tolerance
        : !!account?.default_typo_tolerance;

    // Add precise diagnostics
    console.log('match:config', { mode: postMode, list: postList, typo });
    console.log('match:input', { comment_text: normalize(comment_text) });

    // Perform trigger matching
    const matchResult = matchesTriggers(comment_text, postMode, postList, typo);
    
    console.log('match:result', { matched: matchResult.matched, matched_rule: matchResult.matchedRule });

    if (!matchResult.matched) {
      // No match - log activity and return NO_MATCH
      const eventType = provider === 'sandbox' ? 'sandbox_no_match' : 'no_match';
      await client.from('events').insert({
        type: eventType,
        ig_user: `test_user_${Date.now()}`,
        ig_post_id,
        comment_text: normalize(comment_text),
        matched: false,
        sent_dm: false
      });

      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'NO_MATCH',
        message: 'Comment does not include the trigger',
        details: { 
          mode: postMode, 
          triggers: postList,
          typo_tolerance: typo
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
      });
    }

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
        autoEnabled,
        mode: postMode,
        triggers: postList,
        typo_tolerance: typo,
        matchedRule: matchResult.matchedRule
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