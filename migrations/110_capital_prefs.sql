-- 110 — Identity capital prefs (Accounts & Capital stack)
-- Spec: Capital v0.3 · Funding v0.2 · Staleness v0.1

CREATE TABLE IF NOT EXISTS member_capital_prefs (
  identity_id BIGINT UNSIGNED NOT NULL,
  tolerated_master_drawdown DECIMAL(18, 6) NULL,
  tolerated_master_drawdown_form VARCHAR(16) NOT NULL DEFAULT 'percent',
  buying_power_posture VARCHAR(32) NOT NULL DEFAULT 'arbitrary',
  buying_power_value DECIMAL(18, 2) NULL,
  buying_power_as_of DATETIME(6) NULL,
  balances_confirmed_at DATETIME(6) NULL,
  export_key VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (identity_id),
  UNIQUE KEY uq_mcp_export (export_key),
  CONSTRAINT fk_mcp_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
