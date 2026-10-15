-- 155 — Strategy Lab /app card: silent Coming soon.
-- Take down public catalog sell copy. Name only. No product story.
-- Renumbered from 131: that slot is taken on main (131_member_alerts.sql).

UPDATE apps
SET
  status = 'soon',
  blurb = ''
WHERE slug = 'strategy-lab'
;
