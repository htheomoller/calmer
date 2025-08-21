-- Create atomic increment function for webhook counters
CREATE OR REPLACE FUNCTION increment_webhook_counter(
  p_account_id uuid,
  p_bucket text
) RETURNS int AS $$
DECLARE
  current_count int;
BEGIN
  -- Try to increment existing counter
  UPDATE webhook_counters 
  SET count = count + 1
  WHERE account_id = p_account_id AND bucket = p_bucket
  RETURNING count INTO current_count;
  
  -- If no row was updated, insert new counter
  IF current_count IS NULL THEN
    INSERT INTO webhook_counters (account_id, bucket, count) 
    VALUES (p_account_id, p_bucket, 1)
    ON CONFLICT (account_id, bucket) DO UPDATE SET count = webhook_counters.count + 1
    RETURNING count INTO current_count;
  END IF;
  
  RETURN current_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;