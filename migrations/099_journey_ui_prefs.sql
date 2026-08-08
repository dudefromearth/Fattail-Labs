-- 099 — Journey UI prefs (J3 recovery invite dismiss, F3 server-side)
-- JSON bag on identities; Family B via identity_id on all reads/writes.
-- Shape (open, additive keys):
--   {
--     "recovery_invite_dismissed_at": "ISO-8601" | null,
--     "recovery_invite_dismissed": true | false
--   }

ALTER TABLE identities
  ADD COLUMN journey_ui_prefs_json JSON NULL
    COMMENT 'Server-side Journey UI prefs (dismiss recovery invite, etc.)'
    AFTER home_quick_nav_json;
