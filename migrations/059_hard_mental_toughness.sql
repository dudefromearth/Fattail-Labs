-- 059 — FatTail Hard / Mental Toughness (Hard Spec v1.0 · H1)
-- Identity-scoped enrollments + daily compliance logs. Private; no board.
-- Photos: nullable resource ref for H4; progress_note for H2 record.

CREATE TABLE IF NOT EXISTS member_hard_enrollments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  program_kind    VARCHAR(32) NOT NULL,
  variant_id      VARCHAR(64) NOT NULL,
  status          VARCHAR(32) NOT NULL DEFAULT 'active',
  sprint_days     INT UNSIGNED NOT NULL,
  started_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at        TIMESTAMP NULL DEFAULT NULL,
  consent_json    JSON NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_mhe_owner_status (identity_id, status),
  KEY ix_mhe_owner_started (identity_id, started_at),
  CONSTRAINT fk_mhe_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_hard_daily_logs (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  enrollment_id      BIGINT UNSIGNED NOT NULL,
  identity_id        BIGINT UNSIGNED NOT NULL,
  log_date           DATE NOT NULL,
  tasks_json         JSON NOT NULL,
  complete           TINYINT(1) NOT NULL DEFAULT 0,
  progress_note      TEXT NULL,
  photo_resource_id  BIGINT UNSIGNED NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mhd_enroll_date (enrollment_id, log_date),
  KEY ix_mhd_owner_date (identity_id, log_date),
  CONSTRAINT fk_mhd_enrollment FOREIGN KEY (enrollment_id)
    REFERENCES member_hard_enrollments (id) ON DELETE CASCADE,
  CONSTRAINT fk_mhd_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
