-- ============================================================
--  AMUR.BG — WhatsApp dispatch: hub status, courier geo,
--  order routing columns, dispatch_offers table
-- ============================================================

/* ── Hubs: WhatsApp + availability ── */
ALTER TABLE hubs
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
  ADD COLUMN IF NOT EXISTS status         TEXT NOT NULL DEFAULT 'online'
    CHECK (status IN ('online', 'offline', 'busy'));

/* ── Couriers: WhatsApp + geo + availability ── */
ALTER TABLE couriers
  ADD COLUMN IF NOT EXISTS whatsapp_phone  TEXT,
  ADD COLUMN IF NOT EXISTS is_available    BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS current_lat     NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS current_lng     NUMERIC(11, 8),
  ADD COLUMN IF NOT EXISTS last_seen_at    TIMESTAMPTZ;

/* ── Orders: dispatch tracking ── */
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS assigned_hub_id            UUID REFERENCES hubs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS florist_notified_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS courier_search_started_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estimated_delivery_at      TIMESTAMPTZ;

/* ── dispatch_offers: tracks every hub/courier offer ── */
CREATE TABLE IF NOT EXISTS dispatch_offers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  target_type  TEXT        NOT NULL CHECK (target_type IN ('hub', 'courier')),
  target_id    UUID        NOT NULL,
  offered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  status       TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  UNIQUE (order_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS dispatch_offers_order_idx   ON dispatch_offers (order_id, status);
CREATE INDEX IF NOT EXISTS dispatch_offers_pending_idx ON dispatch_offers (status, offered_at)
  WHERE status = 'pending';

ALTER TABLE dispatch_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON dispatch_offers
  FOR ALL TO service_role USING (true) WITH CHECK (true);
