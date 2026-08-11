-- 121_trade_log_import_recycle.sql
-- Recoverable import deletes: deleting an import no longer destroys its trades — they
-- move to trash tables and can be restored within 30 days, after which they're purged.
-- Spec: FatTail-Labs-Trade-Log-Import-Batches-Spec-v1.0 (recycle-bin amendment).
--
-- Why trash tables (not a deleted_at flag on trades): member trades are read in ~20
-- places (blotter, reports, journey scores, capital, campaigns, export…). Moving deleted
-- trades OUT of the live table means every one of those reads excludes them for free —
-- correct by construction, no per-query filter to miss. The 30-day timer lives on the
-- import row's deleted_at (the import row stays, marked deleted, to show in "Recently
-- deleted" and drive the purge).

ALTER TABLE member_trade_log_imports ADD COLUMN deleted_at TIMESTAMP NULL AFTER created_at;

-- Trash mirrors the live tables exactly so moves are a plain INSERT ... SELECT * (ids
-- preserved for lossless restore). LIKE copies columns + indexes but NOT foreign keys,
-- so trashed rows survive independently. Drop the ext-order unique key: a trashed trade
-- and a later re-import can share the same (identity, account, adapter, order) key.
CREATE TABLE IF NOT EXISTS member_trade_log_trades_trash LIKE member_trade_log_trades;
ALTER TABLE member_trade_log_trades_trash DROP INDEX uq_mtlt_ext;

CREATE TABLE IF NOT EXISTS member_trade_log_legs_trash LIKE member_trade_log_legs;
