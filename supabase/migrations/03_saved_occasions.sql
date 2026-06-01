-- ============================================================
--  AMUR.BG — Sprint USM: Personalized Name-Day Reminders
--  Migration: 03_saved_occasions
-- ============================================================

/**
 * Клиент сохраняет именины КОНКРЕТНОГО человека (получателя).
 * Система шлёт Viber-напоминание за reminder_days_before дней до даты.
 * Это отличается от nameday_optins (общий болгарский календарь).
 */
CREATE TABLE saved_occasions (
  id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone      TEXT     NOT NULL,
  recipient_name      TEXT     NOT NULL,
  month               SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  day                 SMALLINT NOT NULL CHECK (day BETWEEN 1 AND 31),
  reminder_days_before SMALLINT NOT NULL DEFAULT 2 CHECK (reminder_days_before BETWEEN 1 AND 7),
  order_id            UUID     REFERENCES orders(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_phone, recipient_name, month, day)
);

-- RLS
ALTER TABLE saved_occasions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_occasions_anon_insert"
  ON saved_occasions FOR INSERT TO anon WITH CHECK (TRUE);

CREATE POLICY "saved_occasions_service_all"
  ON saved_occasions FOR ALL TO service_role USING (TRUE);
