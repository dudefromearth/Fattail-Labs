-- 058 — Tag Manager two-tier vocabulary (Spec v0.2 two-tier · supersedes v0.3 assign-only)
-- Platform `tags` remain the curated lexicon. Members get personal copies with
-- immutable lexicon_key for concept identity across rename.

ALTER TABLE tags
  ADD COLUMN lexicon_key VARCHAR(64) NULL AFTER slug;

-- Backfill: slug early-exit → early_exit
UPDATE tags
   SET lexicon_key = REPLACE(slug, '-', '_')
 WHERE lexicon_key IS NULL AND slug IS NOT NULL;

ALTER TABLE tags
  ADD UNIQUE KEY uq_tags_lexicon_key (lexicon_key);

CREATE TABLE IF NOT EXISTS member_tag_categories (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  label           VARCHAR(64) NOT NULL,
  system_key      VARCHAR(32) NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mtc_owner_label (identity_id, label),
  KEY ix_mtc_owner (identity_id),
  CONSTRAINT fk_mtc_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_tags (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id          BIGINT UNSIGNED NOT NULL,
  category_id          BIGINT UNSIGNED NULL,
  label                VARCHAR(128) NOT NULL,
  description          TEXT NULL,
  color                VARCHAR(32) NULL,
  lexicon_key          VARCHAR(64) NULL,
  source               VARCHAR(16) NOT NULL DEFAULT 'member_created',
  status               VARCHAR(16) NOT NULL DEFAULT 'active',
  merged_into_tag_id   BIGINT UNSIGNED NULL,
  export_key           VARCHAR(64) NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mt_owner_label (identity_id, label),
  KEY ix_mt_owner_status (identity_id, status),
  KEY ix_mt_lexicon_key (lexicon_key),
  KEY ix_mt_export_key (export_key),
  CONSTRAINT fk_mt_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mt_category FOREIGN KEY (category_id)
    REFERENCES member_tag_categories (id) ON DELETE SET NULL,
  CONSTRAINT fk_mt_merged FOREIGN KEY (merged_into_tag_id)
    REFERENCES member_tags (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Family B assignments may point at member_tags (preferred for journal/trade).
-- tag_id remains for public-object / legacy assignments; may be NULL when member_tag_id set.
ALTER TABLE tag_assignments
  MODIFY COLUMN tag_id BIGINT UNSIGNED NULL;

ALTER TABLE tag_assignments
  ADD COLUMN member_tag_id BIGINT UNSIGNED NULL AFTER tag_id;

ALTER TABLE tag_assignments
  ADD KEY ix_tag_assign_member_tag (member_tag_id);

ALTER TABLE tag_assignments
  ADD CONSTRAINT fk_tag_assign_member_tag FOREIGN KEY (member_tag_id)
    REFERENCES member_tags (id) ON DELETE CASCADE;

-- Prefer unique on member_tag when present (MySQL allows multiple NULLs in unique)
ALTER TABLE tag_assignments
  ADD UNIQUE KEY uq_tag_assign_member (member_tag_id, object_type, object_id);
