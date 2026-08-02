-- 074 — Full Woo → Labs map: Observer, Activator, Navigator, Coaching
-- JWT membership_plans keys must match external_key (or normalized form).
-- Avoid bare ';' inside string literals (migrate.py).

-- Helper pattern: INSERT … SELECT plan id by Labs plan slug.

-- === Observer → observer-trial (grants_role = navigator for the term) ===
INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT p.provider, p.external_key, pl.id
FROM (
  SELECT 'wordpress:fattail' AS provider, 'observer-access' AS external_key UNION ALL
  SELECT 'wordpress:fattail', 'observer' UNION ALL
  SELECT 'wordpress:fattail', 'observer-trial' UNION ALL
  SELECT 'wordpress:fattail', 'labs-observer' UNION ALL
  SELECT 'wordpress:fattail', 'observer-membership' UNION ALL
  SELECT 'wordpress:fattail', 'fattail-observer' UNION ALL
  SELECT 'wordpress:0-dte', 'observer-access' UNION ALL
  SELECT 'wordpress:0-dte', 'observer' UNION ALL
  SELECT 'wordpress:0-dte', 'observer-trial' UNION ALL
  SELECT 'wordpress:0-dte', 'labs-observer' UNION ALL
  SELECT 'wordpress:0-dte', 'observer-membership'
) AS p
CROSS JOIN plans pl
WHERE pl.slug = 'observer-trial'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

-- === Activator → activator ===
INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT p.provider, p.external_key, pl.id
FROM (
  SELECT 'wordpress:fattail' AS provider, 'activator-access' AS external_key UNION ALL
  SELECT 'wordpress:fattail', 'activator' UNION ALL
  SELECT 'wordpress:fattail', 'labs-membership' UNION ALL
  SELECT 'wordpress:fattail', 'labs-activator' UNION ALL
  SELECT 'wordpress:fattail', 'activator-membership' UNION ALL
  SELECT 'wordpress:0-dte', 'activator-access' UNION ALL
  SELECT 'wordpress:0-dte', 'activator' UNION ALL
  SELECT 'wordpress:0-dte', 'labs-membership' UNION ALL
  SELECT 'wordpress:0-dte', 'labs-activator'
) AS p
CROSS JOIN plans pl
WHERE pl.slug = 'activator'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

-- labs-membership historically pointed at labs-membership plan (also activator role).
-- Keep both: map labs-membership → activator plan for consistency of slug naming.
INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:fattail', 'labs-membership', id FROM plans WHERE slug = 'activator'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:0-dte', 'labs-membership', id FROM plans WHERE slug = 'activator'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

-- === Navigator → navigator ===
INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT p.provider, p.external_key, pl.id
FROM (
  SELECT 'wordpress:fattail' AS provider, 'navigator-access' AS external_key UNION ALL
  SELECT 'wordpress:fattail', 'navigator' UNION ALL
  SELECT 'wordpress:fattail', 'labs-navigator' UNION ALL
  SELECT 'wordpress:fattail', 'navigator-membership' UNION ALL
  SELECT 'wordpress:0-dte', 'navigator-access' UNION ALL
  SELECT 'wordpress:0-dte', 'navigator' UNION ALL
  SELECT 'wordpress:0-dte', 'labs-navigator'
) AS p
CROSS JOIN plans pl
WHERE pl.slug = 'navigator'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

-- === Coaching → coaching plan (grants_role navigator) ===
INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT p.provider, p.external_key, pl.id
FROM (
  SELECT 'wordpress:fattail' AS provider, 'coaching-access' AS external_key UNION ALL
  SELECT 'wordpress:fattail', 'coaching' UNION ALL
  SELECT 'wordpress:fattail', 'coaching-membership' UNION ALL
  SELECT 'wordpress:fattail', 'labs-coaching' UNION ALL
  SELECT 'wordpress:0-dte', 'coaching-access' UNION ALL
  SELECT 'wordpress:0-dte', 'coaching' UNION ALL
  SELECT 'wordpress:0-dte', 'coaching-membership' UNION ALL
  SELECT 'wordpress:0-dte', 'labs-coaching'
) AS p
CROSS JOIN plans pl
WHERE pl.slug = 'coaching'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);
