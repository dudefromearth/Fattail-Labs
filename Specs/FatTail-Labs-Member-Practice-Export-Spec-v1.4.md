# FatTail Labs — Member Practice Portability Spec v1.4

**Status:** **BUILD AUTHORITY** — additive amendment to v1.3  
**Parents:** Practice Export v1.3 · [Member Campaign Concept Spec v1.0](./FatTail-Labs-Member-Campaign-Concept-Spec-v1.0.md)  
**Schema:** [`schemas/practice-campaign-v1.json`](./schemas/practice-campaign-v1.json)

---

## 0. What changed from v1.3

| Item | v1.3 | v1.4 |
|------|------|------|
| Practice Campaign surface | Phase 1 MVP fields (title/status/dates/playbook keys) | **First-class** document model_version **1.1** |
| Machine schema | Informal | **`practice-campaign-v1.json`** required for validation |
| Campaign fields | — | `account_export_key`, `account_label`, `starting_capital`, `goals_md`, `activated_at` |
| Multi-active import | Demoted second active → completed | **Multiple actives preserved** (DL-259) |
| Journal stamps | Exported as-built | **Normative** `practice_campaign_export_key` on journal_session entries |
| Trade stamps | Exported as-built | **Normative** `practice_campaign_export_key` on trades when linked |
| Pack surface list | practice_campaign optional peer | Still optional surface; when present must be complete — not a stub |

All other v1.1–v1.3 contracts unchanged (additive import, Family B, no identity_id in docs).

---

## 1. `fattail.labs.practice_campaign` model_version **1.1**

Normative JSON Schema: **`Specs/schemas/practice-campaign-v1.json`**.

```json
{
  "format": "fattail.labs.practice_campaign",
  "model_version": "1.1",
  "exported_at": "…",
  "source": { "system": "fattail-labs" },
  "identity": { "export_subject": "self" },
  "entries": [
    {
      "id": "export_key",
      "title": "…",
      "status": "planned|active|completed|abandoned",
      "starts_at": null,
      "ends_at": null,
      "activated_at": null,
      "account_export_key": "acct-12",
      "account_label": "Primary",
      "starting_capital": 50000.0,
      "goals_md": "…",
      "playbook_export_keys": ["pb-…"],
      "created_at": "…",
      "updated_at": "…"
    }
  ]
}
```

### 1.1 Invariants

| ID | Rule |
|----|------|
| C-1 | No raw `identity_id` in documents |
| C-2 | `entries[].id` is portable `export_key` (idempotent import) |
| C-3 | Empty `entries: []` is valid (campaigns optional — never enforced) |
| C-4 | Multi-active campaigns import without demotion |
| C-5 | `account_export_key` matches `trade_log.accounts[].id` when bound; null = unbound |
| C-6 | Trade + journal stamps use `practice_campaign_export_key` → `entries[].id` |
| C-7 | Pack green for campaigns = schema-valid document + round-trip of C-4…C-6 |

### 1.2 Member pack

`fattail.labs.member_export` documents map **must** include key `practice_campaign` when exporting Practice spine (even if entries empty). Surface name in `surfaces[]`: `practice_campaign`.

Import order: `playbook` → `practice_campaign` → `trade_log` → `journal_session` (account rebind after trade_log).

---

## 2. Cross-surface stamps

| Document | Field |
|----------|--------|
| Trade (inside trade_log accounts) | `practice_campaign_export_key` |
| Journal session entry | `practice_campaign_export_key` |

Omit or null when unstamped (valid). Non-null must resolve to a campaign entry id in the same pack (or already on host).

---

## 3. Purge inventory

Unchanged from v1.3, plus explicit: `member_practice_campaigns` and `member_practice_campaign_playbooks` purged with Practice wipe (already as-built).

---

## 4. Upgrade / compatibility (do not break existing books)

| Case | Behavior |
|------|----------|
| Host with 093 only, not yet 096/097 | Run migrate before deploy; writers require new columns |
| Existing trades (any stamp state) | Untouched by campaign migrations |
| Existing campaign rows | Gain NULL columns; export 1.1 emits nulls for missing capital/goals/account |
| Pack model_version `1.0` import | Accepted; multi-active demotion **removed** (no longer demotes second active) |
| Pack without `practice_campaign` surface | Still valid full pack for members who never used campaigns |
| Pack with empty `entries: []` | Valid |
| Stamp field absent on a trade | Valid (unstamped) |

**Non-destructive import** remains: never UPDATE/DELETE existing campaign rows on re-import of same `export_key` (skip). Account rebind only fills `account_id` when still NULL.

---

## 5. Document history

| Date | Note |
|------|------|
| 2026-08-08 | v1.4 — Practice Campaign first-class schema + multi-active + full field set |
| 2026-08-08 | Compatibility section — upgrade must not break existing accounts/trades |
