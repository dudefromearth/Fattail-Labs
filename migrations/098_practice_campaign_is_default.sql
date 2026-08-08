-- 098 — Practice Campaign: is_default (silent book campaign per account)
-- Additive. At most one default per (identity, account) enforced in domain.
-- Default = no-fuss home for brokerage import + trade stamp prefill.
-- Does NOT auto-create campaigns (ensure is explicit API / import path).

SET @db := DATABASE();
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'is_default'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN is_default TINYINT(1) NOT NULL DEFAULT 0 AFTER goals_md',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND INDEX_NAME = 'ix_mpc_default'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD KEY ix_mpc_default (identity_id, account_id, is_default)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
