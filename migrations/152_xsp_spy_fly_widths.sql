-- 152 — XSP and SPY fly ladders are 1–7 fixed points, not the index/ETF kind default.
-- kind is a settlement label, not a scale discriminator. XSP inherited SPX's
-- 20…50 ladder (migration 119); a 20-wide XSP fly is unpriceable (spread probe
-- 2026-09-04: 20+ OTM is 95.8% bid-null on puts, 100% on calls).
-- JSON_SET only — do not replace the object (would wipe sibling profile keys).
-- fetch_step_floor is left alone (inert for XSP; chain_ladder applies it only
-- when not is_index).

-- NULL profile: seed kind default first, then overlay the two keys.
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
WHERE symbol = 'XSP' AND app_profile_json IS NULL;

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
WHERE symbol = 'SPY' AND app_profile_json IS NULL;

UPDATE market_symbol_universe
SET app_profile_json = JSON_SET(
  app_profile_json,
  '$.fly_width_mode', 'fixed_points',
  '$.fly_widths', JSON_ARRAY(1, 2, 3, 4, 5, 6, 7)
)
WHERE symbol IN ('XSP', 'SPY');
