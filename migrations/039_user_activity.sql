-- 039_user_activity.sql
-- User activity analytics for the admin "Users" section
-- (FatTail-Labs-User-Activity-Analytics-Spec-v1.0).
--
-- login_events: one row per successful login. Auth is otherwise stateless JWT,
--   so this is the ONLY record of who logged in, when, and how (provider).
-- page_views: one row per authenticated in-app navigation (member routes only;
--   /admin paths and anonymous visitors are never recorded). Powers
--   "pages navigated" and gap-based "time on platform" estimation.
--
-- Both are keyed by identity_id (email is the identity's unique key) and cascade
-- on identity delete. Writes are best-effort and never block login/navigation.

CREATE TABLE IF NOT EXISTS login_events (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id  BIGINT UNSIGNED NOT NULL,
  provider     VARCHAR(64)  NOT NULL,   -- native | wordpress:fattail | wordpress:0-dte
  role         VARCHAR(32)  NOT NULL,   -- derived role at moment of login
  ip           VARCHAR(64)  NULL,
  user_agent   VARCHAR(512) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_login_identity_at (identity_id, created_at),
  CONSTRAINT fk_login_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS page_views (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id  BIGINT UNSIGNED NOT NULL,
  path         VARCHAR(512) NOT NULL,   -- pathname only (no query string / fragment)
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_pv_identity_at (identity_id, created_at),
  CONSTRAINT fk_pv_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
