-- 133 — Derived cache of git frontmatter pin / provenance (Member Wiki v0.1 S0).
-- Not a pin table. Reindex rebuilds these columns from the checkout.

ALTER TABLE wiki_pages_idx
  ADD COLUMN pin TINYINT(1) NOT NULL DEFAULT 0 AFTER updated_date,
  ADD COLUMN pin_order INT NOT NULL DEFAULT 1000000 AFTER pin,
  ADD COLUMN compiled_by VARCHAR(255) NOT NULL DEFAULT '' AFTER pin_order,
  ADD COLUMN approved_by VARCHAR(255) NOT NULL DEFAULT '' AFTER compiled_by,
  ADD KEY ix_wiki_pin (pin, pin_order, slug);
