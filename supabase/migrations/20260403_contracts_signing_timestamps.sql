-- Add signing timestamp columns to contracts table
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS client_semnat_la TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agent_semnat_la  TIMESTAMPTZ;
