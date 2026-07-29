-- 044 — Granular Journey community share flags (per-pillar)
-- Spec amendment: Journey Gamification v1.0 — tailor community presence
-- Personal growth defaults OFF so trader growth stays private while community
-- presence (reputation + attendance) can be on.

ALTER TABLE identities
  ADD COLUMN share_reputation TINYINT(1) NOT NULL DEFAULT 1
    AFTER journey_visible_at,
  ADD COLUMN share_personal_growth TINYINT(1) NOT NULL DEFAULT 0
    AFTER share_reputation,
  ADD COLUMN share_attendance TINYINT(1) NOT NULL DEFAULT 1
    AFTER share_personal_growth;
