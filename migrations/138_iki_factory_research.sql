-- 138 — IKI Factory research (IF-2)
-- Versioned skills registry + research window + finding fields.
-- No production skill is seeded (Coach has not named one).

CREATE TABLE IF NOT EXISTS iki_factory_skills (
  skill_id    VARCHAR(64) NOT NULL,
  version     VARCHAR(32) NOT NULL,
  status      VARCHAR(16) NOT NULL DEFAULT 'registered',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (skill_id, version),
  KEY ix_iki_factory_skills_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE iki_factory_cards
  ADD COLUMN findings_json JSON NULL AFTER notes,
  ADD COLUMN remainder_json JSON NULL AFTER findings_json,
  ADD COLUMN sources_json JSON NULL AFTER remainder_json,
  ADD COLUMN rank_n INT NULL AFTER sources_json,
  ADD COLUMN rank_reason TEXT NULL AFTER rank_n,
  ADD COLUMN research_window_ends_at TIMESTAMP NULL AFTER pickup_at;

INSERT INTO agent_principals (callsign, display_name, status) VALUES
  ('gemba', 'Lean Factory Worker', 'active')
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  status = 'active';
