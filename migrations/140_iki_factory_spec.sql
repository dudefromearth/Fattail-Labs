-- 140 — IKI Factory Spec lane (IF-3)
-- Template Specification draft. Plan attachment remains the approval field.

ALTER TABLE iki_factory_cards
  ADD COLUMN spec_md MEDIUMTEXT NULL AFTER plan_ref;
