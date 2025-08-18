import { Card } from "@/components/ui/card";
import { PUBLIC_CONFIG } from "@/config/public";

// Expected secrets for the application
const EXPECTED_SECRETS = [
  { name: "SUPABASE_URL", current: true },
  { name: "SUPABASE_ANON_KEY", current: true },
  { name: "OPENAI_API_KEY", current: true },
  { name: "SINCH_PROJECT_ID", current: false },
  { name: "SINCH_API_KEY", current: false },
  { name: "SINCH_API_SECRET", current: false },
  { name: "SINCH_REGION", current: false },
  { name: "IG_CHANNEL_ID", current: false }
];

export default function Health() {
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
                  {!secret.current && " (future)"}
                </span>
                <span>{secret.current ? "✅" : "❌"}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Public config is stored in <code>src/config/public.ts</code></li>
            <li>• Secrets are managed via Supabase Secrets (Edge Functions only)</li>
            <li>• ❌ for future secrets is expected and OK</li>
            <li>• This page is only available in development mode</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}