-- 028 — Canonical Course Model v1.0 fidelity columns
-- Spec: Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md
-- Idempotent-style: use IF NOT EXISTS patterns via procedure-free ALTERs;
-- re-run on already-applied DB is blocked by migrate.py applied-file tracking.

ALTER TABLE courses
  ADD COLUMN short_description VARCHAR(1024) NULL AFTER description_md,
  ADD COLUMN pathway_position INT NULL AFTER certification_enabled,
  ADD COLUMN flagship TINYINT(1) NOT NULL DEFAULT 0 AFTER pathway_position,
  ADD COLUMN audience_category VARCHAR(32) NOT NULL DEFAULT 'members' AFTER flagship,
  ADD COLUMN estimated_duration_minutes INT UNSIGNED NULL AFTER audience_category,
  ADD COLUMN learning_outcomes_json JSON NULL AFTER estimated_duration_minutes,
  ADD COLUMN related_live_series_ids_json JSON NULL AFTER learning_outcomes_json,
  ADD COLUMN model_instance_version VARCHAR(64) NULL AFTER related_live_series_ids_json;

ALTER TABLE modules
  ADD COLUMN description_md MEDIUMTEXT NULL AFTER title;

ALTER TABLE lessons
  ADD COLUMN extra_blocks_json JSON NULL AFTER external_url;
