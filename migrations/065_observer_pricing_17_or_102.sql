-- 065 — Observer pricing display: $17/wk or $102 for six weeks.
-- Avoid semicolon inside string literals (naive SQL splitter).

UPDATE plans
SET display_json = '{"prices":[{"label":"$17/wk or $102 · 6 weeks","interval":"week"}],"tagline":"Six weeks of full Navigator access — time for habits to form","features":["Everything Navigator includes","Coaching, Discord, app, and all courses","Six weeks so process habits can stick (experts: ~33–66 days)","Complete the 6 weeks: keep the courses for a year"]}'
WHERE slug = 'observer-trial'
;
