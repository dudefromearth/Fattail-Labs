-- 075 — Access Policy Engine tables (Access Control Spec v0.4 §9)
-- Store plan INTENT (selected_plans_json + exact_plans_only). Expand at evaluate only.
-- No expanded-plan cache column. Avoid bare ';' inside COMMENT strings (migrate.py).

CREATE TABLE access_policies (
  target_key              VARCHAR(512) NOT NULL,
  enabled                 TINYINT(1) NOT NULL DEFAULT 1,
  mode                    VARCHAR(16) NOT NULL DEFAULT 'hard',
  min_role                VARCHAR(32) NULL,
  selected_plans_json     JSON NULL,
  exact_plans_only        TINYINT(1) NOT NULL DEFAULT 0,
  all_plans_json          JSON NULL,
  deny_plans_json         JSON NULL,
  plan_role_combine       VARCHAR(8) NOT NULL DEFAULT 'or',
  require_signed_in       TINYINT(1) NOT NULL DEFAULT 1,
  opens_at                DATETIME NULL,
  closes_at               DATETIME NULL,
  close_behavior          VARCHAR(16) NOT NULL DEFAULT 'default',
  deny_ui_json            JSON NULL,
  time_ui_json            JSON NULL,
  campaign_id             BIGINT UNSIGNED NULL,
  grandfather_enrollments TINYINT(1) NOT NULL DEFAULT 1,
  label                   VARCHAR(255) NOT NULL DEFAULT '',
  notes                   TEXT NULL,
  version                 INT NOT NULL DEFAULT 1,
  updated_by              BIGINT UNSIGNED NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (target_key),
  KEY ix_access_campaign (campaign_id),
  KEY ix_access_opens (opens_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=DYNAMIC;

CREATE TABLE access_policy_audit (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  target_key   VARCHAR(512) NOT NULL,
  actor_id     BIGINT UNSIGNED NULL,
  action       VARCHAR(32) NOT NULL,
  before_json  JSON NULL,
  after_json   JSON NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_audit_target_time (target_key, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=DYNAMIC;
