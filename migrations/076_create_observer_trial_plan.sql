-- 076 — Create the observer-trial plan (was missing on production).
--
-- Root cause: observer-trial is created only by seed_dev.py (dev-only), so
-- production never had the plan row. Migrations 064/065 (pricing) and 073/074
-- (provider_plan_map) all used `... WHERE slug = 'observer-trial'`, matched 0
-- rows, and silently no-op'd on prod — the paid 6-week Observer membership had
-- no plan, could not be sold, and its card rendered bare.
--
-- This migration creates the plan idempotently (grants navigator-level access
-- for the term) with the display used on dev, then re-asserts the observer-trial
-- provider mappings that 073/074 failed to insert. Distinct from the free
-- `observer` base-tier plan (grants_role=observer), which is left untouched.

INSERT INTO plans (slug, name, grants_role, display_json)
VALUES (
  'observer-trial',
  'Observer Trial',
  'navigator',
  '{"tagline":"Six weeks of full Navigator access — time for habits to form","prices":[{"label":"$17/wk or $102 · 6 weeks","interval":"week"}],"features":["Everything Navigator includes","Coaching, Discord, app, and all courses","Six weeks so process habits can stick (experts: ~33-66 days)","Complete the 6 weeks: keep the courses for a year"]}'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  grants_role = VALUES(grants_role),
  display_json = VALUES(display_json);

-- Re-assert observer-trial provider_plan_map entries (mirror of 074's set;
-- idempotent via uq_ppm_provider_key). Now that the plan exists the JOIN matches.
INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT k.provider, k.external_key, pl.id
FROM (
  SELECT 'wordpress:fattail' AS provider, 'observer-access'     AS external_key UNION ALL
  SELECT 'wordpress:fattail', 'observer'            UNION ALL
  SELECT 'wordpress:fattail', 'observer-trial'      UNION ALL
  SELECT 'wordpress:fattail', 'labs-observer'       UNION ALL
  SELECT 'wordpress:fattail', 'observer-membership' UNION ALL
  SELECT 'wordpress:fattail', 'fattail-observer'    UNION ALL
  SELECT 'wordpress:0-dte',   'observer-access'     UNION ALL
  SELECT 'wordpress:0-dte',   'observer'            UNION ALL
  SELECT 'wordpress:0-dte',   'observer-trial'      UNION ALL
  SELECT 'wordpress:0-dte',   'labs-observer'       UNION ALL
  SELECT 'wordpress:0-dte',   'observer-membership'
) AS k
JOIN plans pl ON pl.slug = 'observer-trial'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);
