// Secrets management helpers for server-side code
// Note: In Lovable, secrets are managed via Supabase and available in edge functions

/**
 * Get a required secret value. Throws friendly error if missing.
 */
export function getRequired(name: string): string {
  // In client-side code, we can't access secrets directly
  // This is primarily for edge function usage documentation
  throw new Error(`Missing secret: ${name}. Add it in Secrets.`);
}

/**
 * Get an optional secret value with fallback.
 */
export function getOptional(name: string, fallback: string = ""): string {
  // In client-side code, we can't access secrets directly
  // This is primarily for edge function usage documentation
  return fallback;
}

// For edge functions, secrets are available via Deno.env.get()
// This code is meant for edge function environments where Deno is available
export const EDGE_FUNCTION_HELPERS = `
// Use these helpers in your edge functions:

export const getRequired = (name: string): string => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(\`Missing secret: \${name}. Add it in Secrets.\`);
  }
  return value;
};

export const getOptional = (name: string, fallback: string = ""): string => {
  return Deno.env.get(name) || fallback;
};
`;