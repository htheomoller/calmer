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
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Verify form secret
    const formSecret = req.headers.get("X-Form-Secret");
    const expectedSecret = Deno.env.get("WAITLIST_FORM_SECRET");
    
    if (!formSecret || formSecret !== expectedSecret) {
      console.error("Invalid form secret");
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, listId: bodyListId }: WaitlistRequest = await req.json();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY not configured");
      return new Response(JSON.stringify({ ok: false, error: "Service configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Robust list ID selection: secret → body → error
    const rawSecret = Deno.env.get('BREVO_WAITLIST_LIST_ID') ?? '';
    const secretId = Number(rawSecret);
    const bodyId = Number(bodyListId);

    function valid(n: number) { return Number.isFinite(n) && n > 0; }

    const LIST_ID = valid(secretId) ? secretId
                  : valid(bodyId)   ? bodyId
                  : NaN;

    if (!valid(LIST_ID)) {
      console.error(`Invalid list id. secret=${rawSecret} body=${bodyListId}`);
      return new Response(JSON.stringify({ ok: false, error: 'BAD_LIST_ID' }), { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Adding email to Brevo list:", email, "listId:", LIST_ID, "type:", typeof LIST_ID);

    // Call Brevo API to add contact
    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        email: email,
        listIds: [LIST_ID],
      }),
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error("Brevo API error:", brevoResponse.status, errorText);
      
      // Handle duplicate contact (this is usually not an error for waitlists)
      if (brevoResponse.status === 400 && errorText.includes("Contact already exist")) {
        return new Response(JSON.stringify({ ok: true, message: "Already subscribed" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      return new Response(JSON.stringify({ ok: false, error: "Failed to add to waitlist" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Successfully added email to waitlist:", email);
    return new Response(JSON.stringify({ ok: true, message: "Added to waitlist" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in add-to-waitlist function:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);