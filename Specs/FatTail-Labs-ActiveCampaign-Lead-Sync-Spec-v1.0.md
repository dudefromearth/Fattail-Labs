# FatTail Labs — ActiveCampaign Lead Sync Spec v1.0

**Status:** Draft — pending live verification (2026-07-28)
**Context:** Free waitlist signups captured on feature-gate surfaces should flow
into the marketing CRM so leads can be nurtured toward the Observer trial. This
spec covers **free leads only**.
**Related:** Feature Gates (migration `037_feature_gates.sql`,
`routes/feature_gates.py`), Admin Notifications Spec v1.0 (the design analog).

---

## 1. Purpose

When a visitor submits the waitlist form on a countdown/gated surface
(`POST /api/feature-gates/{surface_key}/waitlist`), Labs pushes them to
ActiveCampaign as a contact tagged **`Labs Lead`**, in addition to the existing
durable capture in `feature_gate_emails`.

This gives marketing a live, taggable audience of pre-launch leads without any
manual CSV export.

---

## 2. Scope (v1)

**In scope — free leads only:**

- Waitlist email → AC contact (`POST /api/3/contact/sync`, idempotent by email)
- Ensure the lead tag exists (`GET /api/3/tags` search, else `POST /api/3/tags`)
- Tag the contact (`POST /api/3/contactTags`)

**Explicitly OUT of scope:**

- **Purchasers / customers.** Buyers enter through WooCommerce on the WP sites;
  the WordPress `membership-auto-upgrade` plugin already tags them in the same AC
  account. Labs does **not** tag customers here — no double-plumbing.
- **Stripe / native billing.** Not integrated with AC yet.
- Tag removal, cancellation, list subscription, custom fields, unsubscribe
  handling.

---

## 3. Account & configuration

Shared FatTail / 0-DTE ActiveCampaign account. All config is env-driven; absence
disables the integration (waitlist still works). Modelled on `notify.py` SMTP.

| Env var | Required | Default | Notes |
|---|---|---|---|
| `LABS_AC_API_URL` | with token | — | e.g. `https://0dte.api-us1.com` |
| `LABS_AC_API_TOKEN` | with url | — | AC → Settings → Developer → API Token |
| `LABS_AC_LEAD_TAG` | no | `Labs Lead` | tag applied to leads |
| `LABS_AC_TIMEOUT` | no | `15` | per-request seconds |
| `LABS_AC_REQUIRED` | no | off | `1` = fail loud when a sync runs unconfigured |

**Rules (fail loud):** URL and token must be set **together**; one without the
other raises. `LABS_AC_REQUIRED=1` turns "not configured" into an error at sync
time. Otherwise unconfigured = disabled (`status: skipped`).

---

## 4. Behavior

`activecampaign.sync_lead(email, source=…, surface_key=…)` returns a status dict
and **never raises**:

| status | Meaning |
|---|---|
| `synced` | contact upserted and tagged |
| `skipped` | AC disabled (no config) |
| `failed` | config or API error (logged; `error` populated) |

**Ordering & durability:** the email is INSERTed and committed to
`feature_gate_emails` **first**. The AC push happens **after commit**, inline
(no background worker in this codebase — same as SMTP notifications), wrapped so
that any AC failure never turns the waitlist submit into a non-200. The outcome
is written back to the row.

**Idempotency:** `contact/sync` upserts by email; the tag is found-or-created;
duplicate `contactTags` (HTTP 422, already tagged) is treated as success. Re-
submitting the same email is safe.

---

## 5. Data model

`038_feature_gate_ac_sync.sql` adds to `feature_gate_emails`:

| Column | Type | Meaning |
|---|---|---|
| `ac_status` | VARCHAR(16) | `synced` / `skipped` / `failed` / NULL (not attempted) |
| `ac_error` | VARCHAR(512) | error detail when `failed` |
| `ac_synced_at` | TIMESTAMP | last push attempt time |

No PII beyond the email already stored is added.

---

## 6. Files

- `server/activecampaign.py` — AC v3 client + `sync_lead()`
- `server/routes/feature_gates.py` — `join_waitlist` calls `sync_lead` post-commit
- `migrations/038_feature_gate_ac_sync.sql` — status columns
- `server/tests/test_activecampaign.py` — characterization tests
- `.env.example` — `LABS_AC_*` documented

---

## 7. Verification

1. **Unit/characterization:** `cd server && .venv/bin/python -m pytest tests/test_activecampaign.py -q`
   (AC primitives mocked; no live calls). Covers: disabled→skipped, half-config→
   failed, required-unconfigured→failed, happy path→synced, API error→failed,
   endpoint records status, waitlist survives AC outage.
2. **Live smoke (staging, real token):** set `LABS_AC_API_URL` / `LABS_AC_API_TOKEN`,
   POST a test email to an active collect-email gate, then confirm in AC: contact
   exists and carries the `Labs Lead` tag; confirm `ac_status = synced` on the row.
3. **Disabled path:** unset the vars, submit a waitlist email, confirm 200 +
   `ac_status = skipped` and the email is still captured/exported.

---

## 8. Open items / future (not v1)

- Lead → customer lifecycle in AC (retag on conversion) — deferred; WooCommerce
  owns customer tagging today.
- Async/queued delivery if inline latency on submit becomes a concern.
- Carry `surface_key` / `source` into an AC custom field for segmentation.
- GDPR/consent copy review on the waitlist form ("Get notified when we open").
