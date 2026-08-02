-- 073 — Map Woo Membership plan slugs → Labs Observer / Activator / Navigator
-- Without these rows, SSO succeeds but members stay free observer (no plan grant).
-- external_key must match JWT membership_plans / plans claim from fotw-sso.
-- Avoid bare ';' inside COMMENT strings (migrate.py splits on ;).

-- Observer (paid 6-week term) → Labs observer-trial plan (grants_role navigator)
INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:fattail', 'observer-access', id FROM plans WHERE slug = 'observer-trial'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:fattail', 'observer', id FROM plans WHERE slug = 'observer-trial'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:fattail', 'observer-trial', id FROM plans WHERE slug = 'observer-trial'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:fattail', 'labs-observer', id FROM plans WHERE slug = 'observer-trial'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

-- Activator / Navigator (common FOTW-era slugs on fattail.ai)
INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:fattail', 'activator-access', id FROM plans WHERE slug = 'activator'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:fattail', 'navigator-access', id FROM plans WHERE slug = 'navigator'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:fattail', 'navigator', id FROM plans WHERE slug = 'navigator'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:fattail', 'coaching-access', id FROM plans WHERE slug = 'navigator'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

-- Same keys on 0-dte issuer when those products exist there
INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:0-dte', 'observer-access', id FROM plans WHERE slug = 'observer-trial'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:0-dte', 'observer', id FROM plans WHERE slug = 'observer-trial'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);

INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:0-dte', 'navigator-access', id FROM plans WHERE slug = 'navigator'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);
