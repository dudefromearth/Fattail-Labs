-- 019 — Production packages (Phase C) + placement columns (Phase D start)
-- Spec: FatTail-Labs-Production-Package-Spec-v1.0.md

CREATE TABLE IF NOT EXISTS ai_invocations (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  content_item_id   BIGINT UNSIGNED NULL,
  callsign          VARCHAR(64)  NOT NULL,
  task_id           VARCHAR(64)  NOT NULL,
  provider          VARCHAR(32)  NOT NULL,
  model             VARCHAR(128) NOT NULL,
  prefer            VARCHAR(16)  NULL,
  markers_json      JSON NULL,
  usage_json        JSON NULL,
  status            VARCHAR(16)  NOT NULL DEFAULT 'success',
  error             TEXT NULL,
  actor_kind        VARCHAR(16)  NOT NULL,
  actor_id          BIGINT UNSIGNED NOT NULL,
  actor_label       VARCHAR(255) NOT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_ai_item (content_item_id),
  KEY ix_ai_created (created_at),
  CONSTRAINT fk_ai_item FOREIGN KEY (content_item_id)
    REFERENCES content_items (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_approval_packages (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id               BIGINT UNSIGNED NOT NULL,
  status                VARCHAR(16)  NOT NULL DEFAULT 'pending',
  vision_hash           VARCHAR(64)  NOT NULL,
  checklist_json        JSON NOT NULL,
  artifact_ids_json     JSON NOT NULL,
  placement_result_json JSON NULL,
  created_actor_kind    VARCHAR(16)  NOT NULL,
  created_actor_id      BIGINT UNSIGNED NOT NULL,
  created_actor_label   VARCHAR(255) NOT NULL,
  decided_actor_kind    VARCHAR(16)  NULL,
  decided_actor_id      BIGINT UNSIGNED NULL,
  decided_actor_label   VARCHAR(255) NULL,
  decided_at            TIMESTAMP NULL DEFAULT NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_cap_item (item_id, id),
  CONSTRAINT fk_cap_item FOREIGN KEY (item_id)
    REFERENCES content_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE content_artifacts
  ADD COLUMN ai_invocation_id BIGINT UNSIGNED NULL AFTER url,
  ADD COLUMN content_hash VARCHAR(64) NULL AFTER ai_invocation_id;

ALTER TABLE content_items
  ADD COLUMN placed_course_slug VARCHAR(255) NULL AFTER reject_reason,
  ADD COLUMN latest_package_id BIGINT UNSIGNED NULL AFTER placed_course_slug;
