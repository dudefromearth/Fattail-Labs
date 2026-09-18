-- 154 — SA surface profile-store (AZ-VP-9-A22)
-- Server-side is the home of record for every user setting, object default,
-- mode-preset override, layer state, and dialog value. Browser storage is a
-- rehydration cache only. Document carries schema version from day one.
-- Shape:
--   { "schema": 1, "prefs": { ... SaPrefs ... } }

ALTER TABLE identities
  ADD COLUMN sa_surface_json JSON NULL
    COMMENT 'SA surface profile-store document A22 schema+prefs'
    AFTER surface_inspect_json;
