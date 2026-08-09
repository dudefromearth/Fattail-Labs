-- 112 — Cash movements (fund / defund)
-- Spec: Funding v0.2

CREATE TABLE IF NOT EXISTS member_account_cash_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id BIGINT UNSIGNED NOT NULL,
  account_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  occurred_at DATETIME(6) NOT NULL,
  recorded_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  note MEDIUMTEXT NULL,
  reverses_movement_id BIGINT UNSIGNED NULL,
  export_key VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_macm_account (identity_id, account_id, occurred_at),
  UNIQUE KEY uq_macm_export (export_key),
  CONSTRAINT fk_macm_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_macm_account FOREIGN KEY (account_id)
    REFERENCES member_trade_log_accounts (id) ON DELETE CASCADE,
  CONSTRAINT fk_macm_reverse FOREIGN KEY (reverses_movement_id)
    REFERENCES member_account_cash_movements (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
