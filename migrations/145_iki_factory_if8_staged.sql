-- 145 — IKI Factory IF-8 (Staged lane)
-- Spec: Specs/FatTail-Labs-IKI-Factory-Spec-v1_1.md §7 (supersedes v1.0)
-- Charter: agents/bench/gemba.md — Staged production, workflow 7
-- Additive only. LANES gains "staged" between "build" and "live" in
-- application code (server/iki_factory.py) — no DB enum/constraint to
-- migrate, "lane" is a plain VARCHAR(16). No existing row is in a lane
-- this migration needs to touch.

ALTER TABLE iki_factory_cards
  ADD COLUMN staged_ready TINYINT(1) NOT NULL DEFAULT 0 AFTER built_ready;

-- Staged production tracking (§7.3): product, landing page draft, store
-- placement, help guide. All dark until Live. `kind` is unconstrained at
-- the DB level (application enum, server/iki_factory.py
-- STAGED_ARTIFACT_KINDS) — no wiki_page row is ever seeded (DL-583): the
-- wiki page is Oscar's, composed after publication from the published
-- help guide, never the Factory's to build.
CREATE TABLE IF NOT EXISTS iki_factory_staged_artifacts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  card_id         BIGINT UNSIGNED NOT NULL,
  kind            VARCHAR(32) NOT NULL,   -- product|landing_page|store_placement|help_page
  status          VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending|ready|blocked
  body            MEDIUMTEXT NULL,
  blocked_reason  TEXT NULL,
  produced_by_kind VARCHAR(16) NULL,
  produced_by_id  BIGINT UNSIGNED NULL,
  produced_by_label VARCHAR(255) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_iki_factory_staged_card_kind (card_id, kind),
  CONSTRAINT fk_iki_factory_staged_card
    FOREIGN KEY (card_id) REFERENCES iki_factory_cards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
