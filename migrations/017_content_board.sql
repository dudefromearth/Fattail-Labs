-- 017 — Content backlog & production board (Phase B)
-- Spec: FatTail-Labs-Content-Board-Spec-v1.0.md

CREATE TABLE IF NOT EXISTS content_vision (
  id                      TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  body_md                 MEDIUMTEXT NOT NULL,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by_identity_id  BIGINT UNSIGNED NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO content_vision (id, body_md) VALUES
  (1, '# Content Vision\n\nStop the bleeding first. Process outcomes only. Capacity over dependency.\n\nPathway routes everyone through the flagship before advanced material.\n')
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS content_items (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title                   VARCHAR(512) NOT NULL,
  intent_md               MEDIUMTEXT NOT NULL,
  acceptance_md           MEDIUMTEXT NULL,
  inputs_md               MEDIUMTEXT NULL,
  product_line            VARCHAR(32) NOT NULL DEFAULT 'course',
  status                  VARCHAR(32) NOT NULL DEFAULT 'draft',
  sub_stage               VARCHAR(32) NULL,
  priority                INT NOT NULL DEFAULT 0,
  sort_order              INT NOT NULL DEFAULT 0,
  vision_aligned          TINYINT(1) NOT NULL DEFAULT 1,
  claimed_callsign        VARCHAR(64) NULL,
  last_actor_kind         VARCHAR(16) NULL,
  last_actor_id           BIGINT UNSIGNED NULL,
  last_actor_label        VARCHAR(255) NULL,
  created_by_identity_id  BIGINT UNSIGNED NULL,
  reject_reason           TEXT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_content_status_priority (status, priority DESC, sort_order, id),
  KEY ix_content_claimed (claimed_callsign)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_transitions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id         BIGINT UNSIGNED NOT NULL,
  from_status     VARCHAR(32) NULL,
  to_status       VARCHAR(32) NOT NULL,
  sub_stage       VARCHAR(32) NULL,
  actor_kind      VARCHAR(16) NOT NULL,
  actor_id        BIGINT UNSIGNED NOT NULL,
  actor_label     VARCHAR(255) NOT NULL,
  reason          TEXT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_ct_item (item_id, id),
  CONSTRAINT fk_ct_item FOREIGN KEY (item_id) REFERENCES content_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_artifacts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id         BIGINT UNSIGNED NOT NULL,
  stage           VARCHAR(64) NOT NULL,
  title           VARCHAR(512) NOT NULL,
  body_md         MEDIUMTEXT NULL,
  url             VARCHAR(1024) NULL,
  actor_kind      VARCHAR(16) NOT NULL,
  actor_id        BIGINT UNSIGNED NOT NULL,
  actor_label     VARCHAR(255) NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_ca_item (item_id, id),
  CONSTRAINT fk_ca_item FOREIGN KEY (item_id) REFERENCES content_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_flags (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id         BIGINT UNSIGNED NOT NULL,
  guardian        VARCHAR(32) NOT NULL,
  severity        VARCHAR(16) NOT NULL DEFAULT 'block',
  message         TEXT NOT NULL,
  status          VARCHAR(16) NOT NULL DEFAULT 'open',
  created_actor_kind  VARCHAR(16) NOT NULL,
  created_actor_id    BIGINT UNSIGNED NOT NULL,
  created_actor_label VARCHAR(255) NOT NULL,
  cleared_actor_kind  VARCHAR(16) NULL,
  cleared_actor_id    BIGINT UNSIGNED NULL,
  cleared_actor_label VARCHAR(255) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cleared_at      TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY ix_cf_item_status (item_id, status),
  CONSTRAINT fk_cf_item FOREIGN KEY (item_id) REFERENCES content_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
