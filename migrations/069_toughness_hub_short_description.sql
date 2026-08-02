-- 069 — Shorter Toughness hub description (returner-first layout)
-- Full guide lives at /app/toughness/about. Avoid bare ';' inside strings.

UPDATE site_pages
SET description_md = 'Complete every required activity every day. Miss one → restart day one.'
WHERE slug = 'toughness';
