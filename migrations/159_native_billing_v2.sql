-- 159_native_billing_v2.sql
-- Native Billing v2.0 — Labs owns the subscription (merchant-initiated).
-- Spec: docs/billing/SPEC-Native-Billing-v2.0.md §4 · DL-532
--
-- Idempotent DDL, utf8mb4, InnoDB — matching migrations/001_initial.sql.
--
-- MONEY: INT UNSIGNED minor units everywhere. No DECIMAL, no float, in any
-- arithmetic path. TIME: DATETIME in UTC only — never TIMESTAMP, whose implicit
-- session-timezone conversion is precisely the bug class billing cannot afford.
--
-- ON DELETE RESTRICT throughout, deliberately against the CASCADE used elsewhere
-- in this schema: deleting an identity must never silently delete its financial
-- history. Cancel a subscription rather than cascading it away.
--
-- NUMBERING: this is 159, not 134 as the spec's first draft said. 134 is taken by
-- 134_wiki_contracts.sql on origin/main, which is at 158 while some checkouts sit
-- at 133. Rebase before applying.

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id         BIGINT UNSIGNED NOT NULL,
  plan_id             BIGINT UNSIGNED NOT NULL,

  status              VARCHAR(24) NOT NULL,
    -- BILLING statuses (the worker's due query selects only the first three):
    --   active | past_due | grace | pending_cancel | cancelled | expired | paused
    -- DELIBERATE NON-BILLING statuses (spec 9.3) - a real membership that is
    -- never charged, by decision rather than by fault:
    --   comped          price deliberately set to 0
    --   manual_billing  paid some other way, no gateway on file
    -- FAULT status:
    --   quarantined     data we do not understand - imported, visible, never charged
  provider            VARCHAR(24) NOT NULL,            -- 'stripe' | 'paypal'
  payment_method_id   BIGINT UNSIGNED NULL,            -- -> billing_payment_methods.id

  -- MONEY: the authoritative recurring amount for THIS subscriber.
  -- Never recomputed from the plan. See §9.3 (34 live subs are discounted).
  amount_minor        INT UNSIGNED NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'USD',
  amount_source       VARCHAR(32) NOT NULL DEFAULT 'migrated',
                                                       -- migrated | checkout | admin | plan
  amount_locked       TINYINT(1) NOT NULL DEFAULT 1,   -- spec 9.3. 1 = this price was
                                                       -- deliberately SET for this member.
                                                       -- No bulk price change, plan edit or
                                                       -- coupon expiry may ever alter it.
                                                       -- Migrated rows are locked by default.
  discount_note       VARCHAR(255) NOT NULL DEFAULT '',-- provenance, e.g. the Woo coupon code

  -- SCHEDULE: deterministic, anchor-based. See §5.4.
  interval_unit       VARCHAR(8)  NOT NULL,            -- week | month | year
  interval_count      SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  anchor_at           DATETIME NOT NULL,               -- immutable origin of the series
  period_index        INT UNSIGNED NOT NULL DEFAULT 0, -- periods charged so far
  current_period_start DATETIME NOT NULL,
  next_charge_at      DATETIME NULL,                   -- NULL = nothing further owed
  max_periods         SMALLINT UNSIGNED NULL,          -- DERIVED from ends_at (§8.4), never
                                                       -- from the product. Secondary guard only.
  ends_at             DATETIME NULL,                   -- finite term / prepaid-term end.
                                                       -- PRIMARY stop. Imported from Woo.
  woo_renewals_completed INT UNSIGNED NOT NULL DEFAULT 0, -- display only, NEVER period_index (spec 5.4.1)

  -- DUNNING
  retry_count         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  next_retry_at       DATETIME NULL,
  grace_until         DATETIME NULL,
  last_decline_code   VARCHAR(64) NOT NULL DEFAULT '',

  -- CONCURRENCY: worker lease. See §5.2.
  lease_owner         VARCHAR(64) NULL,
  lease_expires_at    DATETIME NULL,

  -- PROVENANCE / ROLLBACK
  woo_subscription_id BIGINT UNSIGNED NULL,
  migrated_at         DATETIME NULL,
  cancel_reason       VARCHAR(64) NOT NULL DEFAULT '',
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_bsub_woo (woo_subscription_id),         -- import is idempotent
  KEY ix_bsub_due (status, next_charge_at),             -- the worker's only scan index
  KEY ix_bsub_retry (status, next_retry_at),
  KEY ix_bsub_identity (identity_id),
  CONSTRAINT fk_bsub_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE RESTRICT,
  CONSTRAINT fk_bsub_plan FOREIGN KEY (plan_id)
    REFERENCES plans (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_payment_methods (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id       BIGINT UNSIGNED NOT NULL,
  provider          VARCHAR(24) NOT NULL,              -- stripe | paypal
  customer_ref      VARCHAR(255) NOT NULL,             -- cus_… | ppcp_customer_id
  method_ref        VARCHAR(255) NOT NULL,             -- pm_… | PayPal vault id
  kind              VARCHAR(16) NOT NULL DEFAULT 'card',-- card | link | paypal | venmo
  brand             VARCHAR(24) NOT NULL DEFAULT '',   -- display only
  last4             CHAR(4) NOT NULL DEFAULT '',       -- display only
  exp_month         TINYINT UNSIGNED NULL,             -- expiry sweep, §7.8
  exp_year          SMALLINT UNSIGNED NULL,
  is_default        TINYINT(1) NOT NULL DEFAULT 0,
  status            VARCHAR(16) NOT NULL DEFAULT 'active', -- active | stale | revoked
  mandate_ref       VARCHAR(255) NOT NULL DEFAULT '',  -- Stripe mandate/SetupIntent if known
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bpm_provider_method (provider, method_ref),
  KEY ix_bpm_identity (identity_id, provider),
  KEY ix_bpm_expiry (status, exp_year, exp_month),
  CONSTRAINT fk_bpm_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_charges (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subscription_id     BIGINT UNSIGNED NULL,            -- NULL = one-off (e.g. Lifetime)
  identity_id         BIGINT UNSIGNED NOT NULL,
  provider            VARCHAR(24) NOT NULL,

  -- THE IDEMPOTENCY ANCHOR. One row per subscription per billing period. Period.
  period_start        DATETIME NOT NULL,
  period_end          DATETIME NOT NULL,
  period_index        INT UNSIGNED NOT NULL,
  attempt             TINYINT UNSIGNED NOT NULL DEFAULT 1,

  amount_minor        INT UNSIGNED NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'USD',

  status              VARCHAR(24) NOT NULL,
    -- intent | processing | succeeded | failed | requires_action
    -- | abandoned | refunded | partially_refunded | disputed | shadow
  provider_charge_ref VARCHAR(255) NOT NULL DEFAULT '',-- pi_… | PayPal capture id
  provider_intent_ref VARCHAR(255) NOT NULL DEFAULT '',-- pi_… before confirm, for 3DS resume
  idempotency_key     VARCHAR(128) NOT NULL,           -- what we SENT the provider
  decline_code        VARCHAR(64) NOT NULL DEFAULT '',
  failure_message     VARCHAR(512) NOT NULL DEFAULT '',
  amount_refunded_minor INT UNSIGNED NOT NULL DEFAULT 0,

  initiated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at          DATETIME NULL,
  reconciled_at       DATETIME NULL,                   -- §7.7 proof it matched the provider

  PRIMARY KEY (id),

  -- ⬇ THE CENTRAL SAFETY CONSTRAINT.
  -- One (subscription, period, attempt) can exist exactly once. A duplicate
  -- worker, a replayed webhook, a double-clicked admin button, or a crashed
  -- process resuming all collide here and get a DB error instead of a charge.
  UNIQUE KEY uq_chg_period_attempt (subscription_id, period_index, attempt),

  UNIQUE KEY uq_chg_idem (provider, idempotency_key),
  KEY ix_chg_identity (identity_id, initiated_at),
  KEY ix_chg_status (status, initiated_at),
  KEY ix_chg_provider_ref (provider, provider_charge_ref),
  KEY ix_chg_unreconciled (status, reconciled_at),
  CONSTRAINT fk_chg_sub FOREIGN KEY (subscription_id)
    REFERENCES billing_subscriptions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_chg_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_refunds (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  charge_id      BIGINT UNSIGNED NOT NULL,
  amount_minor   INT UNSIGNED NOT NULL,
  reason         VARCHAR(64) NOT NULL DEFAULT '',
  provider_ref   VARCHAR(255) NOT NULL DEFAULT '',
  idempotency_key VARCHAR(128) NOT NULL,
  actor          VARCHAR(64) NOT NULL DEFAULT '',      -- admin email | 'system' | 'webhook'
  status         VARCHAR(24) NOT NULL DEFAULT 'pending',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at     DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rfnd_idem (idempotency_key),
  KEY ix_rfnd_charge (charge_id),
  CONSTRAINT fk_rfnd_charge FOREIGN KEY (charge_id)
    REFERENCES billing_charges (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_events (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider       VARCHAR(24) NOT NULL,
  event_ref      VARCHAR(255) NOT NULL,                -- evt_… | PayPal event id
  event_type     VARCHAR(96) NOT NULL,
  provider_created_at DATETIME NULL,                   -- ordering, §6.4
  payload_json   JSON NOT NULL,
  processed_at   DATETIME NULL,
  process_result VARCHAR(255) NOT NULL DEFAULT '',
  error_count    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_evt_provider_ref (provider, event_ref), -- ⬅ webhook dedupe, durable
  KEY ix_evt_unprocessed (processed_at, id),
  KEY ix_evt_type (provider, event_type, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_worker_runs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  worker_id       VARCHAR(64) NOT NULL,
  mode            VARCHAR(16) NOT NULL,                -- shadow | live
  started_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at     DATETIME NULL,
  due_found       INT UNSIGNED NOT NULL DEFAULT 0,
  charged_ok      INT UNSIGNED NOT NULL DEFAULT 0,
  charged_failed  INT UNSIGNED NOT NULL DEFAULT 0,
  skipped         INT UNSIGNED NOT NULL DEFAULT 0,
  amount_minor    INT UNSIGNED NOT NULL DEFAULT 0,
  halted_reason   VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  KEY ix_bwr_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
