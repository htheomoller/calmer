// SANDBOX_START: self-test runner page
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { SCRIPTS } from "@/selftest/registry";
import { createTestContext } from "@/selftest/helpers";
import type { TestScript, TestResult, TestRunResult } from "@/selftest/types";

export default function SelfTest() {
  const [selectedScript, setSelectedScript] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestRunResult | null>(null);

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
    
    setResults(finalResult);
    setRunning(false);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Self‑Test Robot</h1>
          <p className="text-muted-foreground">Automated sandbox testing and validation</p>
        </div>

        {results && (
          <Card className="p-4">
            <div className="flex items-center gap-2">
              {results.passed ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  ALL PASS ✅
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-4 h-4 mr-1" />
                  FAILED ❌ at {results.failedAt}
                </Badge>
              )}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="space-y-4">
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

            <Button 
              onClick={runTests} 
              disabled={!selectedScript || running}
              className="w-full"
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
          </div>
        </Card>

        {results && (
          <Card className="p-6">
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