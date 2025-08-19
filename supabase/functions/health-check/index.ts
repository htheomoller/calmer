import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check provider configuration
    const gupshupApiKey = Deno.env.get('GUPSHUP_API_KEY');
    const gupshupAppName = Deno.env.get('GUPSHUP_APP_NAME');
    const isGupshupConfigured = gupshupApiKey && gupshupAppName;
    const provider = isGupshupConfigured ? 'gupshup' : 'sandbox';

    // Compute effective list ID using same resolution as add-to-waitlist
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    
    // Read env first
    const envRaw = Deno.env.get('BREVO_WAITLIST_LIST_ID');
    const envId = envRaw ? Number(envRaw) : NaN;
    const envValid = Number.isFinite(envId) && envId > 0;
    
    // Read optional JSON body (tolerate empty body)
    let body: any = null;
    try { 
      body = await req.json(); 
    } catch {} 
    
    const bodyIdRaw = body?.listId;
    const bodyId = bodyIdRaw != null ? Number(bodyIdRaw) : NaN;
    const bodyValid = Number.isFinite(bodyId) && bodyId > 0;
    
    // Resolve effective list ID: env → body → null
    const effectiveListId = envValid ? envId : (bodyValid ? bodyId : null);
    const listIdSource = envValid ? 'env' : (bodyValid ? 'body' : 'none');
    
    const healthData = {
      ok: true,
      provider,
      secrets: {
        GUPSHUP_API_KEY: !!gupshupApiKey,
        GUPSHUP_APP_NAME: !!gupshupAppName,
        SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
        SUPABASE_ANON_KEY: !!Deno.env.get('SUPABASE_ANON_KEY'),
        OPENAI_API_KEY: !!Deno.env.get('OPENAI_API_KEY'),
        BREVO_API_KEY: !!brevoApiKey,
        WAITLIST_FORM_SECRET: !!Deno.env.get('WAITLIST_FORM_SECRET'),
        BREVO_WAITLIST_LIST_ID: !!envRaw
      },
      waitlist: {
        hasKey: !!brevoApiKey,
        listIdSource,
        effectiveListId
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(healthData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in health check:", error);
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