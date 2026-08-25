-- 137 — IKI Factory board (IF-1)
-- Spec: FatTail Labs — IKI Factory Spec v0.1.5 · DL-556 · GO IF-1
-- Operational SoR for in-progress Factory work. Not content_items.

CREATE TABLE IF NOT EXISTS iki_factory_cards (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title                   VARCHAR(512) NOT NULL,
  notes                   MEDIUMTEXT NULL,
  lane                    VARCHAR(16) NOT NULL,
  priority                VARCHAR(16) NOT NULL DEFAULT 'medium',
  owner_identity_id       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  hold                    TINYINT(1) NOT NULL DEFAULT 0,
  card_status             VARCHAR(16) NOT NULL DEFAULT 'active',
  blocked_reason          TEXT NULL,
  failed_reason           TEXT NULL,
  auto_move_reason        TEXT NULL,
  waiting_reason          TEXT NULL,
  spec_ready              TINYINT(1) NOT NULL DEFAULT 0,
  built_ready             TINYINT(1) NOT NULL DEFAULT 0,
  plan_ref                VARCHAR(512) NULL,
  product_type            VARCHAR(64) NULL,
  product_tier            VARCHAR(64) NULL,
  free_vs_paid            VARCHAR(16) NULL,
  help_package_json       JSON NULL,
  lineage_parent_id       BIGINT UNSIGNED NULL,
  pickup_at               TIMESTAMP NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_iki_factory_lane_status (card_status, lane, priority, id),
  KEY ix_iki_factory_owner (owner_identity_id),
  KEY ix_iki_factory_parent (lineage_parent_id),
  CONSTRAINT fk_iki_factory_parent
    FOREIGN KEY (lineage_parent_id) REFERENCES iki_factory_cards (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS iki_factory_transitions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  card_id         BIGINT UNSIGNED NOT NULL,
  from_lane       VARCHAR(16) NULL,
  to_lane         VARCHAR(16) NOT NULL,
  auto_move       TINYINT(1) NOT NULL DEFAULT 0,
  actor_kind      VARCHAR(16) NOT NULL,
  actor_id        BIGINT UNSIGNED NOT NULL,
  actor_label     VARCHAR(255) NOT NULL,
  reason          TEXT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_iki_factory_tr_card (card_id, id),
  CONSTRAINT fk_iki_factory_tr_card
    FOREIGN KEY (card_id) REFERENCES iki_factory_cards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
