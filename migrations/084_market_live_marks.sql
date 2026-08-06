-- 084 — Shared live marks stream for all members' Curate collections
-- One universe, one stream; strategies read the same latest marks (not per-member sockets).

CREATE TABLE IF NOT EXISTS market_symbol_universe (
  symbol            VARCHAR(32) NOT NULL,
  kind              VARCHAR(16) NOT NULL DEFAULT 'equity',
  -- equity | etf | index
  enabled           TINYINT(1) NOT NULL DEFAULT 1,
  sort_order        INT NOT NULL DEFAULT 0,
  note              VARCHAR(128) NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS market_live_marks (
  symbol            VARCHAR(32) NOT NULL,
  mid               DECIMAL(18, 6) NOT NULL,
  bid               DECIMAL(18, 6) NULL,
  ask               DECIMAL(18, 6) NULL,
  last_trade        DECIMAL(18, 6) NULL,
  asof_ts           TIMESTAMP(3) NOT NULL,
  source            VARCHAR(64) NOT NULL,
  label             VARCHAR(128) NOT NULL,
  stream_seq        BIGINT UNSIGNED NOT NULL DEFAULT 0,
  raw_json          JSON NULL,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (symbol),
  KEY ix_mlm_asof (asof_ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS market_stream_heartbeat (
  id                TINYINT UNSIGNED NOT NULL DEFAULT 1,
  status            VARCHAR(16) NOT NULL DEFAULT 'stopped',
  -- running | stopped | error
  last_ok_at        TIMESTAMP(3) NULL,
  last_error        VARCHAR(512) NULL,
  symbols_json      JSON NULL,
  poll_interval_s   INT UNSIGNED NULL,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO market_stream_heartbeat (id, status)
VALUES (1, 'stopped')
ON DUPLICATE KEY UPDATE id = id;

-- Default shared universe (enabled). Admin can extend later.
INSERT INTO market_symbol_universe (symbol, kind, enabled, sort_order, note) VALUES
  ('SPY',  'etf',    1, 10, 'S&P 500 ETF — primary underlier proxy'),
  ('QQQ',  'etf',    1, 20, 'Nasdaq-100 ETF'),
  ('IWM',  'etf',    1, 30, 'Russell 2000 ETF'),
  ('AAPL', 'equity', 1, 40, 'Mag 7'),
  ('MSFT', 'equity', 1, 50, 'Mag 7'),
  ('NVDA', 'equity', 1, 60, 'Mag 7'),
  ('AMZN', 'equity', 1, 70, 'Mag 7'),
  ('META', 'equity', 1, 80, 'Mag 7'),
  ('GOOGL','equity', 1, 90, 'Mag 7'),
  ('TSLA', 'equity', 1, 100, 'Mag 7')
ON DUPLICATE KEY UPDATE note = VALUES(note);
