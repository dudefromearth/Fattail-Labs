-- 020 — Cast assignment on board cards (Phase G1)
-- Spec: FatTail-Labs-Cast-HeyGen-Spec-v1.0.md
-- Cast registry source of truth: docs/studio/cast/AVATAR-*.md (cast_id = NAME)

ALTER TABLE content_items
  ADD COLUMN cast_id VARCHAR(64) NULL AFTER product_line;
