-- 056 — Member retrospective notifications (Spec v0.7.1 §14 · R7)
-- Channel policy (Mike interim lock): in-app first; Family B material never
-- leaves the app boundary via email without Mike-approved payload.

CREATE TABLE IF NOT EXISTS member_notifications (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id       BIGINT UNSIGNED NOT NULL,
  kind              VARCHAR(64)  NOT NULL,
  title             VARCHAR(512) NOT NULL,
  body              TEXT NOT NULL,
  href              VARCHAR(1024) NOT NULL,
  channel           VARCHAR(16)  NOT NULL DEFAULT 'in_app',
  period_key        VARCHAR(64)  NOT NULL,
  resource_type     VARCHAR(64)  NULL,
  resource_id       VARCHAR(64)  NULL,
  payload_json      JSON NULL,
  email_status      VARCHAR(16)  NOT NULL DEFAULT 'skipped',
  suppressed_reason VARCHAR(64)  NULL,
  read_at           TIMESTAMP NULL DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Once per period (Spec §14) — second insert for same period is rejected
  UNIQUE KEY uq_mn_period (identity_id, kind, period_key),
  KEY ix_mn_identity_read (identity_id, read_at, id),
  KEY ix_mn_created (created_at),
  CONSTRAINT fk_mn_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
