-- 003 — Identity & Access core model (Specs/FatTail-Labs-Identity-Access-Spec-v1.0.md)
-- Labs-native identity/roles/plans/memberships. Providers (WordPress/WooCommerce)
-- attach via identity_links + provider_plan_map.

ALTER TABLE identities
  DROP INDEX uq_issuer_wpuser,
  DROP COLUMN issuer,
  DROP COLUMN wp_user_id,
  DROP COLUMN role,
  ADD COLUMN role_override VARCHAR(32) NULL AFTER display_name,
  ADD UNIQUE KEY uq_identity_email (email);

CREATE TABLE IF NOT EXISTS identity_links (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id BIGINT UNSIGNED NOT NULL,
  provider    VARCHAR(64)  NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_link_provider_ext (provider, external_id),
  KEY ix_link_identity (identity_id),
  CONSTRAINT fk_link_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS credentials (
  identity_id   BIGINT UNSIGNED NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (identity_id),
  CONSTRAINT fk_cred_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plans (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(128) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  grants_role VARCHAR(32)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS memberships (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id        BIGINT UNSIGNED NOT NULL,
  plan_id            BIGINT UNSIGNED NOT NULL,
  status             VARCHAR(32)  NOT NULL,           -- active|grace|cancelled|expired
  source             VARCHAR(64)  NOT NULL,           -- native|wordpress:fattail|...
  external_ref       VARCHAR(255) NULL,
  started_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_end DATETIME NULL,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mem_identity_plan_source (identity_id, plan_id, source),
  KEY ix_mem_identity (identity_id),
  CONSTRAINT fk_mem_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mem_plan FOREIGN KEY (plan_id)
    REFERENCES plans (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS provider_plan_map (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider     VARCHAR(64)  NOT NULL,
  external_key VARCHAR(255) NOT NULL,
  plan_id      BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ppm_provider_key (provider, external_key),
  CONSTRAINT fk_ppm_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
