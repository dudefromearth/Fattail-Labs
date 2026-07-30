-- 055 — Journal Retrospective Spec v0.7.1 (R1)
-- Trader cadence setting + history; retro ceremony columns.

ALTER TABLE identities
  ADD COLUMN retro_cadence_days INT UNSIGNED NULL
    AFTER is_demo;

CREATE TABLE IF NOT EXISTS member_retro_cadence_history (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  cadence_days    INT UNSIGNED NOT NULL,
  effective_from  DATE NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_mrch_owner_from (identity_id, effective_from),
  CONSTRAINT fk_mrch_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE member_retrospectives
  ADD COLUMN prompt_version_id VARCHAR(64) NULL
    AFTER agent_json,
  ADD COLUMN cadence_days_at_period INT UNSIGNED NULL
    AFTER prompt_version_id,
  ADD COLUMN period_index INT UNSIGNED NULL
    AFTER cadence_days_at_period,
  ADD COLUMN interrupted TINYINT(1) NOT NULL DEFAULT 0
    AFTER period_index;
