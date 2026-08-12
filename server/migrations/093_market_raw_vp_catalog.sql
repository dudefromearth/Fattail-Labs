-- VP Spec v0.4 dual-store catalog (mounts + raw series + bin artifacts).
-- Bulk tape lives on LABS_MARKET_DATA_* mounts; MySQL holds watermarks only.

CREATE TABLE IF NOT EXISTS market_storage_mount (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  mount_path    VARCHAR(512) NOT NULL,
  role          VARCHAR(64) NOT NULL,
  shard_note    VARCHAR(255) NULL,
  last_seen_at  TIMESTAMP NULL,
  free_bytes    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_msm_path (mount_path(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS market_raw_series (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  series_ticker   VARCHAR(32) NOT NULL,
  kind            ENUM('trades','quotes','aggs_1s') NOT NULL,
  mount_id        BIGINT UNSIGNED NULL,
  first_session   DATE NULL,
  last_session    DATE NULL,
  day_count       INT UNSIGNED NOT NULL DEFAULT 0,
  byte_count      BIGINT UNSIGNED NOT NULL DEFAULT 0,
  complete        TINYINT(1) NOT NULL DEFAULT 0,
  note            VARCHAR(512) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mrs_series_kind (series_ticker, kind),
  KEY ix_mrs_mount (mount_id),
  CONSTRAINT fk_mrs_mount FOREIGN KEY (mount_id)
    REFERENCES market_storage_mount (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS volume_profile_job (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id     VARCHAR(32) NOT NULL,
  job_type      VARCHAR(64) NOT NULL,
  symbol        VARCHAR(32) NULL,
  series_ticker VARCHAR(32) NULL,
  kind          VARCHAR(32) NULL,
  status        VARCHAR(32) NOT NULL DEFAULT 'pending',
  detail_json   JSON NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vpj_public (public_id),
  KEY ix_vpj_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS volume_profile_day_shard (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  symbol        VARCHAR(32) NOT NULL,
  series_ticker VARCHAR(32) NOT NULL,
  algo_version  VARCHAR(64) NOT NULL,
  session_date  DATE NOT NULL,
  source        ENUM('trades','1s','1m') NOT NULL,
  method        VARCHAR(32) NOT NULL,
  store_path    VARCHAR(1024) NOT NULL,
  total_volume  DOUBLE NULL,
  n_bins        INT UNSIGNED NULL,
  meta_json     JSON NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vpds (symbol, algo_version, session_date),
  KEY ix_vpds_series (series_ticker, session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS volume_profile_artifact (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  symbol        VARCHAR(32) NOT NULL,
  series_ticker VARCHAR(32) NOT NULL,
  algo_version  VARCHAR(64) NOT NULL,
  method        VARCHAR(32) NOT NULL,
  store_path    VARCHAR(1024) NOT NULL,
  study_start   DATE NULL,
  study_end     DATE NULL,
  as_of_session DATE NULL,
  n_bins        INT UNSIGNED NULL,
  total_volume  DOUBLE NULL,
  meta_json     JSON NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vpa (symbol, algo_version),
  KEY ix_vpa_series (series_ticker)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
