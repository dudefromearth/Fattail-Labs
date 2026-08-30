-- 149 — Time Machine hold resident-bytes (C11 watch). Coach: ship 553 MB and
-- watch; instrument per-hold heap so thin machines show in data, not support.

CREATE TABLE IF NOT EXISTS tm_hold_resident (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id   BIGINT UNSIGNED NOT NULL,
  day           DATE NOT NULL,
  symbol        VARCHAR(16) NOT NULL,
  gen_count     INT UNSIGNED NOT NULL,
  heap_bytes    BIGINT UNSIGNED NULL,
  fidelity      DECIMAL(6, 4) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_tmhr_created (created_at),
  KEY ix_tmhr_day (day, symbol),
  CONSTRAINT fk_tmhr_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
