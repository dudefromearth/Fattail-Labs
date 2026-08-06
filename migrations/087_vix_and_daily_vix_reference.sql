-- 087 — VIX + Daily VIX (VIX1D) for strategy decisions; prev_close on all marks

ALTER TABLE market_live_marks
  ADD COLUMN prev_close DECIMAL(18, 6) NULL AFTER last_trade,
  ADD COLUMN day_open DECIMAL(18, 6) NULL AFTER prev_close,
  ADD COLUMN day_high DECIMAL(18, 6) NULL AFTER day_open,
  ADD COLUMN day_low DECIMAL(18, 6) NULL AFTER day_high,
  ADD COLUMN day_change_pct DECIMAL(12, 6) NULL AFTER day_low;

ALTER TABLE market_symbol_universe
  ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'tradeable' AFTER kind;
  -- tradeable | reference  (reference = vol regime for decisions, not default scan open)

-- Ensure VIX is reference-role
UPDATE market_symbol_universe
SET role = 'reference',
    note = 'VIX 30-day IV regime for strategy decisions (proxy VIXY until I:VIX entitled)'
WHERE symbol = 'VIX';

-- Daily VIX = Cboe VIX1D (1-day volatility index)
INSERT INTO market_symbol_universe
  (symbol, feed_symbol, proxy_symbol, kind, role, enabled, sort_order, note, options_cadence)
VALUES
  ('VIX1D', 'I:VIX1D', 'VIXY', 'index', 'reference', 1, 25,
   'Daily VIX (VIX1D) - 1-day IV for 0DTE/daily decisions (proxy VIXY until I:VIX1D entitled)',
   'daily/0DTE ref')
ON DUPLICATE KEY UPDATE
  feed_symbol = VALUES(feed_symbol),
  proxy_symbol = VALUES(proxy_symbol),
  kind = VALUES(kind),
  role = VALUES(role),
  enabled = 1,
  sort_order = VALUES(sort_order),
  note = VALUES(note),
  options_cadence = VALUES(options_cadence);
