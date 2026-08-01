-- 060 — Toughness app card (FatTail Hard / True 75 · Hard Spec v1.0 H2+)
-- Top-level Apps grid entry so members need not type /app/toughness by hand.

INSERT INTO apps (slug, title, blurb, status, sort_order)
SELECT
  'toughness',
  'Toughness',
  'FatTail Hard and True 75 Hard. Voluntary capacity training for persistence under load. Process only, never a membership gate.',
  'live',
  25
WHERE NOT EXISTS (SELECT 1 FROM apps WHERE slug = 'toughness')
;
