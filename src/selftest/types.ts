// SANDBOX_START: self-test types
import { supabase } from "@/integrations/supabase/client";

export type TestContext = {
  supabase: typeof supabase;
  now: number;
  log: (m: string, extra?: any) => void;
  ensureSandbox: () => Promise<void>;
  ensureSandboxPost: () => Promise<{ ig_post_id: string }>;
  getRecentActivity: (minutes: number, types?: string[]) => Promise<any[]>;
  invokeWebhook: (args: { ig_post_id: string; comment_text: string }) => Promise<{ ok: boolean; code?: string; message?: string }>;
};

export type TestStep = {
  name: string;
  run: (ctx: TestContext) => Promise<{ pass: boolean; note?: string }>;
  stopOnFail?: boolean; // default true
};

export type TestScript = {
  id: string;
  title: string;
  steps: TestStep[];
};

export type TestResult = {
  step: string;
  status: 'pass' | 'fail';
  note?: string;
};

export type TestRunResult = {
  passed: boolean;
  failedAt?: string;
  results: TestResult[];
};
// SANDBOX_END