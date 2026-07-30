-- 053 — Platform Tag Manager (admin lexicon + polymorphic assignments)
-- Coach locks: admin-only CRUD; members assign existing tags only.
-- No member-owned tag definition tables.

CREATE TABLE IF NOT EXISTS tag_categories (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  system_key      VARCHAR(32) NULL,
  label           VARCHAR(64) NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tag_cat_system_key (system_key),
  UNIQUE KEY uq_tag_cat_label (label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug                 VARCHAR(64) NOT NULL,
  label                VARCHAR(128) NOT NULL,
  description          TEXT NULL,
  category_id          BIGINT UNSIGNED NULL,
  color                VARCHAR(32) NULL,
  status               VARCHAR(16) NOT NULL DEFAULT 'active',
  merged_into_tag_id   BIGINT UNSIGNED NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_slug (slug),
  UNIQUE KEY uq_tags_label (label),
  KEY ix_tags_status (status),
  KEY ix_tags_category (category_id),
  CONSTRAINT fk_tags_category FOREIGN KEY (category_id)
    REFERENCES tag_categories (id) ON DELETE SET NULL,
  CONSTRAINT fk_tags_merged FOREIGN KEY (merged_into_tag_id)
    REFERENCES tags (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tag_assignments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tag_id          BIGINT UNSIGNED NOT NULL,
  object_type     VARCHAR(32) NOT NULL,
  object_id       BIGINT UNSIGNED NOT NULL,
  identity_id     BIGINT UNSIGNED NULL,
  export_key      VARCHAR(64) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tag_assign (tag_id, object_type, object_id),
  KEY ix_tag_assign_object (object_type, object_id),
  KEY ix_tag_assign_identity (identity_id),
  CONSTRAINT fk_tag_assign_tag FOREIGN KEY (tag_id)
    REFERENCES tags (id) ON DELETE CASCADE,
  CONSTRAINT fk_tag_assign_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed teaching categories
INSERT IGNORE INTO tag_categories (id, system_key, label, sort_order) VALUES
  (1, 'behavior', 'Behavior', 10),
  (2, 'context', 'Context', 20),
  (3, 'process', 'Process', 30),
  (4, 'insight', 'Insight', 40);

-- Seed vocabulary (admin-curated starting lexicon)
INSERT IGNORE INTO tags (slug, label, description, category_id, status) VALUES
  ('early-exit', 'early exit', 'Exited before the plan''s exit condition.', 1, 'active'),
  ('impatience', 'impatience', 'Acted before the setup fully formed.', 1, 'active'),
  ('late-entry', 'late entry', 'Entered after the edge window closed.', 1, 'active'),
  ('overtrading', 'overtrading', 'Too many trades relative to the plan.', 1, 'active'),
  ('revenge-trade', 'revenge trade', 'Traded to recover a loss rather than from plan.', 1, 'active'),
  ('sized-too-large', 'sized too large', 'Risk size exceeded the plan frame.', 1, 'active'),
  ('hesitation', 'hesitation', 'Delayed action when the plan said go.', 1, 'active'),
  ('chased-entry', 'chased entry', 'Chased price after missing the planned entry.', 1, 'active'),
  ('high-vix', 'high VIX', 'Elevated implied volatility regime.', 2, 'active'),
  ('fomc-day', 'FOMC day', 'Federal Open Market Committee event day.', 2, 'active'),
  ('compression', 'compression', 'Range compression / coiling conditions.', 2, 'active'),
  ('trending', 'trending', 'Directional trend day or regime.', 2, 'active'),
  ('low-liquidity', 'low liquidity', 'Thin book / low participation.', 2, 'active'),
  ('earnings', 'earnings', 'Earnings-related session or event.', 2, 'active'),
  ('macro-shift', 'macro shift', 'Macro headline or regime shift.', 2, 'active'),
  ('worked-as-expected', 'worked as expected', 'Outcome matched the process plan.', 3, 'active'),
  ('followed-plan', 'followed plan', 'Adhered to the written plan.', 3, 'active'),
  ('broke-rules', 'broke rules', 'Deviated from rules during the sitting.', 3, 'active'),
  ('adjusted-mid-trade', 'adjusted mid-trade', 'Changed plan parameters after entry.', 3, 'active'),
  ('held-through-pain', 'held through pain', 'Held through adverse excursion per plan.', 3, 'active'),
  ('cut-early', 'cut early', 'Exited earlier than the plan called for.', 3, 'active'),
  ('lesson-learned', 'lesson learned', 'A durable process lesson from the sitting.', 4, 'active'),
  ('pattern-recognition', 'pattern recognition', 'Recognized a recurring setup pattern.', 4, 'active'),
  ('bias-spotted', 'bias spotted', 'Identified a personal bias in the moment.', 4, 'active'),
  ('thesis-validated', 'thesis validated', 'Thesis played out as framed.', 4, 'active'),
  ('edge-identified', 'edge identified', 'Named a process edge worth keeping.', 4, 'active');
