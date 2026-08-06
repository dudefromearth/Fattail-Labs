-- 086 — VIX: use VIXY as labeled proxy until Massive index entitlement
UPDATE market_symbol_universe
SET
  proxy_symbol = 'VIXY',
  note = 'Cboe VIX - vol regime, proxy VIXY until I:VIX entitled (not true VIX)'
WHERE symbol = 'VIX'
