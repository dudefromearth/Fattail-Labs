-- 118 — Options chain picker: preformed next-expirations calendar on universe (OC11)
-- Spec: FatTail-Labs-Options-Chain-Picker-Spec-v1.0.1

SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'market_symbol_universe'
    AND COLUMN_NAME = 'next_expirations_json'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE market_symbol_universe ADD COLUMN next_expirations_json JSON NULL AFTER options_cadence',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'market_symbol_universe'
    AND COLUMN_NAME = 'expirations_as_of'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE market_symbol_universe ADD COLUMN expirations_as_of DATETIME NULL AFTER next_expirations_json',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'market_symbol_universe'
    AND COLUMN_NAME = 'strike_step'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE market_symbol_universe ADD COLUMN strike_step DECIMAL(8, 4) NULL AFTER expirations_as_of',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
