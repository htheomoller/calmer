import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-form-secret",
};

interface WaitlistRequest {
  email: string;
  listId?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ 
      ok: false, 
      code: 'METHOD_NOT_ALLOWED', 
      message: 'Only POST method allowed' 
    }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body: WaitlistRequest = await req.json();
    
    // Validate email early
    if (!body.email) {
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'MISSING_EMAIL', 
        message: 'email required' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'INVALID_EMAIL', 
        message: 'valid email format required' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse list ID - prefer env, fallback to body
    const envListId = Deno.env.get('BREVO_WAITLIST_LIST_ID');
    let listIdNumber: number;
    
    if (envListId && !isNaN(Number(envListId))) {
      listIdNumber = Number(envListId);
    } else if (body.listId && Number.isFinite(body.listId) && body.listId > 0) {
      listIdNumber = body.listId;
    } else {
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'MISSING_LIST_ID', 
        message: 'valid listId required' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check for required secrets
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY not configured");
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'MISSING_BREVO_KEY', 
        message: 'BREVO_API_KEY missing' 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify form secret for non-test requests
    const formSecret = req.headers.get("X-Form-Secret");
    const expectedSecret = Deno.env.get("WAITLIST_FORM_SECRET");
    
    if (formSecret && expectedSecret && formSecret !== expectedSecret) {
      console.error("Invalid form secret");
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'INVALID_SECRET', 
        message: 'Invalid form secret' 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Call Brevo API to add contact
    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        email: body.email,
        listIds: [listIdNumber],
        updateEnabled: true
      }),
    });

    const responseText = await brevoResponse.text();
    let responseData: any = null;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Keep as text if not valid JSON
    }

    if (brevoResponse.ok) {
      console.log("Successfully added email to waitlist:", body.email);
      return new Response(JSON.stringify({ 
        ok: true, 
        code: 'SUBSCRIBED', 
        message: 'contact subscribed/updated' 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle error responses
    if (brevoResponse.status === 400) {
      // Check for duplicate or already associated
      if (responseData?.code === "duplicate_parameter" || 
          responseText.includes("already associated") ||
          responseText.includes("Contact already exist")) {
        return new Response(JSON.stringify({ 
          ok: false, 
          code: 'ALREADY_SUBSCRIBED', 
          message: 'already on list or account' 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    console.error("Brevo API error:", brevoResponse.status, responseText);
    
    return new Response(JSON.stringify({ 
      ok: false, 
      code: 'BREVO_ERROR', 
      message: responseData?.message || `Brevo API error: ${brevoResponse.status}`,
      details: responseData
    }), {
      status: brevoResponse.status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in add-to-waitlist function:", error);
    return new Response(JSON.stringify({ 
      ok: false, 
      code: 'UNEXPECTED', 
      message: String(error) 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
