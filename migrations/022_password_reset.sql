-- 022 — Native password reset tokens (forgot-password flow)
-- Spec: FatTail-Labs-Password-Reset-Spec-v1.0.md
-- Store only SHA-256 of the secret token; never the raw token.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  token_hash      CHAR(64)       NOT NULL,
  expires_at      DATETIME       NOT NULL,
  used_at         DATETIME       NULL DEFAULT NULL,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_ip      VARCHAR(64)    NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_prt_token_hash (token_hash),
  KEY ix_prt_identity (identity_id, created_at),
  KEY ix_prt_expires (expires_at),
  CONSTRAINT fk_prt_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
