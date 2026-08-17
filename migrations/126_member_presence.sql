-- 126_member_presence.sql
-- Live presence for the admin Users "Status" column (online/offline right now).
--
-- One row per member, upserted by a client heartbeat (POST /api/presence) every
-- ~60s while a member has the site open and the tab visible. A member is "online"
-- when last_seen is within the online window (see presence.ONLINE_WINDOW_SECONDS).
-- This is true presence, not navigation-inferred, so a member reading a page still
-- counts as online. Best-effort writes, never blocking. Cascades on identity delete.

CREATE TABLE IF NOT EXISTS member_presence (
  identity_id BIGINT UNSIGNED NOT NULL,
  last_seen   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (identity_id),
  KEY ix_presence_seen (last_seen),
  CONSTRAINT fk_presence_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
