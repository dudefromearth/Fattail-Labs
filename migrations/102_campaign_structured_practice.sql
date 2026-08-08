-- 102 — Campaign structured practice: ledger, memory, stamp provenance, bounds table
-- Spec: FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.0.md
-- Idempotent ADD COLUMN / CREATE TABLE guards (098 style).

SET @db := DATABASE();

-- Ledger marker (furniture campaign; never signed)
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'is_ledger'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN is_ledger TINYINT(1) NOT NULL DEFAULT 0 AFTER is_default',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Prior is_default active books → ledger (disposition #1)
UPDATE member_practice_campaigns
   SET is_ledger = 1
 WHERE is_default = 1 AND is_ledger = 0;

-- Clear fabricated signatures on ledgers (ledger is never signed)
UPDATE member_practice_campaigns
   SET signed_at = NULL, signed_terms = NULL, signed_terms_backfilled = 0
 WHERE is_ledger = 1 AND signed_at IS NOT NULL;

-- Stamp provenance on trades
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_trade_log_trades'
    AND COLUMN_NAME = 'stamped_by'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_trade_log_trades ADD COLUMN stamped_by VARCHAR(16) NULL AFTER practice_campaign_id',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Last-pair memory (identity, account) → campaign
CREATE TABLE IF NOT EXISTS member_practice_campaign_memory (
  identity_id   BIGINT UNSIGNED NOT NULL,
  account_id    BIGINT UNSIGNED NOT NULL,
  campaign_id   BIGINT UNSIGNED NOT NULL,
  updated_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                  ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (identity_id, account_id),
  KEY ix_mpcm_campaign (campaign_id),
  CONSTRAINT fk_mpcm_identity
    FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mpcm_account
    FOREIGN KEY (account_id) REFERENCES member_trade_log_accounts (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpcm_campaign
    FOREIGN KEY (campaign_id) REFERENCES member_practice_campaigns (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bounds table (charters only; empty until B1 fills)
CREATE TABLE IF NOT EXISTS member_practice_campaign_bounds (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  campaign_id     BIGINT UNSIGNED NOT NULL,
  attribute       VARCHAR(64) NOT NULL,
  unit            VARCHAR(32) NULL,
  basis           VARCHAR(64) NULL,
  window_kind     VARCHAR(32) NULL,
  range_low       DECIMAL(20, 8) NULL,
  range_high      DECIMAL(20, 8) NULL,
  is_critical     TINYINT(1) NOT NULL DEFAULT 0,
  n_floor         INT UNSIGNED NULL,
  export_key      VARCHAR(64) NOT NULL,
  created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_mpcb_export (export_key),
  KEY ix_mpcb_campaign (identity_id, campaign_id),
  CONSTRAINT fk_mpcb_identity
    FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mpcb_campaign
    FOREIGN KEY (campaign_id) REFERENCES member_practice_campaigns (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
