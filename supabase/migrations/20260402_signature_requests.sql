CREATE TABLE IF NOT EXISTS signature_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  token       UUID        UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  client_email TEXT       NOT NULL,
  client_name  TEXT       NOT NULL,
  contract_text TEXT      NOT NULL,
  status       TEXT       NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed')),
  signed_at    TIMESTAMPTZ,
  signer_ip    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signature_requests_token_idx       ON signature_requests(token);
CREATE INDEX IF NOT EXISTS signature_requests_contract_id_idx ON signature_requests(contract_id);
