-- 094 — Playbook Scrapbook Presentation (Spec v1.1a · DL-255)
-- Book root remains member_playbook_entries; chapters/pages/versions/archive/evidence.
--
-- Book-level subtitle + cover_attachment_id are NOT in this file — see companion
-- 094_playbook_scrapbook_cover_columns.sql (sorts before 095; required on clean DBs
-- before 095 can add FK fk_mpe_cover_attachment).

-- Chapters (FK names unique vs practice_campaigns mpc_*)
CREATE TABLE IF NOT EXISTS member_playbook_chapters (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  playbook_entry_id BIGINT UNSIGNED NOT NULL,
  identity_id       BIGINT UNSIGNED NOT NULL,
  title             VARCHAR(255) NOT NULL,
  blurb             VARCHAR(500) NULL,
  sort_order        INT NOT NULL DEFAULT 0,
  chapter_type      VARCHAR(16) NOT NULL DEFAULT 'chapter',
  export_key        VARCHAR(64) NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mpbch_export (identity_id, export_key),
  KEY ix_mpbch_book_sort (playbook_entry_id, sort_order),
  CONSTRAINT fk_mpbch_book
    FOREIGN KEY (playbook_entry_id) REFERENCES member_playbook_entries (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpbch_identity
    FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT chk_mpbch_type CHECK (chapter_type IN ('chapter'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_playbook_pages (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  chapter_id        BIGINT UNSIGNED NOT NULL,
  playbook_entry_id BIGINT UNSIGNED NOT NULL,
  identity_id       BIGINT UNSIGNED NOT NULL,
  title             VARCHAR(255) NULL,
  body_md           MEDIUMTEXT NOT NULL,
  sort_order        INT NOT NULL DEFAULT 0,
  export_key        VARCHAR(64) NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mpbpg_export (identity_id, export_key),
  KEY ix_mpbpg_chapter_sort (chapter_id, sort_order),
  KEY ix_mpbpg_book (playbook_entry_id),
  CONSTRAINT fk_mpbpg_chapter
    FOREIGN KEY (chapter_id) REFERENCES member_playbook_chapters (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpbpg_book
    FOREIGN KEY (playbook_entry_id) REFERENCES member_playbook_entries (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpbpg_identity
    FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_playbook_attachments (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  playbook_entry_id BIGINT UNSIGNED NOT NULL,
  identity_id       BIGINT UNSIGNED NOT NULL,
  content_type      VARCHAR(128) NOT NULL,
  byte_size         INT UNSIGNED NOT NULL,
  original_name     VARCHAR(255) NULL,
  caption_md        TEXT NULL,
  storage_key       VARCHAR(512) NOT NULL,
  export_key        VARCHAR(64) NULL,
  purged_at         DATETIME NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mpbatt_export (identity_id, export_key),
  KEY ix_mpbatt_book (playbook_entry_id),
  CONSTRAINT fk_mpbatt_book
    FOREIGN KEY (playbook_entry_id) REFERENCES member_playbook_entries (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpbatt_identity
    FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_playbook_stickies (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_id           BIGINT UNSIGNED NOT NULL,
  playbook_entry_id BIGINT UNSIGNED NOT NULL,
  identity_id       BIGINT UNSIGNED NOT NULL,
  body_md           VARCHAR(500) NOT NULL,
  anchor_json       JSON NULL,
  sort_order        INT NOT NULL DEFAULT 0,
  export_key        VARCHAR(64) NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mpbst_export (identity_id, export_key),
  KEY ix_mpbst_page (page_id, sort_order),
  CONSTRAINT fk_mpbst_page
    FOREIGN KEY (page_id) REFERENCES member_playbook_pages (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpbst_book
    FOREIGN KEY (playbook_entry_id) REFERENCES member_playbook_entries (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpbst_identity
    FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_playbook_evidence (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  playbook_entry_id BIGINT UNSIGNED NOT NULL,
  identity_id       BIGINT UNSIGNED NOT NULL,
  object_type       VARCHAR(32) NOT NULL,
  object_id         BIGINT UNSIGNED NOT NULL,
  note_md           TEXT NULL,
  export_key        VARCHAR(64) NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mpbev_pair (playbook_entry_id, object_type, object_id),
  UNIQUE KEY uq_mpbev_export (identity_id, export_key),
  KEY ix_mpbev_book (playbook_entry_id),
  CONSTRAINT fk_mpbev_book
    FOREIGN KEY (playbook_entry_id) REFERENCES member_playbook_entries (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpbev_identity
    FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT chk_mpbev_type CHECK (object_type IN ('journal_session', 'trade'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_playbook_versions (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  playbook_entry_id BIGINT UNSIGNED NOT NULL,
  identity_id       BIGINT UNSIGNED NOT NULL,
  version_n         INT NOT NULL,
  snapshot_json     JSON NOT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mpbver_book_n (playbook_entry_id, version_n),
  KEY ix_mpbver_book (playbook_entry_id),
  CONSTRAINT fk_mpbver_book
    FOREIGN KEY (playbook_entry_id) REFERENCES member_playbook_entries (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpbver_identity
    FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
