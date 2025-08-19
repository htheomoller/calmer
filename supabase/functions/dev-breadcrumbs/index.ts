// SANDBOX_START: Dev breadcrumbs edge function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          code: 'MISSING_CONFIG', 
          message: 'Supabase configuration missing' 
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header and extract the JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          code: 'UNAUTHORIZED', 
          message: 'Authorization header required' 
        }), 
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user?.email) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          code: 'INVALID_TOKEN', 
          message: 'Invalid or expired token' 
        }), 
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const url = new URL(req.url);
    const method = req.method;

    if (method === 'POST' && url.pathname.endsWith('/add')) {
      // Add breadcrumb
      const body = await req.json();
      const { scope, summary, details, tags } = body;

      if (!scope || !summary) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            code: 'MISSING_FIELDS', 
            message: 'scope and summary are required' 
          }), 
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      const { data, error } = await supabase
        .from('dev_breadcrumbs')
        .insert({
          author_email: user.email,
          scope,
          summary,
          details: details || null,
          tags: tags || []
        })
        .select('id')
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            code: 'INSERT_ERROR', 
            message: error.message 
          }), 
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          ok: true, 
          id: data.id 
        }), 
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );

    } else if (method === 'GET' && url.pathname.endsWith('/list')) {
      // List breadcrumbs
      const minutes = parseInt(url.searchParams.get('minutes') || '1440');
      const scope = url.searchParams.get('scope');
      
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

      let query = supabase
        .from('dev_breadcrumbs')
        .select('*')
        .eq('author_email', user.email)
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false });

      if (scope) {
        query = query.eq('scope', scope);
      }

      const { data, error } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            code: 'QUERY_ERROR', 
            message: error.message 
          }), 
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          ok: true, 
          rows: data 
        }), 
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        ok: false, 
        code: 'NOT_FOUND', 
        message: 'Endpoint not found' 
      }), 
      { 
        status: 404, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ 
        ok: false, 
        code: 'UNEXPECTED', 
        message: String(e) 
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
// SANDBOX_END