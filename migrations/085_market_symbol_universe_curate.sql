-- 085 — Curate shared universe (Coach): indexes + ETFs + stocks
-- Includes underliers with 3–5 expirations/week (options-heavy book).
-- feed_symbol: Massive API ticker when different (e.g. I:SPX).
-- proxy_symbol: fallback underlier when index feed not entitled (labeled).

ALTER TABLE market_symbol_universe
  ADD COLUMN feed_symbol VARCHAR(32) NULL AFTER symbol,
  ADD COLUMN proxy_symbol VARCHAR(32) NULL AFTER feed_symbol,
  ADD COLUMN options_cadence VARCHAR(32) NULL AFTER note;

-- Disable anything not in the Coach universe (clean slate for enabled set)
UPDATE market_symbol_universe SET enabled = 0;

INSERT INTO market_symbol_universe
  (symbol, feed_symbol, proxy_symbol, kind, enabled, sort_order, note, options_cadence)
VALUES
  -- Indexes (product symbols members use; feed may be I:*)
  ('SPX',  'I:SPX',  'SPY',  'index', 1, 10,  'S&P 500 index — primary 0DTE/weekly surface', '3-5x/week+0DTE'),
  ('XSP',  'I:XSP',  'SPY',  'index', 1, 20,  'Mini-SPX — cash-settled smaller notional', '3-5x/week+0DTE'),
  ('VIX',  'I:VIX',  'VIXY', 'index', 1, 30,  'Cboe VIX - vol regime, proxy VIXY until entitled', 'weeklys'),
  -- ETFs
  ('SPY',  NULL,      NULL,   'etf',   1, 40,  'S&P 500 ETF', '3-5x/week+0DTE'),
  ('QQQ',  NULL,      NULL,   'etf',   1, 50,  'Nasdaq-100 ETF', '3-5x/week+0DTE'),
  ('IWM',  NULL,      NULL,   'etf',   1, 60,  'Russell 2000 ETF', '3-5x/week'),
  ('GLD',  NULL,      NULL,   'etf',   1, 70,  'Gold ETF', 'weeklys'),
  ('TLT',  NULL,      NULL,   'etf',   1, 80,  '20+ Year Treasury ETF', 'weeklys'),
  ('SLV',  NULL,      NULL,   'etf',   1, 90,  'Silver ETF', 'weeklys'),
  ('USO',  NULL,      NULL,   'etf',   1, 100, 'Crude oil ETF', 'weeklys'),
  ('XLF',  NULL,      NULL,   'etf',   1, 110, 'Financials select', 'weeklys'),
  ('UNG',  NULL,      NULL,   'etf',   1, 120, 'Natural gas ETF', 'weeklys'),
  -- Stocks (Mag 7 subset per Coach)
  ('AAPL', NULL,      NULL,   'equity', 1, 200, 'Apple', 'weeklys+0DTE where listed'),
  ('AMZN', NULL,      NULL,   'equity', 1, 210, 'Amazon', 'weeklys+0DTE where listed'),
  ('NVDA', NULL,      NULL,   'equity', 1, 220, 'NVIDIA', 'weeklys+0DTE where listed'),
  ('TSLA', NULL,      NULL,   'equity', 1, 230, 'Tesla', 'weeklys+0DTE where listed'),
  ('GOOGL',NULL,      NULL,   'equity', 1, 240, 'Alphabet', 'weeklys'),
  ('META', NULL,      NULL,   'equity', 1, 250, 'Meta', 'weeklys+0DTE where listed'),
  ('MSFT', NULL,      NULL,   'equity', 1, 260, 'Microsoft', 'weeklys')
ON DUPLICATE KEY UPDATE
  feed_symbol = VALUES(feed_symbol),
  proxy_symbol = VALUES(proxy_symbol),
  kind = VALUES(kind),
  enabled = VALUES(enabled),
  sort_order = VALUES(sort_order),
  note = VALUES(note),
  options_cadence = VALUES(options_cadence);
