-- 005 — plan display metadata (Membership Tiers & Enrollment spec §5)
-- Sellable plans carry marketing display data so the pricing page renders fully
-- before billing wiring. Non-sellable plans (alumni) have NULL.

ALTER TABLE plans ADD COLUMN display_json JSON NULL;
