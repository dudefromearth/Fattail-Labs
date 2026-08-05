-- 082 — entry_source: machine → automated (Strategy Lab / automations ≠ import)
-- Three channels: manual | import | automated

UPDATE member_trade_log_trades
SET entry_source = 'automated'
WHERE entry_source = 'machine';
