-- Extend signature_requests for two-sided (client + agent) signing flow

ALTER TABLE signature_requests
  ADD COLUMN IF NOT EXISTS device_info        TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url            TEXT,
  ADD COLUMN IF NOT EXISTS agent_signed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agent_ip           TEXT,
  ADD COLUMN IF NOT EXISTS agent_device_info  TEXT;

-- Extend status constraint to cover all signing states
ALTER TABLE signature_requests
  DROP CONSTRAINT IF EXISTS signature_requests_status_check;

ALTER TABLE signature_requests
  ADD CONSTRAINT signature_requests_status_check
  CHECK (status IN ('pending', 'signed', 'semnat_client', 'semnat_complet'));
