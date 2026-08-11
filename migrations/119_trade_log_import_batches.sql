-- 119_trade_log_import_batches.sql
-- Import batches: every import becomes an identifiable, previewable, deletable unit.
-- Spec: FatTail-Labs-Trade-Log-Import-Batches-Spec-v1.0.
--
-- Structure:
--   member_trade_log_imports  — one row per import; its id IS the unique import ID.
--   member_trade_log_trades.import_id — which import created a trade (NULL = manual/
--     automated/pre-119). FK ON DELETE CASCADE, so deleting an import removes exactly
--     its trades; legs already cascade from trades (040).
--
-- Backfill: existing import trades were never batched, but each was inserted at import
-- time, so we reconstruct historical imports by GAP-clustering their created_at within
-- (identity, account, adapter). GAP = 300s: far above the few seconds a large single
-- import spans, far below the gap between distinct imports. (Exact-second grouping would
-- split a big import that straddles a second — verified against prod.)

CREATE TABLE IF NOT EXISTS member_trade_log_imports (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id          BIGINT UNSIGNED NOT NULL,
  account_id           BIGINT UNSIGNED NOT NULL,
  adapter              VARCHAR(32)  NOT NULL,
  source_filename      VARCHAR(255) NULL,
  practice_campaign_id BIGINT UNSIGNED NULL,
  trade_count          INT NOT NULL DEFAULT 0,
  skipped_count        INT NOT NULL DEFAULT 0,
  label                VARCHAR(120) NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_imports_identity_at (identity_id, created_at),
  CONSTRAINT fk_imports_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE member_trade_log_trades
  ADD COLUMN import_id BIGINT UNSIGNED NULL AFTER entry_source,
  ADD KEY ix_trades_import (identity_id, import_id),
  ADD CONSTRAINT fk_trades_import FOREIGN KEY (import_id)
    REFERENCES member_trade_log_imports (id) ON DELETE CASCADE;

-- Backfill 1: one reconstructed import row per gap-cluster of existing import trades.
INSERT INTO member_trade_log_imports
  (identity_id, account_id, adapter, source_filename, practice_campaign_id,
   trade_count, skipped_count, label, created_at)
SELECT identity_id, account_id, external_adapter, NULL, NULL,
       COUNT(*), 0, 'Recovered import', MIN(created_at)
FROM (
  SELECT id, identity_id, account_id, external_adapter, created_at,
         SUM(is_new) OVER (
           PARTITION BY identity_id, account_id, external_adapter
           ORDER BY created_at, id
         ) AS cl
  FROM (
    SELECT id, identity_id, account_id, external_adapter, created_at,
           CASE
             WHEN LAG(created_at) OVER w IS NULL
               OR TIMESTAMPDIFF(SECOND, LAG(created_at) OVER w, created_at) > 300
             THEN 1 ELSE 0
           END AS is_new
    FROM member_trade_log_trades
    WHERE entry_source = 'import'
      AND import_id IS NULL
      AND external_adapter IS NOT NULL
      AND external_adapter <> ''
    WINDOW w AS (
      PARTITION BY identity_id, account_id, external_adapter
      ORDER BY created_at, id
    )
  ) flagged
) clustered
GROUP BY identity_id, account_id, external_adapter, cl;

-- Backfill 2: stamp each historical import trade with its reconstructed import id.
UPDATE member_trade_log_trades t
JOIN (
  SELECT id, identity_id, account_id, external_adapter,
         MIN(created_at) OVER (
           PARTITION BY identity_id, account_id, external_adapter, cl
         ) AS cl_start
  FROM (
    SELECT id, identity_id, account_id, external_adapter, created_at,
           SUM(is_new) OVER (
             PARTITION BY identity_id, account_id, external_adapter
             ORDER BY created_at, id
           ) AS cl
    FROM (
      SELECT id, identity_id, account_id, external_adapter, created_at,
             CASE
               WHEN LAG(created_at) OVER w IS NULL
                 OR TIMESTAMPDIFF(SECOND, LAG(created_at) OVER w, created_at) > 300
               THEN 1 ELSE 0
             END AS is_new
      FROM member_trade_log_trades
      WHERE entry_source = 'import'
        AND import_id IS NULL
        AND external_adapter IS NOT NULL
        AND external_adapter <> ''
      WINDOW w AS (
        PARTITION BY identity_id, account_id, external_adapter
        ORDER BY created_at, id
      )
    ) flagged2
  ) clustered2
) m ON m.id = t.id
JOIN member_trade_log_imports i
  ON i.identity_id = t.identity_id
 AND i.account_id  = t.account_id
 AND i.adapter     = t.external_adapter
 AND i.created_at  = m.cl_start
 AND i.source_filename IS NULL
SET t.import_id = i.id
WHERE t.entry_source = 'import' AND t.import_id IS NULL;
