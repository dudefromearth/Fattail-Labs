-- 001_initial.sql — FatTail Labs core domain (spec §6)
-- Idempotent DDL. utf8mb4 throughout.

CREATE TABLE IF NOT EXISTS identities (
  identity_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issuer        VARCHAR(32)  NOT NULL,             -- 'fattail' | '0-dte'
  wp_user_id    BIGINT UNSIGNED NOT NULL,
  email         VARCHAR(255) NOT NULL,
  display_name  VARCHAR(255) NOT NULL DEFAULT '',
  role          VARCHAR(32)  NOT NULL DEFAULT 'observer',  -- highest derived role, synced from WP
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (identity_id),
  UNIQUE KEY uq_issuer_wpuser (issuer, wp_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS instructors (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(255) NOT NULL,
  bio_md     MEDIUMTEXT,
  avatar_url VARCHAR(1024),
  links_json JSON,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(128) NOT NULL,
  name VARCHAR(128) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cat_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug                  VARCHAR(255) NOT NULL,
  title                 VARCHAR(512) NOT NULL,
  subtitle              VARCHAR(1024) NOT NULL DEFAULT '',
  description_md        MEDIUMTEXT,
  hero_image_url        VARCHAR(1024),
  trailer_video_id      VARCHAR(255),
  level                 VARCHAR(32) NOT NULL DEFAULT 'beginner',   -- beginner|intermediate|advanced
  status                VARCHAR(32) NOT NULL DEFAULT 'draft',      -- draft|published|archived
  certification_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at          TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_course_slug (slug),
  KEY ix_course_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_categories (
  course_id   BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (course_id, category_id),
  CONSTRAINT fk_cc_course   FOREIGN KEY (course_id)   REFERENCES courses (id)    ON DELETE CASCADE,
  CONSTRAINT fk_cc_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_instructors (
  course_id     BIGINT UNSIGNED NOT NULL,
  instructor_id BIGINT UNSIGNED NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (course_id, instructor_id),
  CONSTRAINT fk_ci_course     FOREIGN KEY (course_id)     REFERENCES courses (id)     ON DELETE CASCADE,
  CONSTRAINT fk_ci_instructor FOREIGN KEY (instructor_id) REFERENCES instructors (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS modules (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id  BIGINT UNSIGNED NOT NULL,
  title      VARCHAR(512) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  kind       VARCHAR(32) NOT NULL DEFAULT 'standard',  -- standard|worksheets|resources|bonus
  PRIMARY KEY (id),
  KEY ix_mod_course (course_id, sort_order),
  CONSTRAINT fk_mod_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lessons (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_id        BIGINT UNSIGNED NOT NULL,
  slug             VARCHAR(255) NOT NULL,
  title            VARCHAR(512) NOT NULL,
  sort_order       INT NOT NULL DEFAULT 0,
  kind             VARCHAR(32) NOT NULL DEFAULT 'video',  -- video|text|download|external|replay
  video_id         VARCHAR(255),
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  body_md          MEDIUMTEXT,
  external_url     VARCHAR(1024),
  free_preview     TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lesson_module_slug (module_id, slug),
  KEY ix_les_module (module_id, sort_order),
  CONSTRAINT fk_les_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attachments (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_type VARCHAR(16) NOT NULL,                 -- course|lesson
  owner_id   BIGINT UNSIGNED NOT NULL,
  title      VARCHAR(512) NOT NULL,
  kind       VARCHAR(16) NOT NULL DEFAULT 'file',  -- file|link
  url        VARCHAR(1024) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_att_owner (owner_type, owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollments (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id    BIGINT UNSIGNED NOT NULL,
  course_id      BIGINT UNSIGNED NOT NULL,
  enrolled_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at   TIMESTAMP NULL,
  certificate_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enr_identity_course (identity_id, course_id),
  KEY ix_enr_course (course_id),
  CONSTRAINT fk_enr_identity FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_enr_course   FOREIGN KEY (course_id)   REFERENCES courses (id)             ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lesson_progress (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id   BIGINT UNSIGNED NOT NULL,
  lesson_id     BIGINT UNSIGNED NOT NULL,
  watch_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  last_position INT UNSIGNED NOT NULL DEFAULT 0,
  completed_at  TIMESTAMP NULL,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lp_identity_lesson (identity_id, lesson_id),
  KEY ix_lp_lesson (lesson_id),
  CONSTRAINT fk_lp_identity FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_lp_lesson   FOREIGN KEY (lesson_id)   REFERENCES lessons (id)             ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id BIGINT UNSIGNED NOT NULL,
  course_id   BIGINT UNSIGNED NOT NULL,
  rating      TINYINT UNSIGNED NOT NULL,             -- 1..5 (validated in app)
  body        TEXT,
  status      VARCHAR(16) NOT NULL DEFAULT 'visible', -- visible|held
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rev_identity_course (identity_id, course_id),
  KEY ix_rev_course (course_id, status),
  CONSTRAINT fk_rev_identity FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_course   FOREIGN KEY (course_id)   REFERENCES courses (id)             ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS threads (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  scope_type  VARCHAR(16) NOT NULL,                  -- course|lesson
  scope_id    BIGINT UNSIGNED NOT NULL,
  identity_id BIGINT UNSIGNED NOT NULL,
  title       VARCHAR(512) NOT NULL DEFAULT '',
  body_md     MEDIUMTEXT,
  status      VARCHAR(16) NOT NULL DEFAULT 'visible',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_thr_scope (scope_type, scope_id),
  CONSTRAINT fk_thr_identity FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thread_id   BIGINT UNSIGNED NOT NULL,
  identity_id BIGINT UNSIGNED NOT NULL,
  body_md     MEDIUMTEXT NOT NULL,
  status      VARCHAR(16) NOT NULL DEFAULT 'visible',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_com_thread (thread_id),
  CONSTRAINT fk_com_thread   FOREIGN KEY (thread_id)   REFERENCES threads (id)              ON DELETE CASCADE,
  CONSTRAINT fk_com_identity FOREIGN KEY (identity_id) REFERENCES identities (identity_id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificates (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id BIGINT UNSIGNED NOT NULL,
  course_id   BIGINT UNSIGNED NOT NULL,
  issued_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verify_slug VARCHAR(64) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cert_verify (verify_slug),
  UNIQUE KEY uq_cert_identity_course (identity_id, course_id),
  CONSTRAINT fk_cert_identity FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_cert_course   FOREIGN KEY (course_id)   REFERENCES courses (id)             ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS live_sessions (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title            VARCHAR(512) NOT NULL,
  kind             VARCHAR(32) NOT NULL DEFAULT 'workshop',  -- trading_room|workshop
  starts_at        DATETIME NOT NULL,
  join_url         VARCHAR(1024),
  replay_course_id BIGINT UNSIGNED NULL,
  min_role         VARCHAR(32) NOT NULL DEFAULT 'activator', -- activator|navigator
  PRIMARY KEY (id),
  KEY ix_ls_starts (starts_at),
  CONSTRAINT fk_ls_replay FOREIGN KEY (replay_course_id) REFERENCES courses (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pathways (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id          BIGINT UNSIGNED NOT NULL,
  assessment_json      JSON,
  course_sequence_json JSON,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_path_identity (identity_id),
  CONSTRAINT fk_path_identity FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
