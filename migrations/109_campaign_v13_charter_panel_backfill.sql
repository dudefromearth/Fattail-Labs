-- 109 — v1.3 backfill: six panel seeds on every pre-existing charter
-- Spec: Member Campaign Spec v1.3 §5 — prescribed six on every charter.
-- Idempotent: only inserts missing (attribute, role=boundary) rows.
-- Ledgers excluded. Account-free reaffirm (charter account_id NULL).

UPDATE member_practice_campaigns
   SET account_id = NULL
 WHERE is_ledger = 0
   AND account_id IS NOT NULL;

-- Seed helpers: one INSERT per attribute (MySQL has no multi-row SELECT of constants easily)

INSERT INTO member_practice_campaign_bounds
  (identity_id, campaign_id, role, attribute, unit, basis, window_kind,
   range_low, range_high, display_low, display_high, is_critical, n_floor, export_key)
SELECT c.identity_id, c.id, 'boundary', 'win_rate', 'percent', NULL, NULL,
       40, 60, 0, 100, 0, 20, CONCAT('bnd-seed-wr-', c.id)
FROM member_practice_campaigns c
WHERE c.is_ledger = 0
  AND NOT EXISTS (
    SELECT 1 FROM member_practice_campaign_bounds b
    WHERE b.campaign_id = c.id AND b.role = 'boundary' AND b.attribute = 'win_rate'
  );

INSERT INTO member_practice_campaign_bounds
  (identity_id, campaign_id, role, attribute, unit, basis, window_kind,
   range_low, range_high, display_low, display_high, is_critical, n_floor, export_key)
SELECT c.identity_id, c.id, 'boundary', 'risk_to_reward', 'ratio', NULL, NULL,
       9, 18, 0, 30, 0, 10, CONCAT('bnd-seed-rr-', c.id)
FROM member_practice_campaigns c
WHERE c.is_ledger = 0
  AND NOT EXISTS (
    SELECT 1 FROM member_practice_campaign_bounds b
    WHERE b.campaign_id = c.id AND b.role = 'boundary' AND b.attribute = 'risk_to_reward'
  );

INSERT INTO member_practice_campaign_bounds
  (identity_id, campaign_id, role, attribute, unit, basis, window_kind,
   range_low, range_high, display_low, display_high, is_critical, n_floor, export_key)
SELECT c.identity_id, c.id, 'boundary', 'drawdown', 'percent', NULL, NULL,
       0, 6, 0, 15, 0, 10, CONCAT('bnd-seed-dd-', c.id)
FROM member_practice_campaigns c
WHERE c.is_ledger = 0
  AND NOT EXISTS (
    SELECT 1 FROM member_practice_campaign_bounds b
    WHERE b.campaign_id = c.id AND b.role = 'boundary' AND b.attribute = 'drawdown'
  );

INSERT INTO member_practice_campaign_bounds
  (identity_id, campaign_id, role, attribute, unit, basis, window_kind,
   range_low, range_high, display_low, display_high, is_critical, n_floor, export_key)
SELECT c.identity_id, c.id, 'boundary', 'avg_win_loss', 'ratio', NULL, NULL,
       1.2, 2.2, 0, 4, 0, 10, CONCAT('bnd-seed-awl-', c.id)
FROM member_practice_campaigns c
WHERE c.is_ledger = 0
  AND NOT EXISTS (
    SELECT 1 FROM member_practice_campaign_bounds b
    WHERE b.campaign_id = c.id AND b.role = 'boundary' AND b.attribute = 'avg_win_loss'
  );

INSERT INTO member_practice_campaign_bounds
  (identity_id, campaign_id, role, attribute, unit, basis, window_kind,
   range_low, range_high, display_low, display_high, is_critical, n_floor, export_key)
SELECT c.identity_id, c.id, 'boundary', 'profit_factor', 'ratio', NULL, NULL,
       1.3, 2.5, 0, 5, 0, 10, CONCAT('bnd-seed-pf-', c.id)
FROM member_practice_campaigns c
WHERE c.is_ledger = 0
  AND NOT EXISTS (
    SELECT 1 FROM member_practice_campaign_bounds b
    WHERE b.campaign_id = c.id AND b.role = 'boundary' AND b.attribute = 'profit_factor'
  );

INSERT INTO member_practice_campaign_bounds
  (identity_id, campaign_id, role, attribute, unit, basis, window_kind,
   range_low, range_high, display_low, display_high, is_critical, n_floor, export_key)
SELECT c.identity_id, c.id, 'boundary', 'sharpe', 'ratio', NULL, NULL,
       2, 6, 0, 10, 0, 10, CONCAT('bnd-seed-sh-', c.id)
FROM member_practice_campaigns c
WHERE c.is_ledger = 0
  AND NOT EXISTS (
    SELECT 1 FROM member_practice_campaign_bounds b
    WHERE b.campaign_id = c.id AND b.role = 'boundary' AND b.attribute = 'sharpe'
  );
