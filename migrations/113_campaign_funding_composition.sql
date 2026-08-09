-- 113 — Campaign funding composition (wrap / proportion)
-- Spec: Capital v0.3 Ring 2 · OD-5 snapshot default

CREATE TABLE IF NOT EXISTS member_practice_campaign_funding (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id BIGINT UNSIGNED NOT NULL,
  campaign_id BIGINT UNSIGNED NOT NULL,
  mode VARCHAR(16) NOT NULL,
  account_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(18, 2) NULL,
  pct DECIMAL(9, 4) NULL,
  tracking VARCHAR(16) NOT NULL DEFAULT 'snapshot',
  snapshot_amount DECIMAL(18, 2) NULL,
  snapshot_at DATETIME(6) NULL,
  export_key VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_mpcf_campaign (identity_id, campaign_id),
  UNIQUE KEY uq_mpcf_export (export_key),
  CONSTRAINT fk_mpcf_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mpcf_campaign FOREIGN KEY (campaign_id)
    REFERENCES member_practice_campaigns (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpcf_account FOREIGN KEY (account_id)
    REFERENCES member_trade_log_accounts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
