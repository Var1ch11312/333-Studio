-- ============================================================
--  Kiss My Flowers — Catalog Rebrand + 8 Realistic Bouquets
--  Migration: 10_kiss_my_flowers_catalog
-- ============================================================

-- Clear legacy seed and replace with 8 market-calibrated bouquets.
-- All flower_count values are ODD (Bulgarian cultural rule).
-- Prices calibrated to Burgas premium delivery market (EUR).
-- price_bgn is GENERATED via (price_eur * 1.95583), no need to insert.

-- Keeps in sync with lib/catalog.ts (same titles, prices, photos).
-- Replace the image_url sample photos with your own product photography.

DELETE FROM order_items WHERE product_id IN (SELECT id FROM products);
DELETE FROM products;

INSERT INTO products (title, description, price_eur, flower_count, tag, image_url, active)
VALUES
  (
    'Розова Мечта',
    '11 розово-бели рози с деликатен аромат, гипсофила и декоративна зеленина. Класически букет за всеки повод.',
    32.00, 11, NULL,
    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&q=80', TRUE
  ),
  (
    'Слънчева Радост',
    '9 слънчогледа — символ на топлина и вярност. Сезонни допълнения по избор на флориста.',
    37.00, 9, 'Сезонен',
    'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=900&q=80', TRUE
  ),
  (
    'Нежна Прегръдка',
    '21 розови рози и бели пиони — романтичен букет за годишнини и специални поводи.',
    59.00, 21, 'Бестселър',
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=900&q=80', TRUE
  ),
  (
    'Алена Страст',
    '21 червени рози Ecuador с дълги стъбла и интензивен аромат. Декоративна зеленина и бабин лен.',
    69.00, 21, NULL,
    'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=900&q=80', TRUE
  ),
  (
    'Бяла Симфония',
    '17 бели рози с орхидея Dendrobium и еустома. Луксозна опаковка с панделка. Символ на чистота.',
    89.00, 17, 'Премиум',
    'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=900&q=80', TRUE
  ),
  (
    'Пролетна Поема',
    '15 стъбла лалета, нарциси и зюмбюли. Свежест и аромат на пролетта. Наличен март–май.',
    45.00, 15, 'Сезонен',
    'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=900&q=80', TRUE
  ),
  (
    'Корпоративен Шик',
    '51 смесени рози — монобукет с луксозна опаковка и персонална картичка. За корпоративни подаръци и партньори.',
    139.00, 51, 'B2B',
    'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=900&q=80', TRUE
  ),
  (
    'Изненада за Именник',
    '11 стъбла — персонализиран букет по избор на флориста, съобразен с повода и сезона.',
    39.00, 11, 'Именен ден',
    'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=900&q=80', TRUE
  );
