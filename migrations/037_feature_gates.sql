-- 037 — Feature gates (countdown / waitlist)
-- Admin-controlled: hide a surface until ready + anticipation countdown + email capture.
-- Surfaces are stable keys (home, hub, app, resource, live, wiki, …).
-- NOTE: do not put bare semicolons inside COMMENT strings (migrate.py splits on ;).

CREATE TABLE IF NOT EXISTS feature_gates (
  surface_key           VARCHAR(64) NOT NULL,
  label                 VARCHAR(128) NOT NULL DEFAULT '',
  enabled               TINYINT(1) NOT NULL DEFAULT 0,
  opens_at              DATETIME NULL,
  headline              VARCHAR(512) NOT NULL DEFAULT 'Launching soon',
  body_md               MEDIUMTEXT NULL,
  cta_primary_label     VARCHAR(128) NOT NULL DEFAULT 'Membership',
  cta_primary_href      VARCHAR(512) NOT NULL DEFAULT '/membership',
  cta_secondary_label   VARCHAR(128) NOT NULL DEFAULT 'Create free account',
  cta_secondary_href    VARCHAR(512) NOT NULL DEFAULT '/signup',
  collect_email         TINYINT(1) NOT NULL DEFAULT 1,
  email_prompt          VARCHAR(512) NOT NULL DEFAULT 'Get notified when we open',
  reveal_path           VARCHAR(512) NOT NULL DEFAULT '/hub',
  footer_note           VARCHAR(1024) NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (surface_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feature_gate_emails (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  surface_key   VARCHAR(64) NOT NULL,
  email         VARCHAR(320) NOT NULL,
  source        VARCHAR(64) NOT NULL DEFAULT 'gate',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gate_email (surface_key, email),
  KEY ix_gate_email_surface (surface_key, created_at),
  CONSTRAINT fk_gate_email_surface
    FOREIGN KEY (surface_key) REFERENCES feature_gates (surface_key)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO feature_gates (
  surface_key, label, enabled, opens_at, headline, body_md,
  collect_email, email_prompt, reveal_path, footer_note
) VALUES
(
  'home',
  'Home (/)',
  1,
  '2026-08-01 13:00:00',
  'Launching this weekend',
  'Membership education for convex options trading — capital preservation first. Courses, live sessions, resources, and practice apps. Built for the month-end Navigator campaign and everyone ready to **stop the bleeding**.',
  1,
  'Get notified when FatTail Labs opens',
  '/hub',
  'Navigator annuals and the Labs library open together. Team preview: /hub'
),
(
  'hub',
  'Course hub (/hub)',
  0,
  NULL,
  'Course hub — coming soon',
  'The membership course library is almost ready.',
  1,
  'Notify me when the hub opens',
  '/hub',
  NULL
),
(
  'app',
  'Apps (/app)',
  0,
  NULL,
  'Apps — coming soon',
  'Practice tools for capacity-building are on the way.',
  1,
  'Notify me about Apps',
  '/app',
  NULL
),
(
  'resource',
  'Resources (/resource)',
  0,
  NULL,
  'Resources — coming soon',
  'The member resource library is almost ready.',
  1,
  'Notify me about Resources',
  '/resource',
  NULL
),
(
  'live',
  'Live (/live)',
  0,
  NULL,
  'Live sessions — coming soon',
  'Live schedule and sessions are almost ready.',
  1,
  'Notify me about Live',
  '/live',
  NULL
),
(
  'wiki',
  'Wiki (/app/wiki)',
  0,
  NULL,
  'Wiki — coming soon',
  'The compiled map of everything we teach is under construction.',
  1,
  'Notify me when Wiki opens',
  '/app/wiki',
  NULL
)
ON DUPLICATE KEY UPDATE label = VALUES(label);
