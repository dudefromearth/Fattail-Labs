-- 120 — Durable underlier OHLC store (Volume Profile / charts)
-- Bootstrap once from Massive; morning (and live tip) jobs append new bars.
-- Apps read from this table; Massive is not hit for full history every page load.

CREATE TABLE IF NOT EXISTS market_ohlc_series (
  product        VARCHAR(32)  NOT NULL,
  tf             VARCHAR(8)   NOT NULL,
  series_ticker  VARCHAR(48)  NULL,
  proxy_label    VARCHAR(64)  NULL,
  source         VARCHAR(64)  NULL,
  first_t        BIGINT       NULL COMMENT 'ms epoch first bar',
  last_t         BIGINT       NULL COMMENT 'ms epoch last bar',
  bar_count      INT          NOT NULL DEFAULT 0,
  bootstrap_complete TINYINT(1) NOT NULL DEFAULT 0,
  last_append_at DATETIME     NULL,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product, tf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS market_ohlc_bars (
  product   VARCHAR(32)   NOT NULL,
  tf        VARCHAR(8)    NOT NULL,
  bar_t     BIGINT        NOT NULL COMMENT 'ms epoch bar open',
  o         DECIMAL(18,6) NULL,
  h         DECIMAL(18,6) NULL,
  l         DECIMAL(18,6) NULL,
  c         DECIMAL(18,6) NOT NULL,
  v         DECIMAL(24,4) NULL,
  PRIMARY KEY (product, tf, bar_t),
  KEY idx_ohlc_product_tf_t (product, tf, bar_t)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
