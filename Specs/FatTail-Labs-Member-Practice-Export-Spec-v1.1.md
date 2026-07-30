# FatTail Labs — Member Practice Portability Spec v1.1

**Status:** **BUILD AUTHORITY** — two-way (export + import) · Coach GO 2026-07-29  
**Supersedes for portability:** v1.0 (export-only D6 **reversed**)  
**Parents:** Trade Log Spec v1.1 §7–8 · Privacy Spec v0.1 MR-2 / MR-2b · Retrospective v0.6 · Journey §4.1a  

---

## 0. What changed from v1.0

| Item | v1.0 | v1.1 |
|------|------|------|
| D6 | Export only | **Two-way** — import **additive only** (non-destructive) |
| Journey | Export snapshot | Import **new check-ins only**; never meters; never overwrite privacy prefs |
| Schema | — | `export_key` on notes / retros / habit plans |
| UI | Download only | Profile **Download** + **Load** |

Locked import: **additive only** — insert missing keys, **never UPDATE/DELETE**; open-retro conflict **409**; partial packs **OK**.

---

## 1. Intent

Members can **download** and **load** Practice data using the same canonical formats:

- `fattail.labs.trade_log` (I/O via existing Trade Log import)  
- `fattail.labs.journal`  
- `fattail.labs.retrospective`  
- `fattail.labs.journey` (export full snapshot; import partial)  
- `fattail.labs.member_export` (pack)  

Session `identity_id` always owns the write. Email in file is label only.

---

## 2. Export (unchanged shapes from v1.0)

See v1.0 §2–6 for document envelopes. Additionally:

- Each journal entry / retrospective / habit plan carries portable **`id`** (`note-N`, `retro-N`, `plan-N`).  
- On write, Labs stores `export_key` = that portable id (or stable hash) for merge.

---

## 3. Import contract

```
file → detect → preview → commit(policy=additive)
```

### 3.1 API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/me/import/detect` | Identify format(s) |
| POST | `/api/me/import/preview` | Counts: new / skip / errors |
| POST | `/api/me/import/commit` | Apply **additive** load |

Body (JSON): `{ "text" | "base64", "filename"?, "policy"?: "additive" }`  
Or multipart file. Max **25 MB** fail loud.  
(`merge` / `skip_existing` aliases are accepted and treated as **additive**.)

### 3.2 Policy (single)

| Policy | Behavior |
|--------|----------|
| **`additive` (only)** | **Insert** when no `export_key` / external-id match; **skip** if present. **Never UPDATE or DELETE** existing rows. |
| `replace_surface` / overwrite | **Forbidden** |

### 3.3 Detectable formats

| Marker | Format |
|--------|--------|
| `format: fattail.labs.member_export` or ZIP + manifest | Pack |
| `format: fattail.labs.journal` | Journal |
| `format: fattail.labs.retrospective` | Retrospective |
| `format: fattail.labs.journey` | Journey partial |
| `format: fattail.labs.trade_log` | Trade log → delegate to trade_log_io |

### 3.4 Audit

`member_access_audit.action = import` with surfaces + summary detail.

---

## 4. Surface import rules

### 4.1 Journal

- Write `entries[]` only.  
- `surface` ∈ {`journal`,`pre_market`}; empty body → skip.  
- Key = entry `id` or hash(surface|day|body_md).

### 4.2 Retrospective

- Upsert retros by `export_key` / id.  
- Store report/comparison/agent JSON as provided.  
- Habit plans after retros; remap `retrospective_id` via key map.  
- **Max 1 open** (`draft|gathering|ready`): if import would create a second open → preview error, commit **409**.  
- **Max 2 active** habits: would-exceed → preview error, commit **409**.

### 4.3 Journey (partial)

Import **only new** `raw_signals.live_checkins[]` (skip existing `session_key`).

**Never** write `process` meters/grades.  
**Never** overwrite `journey_visible` or analytics consent (non-destructive).  
Scores recompute from restored authored activity.

### 4.4 Trade log

Delegate to existing detect/preview/commit semantics (account required or default).

### 4.5 Pack order

1. trade_log → 2. journal → 3. retrospective (+ habits) → 4. journey partial.

Partial ZIP/JSON (missing surfaces) is OK.

---

## 5. Schema

```sql
-- migration 048
ALTER TABLE member_tool_notes
  ADD COLUMN export_key VARCHAR(64) NULL,
  ADD UNIQUE KEY uq_mtn_export (identity_id, export_key);

ALTER TABLE member_retrospectives
  ADD COLUMN export_key VARCHAR(64) NULL,
  ADD UNIQUE KEY uq_mretro_export (identity_id, export_key);

ALTER TABLE member_habit_plans
  ADD COLUMN export_key VARCHAR(64) NULL,
  ADD UNIQUE KEY uq_mhp_export (identity_id, export_key);
```

---

## 6. Purge Practice data (membership retained)

| Method | Path | Body |
|--------|------|------|
| POST | `/api/me/practice-data/purge` | `{ "confirm": "DELETE_PRACTICE_DATA" }` |

**Deletes (identity-scoped):** trade log accounts/trades/legs, tool notes, retrospectives, habit plans, live check-ins.  
**Keeps:** identity, credentials, memberships, enrollments, lesson progress, certificates, privacy prefs (analytics / journey_visible).

Audit: `action=purge_practice`. Fail loud without exact confirm phrase.

**Full replace path:** Download → Purge Practice data → Load (additive insert into empty surfaces).

---

## 7. UI

Profile `/me`:

- **Download my data** (ZIP export)  
- **Load Practice data** — choose file → preview counts → Confirm load (**additive**)  
- **Delete Practice data…** — warn first; **Download backup first** offered; delete enabled only after member acknowledges they have a backup (or choose not to keep one); membership kept  

Copy: *We strongly recommend downloading a copy first.* Load is additive only. Full replace: download → delete Practice data → load.

---

## 8. Verification

1. Round-trip: export → clear rows → import → content match  
2. Second import: all **skip**, zero new (idempotent additive)  
3. Re-import same key with different body: **original body unchanged**  
4. Isolation session-bound  
5. Open retro / active habit caps fail loud  
6. Journey meters and privacy prefs not written from file  
7. Purge: Practice rows gone; identity + membership path remain; load works after  

---

## 9. Demo generation

Ops/demo script: `server/seed_practice_demo_pack.py`

- Writes a full `fattail.labs.member_export` ZIP/JSON (process-first sample).
- Optional `--import-email` (additive) and `--purge-first` for a clean demo account.
- Walkthrough: `agents/p-member-export/DEMO.md`.

## 10. Decision-log

> **Practice portability is two-way and non-destructive on load.** Export + **additive** import; member may **purge Practice data** while keeping membership, then load an export. Journey meters never imported as SoR. Demo pack generator for product demos.
