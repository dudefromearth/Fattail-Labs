-- 049 — Journal Session tables (Session Spec v0.2 §14 · JS1-1)
-- sessions + messages + date_closures. Attachments deferred to J5 (D4).
-- Family B: isolation via identity_id. No media store in this migration.

CREATE TABLE IF NOT EXISTS member_journal_sessions (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id               BIGINT UNSIGNED NOT NULL,
  tag                       VARCHAR(32) NOT NULL,
  journal_date              DATE NOT NULL,
  session_started_at        DATETIME(6) NOT NULL,
  status                    VARCHAR(16) NOT NULL,
  structured_json           JSON NULL,
  export_key                VARCHAR(64) NULL,
  spawned_retrospective_id  BIGINT UNSIGNED NULL,
  created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mjs_export (identity_id, export_key),
  KEY ix_mjs_owner_date (identity_id, journal_date),
  KEY ix_mjs_owner_started (identity_id, session_started_at),
  KEY ix_mjs_owner_status (identity_id, status),
  CONSTRAINT fk_mjs_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mjs_spawned_retro FOREIGN KEY (spawned_retrospective_id)
    REFERENCES member_retrospectives (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_journal_messages (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id      BIGINT UNSIGNED NOT NULL,
  identity_id     BIGINT UNSIGNED NOT NULL,
  author          VARCHAR(16) NOT NULL,
  agent_service   VARCHAR(64) NULL,
  body_md         MEDIUMTEXT NOT NULL,
  phase           VARCHAR(16) NOT NULL,
  created_at      DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_mjm_session_created (session_id, created_at),
  KEY ix_mjm_owner_created (identity_id, created_at),
  CONSTRAINT fk_mjm_session FOREIGN KEY (session_id)
    REFERENCES member_journal_sessions (id) ON DELETE CASCADE,
  CONSTRAINT fk_mjm_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Closed journal_date rows. Date stays closed even if closing retro is removed
-- (ON DELETE SET NULL on closed_by). Prefer wholesale demo reset over reopening.
CREATE TABLE IF NOT EXISTS member_journal_date_closures (
  identity_id                   BIGINT UNSIGNED NOT NULL,
  journal_date                  DATE NOT NULL,
  closed_by_retrospective_id    BIGINT UNSIGNED NULL,
  closed_at                     DATETIME(6) NOT NULL,
  PRIMARY KEY (identity_id, journal_date),
  KEY ix_mjdc_retro (closed_by_retrospective_id),
  CONSTRAINT fk_mjdc_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mjdc_retro FOREIGN KEY (closed_by_retrospective_id)
    REFERENCES member_retrospectives (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
