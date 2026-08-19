-- 131 — Strategy Lab /app card: silent Coming soon.
-- Take down public catalog sell copy. Name only. No product story.

UPDATE apps
SET
  status = 'soon',
  blurb = ''
WHERE slug = 'strategy-lab'
;
