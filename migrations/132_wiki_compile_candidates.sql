-- 132 — Wiki compile candidates + watcher-state (Wiki Spec v1.2 W0 · OD-WK4)
-- Last SHA lives on wiki_compile_watcher_state, never on a candidate row (AT-WK5).

CREATE TABLE wiki_compile_candidates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_key VARCHAR(512) NOT NULL,
  kind VARCHAR(32) NOT NULL,
  origin VARCHAR(32) NOT NULL,
  title VARCHAR(512) NOT NULL,
  source_ref VARCHAR(1024) NULL,
  deployed_sha VARCHAR(40) NULL,
  deployed_at DATETIME NULL,
  surface_key VARCHAR(128) NULL,
  state_key VARCHAR(128) NULL,
  route VARCHAR(512) NULL,
  audience VARCHAR(16) NOT NULL,
  suggested_target VARCHAR(16) NULL,
  suggested_title VARCHAR(512) NULL,
  rationale VARCHAR(1024) NULL,
  suggested_parent VARCHAR(512) NULL,
  note TEXT NULL,
  disposition VARCHAR(32) NOT NULL DEFAULT 'open',
  compiled_content_ids JSON NULL,
  created_at DATETIME NOT NULL,
  disposed_at DATETIME NULL,
  disposed_by BIGINT UNSIGNED NULL,
  identity_open_key VARCHAR(512)
    GENERATED ALWAYS AS (
      CASE
        WHEN disposition IN ('open', 'compiling') THEN identity_key
        ELSE NULL
      END
    ) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wiki_compile_identity_open (identity_open_key),
  KEY ix_wiki_compile_disposition (disposition, created_at),
  CONSTRAINT chk_wcc_kind CHECK (kind IN ('template', 'feature', 'spec', 'decision')),
  CONSTRAINT chk_wcc_origin CHECK (origin IN ('agent_found', 'admin_pointed')),
  CONSTRAINT chk_wcc_audience CHECK (audience IN ('public', 'member', 'staff')),
  CONSTRAINT chk_wcc_disposition CHECK (
    disposition IN ('open', 'compiling', 'compiled', 'dismissed')
  ),
  CONSTRAINT chk_wcc_suggested_target CHECK (
    suggested_target IS NULL OR suggested_target IN ('wiki', 'help', 'both')
  ),
  CONSTRAINT chk_wcc_sha_origin CHECK (
    (origin = 'admin_pointed' AND deployed_sha IS NULL AND deployed_at IS NULL)
    OR
    (origin = 'agent_found' AND deployed_sha IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wiki_compile_watcher_state (
  id TINYINT UNSIGNED NOT NULL,
  last_sha VARCHAR(40) NULL,
  recorded_at DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_wiki_compile_watcher_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO wiki_compile_watcher_state (id, last_sha, recorded_at)
VALUES (1, NULL, NULL);
