-- Create webhook_counters table for atomic rate limiting
CREATE TABLE IF NOT EXISTS webhook_counters (
  account_id uuid NOT NULL,
  bucket text NOT NULL,
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, bucket)
);

-- Enable RLS
ALTER TABLE webhook_counters ENABLE ROW LEVEL SECURITY;

-- Allow only service role (edge functions) to modify
CREATE POLICY "service role only"
ON webhook_counters
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');