-- 063 — Process co-pilot chat (card-scoped, full lifecycle)
-- Operator AI companion for insight, diagnosis, and fixes on production board items.

CREATE TABLE IF NOT EXISTS content_item_process_chat (
  content_item_id         BIGINT UNSIGNED NOT NULL,
  chat_json               MEDIUMTEXT NOT NULL,
  last_ai_invocation_id   BIGINT UNSIGNED NULL,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (content_item_id),
  CONSTRAINT fk_process_chat_item
    FOREIGN KEY (content_item_id) REFERENCES content_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
