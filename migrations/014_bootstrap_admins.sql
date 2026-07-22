-- 014 — Bootstrap platform administrators (Coach directive 2026-07-22)
-- Durable admin grant is identity.role_override (Identity Access §3).
-- Email is the universal key; passwords/SSO links are operator-managed separately.

INSERT INTO identities (email, display_name, role_override)
VALUES
  ('ernie@fattail.ai', 'Ernie Varitimos', 'administrator'),
  ('conor@fattail.ai', 'Conor', 'administrator'),
  ('coach@fattail.ai', 'Coach', 'administrator')
ON DUPLICATE KEY UPDATE
  role_override = 'administrator',
  display_name = IF(display_name = '', VALUES(display_name), display_name);
