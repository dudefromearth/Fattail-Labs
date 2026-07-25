-- Site appearance & chrome control plane (Human Interface Spec v1.0 §10)
CREATE TABLE IF NOT EXISTS site_appearance (
  id               TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  schema_version   INT NOT NULL,
  draft_json       JSON NOT NULL,
  published_json   JSON NOT NULL,
  draft_updated_at DATETIME(6) NULL,
  published_at     DATETIME(6) NULL,
  published_by     BIGINT UNSIGNED NULL,
  publish_note     VARCHAR(512) NULL,
  CONSTRAINT chk_site_appearance_singleton CHECK (id = 1)
);
