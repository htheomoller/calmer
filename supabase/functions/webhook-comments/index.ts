import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendInstagramDM, sendInstagramDMSandbox } from "../utils/gupshup-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommentWebhookPayload {
  ig_post_id: string;
  ig_user: string;
  comment_text: string;
  created_at?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ig_post_id, ig_user, comment_text, created_at, provider }: CommentWebhookPayload & { provider?: string } = await req.json();

    console.log("simulate:input", { ig_post_id, provider, ig_user, comment_text });

    // Initialize Supabase client with service role for RLS bypass
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    console.log("simulate:using_service_role = true");

    // Look up the post with provider filter if provided
    let query = supabaseClient
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
      .eq('ig_post_id', ig_post_id);
    
    if (provider) {
      query = query.eq('provider', provider);
    }
    
    const { data: post, error: postError } = await query.maybeSingle();

    if (postError) {
      console.error("Error fetching post:", postError);
      throw postError;
    }

    console.log("simulate:db", { 
      found: post ? 1 : 0, 
      id: post?.ig_post_id, 
      automation_enabled: post?.automation_enabled, 
      provider: post?.provider 
    });

    // Log simulation attempt
    await supabaseClient.from('events').insert({
      type: 'sandbox_simulate_attempt',
      ig_user,
      ig_post_id,
      comment_text: `Attempt with provider: ${provider || 'none'}`
    });

    let foundPost = post;
    let autoEnabled = false;

    // Auto-recovery for sandbox posts
    if (!foundPost && provider === 'sandbox') {
      console.log("simulate:trying_without_provider_filter");
      const { data: fallbackPost } = await supabaseClient
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
        .maybeSingle();
      
      if (fallbackPost) {
        console.log("simulate:provider_mismatch");
        foundPost = fallbackPost;
      }
    }

    if (!foundPost) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "No sandbox post with this id" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Auto-enable automation for sandbox posts
    if (!foundPost.automation_enabled && provider === 'sandbox') {
      console.log("simulate:auto_enabled");
      await supabaseClient
        .from('posts')
        .update({ automation_enabled: true })
        .eq('id', foundPost.id);
      
      foundPost.automation_enabled = true;
      autoEnabled = true;
    } else if (!foundPost.automation_enabled) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Automation disabled for this post" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const account = foundPost.accounts;
    if (!account) {
      throw new Error("Account not found for post");
    }

    // Determine final link
    const finalLink = foundPost.link || account.default_link;
    if (!finalLink) {
      console.log("No link available for post:", ig_post_id);
      await supabaseClient.from('events').insert({
        type: 'no_link',
        ig_user,
        ig_post_id,
        comment_text,
        matched: false,
        sent_dm: false
      });

      return new Response(JSON.stringify({ 
        success: false, 
        message: "No link configured" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if comment matches code
    let matched = false;
    if (foundPost.code) {
      matched = comment_text.toLowerCase().includes(foundPost.code.toLowerCase());
    }

    if (!matched) {
      console.log("Comment doesn't match code:", { comment_text, code: foundPost.code });
      await supabaseClient.from('events').insert({
        type: 'comment',
        ig_user,
        ig_post_id,
        comment_text,
        matched: false,
        sent_dm: false
      });

      return new Response(JSON.stringify({ 
        success: false, 
        message: "Comment doesn't match trigger code" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check limits - count DMs sent for this post
    const { count: dmCount } = await supabaseClient
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('ig_post_id', ig_post_id)
      .eq('type', 'dm_sent')
      .eq('sent_dm', true);

    if (dmCount && dmCount >= account.comment_limit) {
      console.log("Comment limit reached for post:", ig_post_id);
      await supabaseClient.from('events').insert({
        type: 'limit_hit',
        ig_user,
        ig_post_id,
        comment_text,
        matched: true,
        sent_dm: false
      });

      return new Response(JSON.stringify({ 
        success: false, 
        message: "Comment limit reached for this post" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check per-user per-post cooldown
    const { data: existingDM } = await supabaseClient
      .from('events')
      .select('id')
      .eq('ig_post_id', ig_post_id)
      .eq('ig_user', ig_user)
      .eq('type', 'dm_sent')
      .eq('sent_dm', true)
      .maybeSingle();

    if (existingDM) {
      console.log("User already received DM for this post:", { ig_user, ig_post_id });
      await supabaseClient.from('events').insert({
        type: 'cooldown',
        ig_user,
        ig_post_id,
        comment_text,
        matched: true,
        sent_dm: false
      });

      return new Response(JSON.stringify({ 
        success: false, 
        message: "User already received DM for this post" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // All checks passed - send DM
    const dmText = account.dm_template.replace('{link}', finalLink);
    
    // Get secrets for provider determination
    const gupshupApiKey = Deno.env.get('GUPSHUP_API_KEY');
    const gupshupAppName = Deno.env.get('GUPSHUP_APP_NAME');
    const isGupshupConfigured = gupshupApiKey && gupshupAppName;
    const provider = isGupshupConfigured ? 'gupshup' : 'sandbox';
    
    console.log(`Using provider: ${provider} for DM to ${ig_user}`);
    
    try {
      const dmResult = provider === 'gupshup' 
        ? await sendInstagramDM(ig_user, dmText, gupshupApiKey!, gupshupAppName!)
        : await sendInstagramDMSandbox(ig_user, dmText);

      if (!dmResult.success) {
        throw new Error(dmResult.error || 'DM failed');
      }

      console.log("DM sent successfully to:", ig_user, "via", provider);

      // TODO: Reply to comment functionality will be added later
      // For now, we just log the intent
      if (account.reply_to_comments) {
        console.log("Would reply to comment for:", ig_user, "(feature coming soon)");
      }

      // Save success event
      await supabaseClient.from('events').insert({
        type: provider === 'sandbox' ? 'sandbox_dm' : 'dm_sent',
        ig_user,
        ig_post_id,
        comment_text,
        matched: true,
        sent_dm: true
      });

      const successMessage = autoEnabled 
        ? "Automation was off; enabled and simulated"
        : (provider === 'sandbox' ? "Sandbox DM generated (logged)" : "DM sent successfully");

      return new Response(JSON.stringify({ 
        success: true, 
        message: successMessage,
        finalLink,
        dmText
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } catch (dmError) {
      console.error("Error sending DM:", dmError);
      
      // Save failure event
      await supabaseClient.from('events').insert({
        type: 'dm_failed',
        ig_user,
        ig_post_id,
        comment_text,
        matched: true,
        sent_dm: false
      });

      return new Response(JSON.stringify({ 
        success: false, 
        message: "Failed to send DM",
        error: dmError.message
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Error in comment webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);