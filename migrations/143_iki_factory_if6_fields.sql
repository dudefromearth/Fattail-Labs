-- 143 — IKI Factory IF-6 (vocabulary + work-item slice)
-- Spec: Specs/FatTail-Labs-IKI-Factory-Pipeline-Spec-v1_0.md · BUILD AUTHORITY · DL-582
-- Plan: docs/IKI-Factory-Pipeline-Spec-v0.6-Full-Agent-Bench-Plan-v1.1.md · IF-6
-- Additive only. Does not touch lane/movement columns or existing data.
--
-- priority is intentionally left in place (v1.0 §2.2 cuts it as a work-item
-- concept, but removing the column/API touches shipped IF-1 code and tests,
-- which is out of scope for an additive-only GO). See Delta gate IF-6-G.

ALTER TABLE iki_factory_cards
  ADD COLUMN description       MEDIUMTEXT NULL AFTER title,
  ADD COLUMN originator_kind   VARCHAR(16) NOT NULL DEFAULT 'coach' AFTER description,
  ADD COLUMN originator_label  VARCHAR(255) NULL AFTER originator_kind;

CREATE TABLE IF NOT EXISTS iki_factory_card_attachments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  card_id         BIGINT UNSIGNED NOT NULL,
  kind            VARCHAR(16) NOT NULL,           -- 'link' | 'upload'
  url             VARCHAR(1024) NULL,             -- link target, or served-file path
  label           VARCHAR(255) NULL,
  filename        VARCHAR(255) NULL,              -- upload only
  content_type    VARCHAR(128) NULL,              -- upload only
  size_bytes      BIGINT UNSIGNED NULL,           -- upload only
  storage_path    VARCHAR(1024) NULL,             -- upload only, disk path
  created_by_kind VARCHAR(16) NOT NULL,
  created_by_id   BIGINT UNSIGNED NOT NULL,
  created_by_label VARCHAR(255) NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_iki_factory_attach_card (card_id, id),
  CONSTRAINT fk_iki_factory_attach_card
    FOREIGN KEY (card_id) REFERENCES iki_factory_cards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
