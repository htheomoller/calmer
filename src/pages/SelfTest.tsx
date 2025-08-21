// SANDBOX_START: self-test runner page
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SCRIPTS } from "@/selftest/registry";
import { createTestContext } from "@/selftest/helpers";
import type { TestScript, TestResult, TestRunResult } from "@/selftest/types";
// SANDBOX_START: automatic breadcrumbs
import { logBreadcrumb } from "@/lib/devlog";
// SANDBOX_END

export default function SelfTest() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedScript, setSelectedScript] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestRunResult | null>(null);
  // SANDBOX_START (polish)
  const [lastSelectedScript, setLastSelectedScript] = useState<string>('');
  // SANDBOX_END

  // Guard: only show in development
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">Self-Test page is only available in development.</p>
        </Card>
      </div>
    );
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Require authentication
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <div className="text-center space-y-4">
            <LogIn className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">Sign in to run tests</h2>
              <p className="text-muted-foreground mt-2">
                The test robot needs a user to create sandbox posts.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/login?from=/self-test')}
              className="w-full"
            >
              Log in
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const runTests = async () => {
    const script = SCRIPTS.find(s => s.id === selectedScript);
    if (!script) return;

    setRunning(true);
    setResults(null);

    const testResults: TestResult[] = [];
    let passed = true;
    let failedAt: string | undefined;

    console.log(`🤖 Self-Test Robot: Starting "${script.title}" (${script.steps.length} steps)`);

    // Create test context with console logging
    const ctx = createTestContext((message: string, extra?: any) => {
      console.log(`🤖 ${message}`, extra || '');
    });

    for (let i = 0; i < script.steps.length; i++) {
      const step = script.steps[i];
      console.log(`🤖 Step ${i + 1}/${script.steps.length}: ${step.name} - START`);

      try {
        const stepResult = await step.run(ctx);
        
        testResults.push({
          step: step.name,
          status: stepResult.pass ? 'pass' : 'fail',
          note: stepResult.note
        });

        console.log(`🤖 Step ${i + 1}/${script.steps.length}: ${step.name} - ${stepResult.pass ? 'PASS' : 'FAIL'}`, stepResult.note || '');

        if (!stepResult.pass) {
          passed = false;
          failedAt = `Step ${i + 1} – ${step.name}`;
          
          // Stop on failure unless explicitly configured not to
          if (step.stopOnFail !== false) {
            break;
          }
        }
      } catch (error: any) {
        const errorResult = {
          step: step.name,
          status: 'fail' as const,
          note: error?.message || 'Unknown error'
        };
        
        testResults.push(errorResult);
        console.error(`🤖 Step ${i + 1}/${script.steps.length}: ${step.name} - ERROR`, error);
        
        passed = false;
        failedAt = `Step ${i + 1} – ${step.name}`;
        
        // Stop on exception unless explicitly configured not to
        if (step.stopOnFail !== false) {
          break;
        }
      }
    }

    const finalResult: TestRunResult = {
      passed,
      failedAt,
      results: testResults
    };

    console.log(`🤖 Self-Test Robot: Completed "${script.title}" - ${passed ? 'ALL PASS ✅' : `FAILED ❌ at ${failedAt}`}`);
    
    // SANDBOX_START: automatic breadcrumbs
    const result = { ok: passed, steps: testResults }; // minimal JSON
    const failedIndex = testResults.findIndex(r => r.status === 'fail');
    logBreadcrumb({
      scope: 'selftest',
      summary: passed ? 'Self‑Test: ALL PASS' : `Self‑Test: FAIL at step ${failedIndex + 1}`,
      details: result,
      tags: passed ? ['pass'] : ['fail'],
    });
    // SANDBOX_END
    
    setResults(finalResult);
    setRunning(false);
    
    // SANDBOX_START (polish)
    setLastSelectedScript(selectedScript);
    
    // Auto-scroll to results after completion
    setTimeout(() => {
      const resultsElement = document.getElementById('test-results');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    // SANDBOX_END
  };

  return (
    <div className="min-h-screen p-8">
      <meta name="robots" content="noindex,nofollow" />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Self‑Test Robot</h1>
            <p className="text-muted-foreground">Automated sandbox testing and validation</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {import.meta.env.DEV ? 'ENV: DEV • dev routes enabled' : 
             (typeof window !== 'undefined' && localStorage.getItem('calmer.dev.unlocked') === '1') ? 
             'ENV: PREVIEW (dev-unlocked)' : 'ENV: PREVIEW'}
          </Badge>
        </div>

        {/* SANDBOX_START (polish) */}
        {results && (
          <Card className={`p-4 border-2 ${results.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {results.passed ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    All {results.results.length} steps passed
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="w-4 h-4 mr-1" />
                    Failed at {results.failedAt}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const resultsElement = document.getElementById('test-results');
                  if (resultsElement) {
                    resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                View details
              </Button>
            </div>
          </Card>
        )}
        {/* SANDBOX_END */}

        <Card className="p-6">
          <div className="space-y-4">
            {/* SANDBOX_START: Quick log button */}
            {results && !import.meta.env.PROD && (
              <Button 
                onClick={() => {
                  logBreadcrumb({
                    scope: 'selftest',
                    summary: `Self‑Test manual log: ${results.passed ? 'PASS' : 'FAIL'}`,
                    details: { manual: true, timestamp: new Date().toISOString() },
                    tags: ['manual', results.passed ? 'pass' : 'fail'],
                  });
                }}
                variant="outline"
                size="sm"
              >
                Log last run result
              </Button>
            )}
            {/* SANDBOX_END */}
            
            <div>
              <label className="text-sm font-medium">Test script:</label>
              <Select value={selectedScript} onValueChange={setSelectedScript}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a test script" />
                </SelectTrigger>
                <SelectContent>
                  {SCRIPTS.map((script) => (
                    <SelectItem key={script.id} value={script.id}>
                      {script.title}
                      {script.steps.length === 0 && ' (empty)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={runTests} 
                disabled={!selectedScript || running}
                className="flex-1"
              >
                {running ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  'Run Tests'
                )}
              </Button>
              
              {/* SANDBOX_START (polish) */}
              {lastSelectedScript && !running && (
                <Button
                  onClick={() => {
                    setSelectedScript(lastSelectedScript);
                    setTimeout(() => runTests(), 100);
                  }}
                  variant="outline"
                  disabled={running}
                >
                  Run again
                </Button>
              )}
              {/* SANDBOX_END */}
            </div>
          </div>
        </Card>

        {results && (
          <Card className="p-6" id="test-results">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4 pb-2 border-b font-medium text-sm">
                <span>Step</span>
                <span>Status</span>
                <span>Note</span>
              </div>
              {results.results.map((result, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b">
                  <span className="text-sm">{result.step}</span>
                  <div className="flex items-center gap-1">
                    {result.status === 'pass' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {result.status === 'pass' ? '✅' : '❌'}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {result.note || '—'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Available Scripts</h2>
          <div className="space-y-2">
            {SCRIPTS.map((script) => (
              <div key={script.id} className="flex justify-between items-center p-3 bg-secondary rounded">
                <div>
                  <span className="font-medium">{script.title}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({script.steps.length} steps)
                  </span>
                </div>
                <Badge variant="outline">{script.id}</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            To add new scripts, create files in src/selftest/scripts/ and update the registry.
          </p>
        </Card>
      </div>
    </div>
  );
}
// SANDBOX_END