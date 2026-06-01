-- ============================================================
--  AMUR.BG — Crypto paywall: verified on-chain payment records
-- ============================================================

CREATE TABLE IF NOT EXISTS api_payments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash        TEXT        NOT NULL UNIQUE,
  network        TEXT        NOT NULL CHECK (network IN ('polygon', 'base')),
  amount         NUMERIC(18, 6) NOT NULL CHECK (amount > 0),
  sender_address TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_payments_tx_hash_idx ON api_payments (tx_hash);
CREATE INDEX IF NOT EXISTS api_payments_sender_idx  ON api_payments (sender_address);

-- RLS: only service-role can read/write (no anon access to payment records)
ALTER TABLE api_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON api_payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
