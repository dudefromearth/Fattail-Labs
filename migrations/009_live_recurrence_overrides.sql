-- 009 — scope-aware recurring event editing (Live Sessions spec v1.4).
-- Series bounds for splitting + per-occurrence override/exception layer.

ALTER TABLE live_recurrences ADD COLUMN start_date DATE NULL;
ALTER TABLE live_recurrences ADD COLUMN until_date DATE NULL;

CREATE TABLE IF NOT EXISTS live_recurrence_overrides (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  recurrence_id    BIGINT UNSIGNED NOT NULL,
  occurrence_date  DATE NOT NULL,           -- ET date of the original occurrence
  cancelled        TINYINT(1) NOT NULL DEFAULT 0,
  title            VARCHAR(512) NULL,       -- NULL = inherit from series
  kind             VARCHAR(32) NULL,
  start_time       TIME NULL,
  duration_minutes INT NULL,
  join_url         VARCHAR(1024) NULL,
  category         VARCHAR(32) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_override_occurrence (recurrence_id, occurrence_date),
  CONSTRAINT fk_override_recurrence FOREIGN KEY (recurrence_id)
    REFERENCES live_recurrences (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
