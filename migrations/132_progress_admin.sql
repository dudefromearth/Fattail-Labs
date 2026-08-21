-- 132 — Progress admin surface (DL-530)
-- Standalone admin analytics: per-source snapshots + editable model parameters.
-- New tables only; nothing existing is altered.

CREATE TABLE progress_snapshot (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source VARCHAR(32) NOT NULL,            -- woocommerce | youtube | activecampaign
  captured_at DATETIME NOT NULL,
  status VARCHAR(16) NOT NULL,            -- ok | failed
  error TEXT NULL,                        -- populated when status = failed
  duration_ms INT UNSIGNED NULL,
  payload JSON NULL,                      -- normalised source facts (never raw dumps)
  PRIMARY KEY (id),
  KEY idx_progress_snapshot_source (source, captured_at),
  KEY idx_progress_snapshot_ok (source, status, captured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE progress_model_param (
  param_key VARCHAR(64) NOT NULL,
  param_value DECIMAL(18,6) NOT NULL,
  unit VARCHAR(32) NOT NULL,              -- rate | count | usd | days | views
  label VARCHAR(160) NOT NULL,
  hint VARCHAR(500) NOT NULL,
  min_value DECIMAL(18,6) NOT NULL,
  max_value DECIMAL(18,6) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL,
  updated_by VARCHAR(191) NULL,
  PRIMARY KEY (param_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seeds are starting values measured 2026-08-21 from the live WooCommerce data.
-- They are DATA, not doctrine: admins retune them as the business moves.
INSERT INTO progress_model_param
  (param_key, param_value, unit, label, hint, min_value, max_value, sort_order, updated_at) VALUES
  ('monthly_revenue_target', 30000.000000, 'usd', 'Monthly revenue target',
   'The number the Progress verdict is measured against.', 0, 1000000, 10, UTC_TIMESTAMP()),
  ('activator_monthly_churn', 0.067000, 'rate', 'Activator monthly churn',
   'Share of Activators cancelling per month. Measured Jun-Aug 2026 average.', 0.001000, 1, 20, UTC_TIMESTAMP()),
  ('navigator_monthly_churn', 0.205000, 'rate', 'Navigator monthly churn',
   'Share of monthly Navigators cancelling per month. Small base - review often.', 0.001000, 1, 30, UTC_TIMESTAMP()),
  ('observer_upgrade_rate', 0.059000, 'rate', 'Observer to paid conversion',
   'Share of Observers buying any paid tier within 28 days. Jun-Jul 2026 reality.', 0, 1, 40, UTC_TIMESTAMP()),
  ('observer_revenue_per_signup', 67.000000, 'usd', 'Revenue per Observer signup',
   'Expected subscription revenue over the full term. 6-week term estimate.', 0, 10000, 50, UTC_TIMESTAMP()),
  ('observer_annual_rate', 0.029000, 'rate', 'Observer to annual rate',
   'Share of Observers who go on to buy an annual or lifetime.', 0, 1, 60, UTC_TIMESTAMP()),
  ('upgrade_share_navigator', 0.250000, 'rate', 'Upgrades landing on Navigator',
   'Of Observers who upgrade, the share choosing Navigator over Activator.', 0, 1, 70, UTC_TIMESTAMP()),
  ('views_per_observer', 430.000000, 'views', 'Channel views per Observer',
   'YouTube views needed to produce one Observer signup. Mar-Aug 2026 blend.', 1, 100000, 80, UTC_TIMESTAMP()),
  ('conversion_floor', 0.100000, 'rate', 'Conversion floor',
   'Observer conversion below this fires a finding.', 0, 1, 90, UTC_TIMESTAMP()),
  ('activator_churn_ceiling', 0.100000, 'rate', 'Activator churn ceiling',
   'Activator churn above this fires a finding.', 0, 1, 100, UTC_TIMESTAMP()),
  ('navigator_churn_ceiling', 0.150000, 'rate', 'Navigator churn ceiling',
   'Navigator churn above this fires a finding.', 0, 1, 110, UTC_TIMESTAMP()),
  ('campaign_ctr_floor', 0.005000, 'rate', 'Campaign click-through floor',
   'Full-list email CTR below this fires a list-fatigue finding.', 0, 1, 120, UTC_TIMESTAMP()),
  ('snapshot_stale_hours', 6.000000, 'count', 'Stale after (hours)',
   'A source older than this is shown as stale rather than current.', 1, 168, 130, UTC_TIMESTAMP());
