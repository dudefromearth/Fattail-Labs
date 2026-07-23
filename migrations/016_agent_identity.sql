-- 016 — Agent identity (Phase A)
-- Spec: FatTail-Labs-Agent-Identity-Spec-v1.0.md
-- Agents authenticate as principals with API keys; humans mint/revoke keys.

CREATE TABLE IF NOT EXISTS agent_principals (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  callsign     VARCHAR(64)  NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  status       VARCHAR(16)  NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_agent_callsign (callsign)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agent_api_keys (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  principal_id BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(128) NOT NULL DEFAULT 'default',
  key_prefix   VARCHAR(16)  NOT NULL,
  key_hash     VARCHAR(255) NOT NULL,
  scopes_json  JSON NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL DEFAULT NULL,
  revoked_at   TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_agent_key_prefix (key_prefix),
  KEY ix_agent_key_principal (principal_id),
  CONSTRAINT fk_agent_key_principal FOREIGN KEY (principal_id)
    REFERENCES agent_principals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS actor_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_kind  VARCHAR(16)  NOT NULL,
  actor_id    BIGINT UNSIGNED NOT NULL,
  actor_label VARCHAR(255) NOT NULL,
  action      VARCHAR(128) NOT NULL,
  resource    VARCHAR(255) NULL,
  detail_json JSON NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_actor_kind_id (actor_kind, actor_id),
  KEY ix_actor_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seated studio principals (keys minted by administrators)
INSERT INTO agent_principals (callsign, display_name, status) VALUES
  ('quebec', 'Content Production Operations', 'active'),
  ('bravo', 'Content Research Specialist', 'active'),
  ('november', 'Instructional Designer', 'active'),
  ('romeo', 'Script & Short-Form Writer', 'active'),
  ('papa', 'Video Producer', 'active'),
  ('hotel', 'Trading-Domain Guardian', 'active'),
  ('victor', 'Taleb Doctrine Channel', 'active'),
  ('whiskey', 'Spitznagel Strategy Channel', 'active'),
  ('yankee', 'Mandelbrot Lineage Channel', 'active'),
  ('tango', 'Member Archetype Guardian', 'active')
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  status = 'active';
