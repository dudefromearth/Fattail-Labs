-- 046 — Member retrospectives (Journal-Retrospective Spec v0.2, slices R1–R3)
-- Started from Journal type=retrospective. Gather scope: since last complete
-- or maiden journey. Dual report JSON: P&L + process + integrity + comparison.
-- Agent fields reserved; agent analyze is later slice.

CREATE TABLE IF NOT EXISTS member_retrospectives (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  status          VARCHAR(32) NOT NULL DEFAULT 'draft',
  is_maiden       TINYINT(1) NOT NULL DEFAULT 0,
  scope_start     DATETIME NOT NULL,
  scope_end       DATETIME NOT NULL,
  title           VARCHAR(255) NOT NULL DEFAULT '',
  body_md         MEDIUMTEXT NOT NULL,
  report_json     JSON NULL,
  comparison_json JSON NULL,
  agent_json      JSON NULL,
  completed_at    TIMESTAMP NULL DEFAULT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_mretro_owner_status (identity_id, status, completed_at),
  KEY ix_mretro_owner_complete (identity_id, completed_at),
  CONSTRAINT fk_mretro_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
