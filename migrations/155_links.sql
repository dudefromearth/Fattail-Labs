-- Links Phase 1 (LK-1.1). owner is present and written by no statement.
-- link_events.member_id and marker_id are present and inserted NULL.
-- No IP column (RD-L3).

CREATE TABLE IF NOT EXISTS links (
  slug         CHAR(6) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  destination  VARCHAR(2048) NOT NULL,
  label        VARCHAR(255) NOT NULL,
  active       TINYINT(1) NOT NULL DEFAULT 1,
  `static`     TINYINT(1) NOT NULL DEFAULT 0,
  source       VARCHAR(255) NULL,
  medium       VARCHAR(255) NULL,
  campaign     VARCHAR(255) NULL,
  placement    VARCHAR(255) NULL,
  owner        VARCHAR(128) NULL,
  design_json  JSON NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS link_events (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  occurred_at   DATETIME(6) NOT NULL,
  slug          CHAR(6) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  kind          VARCHAR(16) NOT NULL,
  device_class  VARCHAR(32) NOT NULL,
  os_family     VARCHAR(32) NOT NULL,
  referrer      VARCHAR(2048) NOT NULL,
  country       VARCHAR(64) NOT NULL,
  region        VARCHAR(128) NOT NULL,
  bot           TINYINT(1) NOT NULL,
  member_id     BIGINT UNSIGNED NULL,
  marker_id     VARCHAR(64) NULL,
  PRIMARY KEY (id),
  KEY ix_link_events_slug_time (slug, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS link_misses (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attempted    VARCHAR(2048) NOT NULL,
  occurred_at  DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_link_misses_attempted (attempted(64), occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
