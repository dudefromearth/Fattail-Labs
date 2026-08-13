-- 124 — Apps hub catalog order (Catalog-Order Spec v1.1 · DL-319)
-- Editorial order for /app cards, same contract as courses.sort_order.
-- Ensures catalog parent rows exist (Practice suite + Options Lab) so every
-- visible card has a real id for POST /api/admin/apps/reorder.
-- Avoid semicolon and double-hyphen inside string literals (naive SQL splitter).

INSERT INTO apps (slug, title, blurb, status, sort_order)
SELECT
  'practice-log',
  'Practice',
  'Reports home (equity and drawdown), Trade Log, Journal, and Playbook. Process first.',
  'live',
  20
WHERE NOT EXISTS (SELECT 1 FROM apps WHERE slug = 'practice-log')
;

INSERT INTO apps (slug, title, blurb, status, sort_order)
SELECT
  'options-lab',
  'Options Lab',
  'Chain ladder: pick a name from the shared universe, the next three expiries, and watch strikes update in place. Process structure, not P and L theater.',
  'live',
  50
WHERE NOT EXISTS (SELECT 1 FROM apps WHERE slug = 'options-lab')
;

-- Seed current hardcoded TOP_LEVEL_ORDER so the first migrated catalog
-- matches today's /app grid (x10 spacing, same as courses).
UPDATE apps SET sort_order = 10 WHERE slug = 'journey'
;
UPDATE apps SET sort_order = 20 WHERE slug = 'practice-log'
;
UPDATE apps SET sort_order = 30 WHERE slug = 'toughness'
;
UPDATE apps SET sort_order = 40 WHERE slug = 'strategy-lab'
;
UPDATE apps SET sort_order = 50 WHERE slug = 'options-lab'
;
UPDATE apps SET sort_order = 60 WHERE slug = 'community'
;
UPDATE apps SET sort_order = 70 WHERE slug = 'wiki'
;
