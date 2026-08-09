-- 115 — Per-account buying power (Positions View Spec v0.2 · PV-2 / #5a)
-- Move deployability BP off identity capital_prefs onto each trade book.

SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_trade_log_accounts'
    AND COLUMN_NAME = 'buying_power_posture'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_trade_log_accounts
     ADD COLUMN buying_power_posture VARCHAR(32) NOT NULL DEFAULT ''arbitrary'' AFTER starting_balance,
     ADD COLUMN buying_power_value DECIMAL(18, 2) NULL AFTER buying_power_posture,
     ADD COLUMN buying_power_as_of DATETIME(6) NULL AFTER buying_power_value',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Copy identity-level self_report BP onto each account once (first land)
UPDATE member_trade_log_accounts a
  INNER JOIN member_capital_prefs p ON p.identity_id = a.identity_id
   SET a.buying_power_posture = p.buying_power_posture,
       a.buying_power_value = p.buying_power_value,
       a.buying_power_as_of = p.buying_power_as_of
 WHERE p.buying_power_posture IN ('self_report', 'live_sync')
   AND a.buying_power_posture = 'arbitrary'
   AND a.buying_power_value IS NULL;
