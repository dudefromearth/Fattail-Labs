-- 079 — Strategy Lab replace_lab recovery snapshots (Portability SLP-15)

CREATE TABLE IF NOT EXISTS strategy_lab_recoveries (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id   BIGINT UNSIGNED NOT NULL,
  recovery_id   VARCHAR(32) NOT NULL,
  pack_json     JSON NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    TIMESTAMP NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_slr_recovery (recovery_id),
  KEY ix_slr_owner_created (identity_id, created_at),
  CONSTRAINT fk_slr_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
