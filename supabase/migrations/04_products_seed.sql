-- ============================================================
--  AMUR.BG — Products: add tag column + seed catalog
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS tag TEXT;

-- Seed — skip if catalog already populated
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    INSERT INTO products (title, description, price_eur, flower_count, tag, active)
    VALUES
      ('Розова Елегантност',  '25 бели и розови рози, ароматни лилии, gypsophila',              45.00, 25,  'Бестселър', TRUE),
      ('Алена Страст',        '21 червени рози Ecuador, бабий лен, декоративна зеленина',       55.00, 21,  NULL,        TRUE),
      ('Бяла Приказка',       '17 бели рози, орхидея Dendrobium, еустома',                      65.00, 17,  'Премиум',   TRUE),
      ('Пролетна Радост',     'Сезонни цветя — лалета, нарциси, хиацинти',                     39.00, 15,  NULL,        TRUE),
      ('Корпоративен Шик',    '51 смесени рози, монобукет с луксозна опаковка',                 110.00, 51, 'B2B',       TRUE),
      ('Изненада за Именник', 'Персонализиран букет — свободен избор на флориста',              35.00, 11,  'Именен ден', TRUE);
  END IF;
END $$;
