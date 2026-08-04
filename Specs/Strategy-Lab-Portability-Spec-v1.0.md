# Strategy Lab — Portability Spec v1.0

**Status:** **SPEC AUTHORITY** — schema + import/export contract (implementation may follow)  
**Date:** 2026-08-04  
**Product:** FatTail Strategy Lab (`/app/strategy-lab`)  
**Parents:**  
- [`Strategy-Lab-Architecture-Design-v1.0.md`](./Strategy-Lab-Architecture-Design-v1.0.md)  
- [`Strategy-Lab-Life-Cycle-Architecture-v1.1.md`](./Strategy-Lab-Life-Cycle-Architecture-v1.1.md)  
- [`FatTail-Labs-Member-Practice-Export-Spec-v1.1.md`](./FatTail-Labs-Member-Practice-Export-Spec-v1.1.md) (envelope / two-way pattern)  
- [`FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md) (MR-2 export/delete; Family B)  

**JSON Schema:** [`schemas/strategy-lab-pack-v1.json`](./schemas/strategy-lab-pack-v1.json)

**Doctrine:** Portability is a **first-class foundation feature**, not a bolt-on. Strategies today are shallow (phase + state + empty attributes); the pack schema still describes the **entire Lab** so depth can grow without format rewrites.

---

## 0. Intent

Members own a private **Strategy Lab**: every strategy card across Development, Curation, Deployment, and Archive (Bin), plus reserved slots for campaigns, reports, and plugin bags.

They must be able to:

1. **Export** the full lab as a portable document (download / backup / coach handoff / demo seed).  
2. **Import** a pack into their account under explicit policies (preview → commit).  
3. Grow strategy **depth** (attributes, evidence, specs) without changing the pack envelope.

### 0.1 Goals

| Goal | Meaning |
|------|---------|
| **Whole-lab unit** | One document describes the member’s entire Strategy Lab, not a single card |
| **Skeleton-first** | v1 packs are valid with empty `attributes` / empty `evidence` |
| **Life-cycle faithful** | Phase + phase_state + version + log survive round-trip |
| **Family B isolation** | Session `identity_id` only; no raw identity ids in files |
| **Forward compatible** | Unknown keys preserved; attribute bags versioned independently |
| **Exercise-ready** | Demo packs can place many strategies across phases/states |

### 0.2 Non-goals (v1.0)

- Sharing a lab with another member (no multi-tenant share URLs)  
- Broker / OMS positions or live order state  
- Profit claims, fantasy fills, or P&L theater in the pack  
- Importing Practice / Trade Log / Journey data via this format  
- Full attribute plugin schemas (those arrive as `name@version` later)

---

## 1. Locked decisions

| ID | Decision |
|----|----------|
| **SLP-1** | Format id: **`fattail.labs.strategy_lab`** |
| **SLP-2** | Document unit = **entire lab** (`strategies[]` + reserved collections) |
| **SLP-3** | `model_version` string for pack envelope; `foundation_version` int for life-cycle kernel |
| **SLP-4** | Portable strategy id = card `id` (as-built `public_id`); also stored as `export_key` for merge |
| **SLP-5** | **No** raw `identity_id`, DB surrogate keys, or session tokens in documents |
| **SLP-6** | Email in pack is **label only** (identity stamp); import never rebinds ownership by email |
| **SLP-7** | Default import policy = **`additive`** (insert missing keys; never UPDATE/DELETE) |
| **SLP-8** | Optional **`replace_lab`** policy (purge Strategy Lab rows for identity, then insert) — requires explicit confirm; used for demos / full restore |
| **SLP-9** | Phase capacity **100 per phase** enforced on import commit (fail loud with counts) |
| **SLP-10** | Archive strategies export as `phase: "bin"` with `phase_state` ∈ {`retired`,`trashed`} |
| **SLP-11** | `attributes` is a map of **versioned bags** (`"options_spec@1": {…}`); empty `{}` is valid |
| **SLP-12** | `lifecycle_log` is portable audit; import may **truncate** to last 50 events (matches store) or preserve all if under cap |
| **SLP-13** | Pack download = **JSON** default; optional **ZIP** (`strategy-lab.json` + `manifest.json`) later — same payload |
| **SLP-14** | Detect/preview/commit shape mirrors Practice import where practical |

---

## 2. Conceptual model

```
┌─────────────────────────────────────────────────────────────────┐
│  Strategy Lab Pack  (fattail.labs.strategy_lab)                 │
│                                                                 │
│  envelope: format · model_version · foundation_version · meta   │
│                                                                 │
│  strategies[]  ──► each card = product in a phase + state       │
│       ├── identity (id, product_key, export_key)                │
│       ├── product  (name, description, version*)                │
│       ├── location (phase, phase_state, disposition)            │
│       ├── bags     (attributes{}, evidence[], spec?)            │
│       └── audit    (lifecycle_log[], bin_reason?, timestamps)   │
│                                                                 │
│  campaigns[]   ──► reserved (empty in F1)                       │
│  reports[]     ──► reserved (Archive reports later)             │
│  lab_settings  ──► reserved (UI prefs, mode)                    │
└─────────────────────────────────────────────────────────────────┘
```

A **Lab** is the set of all strategies (and future campaigns) owned by one `identity_id` in `strategy_lab_strategies` (and future tables). Export is a **snapshot** of that set. Import writes back under session ownership only.

---

## 3. Document envelope

Every Strategy Lab pack:

```json
{
  "format": "fattail.labs.strategy_lab",
  "model_version": "1.0",
  "foundation_version": 1,
  "exported_at": "2026-08-04T18:00:00Z",
  "source": {
    "system": "fattail-labs",
    "env": "dev|staging|production",
    "app": "strategy-lab"
  },
  "identity": {
    "export_subject": "self",
    "email": "member@example.com"
  },
  "lab": {
    "schema_version": 1,
    "label": optional_human_label,
    "counts": {
      "development": 0,
      "curation": 0,
      "deployment": 0,
      "bin": 0,
      "total": 0
    }
  },
  "strategies": [ /* §4 */ ],
  "campaigns": [],
  "reports": [],
  "lab_settings": {}
}
```

### 3.1 Envelope fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `format` | string | yes | Const `fattail.labs.strategy_lab` |
| `model_version` | string | yes | Pack shape version (`"1.0"`) |
| `foundation_version` | integer | yes | Life-cycle kernel; bump when phases/states enum breaks |
| `exported_at` | ISO-8601 | yes | UTC `Z` preferred |
| `source` | object | yes | Provenance; never used for auth |
| `identity` | object | yes | Label only; see SLP-5/6 |
| `lab` | object | yes | Lab-level meta + optional counts |
| `strategies` | array | yes | May be empty `[]` |
| `campaigns` | array | yes | Reserved; empty in v1 |
| `reports` | array | yes | Reserved; empty in v1 |
| `lab_settings` | object | yes | Reserved; empty `{}` in v1 |

### 3.2 Invariants

| ID | Rule |
|----|------|
| **E-1** | Scope of export/import = session `identity_id` only |
| **E-2** | No peer rows; no admin cross-account pack without separate consent workflow |
| **E-3** | `member_access_audit`: `action=export` / `action=import` with surface `strategy_lab` |
| **E-4** | Unknown top-level keys: **preserve on re-export** if stored; ignore on import if not understood (fail loud only for **required** violations) |
| **E-5** | `lab.counts` is advisory on export; importers **recompute** from `strategies[]` |

---

## 4. Strategy record (portable card)

Each element of `strategies[]` is one versionable product card.

### 4.1 Skeleton (F1 depth — valid today)

```json
{
  "id": "a62c347c",
  "export_key": "a62c347c",
  "product_key": "a62c347c",
  "name": "Iron Fly Hypothesis A",
  "description": "Stop-the-bleeding defined-risk experiment.",
  "version": "1.0.0",
  "version_major": 1,
  "version_minor": 0,
  "version_patch": 0,
  "phase": "development",
  "phase_state": "hypothesis",
  "disposition": "active",
  "bin_reason": null,
  "attributes": {},
  "evidence": [],
  "spec": null,
  "lifecycle_log": [
    {
      "at": "2026-08-04T12:00:00Z",
      "event": "created",
      "phase": "development",
      "phase_state": "hypothesis",
      "version": "1.0.0"
    }
  ],
  "created_at": "2026-08-04T12:00:00Z",
  "updated_at": "2026-08-04T12:00:00Z"
}
```

### 4.2 Field dictionary

| Field | Type | Required on export | Import rule |
|-------|------|--------------------|-------------|
| `id` | string | yes | Portable id; becomes new `public_id` if free, else remap (see §6) |
| `export_key` | string | yes* | *If omitted, equals `id`. Unique per identity for merge |
| `product_key` | string | yes | Stable product lineage key; may equal `id` in F1 |
| `name` | string | yes | 1–255 chars after trim; empty → `"Untitled strategy"` |
| `description` | string | no | Max 512; default `""` |
| `version` | string | yes | Semver-like `major.minor.patch` |
| `version_major` / `_minor` / `_patch` | int ≥ 0 | yes | Must agree with `version` string or importer recomputes from ints |
| `phase` | enum | yes | `development` \| `curation` \| `deployment` \| `bin` |
| `phase_state` | string | yes | Must be legal for `phase` (§4.3) or normalize to phase default |
| `disposition` | string | no | `active` or bin state mirror; derived if missing |
| `bin_reason` | string \| null | no | Required semantically when `phase=bin` (default `"Imported"`) |
| `attributes` | object | yes | Map; empty `{}` allowed. Keys `name@version` later |
| `evidence` | array | yes | Reserved append-only evidence records; empty `[]` in F1 |
| `spec` | object \| null | no | Legacy options shape; maps toward `attributes["options_spec@1"]` later |
| `lifecycle_log` | array | yes | Event objects; may be empty |
| `created_at` / `updated_at` | ISO-8601 | no | Preserve if valid; else set import time |

**Forbidden in record:** `db_id`, `identity_id`, internal MySQL ids.

### 4.3 Phase and phase_state (foundation enums)

Must match life-cycle kernel (`strategy_lab_domain.py` / Architecture Design §4).

| Phase | Legal `phase_state` values (ordered) |
|-------|--------------------------------------|
| `development` | `hypothesis` · `model` · `is_test` · `oos_test` · `deployed` |
| `curation` | `categorized` · `grouped` · `position_sized` · `monitored` |
| `deployment` | `strategy` · `capital_allocation` · `scheduled` · `started` · `paused` · `stopped` · `ended` · `pruned` · `retrospective` |
| `bin` | `retired` · `trashed` |

**Aliases on import (normalize, do not fail):**

| Alias | Canonical |
|-------|-----------|
| `design`, `develop` | `development` |
| `curate` | `curation` |
| `campaign`, `deploy` | `deployment` |
| `archive`, `killed` | `bin` |

**Defaults if state illegal for phase:**  
Development → `hypothesis`; Curation → `categorized`; Deployment → `strategy`; Bin → `retired`.

### 4.4 Disposition

| Phase | `disposition` |
|-------|----------------|
| development / curation / deployment | `active` |
| bin + retired | `retired` |
| bin + trashed | `trashed` |

Importer may overwrite disposition from phase + phase_state.

### 4.5 Lifecycle log events (portable)

Each log entry is a free-form object with at least:

```json
{
  "at": "ISO-8601",
  "event": "created|rename|phase_move|phase_state|version_bump|imported|…"
}
```

Common optional keys (preserve if present):  
`phase`, `phase_state`, `from_phase`, `to_phase`, `from_state`, `to_state`, `from_label`, `to_label`, `from_name`, `to_name`, `from_version`, `version`, `part`, `reason`.

On import commit, append a final event:

```json
{
  "at": "<import time>",
  "event": "imported",
  "source_format": "fattail.labs.strategy_lab",
  "model_version": "1.0",
  "policy": "additive|replace_lab"
}
```

### 4.6 Attributes bag (extension skeleton)

```json
"attributes": {
  "hypothesis@1": {
    "thesis": "…",
    "risk_posture": "defined"
  },
  "options_spec@1": {
    "kind": "long_butterfly",
    "underlying": "SPX"
  }
}
```

| Rule | Meaning |
|------|---------|
| **A-1** | Keys SHOULD be `name@version` (integer version) |
| **A-2** | Unknown bags are stored opaque; not stripped |
| **A-3** | F1 export may always emit `{}` |
| **A-4** | Validation of bag interiors is plugin-owned (later); pack import only checks JSON object type |
| **A-5** | Legacy `spec` if present SHOULD also be mirrored under `attributes["options_spec@1"]` when that bag is introduced (migration note — not required in v1.0) |

### 4.7 Evidence bag (reserved skeleton)

```json
"evidence": [
  {
    "id": "ev-…",
    "kind": "is_backtest",
    "schema_version": 1,
    "at": "ISO-8601",
    "payload": {}
  }
]
```

F1: always `[]`. Importers accept and store if DB column/path exists; otherwise preserve inside `attributes["_evidence@1"]` only if a store path is absent — **prefer fail loud** if evidence non-empty and store cannot persist it (config-driven).

**v1.0 as-built store:** `attributes_json` + `spec_json` + `lifecycle_log` only.  
- `evidence[]` non-empty → **preview warning**; commit stores evidence inside `attributes["__evidence@1"]` array until a first-class column exists (documented escape hatch, not silent drop).

---

## 5. Reserved collections

### 5.1 `campaigns[]`

Reserved for multi-strategy Deployment campaigns (Architecture open question).

```json
"campaigns": []
```

Future sketch (not normative in v1.0):

```json
{
  "id": "camp-…",
  "export_key": "camp-…",
  "name": "August paper book",
  "strategy_ids": ["a62c347c"],
  "status": "planned|active|closed",
  "attributes": {}
}
```

### 5.2 `reports[]`

Reserved for Archive page reports / lifecycle summaries.

```json
"reports": []
```

### 5.3 `lab_settings`

Reserved for member UI prefs (`mode: basic|pro`, default sort, etc.).

```json
"lab_settings": {}
```

---

## 6. Export contract

### 6.1 API (proposed)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/me/strategy-lab/export` | Full lab pack JSON |
| GET | `/api/me/strategy-lab/export?format=zip` | ZIP with `strategy-lab.json` |

Query (optional):

| Param | Effect |
|-------|--------|
| `phases` | Comma list filter (`development,curation`) — default all |
| `include_bin` | `true` (default) \| `false` — omit Archive cards |

### 6.2 Algorithm

1. Auth session → `identity_id`.  
2. `SELECT` all strategies for identity (or filtered).  
3. Map each row via portable projection (§4); **omit** `db_id`.  
4. Set `export_key` = `public_id` (or stored `export_key` when column lands).  
5. Build envelope + `lab.counts`.  
6. Audit `export`.  
7. Return `Content-Disposition: attachment; filename="strategy-lab-YYYYMMDD.json"`.

### 6.3 Projection (as-built → portable)

| DB / API field | Pack field |
|----------------|------------|
| `public_id` | `id`, `export_key` |
| `product_key` | `product_key` |
| `name`, `description` | same |
| `version*` | same |
| `phase`, `phase_state`, `disposition` | same |
| `attributes_json` | `attributes` |
| `spec_json` | `spec` |
| `lifecycle_log` | `lifecycle_log` (+ extract `__evidence@1` → `evidence` if present) |
| `bin_reason` | `bin_reason` |
| `created_at`, `updated_at` | ISO-8601 Z |

---

## 7. Import contract

### 7.1 Flow

```
file → detect → preview → commit(policy)
```

Member UI (Archive or Profile / Lab chrome): **Download lab** · **Load lab**.

### 7.2 API (proposed)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/me/strategy-lab/import/detect` | Confirm format + model_version |
| POST | `/api/me/strategy-lab/import/preview` | Counts: create / skip / remap / errors / capacity |
| POST | `/api/me/strategy-lab/import/commit` | Apply policy |

Body: `{ "document": {…} }` or multipart file. Max **25 MB**. Fail loud if exceeded.

### 7.3 Policies

| Policy | Behavior |
|--------|----------|
| **`additive`** (default) | For each strategy: if `export_key` already owned by identity → **skip**; else **insert**. Never UPDATE/DELETE. |
| **`replace_lab`** | Delete **all** `strategy_lab_strategies` for identity, then insert pack strategies. Requires `confirm: "REPLACE_LAB"`. |
| `merge_update` | **Forbidden in v1.0** (no silent overwrite of member cards) |

**Full restore path (member):** Download → `replace_lab` **or** purge Lab → additive load.

### 7.4 Identity of rows

1. Prefer match on `export_key` (unique per identity when column exists).  
2. Else match on `id` if it equals an existing `public_id`.  
3. On insert: if desired `public_id` collides with another of this identity’s keys under additive… already skip; under replace_lab table is empty so use pack `id` if valid hex/token shape, else mint new `public_id` and set `export_key` to pack’s key for future merges.

**Id shape:** as-built uses 8-char hex (`token_hex(4)`). Importers accept `[a-zA-Z0-9_-]{4,32}`; invalid → mint new, keep `export_key` = original.

### 7.5 Capacity

For commit:

```
for each phase in {development, curation, deployment, bin}:
  existing_count[phase]  // 0 if replace_lab
  incoming_new[phase]    // only cards that would insert
  if existing + incoming_new > 100 → 409 with detail
```

Preview surfaces the same matrix without writing.

### 7.6 Validation (fail loud)

| Code | Condition |
|------|-----------|
| `invalid_format` | `format` ≠ `fattail.labs.strategy_lab` |
| `unsupported_model` | `model_version` major > implemented (e.g. `2.x` when only `1.x`) |
| `unsupported_foundation` | `foundation_version` > server kernel |
| `invalid_strategy` | missing `name`/`phase` after normalize; not an object |
| `phase_capacity` | would exceed 100 in a phase |
| `replace_not_confirmed` | policy `replace_lab` without confirm token |
| `payload_too_large` | > 25 MB |

Soft (preview **warnings**, still importable):

| Warning | Condition |
|---------|-----------|
| `state_normalized` | Illegal phase_state coerced to default |
| `phase_aliased` | Alias rewritten |
| `evidence_embedded` | Non-empty evidence stored under `attributes.__evidence@1` |
| `log_truncated` | lifecycle_log clipped to 50 |
| `id_remapped` | public_id minted; export_key preserved |

### 7.7 Preview response (shape)

```json
{
  "format": "fattail.labs.strategy_lab",
  "model_version": "1.0",
  "policy": "additive",
  "summary": {
    "strategies_in_pack": 24,
    "create": 20,
    "skip": 4,
    "errors": 0,
    "warnings": 2
  },
  "by_phase": {
    "development": { "create": 8, "skip": 1, "after_total": 12 },
    "curation": { "create": 5, "skip": 1, "after_total": 6 },
    "deployment": { "create": 4, "skip": 1, "after_total": 5 },
    "bin": { "create": 3, "skip": 1, "after_total": 3 }
  },
  "issues": [
    { "level": "warning", "code": "state_normalized", "strategy_export_key": "…", "detail": "…" }
  ]
}
```

### 7.8 Commit response

```json
{
  "ok": true,
  "policy": "additive",
  "created": 20,
  "skipped": 4,
  "public_ids_created": ["…"],
  "export_key_map": { "pack-key": "new-public-id-if-remapped" }
}
```

---

## 8. Demo / exercise packs

To exercise the framework (many strategies × phases × states), packs SHOULD:

1. Use distinct `export_key` / `id` per card.  
2. Cover **every** legal `phase_state` at least once (recommended coach fixture).  
3. Include a few `bin` cards (`retired` and `trashed`).  
4. Keep `attributes: {}` until attribute plugins ship — depth is optional.  
5. Set `lab.label` e.g. `"F1 exercise pack 2026-08"`.  
6. Prefer `replace_lab` on a **dev** identity so the board matches the pack exactly.

### 8.1 Minimal multi-state fixture outline

| Phase | States to include (one card each) |
|-------|-----------------------------------|
| development | all 5 |
| curation | all 4 |
| deployment | all 9 |
| bin | retired, trashed |

Total **20** cards = full state coverage skeleton (names like `Dev · Hypothesis`, `Cur · Grouped`, …).

---

## 9. Versioning

| Artifact | Field | Bump when |
|----------|-------|-----------|
| Pack envelope | `model_version` | Required fields / collections change |
| Life-cycle kernel | `foundation_version` | Phase or state enums break |
| Attribute bags | key `@n` | Field semantics inside a bag |
| This spec | filename version | Normative contract changes |

**Compatibility:** Importers MUST accept `model_version` `1.0` and `1.x` additive minors if documented. Major `2.0` requires new code path.

**Unknown attribute keys:** preserve.  
**Unknown phase:** fail that strategy (error), do not invent phases.

---

## 10. Privacy & ownership

| Rule | Source |
|------|--------|
| Strategy Lab is Family B — private by default | Application Framework + Privacy v0.1 |
| Export/delete rights for authored lab data | MR-2 extended to Strategy Lab |
| No admin pack download without consent workflow | Privacy individual-access |
| Purge Lab ≠ delete membership | Same pattern as Practice purge |

**Purge inventory (Strategy Lab wipe):**

- All rows in `strategy_lab_strategies` for `identity_id`  
- Future: campaigns, report rows, lab_settings  

Does **not** remove: identity, membership, Practice data, courses.

---

## 11. UI placement (product)

| Surface | Action |
|---------|--------|
| Strategy Lab chrome / Archive | **Download lab** · **Load lab** |
| Profile “My data” (optional later) | Include Strategy Lab in member export suite |

Copy guidance:

- Load is **additive** by default (safe).  
- Full replace: *Download first → Load with Replace lab* (confirm).  
- Process-first: packs describe **process location** (phase/state), not performance claims.

---

## 12. Implementation sketch (non-binding)

| Layer | Touch |
|-------|--------|
| Domain | `export_lab(identity_id)`, `import_lab_preview`, `import_lab_commit` in `strategy_lab_domain.py` |
| Routes | `/api/me/strategy-lab/export`, `…/import/{detect,preview,commit}` |
| Migration | Optional `export_key VARCHAR(64)` UNIQUE (`identity_id`, `export_key`) — may equal `public_id` initially |
| Web | Archive page + board overflow: Download / Load dialogs |
| Tests | Round-trip; additive idempotent; capacity 409; replace confirm; state coverage pack |
| Schema file | `Specs/schemas/strategy-lab-pack-v1.json` |

---

## 13. Acceptance criteria

| # | Criterion |
|---|-----------|
| 1 | Export produces valid pack per JSON Schema (`format`, `strategies[]`) |
| 2 | Empty lab exports `strategies: []` successfully |
| 3 | Round-trip: replace_lab import → export → deep equality on portable fields (ids/export_keys, phase, state, version, name, attributes) |
| 4 | Second additive import of same pack → all skip, zero creates |
| 5 | Capacity: 101st card into a full phase → preview error + commit 409 |
| 6 | Illegal phase_state → normalized with warning, not silent wrong phase |
| 7 | No `identity_id` or `db_id` in any exported JSON |
| 8 | Audit rows written for export and import |
| 9 | Exercise pack with ≥1 card per legal phase_state loads and renders on board + Archive |

---

## 14. Worked example (tiny pack)

```json
{
  "format": "fattail.labs.strategy_lab",
  "model_version": "1.0",
  "foundation_version": 1,
  "exported_at": "2026-08-04T18:30:00Z",
  "source": { "system": "fattail-labs", "env": "dev", "app": "strategy-lab" },
  "identity": { "export_subject": "self", "email": "coach@example.com" },
  "lab": {
    "schema_version": 1,
    "label": "Tiny demo",
    "counts": {
      "development": 1,
      "curation": 1,
      "deployment": 0,
      "bin": 1,
      "total": 3
    }
  },
  "strategies": [
    {
      "id": "dev00001",
      "export_key": "dev00001",
      "product_key": "dev00001",
      "name": "Dev · OOS test",
      "description": "Skeleton card mid Development.",
      "version": "1.2.0",
      "version_major": 1,
      "version_minor": 2,
      "version_patch": 0,
      "phase": "development",
      "phase_state": "oos_test",
      "disposition": "active",
      "bin_reason": null,
      "attributes": {},
      "evidence": [],
      "spec": null,
      "lifecycle_log": [
        { "at": "2026-08-01T10:00:00Z", "event": "created", "phase": "development", "phase_state": "hypothesis", "version": "1.0.0" },
        { "at": "2026-08-02T10:00:00Z", "event": "phase_state", "from_state": "hypothesis", "to_state": "oos_test", "version": "1.2.0" }
      ],
      "created_at": "2026-08-01T10:00:00Z",
      "updated_at": "2026-08-02T10:00:00Z"
    },
    {
      "id": "cur00001",
      "export_key": "cur00001",
      "product_key": "cur00001",
      "name": "Cur · Grouped",
      "description": "",
      "version": "1.0.0",
      "version_major": 1,
      "version_minor": 0,
      "version_patch": 0,
      "phase": "curation",
      "phase_state": "grouped",
      "disposition": "active",
      "bin_reason": null,
      "attributes": {},
      "evidence": [],
      "spec": null,
      "lifecycle_log": [],
      "created_at": "2026-08-03T09:00:00Z",
      "updated_at": "2026-08-03T09:00:00Z"
    },
    {
      "id": "bin00001",
      "export_key": "bin00001",
      "product_key": "bin00001",
      "name": "Retired · Lesson learned",
      "description": "Pruned after process review.",
      "version": "2.0.0",
      "version_major": 2,
      "version_minor": 0,
      "version_patch": 0,
      "phase": "bin",
      "phase_state": "retired",
      "disposition": "retired",
      "bin_reason": "Lifecycle complete",
      "attributes": {},
      "evidence": [],
      "spec": null,
      "lifecycle_log": [
        { "at": "2026-08-04T08:00:00Z", "event": "phase_move", "from_phase": "deployment", "to_phase": "bin", "to_state": "retired", "reason": "Lifecycle complete" }
      ],
      "created_at": "2026-07-01T10:00:00Z",
      "updated_at": "2026-08-04T08:00:00Z"
    }
  ],
  "campaigns": [],
  "reports": [],
  "lab_settings": {}
}
```

---

## 15. Relation to other formats

| Format | Role |
|--------|------|
| `fattail.labs.strategy_lab` | **This spec** — whole Strategy Lab |
| `fattail.labs.member_export` | Practice suite pack; may **link** Strategy Lab later as nested document — not required in v1.0 |
| `fattail.labs.trade_log` | Unrelated SoR; strategies may reference trade ids later via attributes |
| Proto `lab_state.json` | Dev-only Streamlit store; export path should prefer Labs API pack over proto |

---

## 16. Document history

| Date | Note |
|------|------|
| 2026-08-04 | v1.0 — Initial portability contract: whole-lab pack, skeleton strategies, additive + replace_lab, phase/state enums, extension bags |

---

## 17. Coach lock summary

> **A Strategy Lab pack is the portable unit for a member’s entire life-cycle board.**  
> Schema ships as a **skeleton** so depth (attributes, evidence, campaigns, reports) grows inside stable envelopes.  
> Export early; import **additive by default**, **replace_lab** only with explicit confirm — so demos and backups stay honest, and the framework can be exercised with many strategies before the cards get deep.
