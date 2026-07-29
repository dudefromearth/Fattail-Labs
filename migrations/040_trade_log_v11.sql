-- 040 — Trade Log v1.1 (Spec FatTail-Labs-Trade-Log-Spec-v1.1, Pass 1)
-- Accounts (broker|sim venue, ≤10 active enforced in app) + multi-leg trades.
-- Migrates legacy member_trade_log_entries into NOTE trades on a Primary account.

CREATE TABLE IF NOT EXISTS member_trade_log_accounts (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id   BIGINT UNSIGNED NOT NULL,
  label         VARCHAR(128) NOT NULL,
  broker        VARCHAR(64) NOT NULL,
  broker_label  VARCHAR(255) NULL,
  currency      VARCHAR(8) NOT NULL DEFAULT 'USD',
  status        VARCHAR(16) NOT NULL DEFAULT 'active',
  badge_color   VARCHAR(32) NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  notes_md      TEXT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_mtla_owner (identity_id, status, sort_order),
  CONSTRAINT fk_mtla_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_trade_log_trades (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id       BIGINT UNSIGNED NOT NULL,
  account_id        BIGINT UNSIGNED NOT NULL,
  exec_at           DATETIME NOT NULL,
  asset_class       VARCHAR(32) NOT NULL DEFAULT 'equity_option',
  strategy          VARCHAR(64) NOT NULL,
  order_type        VARCHAR(32) NOT NULL DEFAULT 'LMT',
  net_price         DECIMAL(18, 6) NULL,
  net_side          VARCHAR(8) NULL,
  setup_md          TEXT NOT NULL,
  plan_md           TEXT NOT NULL,
  rules_md          TEXT NOT NULL,
  adherence         VARCHAR(32) NOT NULL DEFAULT 'unknown',
  deviation_md      TEXT NOT NULL,
  lesson_md         TEXT NOT NULL,
  pnl_amount        DECIMAL(18, 4) NULL,
  journal_entry_id  BIGINT UNSIGNED NULL,
  external_adapter  VARCHAR(64) NULL,
  external_order_id VARCHAR(128) NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_mtlt_owner_acct (identity_id, account_id, exec_at),
  UNIQUE KEY uq_mtlt_ext (identity_id, account_id, external_adapter, external_order_id),
  CONSTRAINT fk_mtlt_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mtlt_account FOREIGN KEY (account_id)
    REFERENCES member_trade_log_accounts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_trade_log_legs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trade_id        BIGINT UNSIGNED NOT NULL,
  identity_id     BIGINT UNSIGNED NOT NULL,
  account_id      BIGINT UNSIGNED NOT NULL,
  leg_index       SMALLINT NOT NULL DEFAULT 0,
  side            VARCHAR(8) NOT NULL,
  quantity        INT NOT NULL,
  pos_effect      VARCHAR(16) NULL,
  asset_class     VARCHAR(32) NOT NULL DEFAULT 'equity_option',
  underlier       VARCHAR(64) NULL,
  symbol          VARCHAR(64) NULL,
  expiry          DATE NULL,
  strike          DECIMAL(18, 6) NULL,
  option_right    VARCHAR(8) NULL,
  multiplier      INT NULL,
  fill_price      DECIMAL(18, 6) NOT NULL DEFAULT 0,
  fees            DECIMAL(18, 6) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_mtll_trade (trade_id, leg_index),
  KEY ix_mtll_owner (identity_id, account_id),
  CONSTRAINT fk_mtll_trade FOREIGN KEY (trade_id)
    REFERENCES member_trade_log_trades (id) ON DELETE CASCADE,
  CONSTRAINT fk_mtll_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mtll_account FOREIGN KEY (account_id)
    REFERENCES member_trade_log_accounts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Primary account per identity that has legacy entries
INSERT INTO member_trade_log_accounts (identity_id, label, broker, status, sort_order)
SELECT DISTINCT e.identity_id, 'Primary', 'thinkorswim', 'active', 10
FROM member_trade_log_entries e
WHERE NOT EXISTS (
  SELECT 1 FROM member_trade_log_accounts a WHERE a.identity_id = e.identity_id
);

-- Legacy prose rows → NOTE trades (no legs)
INSERT INTO member_trade_log_trades (
  identity_id, account_id, exec_at, asset_class, strategy, order_type,
  setup_md, plan_md, rules_md, adherence, deviation_md, lesson_md, pnl_amount
)
SELECT
  e.identity_id,
  a.id,
  TIMESTAMP(COALESCE(e.traded_on, DATE(e.created_at)), '12:00:00'),
  'equity_option',
  'NOTE',
  'LMT',
  COALESCE(e.setup_md, ''),
  COALESCE(e.plan_md, ''),
  COALESCE(e.rules_md, ''),
  COALESCE(e.adherence, 'unknown'),
  COALESCE(e.deviation_md, ''),
  COALESCE(e.lesson_md, ''),
  e.pnl_amount
FROM member_trade_log_entries e
JOIN member_trade_log_accounts a
  ON a.identity_id = e.identity_id AND a.label = 'Primary'
WHERE NOT EXISTS (
  SELECT 1 FROM member_trade_log_trades t
  WHERE t.identity_id = e.identity_id
    AND t.strategy = 'NOTE'
    AND t.setup_md = COALESCE(e.setup_md, '')
    AND t.exec_at = TIMESTAMP(COALESCE(e.traded_on, DATE(e.created_at)), '12:00:00')
);
