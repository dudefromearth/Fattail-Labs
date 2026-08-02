-- 070 — Toughness hub: one short blurb (daily rules are the main text)
-- Avoid bare ';' inside string literals (migrate.py).

UPDATE site_pages
SET description_md = 'Complete every required activity every day. Miss one → restart day one.'
WHERE slug = 'toughness';
