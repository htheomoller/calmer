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

    const healthData = {
      provider,
      secrets: {
        GUPSHUP_API_KEY: !!gupshupApiKey,
        GUPSHUP_APP_NAME: !!gupshupAppName,
        SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
        SUPABASE_ANON_KEY: !!Deno.env.get('SUPABASE_ANON_KEY'),
        OPENAI_API_KEY: !!Deno.env.get('OPENAI_API_KEY')
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