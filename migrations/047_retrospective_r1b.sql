-- 047 — Retrospective R1b (Spec v0.5 §9.2 / §9.3 / §10.1)
-- member_habit_plans schema (CRUD in R4); book expand preference; entitlement is code.

ALTER TABLE identities
  ADD COLUMN retrospective_pnl_expanded TINYINT(1) NOT NULL DEFAULT 0
    AFTER journey_visible_at;

CREATE TABLE IF NOT EXISTS member_habit_plans (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id        BIGINT UNSIGNED NOT NULL,
  retrospective_id   BIGINT UNSIGNED NULL,
  title              VARCHAR(255) NOT NULL DEFAULT '',
  habit              VARCHAR(512) NOT NULL DEFAULT '',
  why_process        TEXT NOT NULL,
  observable_signal  VARCHAR(64) NOT NULL,
  status             VARCHAR(32) NOT NULL DEFAULT 'proposed',
  activated_at       TIMESTAMP NULL DEFAULT NULL,
  retired_at         TIMESTAMP NULL DEFAULT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_mhp_owner_status (identity_id, status),
  KEY ix_mhp_retro (retrospective_id),
  CONSTRAINT fk_mhp_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mhp_retro FOREIGN KEY (retrospective_id)
    REFERENCES member_retrospectives (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
