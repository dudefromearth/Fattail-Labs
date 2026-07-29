-- 041 — Practice suite naming: Statistics → Reports; journal live for calendar shell.
-- Product nav: Trade Log · Reports · Journal · Playbook.
-- Avoid semicolon and double-hyphen inside string literals (naive SQL splitter).

UPDATE apps
SET
  slug = 'reports',
  title = 'Reports',
  blurb = 'Adherence and process metrics across accounts. Totals and charts, never profit claims.'
WHERE slug = 'statistics'
;

INSERT INTO apps (slug, title, blurb, status, sort_order)
SELECT
  'reports',
  'Reports',
  'Adherence and process metrics across accounts. Totals and charts, never profit claims.',
  'soon',
  4
WHERE NOT EXISTS (SELECT 1 FROM apps WHERE slug = 'reports')
;

UPDATE apps
SET
  title = 'Journal',
  blurb = 'Calendar-structured process notes: preparation, selection, and review. Pairs with Trade Log.',
  status = 'live'
WHERE slug = 'journal'
;

UPDATE apps
SET blurb = 'Record fills and structure outcomes. Process first, not P and L theater. Practice suite with Reports, Journal, Playbook.'
WHERE slug = 'trade-log'
;

UPDATE apps
SET blurb = 'Your defined-risk setups and rules. The book you actually trade from. Practice suite with Trade Log, Reports, Journal.'
WHERE slug = 'playbook'
;
