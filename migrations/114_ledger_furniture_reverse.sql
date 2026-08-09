-- 114 — Ledger furniture reverse (Top-Level Account Amendment)
-- Option A soft-delete: unstamp trades; abandon furniture rows (keep export_key).
-- Spec: Campaign Amendment Top-Level Is the Account

-- Clear stamps pointing at ledger furniture
UPDATE member_trade_log_trades t
  INNER JOIN member_practice_campaigns c
    ON c.id = t.practice_campaign_id
   AND c.identity_id = t.identity_id
   SET t.practice_campaign_id = NULL,
       t.stamped_by = NULL
 WHERE c.is_ledger = 1;

-- Soft-end furniture campaigns (never hard-delete — export lineage)
UPDATE member_practice_campaigns
   SET status = 'abandoned',
       is_default = 0
 WHERE is_ledger = 1
   AND status NOT IN ('abandoned', 'completed');

-- Clear memory pointing at ledger furniture
DELETE m FROM member_practice_campaign_memory m
  INNER JOIN member_practice_campaigns c ON c.id = m.campaign_id
 WHERE c.is_ledger = 1;
