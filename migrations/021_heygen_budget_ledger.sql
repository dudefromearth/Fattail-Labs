-- 021 — HeyGen job ledger + daily/monthly budget accounting (Phase G3)
-- Spec: FatTail-Labs-Cast-HeyGen-Spec-v1.1.md

CREATE TABLE IF NOT EXISTS heygen_job_ledger (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  content_item_id   BIGINT UNSIGNED NULL,
  artifact_id       BIGINT UNSIGNED NULL,
  cast_id           VARCHAR(64)  NULL,
  session_id        VARCHAR(128) NULL,
  slug              VARCHAR(128) NULL,
  status            VARCHAR(32)  NOT NULL,
  dry_run           TINYINT(1)   NOT NULL DEFAULT 0,
  actor_kind        VARCHAR(16)  NOT NULL,
  actor_id          BIGINT UNSIGNED NOT NULL,
  actor_label       VARCHAR(255) NOT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_heygen_created (created_at),
  KEY ix_heygen_item (content_item_id),
  KEY ix_heygen_session (session_id),
  CONSTRAINT fk_heygen_item FOREIGN KEY (content_item_id)
    REFERENCES content_items (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
