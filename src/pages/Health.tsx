// FEATURE:sandbox
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, TestTube } from "lucide-react";
import { Link } from "react-router-dom";
import { PUBLIC_CONFIG } from "@/config/public";
import { getCurrentProvider, type MessagingProvider } from "@/config/provider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WEBHOOK_COMMENTS_FN } from "@/config/functions";
// SANDBOX_START: automatic breadcrumbs
import { logBreadcrumb } from "@/lib/devlog";
// SANDBOX_END
// SANDBOX_START (audit)
import { MarkdownModal } from "@/components/dev/MarkdownModal";
import { Badge } from "@/components/ui/badge";
// SANDBOX_END

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
  const [edgeLoading, setEdgeLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const { toast } = useToast();
  // SANDBOX_START (audit)
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [result, setResult] = useState<string|null>(null);
  const [report, setReport] = useState<string|null>(null);
  const [modalPath, setModalPath] = useState<string>('');
  // SANDBOX_END

  useEffect(() => {
    getCurrentProvider().then(setProvider);
  }, []);

  // Only show in development/preview
  if (!(import.meta.env.DEV || import.meta.env.MODE === 'development' || import.meta.env.MODE === 'preview')) {
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

  const testEdgeFunction = async () => {
    setEdgeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ping', { 
        body: { hello: 'world' } 
      });
      
      console.log('edge:ping ->', { data, error });
      
      if (error) {
        toast({
          title: "Edge Error",
          description: `Edge error: ${error?.message ?? 'unknown'}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Edge Function Test",
          description: `Edge OK: ${new Date(data.time).toISOString()}`,
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Edge test failed:', error);
      toast({
        title: "Edge Test Failed",
        description: error.message || "Unknown error",
        variant: "destructive"
      });
    } finally {
      setEdgeLoading(false);
    }
  };

  const extractInvokeError = (err: any) => {
    // Supabase packs the function response under err.context or err.details
    const ctx = err?.context ?? err?.details ?? {};
    // Try to parse any string body as JSON; fall back to text
    let body = ctx.body ?? ctx.response ?? ctx.data ?? null;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* keep as text */ }
    }
    return {
      status: err?.status ?? ctx.status ?? 'unknown',
      message: err?.message ?? body?.message ?? 'invoke failed',
      code: body?.code ?? ctx.code ?? 'UNKNOWN',
      raw: { err }
    };
  };

  const testWebhookFunction = async () => {
    setWebhookLoading(true);
    try {
      // Find first sandbox post with automation enabled
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('automation_enabled', true)
        .limit(1);

      if (postsError || !posts?.length) {
        toast({
          title: "Webhook Test Failed",
          description: "No active sandbox posts found",
          variant: "destructive"
        });
        return;
      }

      const post = posts[0];
      const { data, error } = await supabase.functions.invoke(WEBHOOK_COMMENTS_FN, {
        body: {
          provider: 'sandbox',
          ig_post_id: post.ig_post_id,
          comment_text: 'LINK'
        }
      });

      if (error) {
        const e = extractInvokeError(error);
        console.log('invoke:webhook-comments:error', e);
        toast({
          title: `Edge ${e.status}: ${e.code}`,
          description: e.message,
          variant: "destructive"
        });
        return;
      }

      console.log('invoke:webhook-comments:ok', data);
      toast({
        title: "Webhook Test Result",
        description: data?.message ?? 'OK',
        variant: "default"
      });
    } catch (error: any) {
      console.error('Webhook test failed:', error);
      toast({
        title: "Webhook Test Failed",
        description: error.message || "Unknown error",
        variant: "destructive"
      });
    } finally {
      setWebhookLoading(false);
    }
  };

  // SANDBOX_START (audit)
  const runAudit = async () => {
    setIsRunning(true); setError(null); setResult(null); setReport(null);
    
    await logBreadcrumb({
      scope: 'audit',
      summary: 'audit_start',
      details: { at: new Date().toISOString() },
      tags: ['audit','start']
    });
    
    try {
      const res = await fetch('/__dev/audit-run');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data.message || 'Audit completed.');
      
      await logBreadcrumb({
        scope: 'audit',
        summary: 'audit_success',
        details: { code: data?.code, at: new Date().toISOString() },
        tags: ['audit','success']
      });
    } catch (e: any) {
      setError(e.message || 'Audit failed');
      
      await logBreadcrumb({
        scope: 'audit',
        summary: 'audit_fail',
        details: { error: e.message, at: new Date().toISOString() },
        tags: ['audit','error']
      });
    } finally {
      setIsRunning(false);
    }
  };

  const viewReport = async () => {
    try {
      const res = await fetch('/__dev/read-file?path=tmp/audit/report.md');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setReport(data.content || '(empty)');
      setModalPath('tmp/audit/report.md');
    } catch (e: any) {
      setError(e.message || 'Could not read report');
    }
  };

  const viewPlan = async () => {
    try {
      const res = await fetch('/__dev/read-file?path=docs/cleanup/plan.md');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setReport(data.content || '(empty)');
      setModalPath('docs/cleanup/plan.md');
    } catch (e: any) {
      setError(e.message || 'Could not read plan');
    }
  };
  // SANDBOX_END

  return (
    <div className="min-h-screen p-8">
      <meta name="robots" content="noindex,nofollow" />
      <div className="max-w-2xl mx-auto space-y-6">
        {import.meta.env.DEV && (
          <div style={{fontSize:'12px', opacity:0.7, marginBottom:8}}>ENV: DEV • dev routes enabled</div>
        )}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Application Health</h1>
            <p className="text-muted-foreground">Configuration and secrets status</p>
          </div>
          <div className="text-right space-y-2">
            <Badge variant="outline" className="block text-xs">
              {import.meta.env.DEV ? 'ENV: DEV • dev routes enabled' : 
               (typeof window !== 'undefined' && localStorage.getItem('calmer.dev.unlocked') === '1') ? 
               'ENV: PREVIEW (dev-unlocked)' : 'ENV: PREVIEW'}
            </Badge>
          </div>
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
                  const oldValue = localStorage.getItem('providerOverride') || provider;
                  localStorage.setItem('providerOverride', 'sandbox');
                  // SANDBOX_START: automatic breadcrumbs
                  logBreadcrumb({
                    scope: 'routing',
                    summary: 'Provider override: sandbox',
                    details: { from: oldValue, to: 'sandbox', at: new Date().toISOString() },
                    tags: ['provider'],
                  });
                  // SANDBOX_END
                  window.location.reload();
                }}
                className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded"
              >
                Use sandbox now
              </button>
              <button 
                onClick={() => {
                  const oldValue = localStorage.getItem('providerOverride') || provider;
                  localStorage.setItem('providerOverride', 'gupshup');
                  // SANDBOX_START: automatic breadcrumbs
                  logBreadcrumb({
                    scope: 'routing',
                    summary: 'Provider override: gupshup',
                    details: { from: oldValue, to: 'gupshup', at: new Date().toISOString() },
                    tags: ['provider'],
                  });
                  // SANDBOX_END
                  window.location.reload();
                }}
                className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded"
              >
                Use gupshup now
              </button>
              {localStorage.getItem('providerOverride') && (
                <button 
                  onClick={() => {
                    const oldValue = localStorage.getItem('providerOverride');
                    localStorage.removeItem('providerOverride');
                    // SANDBOX_START: automatic breadcrumbs
                    logBreadcrumb({
                      scope: 'routing',
                      summary: 'Provider override: cleared',
                      details: { from: oldValue, to: null, at: new Date().toISOString() },
                      tags: ['provider'],
                    });
                    // SANDBOX_END
                    window.location.reload();
                  }}
                  className="px-3 py-1 text-xs text-muted-foreground underline"
                >
                  Clear override
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={testEdgeFunction} 
                disabled={edgeLoading}
                variant="outline"
                className="flex-1"
              >
                {edgeLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Edge (ping)"
                )}
              </Button>
              
              <Button 
                onClick={testWebhookFunction} 
                disabled={webhookLoading}
                variant="outline"
                className="flex-1"
              >
                {webhookLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Webhook (invoke)"
                )}
              </Button>
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

        {/* SANDBOX_START: self-test integration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Self‑Test
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Automated sandbox testing and validation system
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/self-test">
                Open /self-test
              </Link>
            </Button>
          </div>
        </Card>
        {/* SANDBOX_END */}

        {/* SANDBOX_START: Dev tools card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Development Tools</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Development-only tools and utilities
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.open('/dev/breadcrumbs', '_blank')}
              variant="outline"
            >
              Open Breadcrumbs
            </Button>
            <Button 
              onClick={() => {
                const scope = 'sandbox';
                const url = `/dev/breadcrumbs?scope=${scope}`;
                window.open(url, '_blank');
              }}
              variant="outline"
              size="sm"
            >
              Quick Log
            </Button>
          </div>
        </Card>
        {/* SANDBOX_END */}

        {/* SANDBOX_START (audit) */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Audit Kit</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Development-only audit and cleanup tools
          </p>
          
          {import.meta.env.PROD ? (
            <p className="text-sm text-muted-foreground">
              Audit Kit is disabled in production.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={runAudit}
                  disabled={isRunning}
                  variant="default"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running audit...
                    </>
                  ) : (
                    "Run Audit"
                  )}
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const r = await logBreadcrumb({
                      scope: 'audit',
                      summary: 'manual_test',
                      details: { from: 'Health button', at: new Date().toISOString() },
                      tags: ['audit','test'],
                    });
                    if (r?.ok) {
                      console.info('[breadcrumb:ok] logged');
                      toast({ title: 'Breadcrumb logged ✅', description: 'Check /dev/breadcrumbs' });
                    } else {
                      console.warn('[breadcrumb:fail]', r?.error);
                      toast({ title: 'Breadcrumb failed ❌', description: String(r?.error || 'unknown error'), variant: 'destructive' });
                    }
                  }}
                >
                  Log test breadcrumb
                </Button>
              </div>
              
              {result && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-green-600">{result}</p>
                </div>
              )}
              
              {error && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              
              {result && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={viewReport}
                  >
                    View Report
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={viewPlan}
                  >
                    View Plan
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
        {/* SANDBOX_END */}

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
      
      {/* SANDBOX_START (audit) */}
      {modalPath && report && (
        <MarkdownModal 
          path={modalPath} 
          onClose={() => setModalPath('')}
          title={modalPath.includes('report') ? 'Audit Report' : 'Cleanup Plan'}
        />
      )}
      {/* SANDBOX_END */}
    </div>
  );
}