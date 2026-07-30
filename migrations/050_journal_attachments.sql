-- 050 — Journal session private attachments (Session Spec v0.2 §11.2 / §14 · J5)
-- Separate Family B store — not course private tier.

CREATE TABLE IF NOT EXISTS member_journal_attachments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id      BIGINT UNSIGNED NOT NULL,
  identity_id     BIGINT UNSIGNED NOT NULL,
  trade_id        BIGINT UNSIGNED NULL,
  storage_key     VARCHAR(512) NOT NULL,
  content_type    VARCHAR(64) NOT NULL,
  byte_size       INT NOT NULL,
  caption_md      MEDIUMTEXT NULL,
  export_key      VARCHAR(64) NULL,
  created_at      DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mja_export (identity_id, export_key),
  KEY ix_mja_session (session_id),
  KEY ix_mja_identity (identity_id),
  CONSTRAINT fk_mja_session FOREIGN KEY (session_id)
    REFERENCES member_journal_sessions (id) ON DELETE CASCADE,
  CONSTRAINT fk_mja_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
