-- 083 — Strategy Lab Curate run environment
-- Real market marks (data plane later) + simulated broker + fake money.
-- Never calls Tradier. Family B: identity_id isolation.

CREATE TABLE IF NOT EXISTS strategy_lab_curate_instances (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id             VARCHAR(16) NOT NULL,
  identity_id           BIGINT UNSIGNED NOT NULL,
  strategy_id           BIGINT UNSIGNED NOT NULL,
  strategy_public_id    VARCHAR(16) NOT NULL,
  bound_version         VARCHAR(32) NOT NULL,
  pack_config_hash      VARCHAR(64) NOT NULL,
  status                VARCHAR(16) NOT NULL DEFAULT 'draft',
  -- draft | armed | running | paused | halted | archived
  allocation_usd        DECIMAL(14, 2) NOT NULL,
  cash_usd              DECIMAL(14, 2) NOT NULL,
  realized_pnl_usd      DECIMAL(14, 2) NOT NULL DEFAULT 0,
  envelope_json         JSON NOT NULL,
  runners_json          JSON NOT NULL,
  fill_model            VARCHAR(64) NOT NULL DEFAULT 'mark_mid_v1',
  last_tick_at          TIMESTAMP NULL DEFAULT NULL,
  last_tick_status      VARCHAR(16) NULL,
  last_error            VARCHAR(512) NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_slci_owner_public (identity_id, public_id),
  KEY ix_slci_owner_status (identity_id, status),
  KEY ix_slci_strategy (identity_id, strategy_id),
  CONSTRAINT fk_slci_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_slci_strategy FOREIGN KEY (strategy_id)
    REFERENCES strategy_lab_strategies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS strategy_lab_curate_positions (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id             VARCHAR(16) NOT NULL,
  instance_id           BIGINT UNSIGNED NOT NULL,
  identity_id           BIGINT UNSIGNED NOT NULL,
  symbol                VARCHAR(32) NOT NULL,
  structure_json        JSON NOT NULL,
  qty                   INT NOT NULL DEFAULT 1,
  side                  VARCHAR(8) NOT NULL DEFAULT 'long',
  -- long = debit defined-risk; short = credit defined-risk (fake money only)
  entry_price           DECIMAL(14, 6) NOT NULL,
  max_loss_usd          DECIMAL(14, 2) NOT NULL,
  max_profit_usd        DECIMAL(14, 2) NOT NULL,
  mark_price            DECIMAL(14, 6) NULL,
  unrealized_pnl_usd    DECIMAL(14, 2) NOT NULL DEFAULT 0,
  status                VARCHAR(16) NOT NULL DEFAULT 'open',
  -- open | closed
  client_order_tag      VARCHAR(64) NOT NULL,
  opened_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at             TIMESTAMP NULL DEFAULT NULL,
  close_reason          VARCHAR(64) NULL,
  realized_pnl_usd      DECIMAL(14, 2) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_slcp_public (public_id),
  KEY ix_slcp_instance_status (instance_id, status),
  KEY ix_slcp_identity (identity_id),
  CONSTRAINT fk_slcp_instance FOREIGN KEY (instance_id)
    REFERENCES strategy_lab_curate_instances (id) ON DELETE CASCADE,
  CONSTRAINT fk_slcp_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS strategy_lab_curate_orders (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id             VARCHAR(16) NOT NULL,
  instance_id           BIGINT UNSIGNED NOT NULL,
  identity_id           BIGINT UNSIGNED NOT NULL,
  position_id           BIGINT UNSIGNED NULL,
  client_order_tag      VARCHAR(64) NOT NULL,
  intent                VARCHAR(16) NOT NULL,
  -- open | close
  status                VARCHAR(16) NOT NULL,
  -- accepted | filled | rejected
  symbol                VARCHAR(32) NOT NULL,
  qty                   INT NOT NULL,
  fill_price            DECIMAL(14, 6) NULL,
  reject_reason         VARCHAR(256) NULL,
  payload_json          JSON NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_slco_public (public_id),
  UNIQUE KEY uq_slco_tag (instance_id, client_order_tag),
  KEY ix_slco_instance (instance_id),
  CONSTRAINT fk_slco_instance FOREIGN KEY (instance_id)
    REFERENCES strategy_lab_curate_instances (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS strategy_lab_decision_log (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id           BIGINT UNSIGNED NOT NULL,
  instance_id           BIGINT UNSIGNED NOT NULL,
  strategy_public_id    VARCHAR(16) NOT NULL,
  runner_type           VARCHAR(16) NOT NULL,
  -- scan | manage | system | manual
  event_type            VARCHAR(64) NOT NULL,
  reason_code           VARCHAR(64) NULL,
  message               VARCHAR(512) NOT NULL DEFAULT '',
  payload_json          JSON NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_sldl_instance_created (instance_id, created_at),
  KEY ix_sldl_identity_created (identity_id, created_at),
  CONSTRAINT fk_sldl_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_sldl_instance FOREIGN KEY (instance_id)
    REFERENCES strategy_lab_curate_instances (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
