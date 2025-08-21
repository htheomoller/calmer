// Public configuration values - safe to expose in client-side code
export const PUBLIC_CONFIG = {
  SUPABASE_URL: "https://upzjnifdcmevsdfmzwzw.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwempuaWZkY21ldnNkZm16d3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjc5MDUsImV4cCI6MjA3MDYwMzkwNX0.s136RNSm8DfsE_qC_llnaQY2nmbwH0vxhYq84MypTg0",
  BREVO_WAITLIST_LIST_ID: 7,
  WAITLIST_FORM_SECRET: "@ccenT228676",
  DEFAULT_CODE: "LINK"
} as const;

// Flip SITE_LOCKDOWN=false to reopen
export const SITE_LOCKDOWN = false; // TEMP for testing

// DEV routes that should be accessible with unlock
export const DEV_ROUTES = ['/health', '/self-test', '/dev/breadcrumbs'];