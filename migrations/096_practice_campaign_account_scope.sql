-- 096 — Practice Campaign: account scope + capital/goals (human mode)
-- Additive / nullable only — safe for existing campaigns and unstamped trades.
-- Does NOT: require campaign on accounts, rewrite trades, demote actives.
-- DL-259 · Member Campaign Concept Spec (upgrade §).

-- account_id (nullable FK)
SET @db := DATABASE();
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'account_id'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN account_id BIGINT UNSIGNED NULL AFTER identity_id',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'starting_capital'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN starting_capital DECIMAL(18, 2) NULL AFTER ends_at',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'goals_md'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN goals_md MEDIUMTEXT NULL AFTER starting_capital',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND INDEX_NAME = 'ix_mpc_account'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD KEY ix_mpc_account (identity_id, account_id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND CONSTRAINT_NAME = 'fk_mpc_trade_account'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD CONSTRAINT fk_mpc_trade_account FOREIGN KEY (account_id) REFERENCES member_trade_log_accounts (id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
