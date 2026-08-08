-- 104 — Rename provisioned account label Primary → Default (member word)
-- Only exact stock name "Primary" is rewritten; member renames are untouched.
-- Also refresh ledger titles that still say "Default — Primary".

UPDATE member_trade_log_accounts
   SET label = 'Default'
 WHERE label = 'Primary';

UPDATE member_practice_campaigns
   SET title = 'Default — Default'
 WHERE is_ledger = 1
   AND title = 'Default — Primary';
