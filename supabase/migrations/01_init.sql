-- ============================================================
--  AMUR.BG — Core Schema (MVP)
--  Migration: 01_init
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── updated_at helper ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────────
--  hubs  (partner florist hubs / pickup locations)
-- ────────────────────────────────────────────────────────────
CREATE TABLE hubs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  address       TEXT        NOT NULL,
  lat           NUMERIC(10, 8) NOT NULL,
  lng           NUMERIC(11, 8) NOT NULL,
  active_status BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER hubs_updated_at
  BEFORE UPDATE ON hubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed: two launch hubs in Burgas
INSERT INTO hubs (name, address, lat, lng) VALUES
  ('Хъб Център',  'ул. Александровска 21, Бургас', 42.4943, 27.4726),
  ('Хъб Север',   'бул. Стефан Стамболов 5, Бургас', 42.5080, 27.4660);

-- ────────────────────────────────────────────────────────────
--  products  (bouquet catalog)
-- ────────────────────────────────────────────────────────────
CREATE TABLE products (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  description  TEXT,
  price_eur    NUMERIC(10, 2) NOT NULL CHECK (price_eur > 0),
  -- price_bgn stored for fast display (1 EUR = 1.95583 BGN)
  price_bgn    NUMERIC(10, 2) GENERATED ALWAYS AS (ROUND(price_eur * 1.95583, 2)) STORED,
  image_url    TEXT,
  hub_id       UUID        REFERENCES hubs(id) ON DELETE SET NULL,
  flower_count INTEGER     NOT NULL DEFAULT 1 CHECK (flower_count > 0),
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
--  orders
-- ────────────────────────────────────────────────────────────
CREATE TYPE order_status AS ENUM (
  'pending',
  'paid',
  'crafting',
  'delivering',
  'delivered'
);

CREATE TYPE payment_method AS ENUM ('card', 'cod');

CREATE TABLE orders (
  id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name            TEXT          NOT NULL,
  customer_phone           TEXT          NOT NULL,
  delivery_address         TEXT          NOT NULL,
  delivery_lat             NUMERIC(10, 8),
  delivery_lng             NUMERIC(11, 8),
  total_amount_eur         NUMERIC(10, 2) NOT NULL CHECK (total_amount_eur > 0),
  stripe_payment_intent_id TEXT,
  payment_method           payment_method NOT NULL DEFAULT 'card',
  hub_id                   UUID          REFERENCES hubs(id) ON DELETE SET NULL,
  status                   order_status  NOT NULL DEFAULT 'pending',
  -- Set TRUE after flower count validation passes (must be odd)
  flower_count_validated   BOOLEAN       NOT NULL DEFAULT FALSE,
  photo_proof_url          TEXT,
  notes                    TEXT,
  -- GDPR: explicit opt-in for name-day reminders
  nameday_optin            BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for dispatcher to pull by status + hub
CREATE INDEX orders_status_hub_idx ON orders (status, hub_id);

-- ────────────────────────────────────────────────────────────
--  order_items
-- ────────────────────────────────────────────────────────────
CREATE TABLE order_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID        REFERENCES products(id) ON DELETE SET NULL,
  quantity       INTEGER     NOT NULL CHECK (quantity > 0),
  unit_price_eur NUMERIC(10, 2) NOT NULL CHECK (unit_price_eur > 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
--  name_days  (Bulgarian name-day calendar)
--  Source: BAS / Wikipedia — verify annually
-- ────────────────────────────────────────────────────────────
CREATE TABLE name_days (
  id     UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name   TEXT    NOT NULL,
  month  SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  day    SMALLINT NOT NULL CHECK (day BETWEEN 1 AND 31),
  UNIQUE (name, month, day)
);

-- Seed: major peak days (expand with full BAS list)
INSERT INTO name_days (name, month, day) VALUES
  -- Ивановден (7 ян.)
  ('Иван', 1, 7), ('Ивана', 1, 7), ('Йоана', 1, 7), ('Йоан', 1, 7),
  -- Трифон Зарезан (14 февр.)
  ('Трифон', 2, 14),
  -- Тодоровден (1-ва събота на март — приблизително 1 март)
  ('Тодор', 3, 1), ('Тодора', 3, 1),
  -- Лазаровден (събота преди Цветница — варира; използваме 12 апр. като placeholder)
  ('Лазар', 4, 12), ('Лазара', 4, 12),
  -- Гергьовден (6 май)
  ('Георги', 5, 6), ('Гергана', 5, 6), ('Геновева', 5, 6), ('Григор', 5, 6),
  -- 24 май
  ('Кирил', 5, 24), ('Методи', 5, 24),
  -- Петровден (29 юни)
  ('Петър', 6, 29), ('Петя', 6, 29),
  -- Илинден (20 юли)
  ('Илия', 7, 20), ('Илиана', 7, 20),
  -- Богородица (15 авг.)
  ('Мария', 8, 15), ('Марийка', 8, 15), ('Маринела', 8, 15),
  -- Димитровден (26 окт.)
  ('Димитър', 10, 26), ('Митко', 10, 26), ('Дима', 10, 26),
  -- Никулден (6 дек.)
  ('Никола', 12, 6), ('Николай', 12, 6), ('Николина', 12, 6);

-- ────────────────────────────────────────────────────────────
--  Row Level Security
-- ────────────────────────────────────────────────────────────
ALTER TABLE hubs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE name_days  ENABLE ROW LEVEL SECURITY;

-- Public (anon) can read active hubs, active products, name_days
CREATE POLICY "hubs_public_read"
  ON hubs FOR SELECT USING (active_status = TRUE);

CREATE POLICY "products_public_read"
  ON products FOR SELECT USING (active = TRUE);

CREATE POLICY "name_days_public_read"
  ON name_days FOR SELECT TO anon USING (TRUE);

-- Anyone can create an order (guest checkout)
CREATE POLICY "orders_anon_insert"
  ON orders FOR INSERT TO anon WITH CHECK (TRUE);

-- Only the service role can read / update orders (hub dashboard uses service key)
CREATE POLICY "orders_service_all"
  ON orders FOR ALL TO service_role USING (TRUE);

CREATE POLICY "order_items_anon_insert"
  ON order_items FOR INSERT TO anon WITH CHECK (TRUE);

CREATE POLICY "order_items_service_all"
  ON order_items FOR ALL TO service_role USING (TRUE);
