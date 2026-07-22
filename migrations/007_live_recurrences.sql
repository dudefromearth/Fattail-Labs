-- 007 — recurring live sessions (Live Sessions spec v1.1)
-- start_time is America/New_York wall-clock; occurrences materialize at read time.

CREATE TABLE IF NOT EXISTS live_recurrences (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title            VARCHAR(512) NOT NULL,
  kind             VARCHAR(32) NOT NULL,          -- trading_room|workshop|show
  days             VARCHAR(64) NOT NULL,          -- csv: mon,tue,wed,thu,fri,sat,sun
  start_time       TIME NOT NULL,                 -- ET wall clock
  duration_minutes INT NOT NULL DEFAULT 60,
  join_url         VARCHAR(1024) NULL,
  min_role         VARCHAR(32) NOT NULL DEFAULT 'navigator',
  active           TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
