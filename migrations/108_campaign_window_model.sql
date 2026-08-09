-- 108 — Campaign window model (Member Campaign Spec v1.3)
-- L5: charters are account-free; ledgers remain bound to one account.
-- Keep historical trade stamps; clear only non-ledger campaign.account_id.
-- Schema already nullable (096); this is data reverse + app-guard law.

-- Charters: drop account binding so one season can accept fills from any book.
UPDATE member_practice_campaigns
   SET account_id = NULL
 WHERE is_ledger = 0
   AND account_id IS NOT NULL;

-- Ledgers must remain bound (heal any corrupt NULL ledger row — should not exist).
-- No-op when all ledgers already have account_id; fails loud in domain if NULL.
