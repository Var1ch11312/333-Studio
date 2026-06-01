-- ============================================================
--  AMUR.BG — Sprint 3: Couriers + name-day opt-ins
--  Migration: 02_couriers
-- ============================================================

-- ── Couriers ────────────────────────────────────────────────
CREATE TABLE couriers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  phone      TEXT        NOT NULL,
  viber_id   TEXT,                          -- Viber subscriber ID for bot dispatch
  hub_id     UUID        REFERENCES hubs(id) ON DELETE SET NULL,
  active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER couriers_updated_at
  BEFORE UPDATE ON couriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Attach courier assignment to orders ──────────────────────
ALTER TABLE orders ADD COLUMN courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL;

-- ── Name-day opt-in contacts ─────────────────────────────────
-- Created when a customer checks "remind me about name-days" at checkout
CREATE TABLE nameday_optins (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT        NOT NULL UNIQUE,
  name       TEXT,
  viber_id   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track which reminders have been sent (avoid duplicates)
CREATE TABLE nameday_reminders_sent (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT        NOT NULL,
  sent_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  names      TEXT        NOT NULL,          -- comma-separated name-day names
  UNIQUE (phone, sent_date)
);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE couriers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE nameday_optins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE nameday_reminders_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couriers_service_all"
  ON couriers FOR ALL TO service_role USING (TRUE);

CREATE POLICY "nameday_optins_service_all"
  ON nameday_optins FOR ALL TO service_role USING (TRUE);

CREATE POLICY "nameday_optins_anon_insert"
  ON nameday_optins FOR INSERT TO anon WITH CHECK (TRUE);

CREATE POLICY "nameday_reminders_service_all"
  ON nameday_reminders_sent FOR ALL TO service_role USING (TRUE);

-- ── Seed: 8 launch couriers (replace with real data) ─────────
INSERT INTO couriers (name, phone, hub_id) VALUES
  ('Иван К.', '+359881000001', (SELECT id FROM hubs WHERE name = 'Хъб Център' LIMIT 1)),
  ('Петър М.', '+359881000002', (SELECT id FROM hubs WHERE name = 'Хъб Център' LIMIT 1)),
  ('Георги С.', '+359881000003', (SELECT id FROM hubs WHERE name = 'Хъб Център' LIMIT 1)),
  ('Димитър В.', '+359881000004', (SELECT id FROM hubs WHERE name = 'Хъб Център' LIMIT 1)),
  ('Стефан Н.', '+359881000005', (SELECT id FROM hubs WHERE name = 'Хъб Север' LIMIT 1)),
  ('Николай Б.', '+359881000006', (SELECT id FROM hubs WHERE name = 'Хъб Север' LIMIT 1)),
  ('Тодор Р.', '+359881000007', (SELECT id FROM hubs WHERE name = 'Хъб Север' LIMIT 1)),
  ('Александър Д.', '+359881000008', (SELECT id FROM hubs WHERE name = 'Хъб Север' LIMIT 1));
