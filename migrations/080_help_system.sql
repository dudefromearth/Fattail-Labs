-- 080_help_system.sql
-- Member help desk (FatTail-Labs-Help-System-Spec-v1.0).
-- Note: originally drafted as 058; 058 was already tag_manager_personal_vocab.
--
-- Members ask questions; admins answer in a thread; everything is stored here in
-- the Labs DB (unlike MSC's bug reporter which proxies to GitHub Issues).
--   help_questions : one row per question (opening post + status + optional screenshot)
--   help_messages  : threaded replies (member follow-ups + admin answers / internal notes)
-- Keyed by identity_id (email is the identity key). Cascades on identity/question delete.

CREATE TABLE IF NOT EXISTS help_questions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  email           VARCHAR(255) NOT NULL DEFAULT '',
  subject         VARCHAR(255) NOT NULL,
  body            MEDIUMTEXT NOT NULL,
  category        VARCHAR(64)  NOT NULL DEFAULT 'general',
  page_context    VARCHAR(512) NULL,             -- path the member was on
  status          VARCHAR(16)  NOT NULL DEFAULT 'open',  -- open | answered | closed
  screenshot_path VARCHAR(512) NULL,             -- relative under /api/media (e.g. help/ab.png)
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  answered_at     TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY ix_hq_identity (identity_id, created_at),
  KEY ix_hq_status (status, created_at),
  CONSTRAINT fk_hq_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS help_messages (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id        BIGINT UNSIGNED NOT NULL,
  author_identity_id BIGINT UNSIGNED NULL,       -- NULL for internal/admin id 0
  author_role        VARCHAR(16)  NOT NULL,      -- member | admin
  body               MEDIUMTEXT NOT NULL,
  visibility         VARCHAR(16)  NOT NULL DEFAULT 'public',  -- public | internal
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_hm_question (question_id, created_at),
  CONSTRAINT fk_hm_question FOREIGN KEY (question_id)
    REFERENCES help_questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
