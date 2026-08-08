-- 103 — Ensure every trade account has a ledger campaign (post-102 backfill)
-- Spec: Structured Practice §2.1 / Law 1 — furniture, never signed.
-- Idempotent: only inserts when no is_ledger row exists for that account.

INSERT INTO member_practice_campaigns
  (identity_id, account_id, title, status, activated_at, starts_at, ends_at,
   starting_capital, goals_md, is_default, is_ledger, signed_at, signed_terms,
   signed_terms_backfilled, predecessor_campaign_id, export_key)
SELECT
  a.identity_id,
  a.id,
  CONCAT(
    'Default — ',
    LEFT(IFNULL(NULLIF(TRIM(a.label), ''), 'Primary'), 200)
  ),
  'active',
  UTC_TIMESTAMP(6),
  a.created_at,
  NULL,
  NULL,
  NULL,
  1,
  1,
  NULL,
  NULL,
  0,
  NULL,
  CONCAT('camp-ledger-', a.id)
FROM member_trade_log_accounts a
WHERE NOT EXISTS (
  SELECT 1 FROM member_practice_campaigns c
  WHERE c.identity_id = a.identity_id
    AND c.account_id = a.id
    AND c.is_ledger = 1
)
AND NOT EXISTS (
  SELECT 1 FROM member_practice_campaigns c2
  WHERE c2.export_key = CONCAT('camp-ledger-', a.id)
);
