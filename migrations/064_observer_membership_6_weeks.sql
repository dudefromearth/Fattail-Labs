-- 064 — Observer membership duration: 4 weeks → 6 weeks (habit formation).
-- Product already sells 6 weeks / $102; align plans.display_json for the pricing UI.
-- Avoid semicolon inside string literals (naive SQL splitter).

UPDATE plans
SET display_json = '{"prices":[{"label":"$17 / week for 6 weeks ($102 total)","interval":"week"}],"tagline":"Six weeks of full Navigator access — time for habits to form","features":["Everything Navigator includes","Coaching, Discord, app, and all courses","Six weeks so process habits can stick (experts: ~33–66 days)","Complete the 6 weeks: keep the courses for a year"]}'
WHERE slug = 'observer-trial'
;
