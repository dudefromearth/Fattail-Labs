-- 069 — Shorter Toughness hub description (returner-first layout)
-- Full guide lives at /app/toughness/about. Avoid bare ';' inside strings.

UPDATE site_pages
SET description_md = 'Voluntary capacity training under load. Process only — never required for membership.'
WHERE slug = 'toughness'
  AND (
    description_md LIKE '%Process Integrity%'
    OR description_md LIKE '%P and L theater%'
    OR description_md LIKE '%P&L%'
  );
