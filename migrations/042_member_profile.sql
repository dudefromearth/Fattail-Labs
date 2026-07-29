-- 042 — Member profile: avatar + Journey presence visibility
-- Spec: Specs/FatTail-Labs-Member-Profile-Journey-Visibility-Spec-v1.0.md
-- Default private (journey_visible=0). Presence roster is opt-in only.

ALTER TABLE identities
  ADD COLUMN avatar_url VARCHAR(1024) NULL AFTER display_name,
  ADD COLUMN journey_visible TINYINT(1) NOT NULL DEFAULT 0 AFTER avatar_url,
  ADD COLUMN journey_visible_at TIMESTAMP NULL DEFAULT NULL AFTER journey_visible;

-- Presence roster queries filter journey_visible = 1.
CREATE INDEX ix_identity_journey_visible
  ON identities (journey_visible, journey_visible_at);
