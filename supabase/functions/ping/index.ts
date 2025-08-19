export const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin ?? '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Form-Secret, Authorization, apikey, x-client-info',
  'Vary': 'Origin'
});

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  
  console.log('ping: start', { method: req.method, origin });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: cors(origin) 
    });
  }
  
  return new Response(JSON.stringify({ 
    ok: true, 
    time: Date.now(),
    method: req.method,
    origin 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...cors(origin) }
  });
});