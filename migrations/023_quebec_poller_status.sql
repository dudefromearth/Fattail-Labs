-- 023 — Quebec poller status (automatic board forward-progress)
-- Spec: FatTail-Labs-Quebec-Poller-Spec-v1.0.md

CREATE TABLE IF NOT EXISTS quebec_poller_status (
  id                TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  poller_enabled    TINYINT(1) NOT NULL DEFAULT 0,
  last_started_at   DATETIME NULL,
  last_finished_at  DATETIME NULL,
  last_ok           TINYINT(1) NULL,
  last_action_count INT NOT NULL DEFAULT 0,
  last_error        TEXT NULL,
  last_result_json  JSON NULL,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO quebec_poller_status (id, poller_enabled)
VALUES (1, 0)
ON DUPLICATE KEY UPDATE id = id;
