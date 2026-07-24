-- 024 — Course Blueprint (Header + Outline) + chat history
-- First validated product for product_line=course (skills/course/course-blueprint)

CREATE TABLE IF NOT EXISTS content_blueprints (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  content_item_id         BIGINT UNSIGNED NOT NULL,
  version                 INT NOT NULL DEFAULT 1,
  status                  VARCHAR(32) NOT NULL DEFAULT 'draft',
  -- draft | pending_validation | approved | superseded
  header_json             JSON NOT NULL,
  outline_json            JSON NOT NULL,
  chat_json               JSON NOT NULL,
  validation_json         JSON NULL,
  last_ai_invocation_id   BIGINT UNSIGNED NULL,
  approved_at             TIMESTAMP NULL DEFAULT NULL,
  approved_actor_kind     VARCHAR(16) NULL,
  approved_actor_id       BIGINT UNSIGNED NULL,
  approved_actor_label    VARCHAR(255) NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_blueprint_item_version (content_item_id, version),
  KEY ix_blueprint_item_status (content_item_id, status),
  CONSTRAINT fk_blueprint_item
    FOREIGN KEY (content_item_id) REFERENCES content_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE content_items
  ADD COLUMN blueprint_status VARCHAR(32) NULL
    COMMENT 'mirrors latest blueprint: draft|pending_validation|approved'
    AFTER placed_course_slug,
  ADD COLUMN blueprint_id BIGINT UNSIGNED NULL
    COMMENT 'latest content_blueprints.id'
    AFTER blueprint_status;
