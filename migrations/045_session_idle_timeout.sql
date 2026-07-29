-- 045 — Member idle session timeout preference (minutes)
-- Spec: Journey Experience / session security — all roles except administrator.
-- Default 30; app enforces 15–60 inclusive.

ALTER TABLE identities
  ADD COLUMN session_idle_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30
    AFTER share_attendance;
