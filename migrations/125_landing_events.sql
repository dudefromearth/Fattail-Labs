-- 125_landing_events.sql
-- Traffic analytics for the admin "Stats" section (general site landings).
--
-- DISTINCT from page_views (039): page_views records only authenticated member
-- in-app navigation. landing_events records EVERY visit — anonymous included — with
-- acquisition data (referrer host + UTM) so operators can see how many people land
-- on the site, where they come from, and users vs non-users.
--
-- No FK on identity_id: it is nullable (NULL = anonymous visitor) and this is a
-- high-volume, decoupled analytics table. visitor_id is a first-party random token
-- (localStorage) used to count unique visitors; is_landing marks the first page of a
-- browsing session (session/landing count). Referrer + UTM are page-provided, not PII;
-- raw IP is intentionally NOT stored (privacy). Writes are best-effort, never blocking.

CREATE TABLE IF NOT EXISTS landing_events (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  visitor_id    CHAR(32)     NULL,      -- first-party random token; unique-visitor count
  identity_id   BIGINT UNSIGNED NULL,   -- set when logged in; NULL = anonymous
  path          VARCHAR(512) NOT NULL,  -- pathname only (no query / fragment)
  is_landing    TINYINT(1)   NOT NULL DEFAULT 0,  -- first page of a browsing session
  referrer_host VARCHAR(255) NULL,      -- external referrer host (NULL if same-origin/direct)
  referrer      VARCHAR(512) NULL,      -- full referrer (trimmed), external only
  utm_source    VARCHAR(128) NULL,
  utm_medium    VARCHAR(128) NULL,
  utm_campaign  VARCHAR(128) NULL,
  utm_term      VARCHAR(128) NULL,
  utm_content   VARCHAR(128) NULL,
  user_agent    VARCHAR(512) NULL,      -- for bot filtering (not displayed)
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_landing_created (created_at),
  KEY ix_landing_visitor (visitor_id, created_at),
  KEY ix_landing_identity (identity_id, created_at),
  KEY ix_landing_session (is_landing, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
