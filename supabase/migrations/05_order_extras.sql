-- ============================================================
--  AMUR.BG — Order extras: recipient, schedule, greeting, promo
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_for_self   BOOLEAN      NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS recipient_name      TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone     TEXT,
  ADD COLUMN IF NOT EXISTS greeting_message    TEXT,
  ADD COLUMN IF NOT EXISTS delivery_schedule   TEXT         NOT NULL DEFAULT 'asap'
                             CHECK (delivery_schedule IN ('asap', 'scheduled')),
  ADD COLUMN IF NOT EXISTS delivery_date       DATE,
  ADD COLUMN IF NOT EXISTS delivery_time_window TEXT,
  ADD COLUMN IF NOT EXISTS promo_code          TEXT;
