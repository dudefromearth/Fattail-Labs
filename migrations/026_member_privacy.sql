-- 026 — Member Data & Privacy spine (Member-Data-Privacy Spec v0.1)
-- Isolation key: identities.identity_id (same as lesson_progress).
-- Content tool tables (trade log / journal / playbook) land in later migrations;
-- this migration is consent, analytics preference, and access audit only.

CREATE TABLE IF NOT EXISTS member_analytics_consent (
  identity_id   BIGINT UNSIGNED NOT NULL,
  opted_in      TINYINT(1) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (identity_id),
  CONSTRAINT fk_mac_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Individual examination grants: member authorizes a specific admin to read
-- scoped surfaces for a time box (IN-1…IN-5). Admin cannot self-authorize.
CREATE TABLE IF NOT EXISTS member_consent_grants (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_identity_id      BIGINT UNSIGNED NOT NULL,
  admin_identity_id       BIGINT UNSIGNED NOT NULL,
  surfaces_json           JSON NOT NULL,
  purpose                 VARCHAR(512) NOT NULL DEFAULT '',
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at              TIMESTAMP NOT NULL,
  revoked_at              TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY ix_mcg_member (member_identity_id, revoked_at, expires_at),
  KEY ix_mcg_admin (admin_identity_id, revoked_at, expires_at),
  CONSTRAINT fk_mcg_member FOREIGN KEY (member_identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mcg_admin FOREIGN KEY (admin_identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Append-only access audit (PD-6). Do not UPDATE/DELETE from application code.
CREATE TABLE IF NOT EXISTS member_access_audit (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  at                      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_identity_id       BIGINT UNSIGNED NOT NULL,
  subject_identity_id     BIGINT UNSIGNED NOT NULL,
  action                  VARCHAR(32) NOT NULL,
  surfaces_json           JSON NULL,
  consent_grant_id        BIGINT UNSIGNED NULL,
  detail                  VARCHAR(512) NULL,
  PRIMARY KEY (id),
  KEY ix_maa_subject (subject_identity_id, at),
  KEY ix_maa_actor (actor_identity_id, at),
  KEY ix_maa_grant (consent_grant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Probe / placeholder content for isolation tests and W4+ (process-first later).
-- Minimal columns only; W4 extends schema for real Trade Log fields.
CREATE TABLE IF NOT EXISTS member_tool_notes (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  surface         VARCHAR(32) NOT NULL,
  body_md         MEDIUMTEXT NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_mtn_owner (identity_id, surface, id),
  CONSTRAINT fk_mtn_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
