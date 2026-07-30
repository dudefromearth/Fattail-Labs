# FatTail Labs — Member Practice Portability Spec v1.3

**Status:** **BUILD AUTHORITY** — additive amendment to v1.2  
**Parents:** Practice Export v1.2 · Journal Retrospective Spec **v0.7.1** · Privacy v0.1  

---

## 0. What changed from v1.2

| Item | v1.2 | v1.3 |
|------|------|------|
| `fattail.labs.retrospective` | Core retro + habit plans | **+** v0.7.1 ceremony columns: `prompt_version_id`, `cadence_days_at_period`, `period_index`, `interrupted`, `interruption` |
| Report payload | As-stored `report` | Includes period_indicator, emotion_mirror, clustering, trends, correlation, lexicon map when gathered |
| Notifications | — | **In-app** `member_notifications` for material-ready (Family B; channel `in_app`) |
| Cadence history | — | `member_retro_cadence_history` export (forward-only audit trail) |
| Purge inventory | Sessions + tags + trades + retros | **+** `member_notifications`, `member_retro_cadence_history` |

Identity preference `retro_cadence_days` is a **setting** (like journey_visible) — **not** purged with Practice data. History rows are purged.

All other v1.1/v1.2 contracts unchanged (additive import, pack shapes, journey snapshot rules).

---

## 1. `fattail.labs.retrospective` model_version **1.1**

```json
{
  "format": "fattail.labs.retrospective",
  "model_version": "1.1",
  "retrospectives": [
    {
      "id": "retro-…",
      "status": "complete|ready|…",
      "is_maiden": true,
      "scope_start": "…",
      "scope_end": "…",
      "title": "…",
      "body_md": "…",
      "report": { },
      "comparison": { },
      "agent": { "role": "sequence_keeper", "prompt_version_id": "…" },
      "prompt_version_id": "RETROSPECTIVE_SEQUENCE_PROMPT_V1",
      "cadence_days_at_period": 7,
      "period_index": 1,
      "interrupted": false,
      "interruption": null,
      "completed_at": "…",
      "created_at": "…",
      "updated_at": "…"
    }
  ],
  "habit_plans": [ { "id": "plan-…", "status": "active", "retrospective_id": "retro-…" } ],
  "notifications": [
    {
      "id": "mn-…",
      "kind": "retrospective.material_ready",
      "title": "…",
      "body": "…",
      "href": "/app/retrospective",
      "channel": "in_app",
      "period_key": "after:12",
      "email_status": "skipped",
      "read_at": null,
      "created_at": "…"
    }
  ],
  "cadence_history": [
    {
      "cadence_days": 14,
      "effective_from": "YYYY-MM-DD",
      "created_at": "…"
    }
  ]
}
```

### 1.1 Invariants

| ID | Rule |
|----|------|
| R-1 | No raw `identity_id` in documents |
| R-2 | Portable ids: `retro-{id}` / `export_key`, `plan-…`, `mn-…` |
| R-3 | `cadence_days_at_period` is the stamp at period open — never rewritten by later setting changes |
| R-4 | Notification channel policy: Family B material is **in_app**; `email_status` is `skipped` under current lock |
| R-5 | Prompt **bodies** are admin catalog, not re-exported as editable SoR; only `prompt_version_id` stamp |

---

## 2. Purge inventory (Practice wipe)

Removes for the identity (membership retained):

- Prior v1.2 inventory (sessions, media, tags assignments, trades, notes, check-ins, habit plans, retrospectives)
- **`member_notifications`**
- **`member_retro_cadence_history`**

Does **not** remove:

- `identities.retro_cadence_days` (member setting)
- `retrospective_prompt_versions` / Tag Manager vocabulary (platform)

---

## 3. Gate

*India · Mike · Alpha · Kilo · Delta — export suite + purge + program PASS (RT07-9-G).*

---

## 4. Document history

| Date | Note |
|------|------|
| 2026-07-30 | v1.3 — Retrospective v0.7.1 portability (ceremony columns, notifications, cadence history) |
