export interface FeatureManifest {
  slug: string;
  name: string;
  description: string;
  flags: string[];
  routes: string[];
  files: string[];
  edge_functions: string[];
  db: {
    tables: string[];
    policies: string[];
  };
  env: string[];
  cleanup_ready_when: string[];
  notes: string[];
}

export interface ScanResult {
  feature: string;
  listed_files_found: string[];
  listed_files_missing: string[];
  extra_feature_files: string[];
  routes_found: string[];
  routes_missing: string[];
  edge_functions_found: string[];
  edge_functions_missing: string[];
  sandbox_blocks: number;
}

export interface UsageStats {
  feature: string;
  period_days: number;
  event_counts: Record<string, number>;
  last_activity: string | null;
}

export interface AuditReport {
  timestamp: string;
  features: ScanResult[];
  usage: UsageStats[];
  summary: {
    total_features: number;
    files_with_issues: number;
    sandbox_blocks_total: number;
  };
}