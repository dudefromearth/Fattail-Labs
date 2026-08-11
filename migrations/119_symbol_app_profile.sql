-- 119 — Per-symbol app profile for Options Lab / Practice / Strategy Lab
-- Apps read market_symbol_universe.app_profile_json (+ columns) when a symbol
-- is selected so heatmap wings, fly widths, multiplier, etc. are config-driven.
--
-- Profile shape (JSON object, all keys optional — server fills kind defaults):
--   default_wings          int     chain ± listed strikes (default 25)
--   fly_width_mode         string  msc_spx | step_multiples
--   fly_width_count        int     when step_multiples (default 8)
--   fly_widths             number[] explicit center-to-wing points (overrides mode)
--   fetch_step_floor       number  Massive pre-filter floor for equities
--   contract_multiplier    int     100 options, 1 stock-only
--   supports_options       bool
--   default_view_side      call|put
--   heatmap_default_template  sym-fly | bw-fly | gex | ladder
--   ohlc_default_tf        1d | 1h | 5m | …

SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'market_symbol_universe'
    AND COLUMN_NAME = 'app_profile_json'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE market_symbol_universe ADD COLUMN app_profile_json JSON NULL AFTER strike_step',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Strike steps (listed grid hint) for house universe
UPDATE market_symbol_universe SET strike_step = 5.0
  WHERE symbol IN ('SPX', 'NDX', 'RUT') AND (strike_step IS NULL OR strike_step = 0);
UPDATE market_symbol_universe SET strike_step = 1.0
  WHERE symbol IN ('XSP', 'SPY', 'QQQ', 'IWM') AND (strike_step IS NULL OR strike_step = 0);
UPDATE market_symbol_universe SET strike_step = 2.5
  WHERE symbol IN ('TSLA', 'NVDA', 'AMZN', 'META', 'GOOGL') AND (strike_step IS NULL OR strike_step = 0);
UPDATE market_symbol_universe SET strike_step = 1.0
  WHERE symbol IN ('AAPL', 'MSFT') AND (strike_step IS NULL OR strike_step = 0);
UPDATE market_symbol_universe SET strike_step = 0.5
  WHERE symbol IN ('GLD', 'SLV', 'TLT', 'XLF', 'UNG', 'USO') AND (strike_step IS NULL OR strike_step = 0);

-- Index / SPX-class fly ladder (MSC widths)
UPDATE market_symbol_universe
SET app_profile_json = JSON_OBJECT(
  'default_wings', 25,
  'fly_width_mode', 'msc_spx',
  'fly_widths', JSON_ARRAY(20, 25, 30, 35, 40, 45, 50),
  'fetch_step_floor', 5.0,
  'contract_multiplier', 100,
  'supports_options', TRUE,
  'default_view_side', 'call',
  'heatmap_default_template', 'sym-fly',
  'ohlc_default_tf', '1d'
)
WHERE kind = 'index' AND app_profile_json IS NULL;

-- ETF / equity: step multiples, wider fetch floor
UPDATE market_symbol_universe
SET app_profile_json = JSON_OBJECT(
  'default_wings', 25,
  'fly_width_mode', 'step_multiples',
  'fly_width_count', 8,
  'fetch_step_floor', 2.5,
  'contract_multiplier', 100,
  'supports_options', TRUE,
  'default_view_side', 'call',
  'heatmap_default_template', 'sym-fly',
  'ohlc_default_tf', '1d'
)
WHERE kind IN ('etf', 'equity') AND app_profile_json IS NULL;

-- Reference-only (VIX etc.): options chain optional / weaker
UPDATE market_symbol_universe
SET app_profile_json = JSON_OBJECT(
  'default_wings', 15,
  'fly_width_mode', 'step_multiples',
  'fly_width_count', 6,
  'fetch_step_floor', 1.0,
  'contract_multiplier', 100,
  'supports_options', TRUE,
  'default_view_side', 'call',
  'heatmap_default_template', 'ladder',
  'ohlc_default_tf', '1d'
)
WHERE role = 'reference' AND app_profile_json IS NULL;
