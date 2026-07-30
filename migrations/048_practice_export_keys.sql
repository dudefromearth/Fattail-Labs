-- 048 — Practice portability: export_key for round-trip merge (Spec v1.1)

ALTER TABLE member_tool_notes
  ADD COLUMN export_key VARCHAR(64) NULL AFTER body_md,
  ADD UNIQUE KEY uq_mtn_export (identity_id, export_key);

ALTER TABLE member_retrospectives
  ADD COLUMN export_key VARCHAR(64) NULL AFTER body_md,
  ADD UNIQUE KEY uq_mretro_export (identity_id, export_key);

ALTER TABLE member_habit_plans
  ADD COLUMN export_key VARCHAR(64) NULL AFTER status,
  ADD UNIQUE KEY uq_mhp_export (identity_id, export_key);
