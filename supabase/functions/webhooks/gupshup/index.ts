import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendInstagramDM, sendInstagramDMSandbox } from "../utils/gupshup-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GupshupWebhookPayload {
  event_type: string;
  message?: {
    id: string;
    from: string;
    text: string;
    timestamp: string;
  };
  // Add other Gupshup webhook fields as needed
}

interface CommentSimulationPayload {
  ig_post_id: string;
  ig_user: string;
  comment_text: string;
  dm_override?: {
    message: string;
    direct: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: GupshupWebhookPayload | CommentSimulationPayload = await req.json();
    
    console.log("Gupshup webhook received:", payload);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get secrets for provider determination
    const gupshupApiKey = Deno.env.get('GUPSHUP_API_KEY');
    const gupshupAppName = Deno.env.get('GUPSHUP_APP_NAME');
    const isGupshupConfigured = gupshupApiKey && gupshupAppName;
    const provider = isGupshupConfigured ? 'gupshup' : 'sandbox';

    console.log(`Provider mode: ${provider}`);

    // Handle comment simulation (for testing)
    if ('ig_post_id' in payload) {
      const { ig_post_id, ig_user, comment_text, dm_override } = payload;
      
      // If this is a direct DM override, send it immediately
      if (dm_override?.direct) {
        const result = provider === 'gupshup' 
          ? await sendInstagramDM(ig_user, dm_override.message, gupshupApiKey!, gupshupAppName!)
          : await sendInstagramDMSandbox(ig_user, dm_override.message);

        // Log the event
        await supabaseClient.from('events').insert({
          type: result.success ? 'dm_sent' : 'dm_failed',
          ig_user,
          ig_post_id: 'direct-dm',
          comment_text: 'Direct DM test',
          matched: true,
          sent_dm: result.success
        });

        return new Response(JSON.stringify({
          success: result.success,
          provider,
          message: result.success ? 'DM sent successfully' : `Failed: ${result.error}`,
          messageId: result.messageId
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Otherwise, forward to the main comment webhook
      const commentWebhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-comments`;
      const webhookResponse = await fetch(commentWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({ ig_post_id, ig_user, comment_text })
      });

      const result = await webhookResponse.json();
      return new Response(JSON.stringify({
        ...result,
        provider
      }), {
        status: webhookResponse.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle actual Gupshup webhooks
    if ('event_type' in payload) {
      // Process Gupshup webhook events
      console.log(`Processing Gupshup ${payload.event_type} event`);
      
      // Log the webhook event
      await supabaseClient.from('events').insert({
        type: 'gupshup_webhook',
        ig_user: payload.message?.from || 'unknown',
        ig_post_id: null,
        comment_text: payload.message?.text || JSON.stringify(payload),
        matched: false,
        sent_dm: false
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Gupshup webhook processed'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Unknown payload format'
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in Gupshup webhook:", error);
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
