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
    const { ig_post_id, ig_user, comment_text, created_at }: CommentWebhookPayload = await req.json();

    console.log("Processing comment:", { ig_post_id, ig_user, comment_text });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Look up the post
    const { data: post, error: postError } = await supabaseClient
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
      .eq('automation_enabled', true)
      .maybeSingle();

    if (postError) {
      console.error("Error fetching post:", postError);
      throw postError;
    }

    if (!post) {
      console.log("No post found or automation disabled for:", ig_post_id);
      // Save event anyway
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
        message: "Post not found or automation disabled" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const account = post.accounts;
    if (!account) {
      throw new Error("Account not found for post");
    }

    // Determine final link
    const finalLink = post.link || account.default_link;
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
    if (post.code) {
      matched = comment_text.toLowerCase().includes(post.code.toLowerCase());
    }

    if (!matched) {
      console.log("Comment doesn't match code:", { comment_text, code: post.code });
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
        type: 'dm_sent',
        ig_user,
        ig_post_id,
        comment_text,
        matched: true,
        sent_dm: true
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: "DM sent successfully",
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