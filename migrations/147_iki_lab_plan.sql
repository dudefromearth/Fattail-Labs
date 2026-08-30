-- 147 — IKI Lab commercial plan (member product · DL-604).
-- Access is plan presence, not a new role. grants_role=observer so IKI Lab
-- does not elevate Navigator tools. Woo provider_plan_map is a later data
-- packet when Coach names the entitlement key. Do not invent external_key.

INSERT INTO plans (slug, name, grants_role, display_json)
VALUES (
  'iki-lab',
  'IKI Lab',
  'observer',
  '{"tagline":"Information · Knowledge · Intelligence — Your Lab and Analyzer","features":["About","Catalog","Your Lab (Heatmap)","Analyzer"]}'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  grants_role = VALUES(grants_role),
  display_json = VALUES(display_json);
