-- 034 — Wiki replaces Vexy on the Apps grid (Interface Spec v0.1 §1.1, D-i4).
-- Sixth card: slug wiki, title Wiki, entry at /app/wiki. Vexy row retired.

UPDATE apps
SET
  slug = 'wiki',
  title = 'Wiki',
  blurb = 'The compiled map of everything we teach — courses, live sessions, and videos, cross-linked and searchable.',
  status = 'soon',
  sort_order = 5
WHERE slug = 'vexy';

-- Fresh installs that skipped the vexy seed still need a wiki card.
INSERT INTO apps (slug, title, blurb, status, sort_order)
SELECT
  'wiki',
  'Wiki',
  'The compiled map of everything we teach — courses, live sessions, and videos, cross-linked and searchable.',
  'soon',
  5
WHERE NOT EXISTS (SELECT 1 FROM apps WHERE slug = 'wiki');
