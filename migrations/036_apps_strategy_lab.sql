-- 036 — Strategy Lab app card + hub blurbs for sectioned Apps organization.
-- UI groups apps into sections (Journey, Practice Log, Strategy Life Cycle,
-- Playbook, Insights). This migration only ensures the Strategy Lab catalog row.
-- Avoid semicolon and double-hyphen inside string literals (naive SQL splitter).

INSERT INTO apps (slug, title, blurb, status, sort_order)
SELECT
  'strategy-lab',
  'Strategy Lab',
  'Build, Prove, Paper, Run. Validate edges before capital. Most ideas die. Survivors get a campaign.',
  'soon',
  3
WHERE NOT EXISTS (SELECT 1 FROM apps WHERE slug = 'strategy-lab')

;

UPDATE apps SET sort_order = 4 WHERE slug = 'playbook'
;

UPDATE apps SET sort_order = 5 WHERE slug = 'statistics'
;

UPDATE apps SET sort_order = 6 WHERE slug = 'wiki'
;

UPDATE apps
SET blurb = 'Record fills and structure outcomes. Process first, not P and L theater. Pairs with Journal for the full daily practice loop.'
WHERE slug = 'trade-log'
;

UPDATE apps
SET blurb = 'Daily notes tied to the routine: preparation, selection, and review. Pairs with Trade Log under Practice Log.'
WHERE slug = 'journal'
;
