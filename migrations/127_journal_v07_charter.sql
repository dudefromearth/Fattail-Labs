-- 127 — Journal Session v0.7 charter stores (DL-325 / DL-326)
-- Drafts · confirmations · surfacing ledger. No stored open_positions table.
-- Idempotent: a partial apply may have added the column + first tables.

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'member_journal_sessions'
    AND COLUMN_NAME = 'structured_provenance_json'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE member_journal_sessions ADD COLUMN structured_provenance_json JSON NULL COMMENT ''per-field projection of member_journal_confirmations'' AFTER structured_json',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS member_journal_drafts (
  identity_id   BIGINT UNSIGNED NOT NULL,
  journal_date  DATE NOT NULL,
  body_md       TEXT NOT NULL,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (identity_id, journal_date),
  CONSTRAINT fk_mjd_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_journal_confirmations (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id            BIGINT UNSIGNED NOT NULL,
  identity_id           BIGINT UNSIGNED NOT NULL,
  field_key             VARCHAR(64) NOT NULL,
  value_present         TINYINT(1) NOT NULL DEFAULT 0,
  source_message_ids_json JSON NULL,
  method                VARCHAR(16) NOT NULL,
  confirmed_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_mjc_session (session_id, confirmed_at),
  KEY ix_mjc_identity (identity_id),
  CONSTRAINT fk_mjc_session FOREIGN KEY (session_id)
    REFERENCES member_journal_sessions (id) ON DELETE CASCADE,
  CONSTRAINT fk_mjc_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One surfacing ledger per (identity, date, kind) — fired or consumed (B-P1)
CREATE TABLE IF NOT EXISTS member_journal_surfacing (
  identity_id   BIGINT UNSIGNED NOT NULL,
  journal_date  DATE NOT NULL,
  kind          VARCHAR(32) NOT NULL,
  state         VARCHAR(16) NOT NULL,
  channel       VARCHAR(16) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (identity_id, journal_date, kind),
  CONSTRAINT fk_mjsurf_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
