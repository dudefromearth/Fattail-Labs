-- 029 — First-class versioned Resources (Resource Spec v1.0)
-- Spec: Specs/FatTail-Labs-Resource-Spec-v1.0.md
-- agents/p-resources R1

CREATE TABLE IF NOT EXISTS resources (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug                  VARCHAR(255) NOT NULL,
  title                 VARCHAR(512) NOT NULL,
  description_md        MEDIUMTEXT NULL,
  type                  VARCHAR(32) NOT NULL,
  -- spreadsheet|document|image|link|other
  category_slug         VARCHAR(128) NOT NULL DEFAULT '',
  published_version_id  BIGINT UNSIGNED NULL,
  emoji                 VARCHAR(16) NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_resource_slug (slug),
  KEY ix_resource_type (type),
  KEY ix_resource_category (category_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resource_versions (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  resource_id             BIGINT UNSIGNED NOT NULL,
  version                 INT UNSIGNED NOT NULL,
  kind                    VARCHAR(16) NOT NULL,
  -- file|link
  url                     VARCHAR(1024) NOT NULL,
  title_override          VARCHAR(512) NULL,
  description_md          MEDIUMTEXT NULL,
  changelog_md            MEDIUMTEXT NULL,
  byte_size               INT UNSIGNED NULL,
  content_type            VARCHAR(128) NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_identity_id  BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_resource_version (resource_id, version),
  KEY ix_rv_resource (resource_id),
  CONSTRAINT fk_rv_resource FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- published_version_id → resource_versions (SET NULL if version row deleted)
ALTER TABLE resources
  ADD CONSTRAINT fk_res_published_version
  FOREIGN KEY (published_version_id) REFERENCES resource_versions (id) ON DELETE SET NULL;

-- lesson_id = 0 means course-level link (avoids MySQL NULL unique quirks)
CREATE TABLE IF NOT EXISTS course_resource_links (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id           BIGINT UNSIGNED NOT NULL,
  resource_id         BIGINT UNSIGNED NOT NULL,
  pinned_version_id   BIGINT UNSIGNED NOT NULL,
  sort_order          INT NOT NULL DEFAULT 0,
  free_preview        TINYINT(1) NOT NULL DEFAULT 0,
  lesson_id           BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_crl_course_resource_lesson (course_id, resource_id, lesson_id),
  KEY ix_crl_resource (resource_id),
  KEY ix_crl_course (course_id, sort_order),
  CONSTRAINT fk_crl_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT fk_crl_resource FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
  CONSTRAINT fk_crl_pin FOREIGN KEY (pinned_version_id) REFERENCES resource_versions (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attachment backfill map (R4); created early so R1 schema is complete
CREATE TABLE IF NOT EXISTS resource_migration_map (
  attachment_id   BIGINT UNSIGNED NOT NULL,
  resource_id     BIGINT UNSIGNED NOT NULL,
  version_id      BIGINT UNSIGNED NOT NULL,
  migrated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (attachment_id),
  KEY ix_rmm_resource (resource_id),
  CONSTRAINT fk_rmm_resource FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
  CONSTRAINT fk_rmm_version FOREIGN KEY (version_id) REFERENCES resource_versions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
