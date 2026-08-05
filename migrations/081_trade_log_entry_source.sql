-- 081 — Trade Log entry source + trash reason (manual management)
-- entry_source: manual | import | machine (later). trash_reason optional process note.

ALTER TABLE member_trade_log_trades
  ADD COLUMN entry_source VARCHAR(16) NOT NULL DEFAULT 'manual'
    AFTER external_order_id,
  ADD COLUMN trash_reason VARCHAR(64) NULL
    AFTER entry_source;

-- Imports that already have external_adapter → import
UPDATE member_trade_log_trades
SET entry_source = 'import'
WHERE external_adapter IS NOT NULL AND external_adapter != '';
