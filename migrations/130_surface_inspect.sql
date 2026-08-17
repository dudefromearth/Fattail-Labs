-- 130 — Options Lab Surface inspect defaults + saved views (W3-4)
ALTER TABLE identities
  ADD COLUMN surface_inspect_json JSON NULL
    COMMENT 'Options Lab Surface inspect defaults + saved views'
    AFTER home_quick_nav_json;
