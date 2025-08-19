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

    // Validate list ID from request body
    const LIST_ID = Number(bodyListId);
    const valid = Number.isFinite(LIST_ID) && LIST_ID > 0;
    if (!valid) {
      return new Response(JSON.stringify({ ok: false, error: 'BAD_LIST_ID' }), { 
        status: 400,
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
        email: email,
        listIds: [LIST_ID],
      }),
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error("Brevo API error:", brevoResponse.status, errorText);
      
      // Handle duplicate contact
      if (brevoResponse.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.code === "duplicate_parameter") {
            // Check if contact is already in our waitlist (list 7)
            const contactResponse = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
              method: "GET",
              headers: {
                "api-key": brevoApiKey,
              },
            });

            if (contactResponse.ok) {
              const contactData = await contactResponse.json();
              
              // Check if contact is already in list 7
              if (contactData.listIds && contactData.listIds.includes(LIST_ID)) {
                return new Response(JSON.stringify({ ok: true, message: "already_in_list" }), {
                  status: 200,
                  headers: { "Content-Type": "application/json", ...corsHeaders },
                });
              }

              // Contact exists but not in list 7, add them to the list
              const addToListResponse = await fetch(`https://api.brevo.com/v3/contacts/lists/${LIST_ID}/contacts/add`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "api-key": brevoApiKey,
                },
                body: JSON.stringify({
                  emails: [email],
                }),
              });

              if (addToListResponse.ok) {
                return new Response(JSON.stringify({ ok: true, message: "newly_added" }), {
                  status: 200,
                  headers: { "Content-Type": "application/json", ...corsHeaders },
                });
              } else {
                const addToListError = await addToListResponse.text();
                console.error("Failed to add contact to list:", addToListResponse.status, addToListError);
                return new Response(JSON.stringify({ ok: false, error: "add_to_list_failed" }), {
                  status: 500,
                  headers: { "Content-Type": "application/json", ...corsHeaders },
                });
              }
            } else {
              console.error("Failed to fetch contact details:", contactResponse.status);
              // Fallback to treating as already on waitlist
              return new Response(JSON.stringify({ ok: true, message: "already_in_list" }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              });
            }
          }
        } catch (parseError) {
          // If JSON parsing fails, fall back to string check
          if (errorText.includes("Contact already exist")) {
            return new Response(JSON.stringify({ ok: true, message: "already_in_list" }), {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
        }
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