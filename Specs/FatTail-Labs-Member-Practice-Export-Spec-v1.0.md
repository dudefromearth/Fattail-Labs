# FatTail Labs — Member Practice Canonical Export Spec v1.0

**Status:** **SUPERSEDED for portability by v1.1** (two-way) — export shapes still valid  
**Type:** Canonical document formats + member download (portability / subject access)  
**See:** [`FatTail-Labs-Member-Practice-Export-Spec-v1.1.md`](./FatTail-Labs-Member-Practice-Export-Spec-v1.1.md)
**Parents:** Trade Log Spec v1.1 §7 · Member Data Privacy Spec v0.1 (MR-2 / MR-2b) ·  
Retrospective Spec v0.6 · Journey Experience Spec v1.0 · Architecture/12  

**Decisions locked (plan §8):**

| ID | Decision |
|----|----------|
| D1 | Pack: **JSON and ZIP** (`?format=json|zip`; default **zip** for UI) |
| D2 | Include **email**; **omit** raw `identity_id` in documents |
| D3 | Journey: scores + privacy; **include raw signals** (check-ins + enrollment summary) |
| D4 | Journal v1: **notes + day index** (as-built) |
| D5 | Playbook **out of pack** until real SoR |
| D6 | **Export only** — no journal/retro import in v1 |
| D7 | Board: `agents/p-member-export/` |

---

## 1. Intent

Members own their Practice data. They can **download a portable copy** of:

1. Trade Log (existing `fattail.labs.trade_log`)  
2. Journal (new `fattail.labs.journal`)  
3. Retrospectives + habit plans (new `fattail.labs.retrospective`)  
4. Journey process snapshot (new `fattail.labs.journey` — **derived**)  

Wrapped as `fattail.labs.member_export`. Family B isolation absolute. No marketing pipeline.

---

## 2. Shared envelope

Every document:

```json
{
  "format": "fattail.labs.<surface>",
  "model_version": "1.0",
  "exported_at": "ISO-8601",
  "source": { "system": "fattail-labs", "env": "dev|staging|production" },
  "identity": {
    "export_subject": "self",
    "email": "member@example.com"
  }
}
```

| Invariant | Rule |
|-----------|------|
| E-1 | Scope = session `identity_id` only — never body/query identity |
| E-2 | Portable ids: `note-{id}`, `retro-{id}`, `plan-{id}`, `acct-{id}` — not raw DB ids required for re-import later |
| E-3 | No peer rows |
| E-4 | Export writes `member_access_audit` action=`export` |
| E-5 | Journey document is **snapshot**; not re-importable as SoR |

---

## 3. `fattail.labs.journal` v1.0

As-built: `member_tool_notes` (surfaces `journal`, `pre_market`) + trade day index.

```json
{
  "format": "fattail.labs.journal",
  "model_version": "1.0",
  "exported_at": "…",
  "source": { },
  "identity": { },
  "entries": [
    {
      "id": "note-1",
      "day": "YYYY-MM-DD",
      "surface": "journal",
      "body_md": "…",
      "created_at": "…",
      "updated_at": "…"
    }
  ],
  "day_index": [
    {
      "day": "YYYY-MM-DD",
      "has_trades": true,
      "note_ids": ["note-1"]
    }
  ]
}
```

`day` for notes = calendar date of `created_at` in America/New_York (consistent with Journey).

---

## 4. `fattail.labs.retrospective` v1.0

```json
{
  "format": "fattail.labs.retrospective",
  "model_version": "1.0",
  "exported_at": "…",
  "source": { },
  "identity": { },
  "retrospectives": [ { "id": "retro-1", "status": "complete", "report": {}, "comparison": {}, "agent": null } ],
  "habit_plans": [ { "id": "plan-1", "status": "active", "retrospective_id": "retro-1" } ]
}
```

Field names for `report` / `comparison` / `agent` match **Architecture/12** and workspace API. Include all statuses (not only complete).

---

## 5. `fattail.labs.journey` v1.0

```json
{
  "format": "fattail.labs.journey",
  "model_version": "1.0",
  "exported_at": "…",
  "source": { },
  "identity": { },
  "snapshot_note": "Derived at export time; not re-importable as source of truth.",
  "process": { },
  "contribution": { },
  "privacy": {
    "journey_visible": false,
    "analytics_opted_in": false
  },
  "raw_signals": {
    "live_checkins": [],
    "enrollment_summary": { "course_count": 0, "completed_lessons": 0 }
  }
}
```

`process` = same shape as `GET /api/me/journey/scores` → `process`.  
`contribution` = reputation / growth / streak pillars from scores payload (omit rank board peers).

---

## 6. `fattail.labs.member_export` v1.0

```json
{
  "format": "fattail.labs.member_export",
  "model_version": "1.0",
  "exported_at": "…",
  "source": { },
  "identity": { },
  "surfaces": ["trade_log", "journal", "retrospective", "journey"],
  "documents": {
    "trade_log": { "format": "fattail.labs.trade_log" },
    "journal": { "format": "fattail.labs.journal" },
    "retrospective": { "format": "fattail.labs.retrospective" },
    "journey": { "format": "fattail.labs.journey" }
  }
}
```

**ZIP layout** (`format=zip`):

```
member-export/
  pack.json                 # member_export envelope + documents inline OR index only
  trade_log.tradlog.json
  journal.json
  retrospective.json
  journey.json
```

v1: ZIP contains four surface files + `manifest.json` listing formats; optional single `pack.json` with full embed for JSON mode.

---

## 7. API

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/me/export` | Pack; `?format=json\|zip` (default zip) |
| GET | `/api/me/export/journal` | Journal only (JSON) |
| GET | `/api/me/export/retrospectives` | Retrospective only |
| GET | `/api/me/export/journey` | Journey only |
| GET | `/api/me/trade-log/export` | Unchanged |

Auth: session. Entitlement: any signed-in member may export **their** data (empty surfaces allowed). Trade log section empty if no accounts/trades (not 403 for pack).

---

## 8. UI

Profile (`/me`): **Download my data** → `GET /api/me/export?format=zip`.  
Tango copy: *Download a copy of your Practice data (Trade Log, Journal, Retrospectives, Journey). Your files stay private.*

---

## 9. Out of scope v1

- Re-import journal/retro  
- Playbook document  
- Email delivery of pack  
- Encrypted archive password  
- Admin export of another member  

---

## 10. Verification

1. Isolation: A cannot receive B rows  
2. Format markers present on each document  
3. Journey process matches scores shape  
4. Audit `export` written  
5. ZIP contains four surface files  
6. pytest green  

---

## 11. Decision-log

> **Member Practice Export v1.0.** Canonical formats for journal, retrospective, journey + member pack; export-only; privacy MR-2; Family B isolation; audit on download.
