-- 035 — Wiki derived index (Member-Wiki Spec v0.1 §3.0, WIK-D1).
-- Content system-of-record is the lab-wiki git checkout (LABS_WIKI_ROOT).
-- These tables are a rebuildable INDEX over it — never authored directly.

CREATE TABLE IF NOT EXISTS wiki_pages_idx (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(255) NOT NULL,
  path         VARCHAR(512) NOT NULL,               -- repo-relative source file
  title        VARCHAR(512) NOT NULL,
  kind         VARCHAR(32)  NOT NULL,               -- topic|concept|recap|glossary|source
  status       VARCHAR(32)  NOT NULL,               -- draft|published (WIK-D2 gate)
  body_md      LONGTEXT     NOT NULL,
  tags_json    TEXT         NOT NULL,
  sources_json TEXT         NOT NULL,
  updated_date VARCHAR(32)  NOT NULL DEFAULT '',
  indexed_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wiki_slug (slug),
  KEY ix_wiki_status_kind (status, kind),
  FULLTEXT KEY ft_wiki_pages (title, body_md)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wiki_links_idx (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_slug VARCHAR(255) NOT NULL,
  to_slug   VARCHAR(255) NOT NULL,
  relation  VARCHAR(32)  NOT NULL DEFAULT 'wikilink',
  resolved  TINYINT(1)   NOT NULL DEFAULT 0,        -- target slug exists in wiki_pages_idx
  PRIMARY KEY (id),
  UNIQUE KEY uq_wiki_link (from_slug, to_slug, relation),
  KEY ix_wiki_link_to (to_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
