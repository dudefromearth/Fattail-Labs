-- 141 — IKI Factory Live / Deploy (IF-4)
-- Spec v0.1.5 §6 · GO IF-4 · B5 Factory Live record (not Runner)
-- Publication signal is the Live transition. No Wiki envelope.

ALTER TABLE iki_factory_cards
  ADD COLUMN live_at TIMESTAMP NULL AFTER pickup_at,
  ADD COLUMN publication_hash CHAR(64) NULL AFTER live_at,
  ADD COLUMN woo_product_id BIGINT UNSIGNED NULL AFTER publication_hash,
  ADD COLUMN store_visible TINYINT(1) NOT NULL DEFAULT 0 AFTER woo_product_id;

CREATE INDEX ix_iki_factory_live ON iki_factory_cards (lane, live_at);
