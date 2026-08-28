-- 150 — IKI Factory: artifact approval, a real Live gate, and price
-- Spec: Specs/FatTail-Labs-IKI-Store-and-Entitlement-Spec-v0.1.md
-- Amends: Specs/FatTail-Labs-IKI-Factory-Spec-v1_1.md §7.3, §8.2, §8.6
--
-- Three problems this fixes:
--   1. produce_staged_artifact() set status='ready', so "the AI finished" and
--      "a human approved" were the same state. There was no approval.
--   2. Nothing stopped a card reaching Live with all four artifacts untouched
--      (_mark_staged sets staged_ready=1 on arrival, and that was the gate).
--   3. free_vs_paid='paid' was reachable with no price anywhere in the system
--      (v1.1 section 8.6 "paid does not invent a price" had no field to read).
--
-- Additive only. No column is dropped, no status value is removed, and every
-- existing row is grandfathered below so no in-flight card is newly blocked.

ALTER TABLE iki_factory_staged_artifacts
  ADD COLUMN approved_at        TIMESTAMP NULL     AFTER status,
  ADD COLUMN approved_by_kind   VARCHAR(16) NULL   AFTER approved_at,
  ADD COLUMN approved_by_id     BIGINT UNSIGNED NULL AFTER approved_by_kind,
  ADD COLUMN approved_by_label  VARCHAR(255) NULL  AFTER approved_by_id;

-- Grandfather. Anything already 'ready' was produced under the old rules where
-- ready WAS the terminal state, and its card could already reach Live. Mark it
-- approved so this migration blocks nothing that was previously passable.
-- Rejection reuses the existing blocked_reason column — no new field.
UPDATE iki_factory_staged_artifacts
   SET status            = 'approved',
       approved_at       = CURRENT_TIMESTAMP,
       approved_by_kind  = 'system',
       approved_by_label = 'grandfathered by migration 150'
 WHERE status = 'ready';

-- Price lives on the card, entered at the Live gate beside product_type,
-- product_tier and free_vs_paid (v1.1 section 8.2 — that entry IS the human
-- promotion). NULL for free apps. Minor units, so no float ever touches money.
ALTER TABLE iki_factory_cards
  ADD COLUMN price_cents    INT UNSIGNED NULL AFTER free_vs_paid,
  ADD COLUMN price_currency VARCHAR(3)   NULL AFTER price_cents,
  ADD COLUMN price_period   VARCHAR(16)  NULL AFTER price_currency;

-- Grandfather paid cards that are already Live. They were published under the
-- old rules and must not be retro-blocked or have a price invented for them
-- (section 8.6). A NULL price on a live card is history, not a defect.
