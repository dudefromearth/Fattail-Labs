-- 148 — Woo IKI Lab (fattail.ai) → Labs plan iki-lab (DL-607).
-- Product already exists on FatTail.ai. SSO is fotw-sso (wordpress:fattail).
-- JWT membership_plans may send slug or name "IKI Lab" → candidates include
-- iki-lab. Do not invent 0-dte keys unless that store sells this product.

INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT p.provider, p.external_key, pl.id
FROM (
  SELECT 'wordpress:fattail' AS provider, 'iki-lab' AS external_key UNION ALL
  SELECT 'wordpress:fattail', 'iki-lab-access' UNION ALL
  SELECT 'wordpress:fattail', 'iki-lab-membership'
) AS p
CROSS JOIN plans pl
WHERE pl.slug = 'iki-lab'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);
