-- 018 — Admin notifications (email + in-app)
-- Spec: FatTail-Labs-Admin-Notifications-Spec-v1.0.md

CREATE TABLE IF NOT EXISTS admin_notifications (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  kind            VARCHAR(64)  NOT NULL,
  title           VARCHAR(512) NOT NULL,
  body            TEXT NOT NULL,
  href            VARCHAR(1024) NOT NULL,
  resource_type   VARCHAR(64)  NULL,
  resource_id     VARCHAR(64)  NULL,
  read_at         TIMESTAMP NULL DEFAULT NULL,
  email_status    VARCHAR(16)  NOT NULL DEFAULT 'pending',
  email_error     VARCHAR(512) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_an_identity_read (identity_id, read_at, id),
  KEY ix_an_created (created_at),
  CONSTRAINT fk_an_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
