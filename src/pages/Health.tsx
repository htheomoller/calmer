import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PUBLIC_CONFIG } from "@/config/public";
import { getCurrentProvider, type MessagingProvider } from "@/config/provider";

// Expected secrets for the application
const EXPECTED_SECRETS = [
  { name: "SUPABASE_URL", current: true },
  { name: "SUPABASE_ANON_KEY", current: true },
  { name: "OPENAI_API_KEY", current: true },
  { name: "GUPSHUP_API_KEY", current: false },
  { name: "GUPSHUP_APP_NAME", current: false },
  { name: "BREVO_API_KEY", current: true },
  { name: "WAITLIST_FORM_SECRET", current: true }
];

export default function Health() {
  const [provider, setProvider] = useState<MessagingProvider>('sandbox');

  useEffect(() => {
    getCurrentProvider().then(setProvider);
  }, []);

  // Only show in development
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">Health page is only available in development.</p>
        </Card>
      </div>
    );
  }

  const checkPublicConfig = (key: keyof typeof PUBLIC_CONFIG) => {
    return PUBLIC_CONFIG[key] ? "✅" : "❌";
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Application Health</h1>
          <p className="text-muted-foreground">Configuration and secrets status</p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Messaging Provider</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Current Provider</span>
              <span className="font-mono">
                {provider} {provider === 'gupshup' ? '(active)' : '(default)'}
                {localStorage.getItem('providerOverride') && ' (override)'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {provider === 'gupshup' ? 
                'Gupshup provider active - real messages will be sent' :
                'Sandbox mode active - messages are logged only'
              }
            </p>
            
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => {
                  localStorage.setItem('providerOverride', 'sandbox');
                  window.location.reload();
                }}
                className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded"
              >
                Use sandbox now
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem('providerOverride', 'gupshup');
                  window.location.reload();
                }}
                className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded"
              >
                Use gupshup now
              </button>
              {localStorage.getItem('providerOverride') && (
                <button 
                  onClick={() => {
                    localStorage.removeItem('providerOverride');
                    window.location.reload();
                  }}
                  className="px-3 py-1 text-xs text-muted-foreground underline"
                >
                  Clear override
                </button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Public Configuration</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>SUPABASE_URL</span>
              <span>{checkPublicConfig("SUPABASE_URL")}</span>
            </div>
            <div className="flex justify-between">
              <span>SUPABASE_ANON_KEY</span>
              <span>{checkPublicConfig("SUPABASE_ANON_KEY")}</span>
            </div>
            <div className="flex justify-between">
              <span>Waitlist list id (source)</span>
              <span>request body</span>
            </div>
            <div className="flex justify-between">
              <span>Waitlist list id (example)</span>
              <span>7</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Expected Secrets</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Secrets are managed via Supabase and available in edge functions only.
          </p>
          <div className="space-y-2">
            {EXPECTED_SECRETS.map((secret) => (
              <div key={secret.name} className="flex justify-between">
                <span className={secret.current ? "" : "text-muted-foreground"}>
                  {secret.name}
                  {!secret.current && secret.name.includes('GUPSHUP') && " (for Gupshup provider)"}
                </span>
                <span>{secret.current ? "✅" : "❌"}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• App runs in <strong>sandbox</strong> mode by default (logs only)</li>
            <li>• When GUPSHUP_API_KEY + GUPSHUP_APP_NAME are configured, switches to <strong>gupshup</strong> mode</li>
            <li>• Secrets are managed via Supabase and only available in edge functions</li>
            <li>• Provider mode is auto-detected at runtime</li>
            <li>• This page is only available in development mode</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}