-- 111 — Account starting_balance for Ring 1
-- Spec: Capital v0.3 · Funding v0.2

SET @db := DATABASE();
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_trade_log_accounts'
    AND COLUMN_NAME = 'starting_balance'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_trade_log_accounts ADD COLUMN starting_balance DECIMAL(18, 2) NULL AFTER currency',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
