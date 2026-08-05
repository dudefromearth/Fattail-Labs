# Strategy Lab — Strategy Pack Implementation Plan v1.0  
### Butterfly Pack Phase 1 + Portability hardening

**Status:** **BUILD AUTHORITY** — ordered implementation plan  
**Date:** 2026-08-04  
**Locked specs (do not re-litigate in PRs):**

| Spec | Role |
|------|------|
| [`Strategy-Lab-Strategy-Pack-Architecture-v1.0.md`](./Strategy-Lab-Strategy-Pack-Architecture-v1.0.md) **v1.0.1** | Pack contract, Butterfly schema, ranking honesty, provenance |
| [`Strategy-Lab-Portability-Spec-v1.0.md`](./Strategy-Lab-Portability-Spec-v1.0.md) **v1.0.1** | Whole-lab I/O, replace_lab recovery, email omit, coach seeds |
| [`Strategy-Lab-Architecture-Design-v1.0.md`](./Strategy-Lab-Architecture-Design-v1.0.md) **v1.0.1** | Life cycle, production SoR, promote gate |
| [`FatTail-Labs-Access-Control-Spec-v0.4.md`](./FatTail-Labs-Access-Control-Spec-v0.4.md) | `strategy-lab` data-bearing floor |

**Host:** Labs production stack only — Python FastAPI (`server/`) + Next.js (`web/`). Streamlit proto is reference, not SoR.

**Doctrine:** Fail loud · no silent metric substitution · defined risk only · process over profit claims · Family B isolation  

---

## 0. Commit stance

This plan is the **agreed build sequence** for Strategy Pack Phase 1. PRs implement slices below in order unless a later PR has zero dependency on an earlier one (noted). Scope cuts require Coach amendment to this plan or the parent specs — not silent drop of acceptance criteria.

**Already shipped (do not rebuild):**

- Foundation life cycle (phases, phase_state, bins, Archive page, Practice chrome)  
- Identity-scoped CRUD + promote/bin  
- Whole-lab export/import additive + replace_lab **confirm** (recovery snapshot **not** yet)  
- Exercise pack fixture (20 phase_states)  
- `strategy-lab` in `DATA_BEARING_APPS` + email omitted on export by default  

**Explicitly out of this plan:**

- Tradier / live brokerage execution  
- Verticals pack  
- Calibrated convexity research (Q1) — provisional heuristic only  
- `merge_update` import policy  
- Multi-tenant pack marketplace  
- Streamlit as production path  

---

## 1. Goals (Phase 1 outcome)

A signed-in member can:

1. Attach the **Butterfly** pack to a Development strategy (or create from a pack template).  
2. Edit config via **schema-driven** stepper UI with dependsOn.  
3. Validate config (hard errors for HC-* and pack rules).  
4. Construct + rank candidate structures against a **stub or real chain**, with:  
   - `ranked_by` + `primary_metric_substituted` always visible  
   - ratios on `netPremiumAbs`  
   - `data_provenance` labeled (stub vs provider)  
   - `convexityProvisional` stamped  
5. Save config to card `attributes` with version/log events.  
6. Live payoff preview for selected structure.  
7. Promote to Curation only when Development is **Deployed** (foundation) + pack validate.  
8. Survive `replace_lab` via **recovery blob** undo.  
9. Export/import preserve pack attribute bags.

---

## 2. Architecture slice (what gets built)

```text
web/  StrategyDesigner · DynamicForm · PayoffPreview · rank banners
        │
        ▼
/api/me/strategy-lab/packs/*   validate · rank · schema meta
        │
server/strategy_packs/
  registry · common validation · capital · metrics helpers
  packs/butterfly/  schema · defaults · validate · search · construct · metrics · rank
        │
strategy_lab_strategies.attributes_json
  strategy_pack@1 · butterfly_config@1 · (optional candidates / evidence)
```

---

## 3. PR plan (ordered)

Each PR is independently reviewable. Dependencies listed. Do not merge a PR that skips its acceptance block.

---

### PR-0 — Spec freeze commit (docs + floor alignment)

**Title:** `docs(strategy-lab): pack architecture, review resolutions, implementation plan`

**Includes:**

- Pack Architecture v1.0 / v1.0.1  
- Portability v1.0.1, Architecture Design v1.0.1, Access Control floor amendment  
- This implementation plan  
- As-built already partially done: `DATA_BEARING_APPS`, export email omit  

**Depends on:** nothing  

**Acceptance:** Specs linked; tests for access-control keys still green  

---

### PR-1 — Pack registry + Butterfly schema domain (server, no UI)

**Title:** `feat(strategy-lab): strategy pack registry and butterfly schema`

**Files (intent):**

| Path | Work |
|------|------|
| `server/strategy_packs/__init__.py` | Package |
| `server/strategy_packs/registry.py` | `list` / `get` / register at import |
| `server/strategy_packs/types.py` | Protocol / TypedDicts mirroring Pack Spec §3 |
| `server/strategy_packs/common/validation.py` | HC-1–HC-4 cross-pack checks |
| `server/strategy_packs/common/capital.py` | Capital-at-risk unit resolution (stub account capital OK) |
| `server/strategy_packs/packs/butterfly/schema.py` | ParameterSchema as data |
| `server/strategy_packs/packs/butterfly/defaults.py` | Six templates |
| `server/strategy_packs/packs/butterfly/validation.py` | `validate(config)` |
| `server/strategy_packs/packs/butterfly/ui.py` | UIDefinition |
| `server/strategy_packs/packs/butterfly/__init__.py` | Pack object |
| `server/tests/test_strategy_packs_butterfly.py` | Schema keys, defaults validate after host fill, HC-2, exit_rules |

**API:**

| Method | Path |
|--------|------|
| GET | `/api/me/strategy-lab/packs` |
| GET | `/api/me/strategy-lab/packs/{pack_id}` → meta + schema + ui + defaults |
| POST | `/api/me/strategy-lab/packs/{pack_id}/validate` |

**Depends on:** PR-0  

**Acceptance:**

- Only `butterfly` enabled  
- validate rejects win-rate primary, missing decay trailing, bad DTE custom  
- `min_convexity_quality` optional  
- No UI required  

---

### PR-2 — Construct + metrics + rank (server, stub chain)

**Title:** `feat(strategy-lab): butterfly construct, metrics, and honest ranking`

**Files (intent):**

| Path | Work |
|------|------|
| `server/strategy_packs/packs/butterfly/search.py` | `buildSearchQuery` |
| `server/strategy_packs/packs/butterfly/construct.py` | Defined-risk symmetric + BWB skeletons from stub chain |
| `server/strategy_packs/packs/butterfly/metrics.py` | `netPremiumAbs`, ratios, `convexityProvisional=true` |
| `server/strategy_packs/packs/butterfly/rank.py` | §4.7 algorithm |
| `server/strategy_packs/chain_stub.py` | Deterministic stub `OptionChain` with `provenance.source=stub` |
| `server/tests/test_strategy_packs_rank.py` | ranked_by, substitution flag, credit ratio abs, no win-rate sort |

**API:**

| Method | Path |
|--------|------|
| POST | `/api/me/strategy-lab/packs/{pack_id}/rank` body: `{ config, chain?: …, strict_primary?: bool }` |

**Response contract (normative):** each item has `ranked_by`, `primary_metric_substituted`, `data_provenance`, metrics with `convexityProvisional`.

**Depends on:** PR-1  

**Acceptance:**

- Default Phase 1: primary uncomputable → `ranked_by=convexity_ratio_proxy`, `primary_metric_substituted=true`  
- `strict_primary=true` → 422 when primary uncomputable  
- Credit structure cannot beat debit solely via signed ratio  
- Stub provenance present on every result  
- Construct never emits infinite maxLoss  

**Reuse:** Payoff math may port **ideas** from `strategy-lab-proto/engine/risk_engine/` into `server/` (copy/adapt, **no MSC import**). Prefer pure functions testable without Streamlit.

---

### PR-3 — Persist pack config on strategy cards

**Title:** `feat(strategy-lab): save butterfly_config attributes and promote gate`

**Files (intent):**

| Path | Work |
|------|------|
| `server/strategy_lab_domain.py` | `set_pack_config`, stamp `strategy_pack@1` + `butterfly_config@1`, log `pack_config_save`, version bump policy |
| `server/routes/strategy_lab.py` | PATCH body fields or dedicated `…/pack-config` |
| Promote path | Call pack `beforePromoteToCuration` + existing Deployed guard |

**Attribute bags:**

```json
{
  "strategy_pack@1": { "pack_id": "butterfly", "pack_version": "1.0.0" },
  "butterfly_config@1": { /* StrategyConfig fields */ }
}
```

**Depends on:** PR-1 (PR-2 recommended so rank evidence can be optional later)  

**Acceptance:**

- Save invalid config → 422  
- Save valid → attributes round-trip; lifecycle log event  
- Material config change → minor version bump (or documented host policy)  
- Promote without Deployed → 422  
- Export preserves bags (existing portability)  

---

### PR-4 — Development UI: dynamic form + designer shell

**Title:** `feat(strategy-lab): schema-driven butterfly designer UI`

**Files (intent):**

| Path | Work |
|------|------|
| `web/lib/strategyPacks/types.ts` | Mirror contract types |
| `web/lib/strategyPacks/api.ts` | packs list/get/validate/rank client |
| `web/components/strategy-lab/design/DynamicForm.tsx` | FieldDefinition + dependsOn |
| `web/components/strategy-lab/design/StrategyDesigner.tsx` | Stepper sections from UIDefinition |
| `web/components/strategy-lab/StrategyLabApp.tsx` | Work area: open designer when Development strategy selected |
| Templates entry | “Create from Butterfly template” → create strategy + apply default config |

**Depends on:** PR-1, PR-3  

**Acceptance:**

- UI-1, UI-2, UI-5, UI-6  
- dependsOn hides custom DTE / mid_vix bias / campaign frequency correctly  
- Validation errors shown from API (fail loud)  

---

### PR-5 — Rank results + payoff preview + honesty banners

**Title:** `feat(strategy-lab): rank panel, payoff preview, provenance banners`

**Files (intent):**

| Path | Work |
|------|------|
| `web/components/strategy-lab/design/RankResults.tsx` | List ranked structures; show ratios |
| `web/components/strategy-lab/design/HonestyBanner.tsx` | primary_metric_substituted + stub provenance + convexityProvisional |
| `web/components/strategy-lab/design/PayoffPreview.tsx` | Chart from structure legs (reuse/port proto payoff or lightweight SVG) |

**Depends on:** PR-2, PR-4  

**Acceptance:**

- UI-3, UI-4, UI-7, UI-8, UI-9  
- Never show rankings without `ranked_by`  
- Stub label visible when provenance is stub  

---

### PR-6 — Portability: replace_lab recovery snapshots

**Title:** `feat(strategy-lab): replace_lab recovery blob and restore`

**Files (intent):**

| Path | Work |
|------|------|
| `migrations/079_strategy_lab_recovery.sql` | Table: identity_id, recovery_id, pack_json, created_at, expires_at |
| `server/strategy_lab_domain.py` | Snapshot before purge; restore-recovery; FIFO cap 5; retention default 14d |
| `server/routes/strategy_lab.py` | restore endpoint; commit returns `recovery_id` |
| `web/components/strategy-lab/StrategyLabPortability.tsx` | Undo replace UX |
| `server/tests/test_strategy_lab.py` | Snapshot fail blocks purge; restore equality |

**Depends on:** existing portability (can parallel PR-1–5 after PR-0)  

**Acceptance:** Portability acceptance 11–12; SLP-15  

---

### PR-7 — Fixtures, coach seed workflow docs-in-UI, characterization

**Title:** `test(strategy-lab): butterfly demo pack and characterization suite`

**Files (intent):**

| Path | Work |
|------|------|
| `fixtures/strategy-lab/butterfly-templates-pack.json` | Lab pack with strategies preloaded with butterfly_config@1 templates |
| `server/tests/test_strategy_packs_e2e.py` | validate → rank → save → export → import  
| UI copy | Load lab: additive never overwrites; coach seed §7.9 short help |

**Depends on:** PR-2, PR-3, PR-6 (for replace path)  

**Acceptance:** Pack Spec §11 criteria 1–12 that apply to Phase 1; Portability coach workflow documented in UI  

---

## 4. Dependency graph

```text
PR-0 (specs)
  ├─► PR-1 (registry + schema + validate API)
  │     ├─► PR-2 (construct / metrics / rank)
  │     └─► PR-3 (persist attributes + promote)
  │           └─► PR-4 (designer UI)
  │                 └─► PR-5 (rank UI + payoff + banners)
  ├─► PR-6 (recovery)  [can start after PR-0 in parallel]
  └─► PR-7 (fixtures + e2e)  [after PR-2,3,6; PR-5 preferred]
```

**Parallel tracks:**

- **Track A (Pack core):** PR-1 → PR-2 → PR-3 → PR-4 → PR-5  
- **Track B (Portability harden):** PR-6  
- **Track C (Polish):** PR-7  

---

## 5. Data & migrations

| Migration | Purpose |
|-----------|---------|
| (none for packs) | Attributes already JSON on `strategy_lab_strategies` |
| `079_strategy_lab_recovery.sql` | Recovery blobs for replace_lab |

Optional later (not Phase 1 blockers): dedicated `export_key` column; first-class `evidence` column.

---

## 6. API surface (complete Phase 1)

| Method | Path | PR |
|--------|------|-----|
| GET | `/api/me/strategy-lab/packs` | 1 |
| GET | `/api/me/strategy-lab/packs/{pack_id}` | 1 |
| POST | `/api/me/strategy-lab/packs/{pack_id}/validate` | 1 |
| POST | `/api/me/strategy-lab/packs/{pack_id}/rank` | 2 |
| PATCH | `/api/me/strategy-lab/strategies/{id}` (pack config) | 3 |
| GET | `/api/me/strategy-lab/export` | shipped (+ include_email) |
| POST | `/api/me/strategy-lab/import/*` | shipped |
| POST | `/api/me/strategy-lab/import/restore-recovery` | 6 |
| GET | `/api/me/strategy-lab/recoveries` (list) | 6 optional |

---

## 7. Testing strategy

| Layer | Coverage |
|-------|----------|
| Unit | Butterfly validate matrix; ratio abs; rank substitution; DTE resolution |
| API | packs meta; validate 422; rank provenance; save attributes; promote Deployed |
| Portability | recovery before replace; restore; no email by default |
| Access | hard-lock strategy-lab → 422 (floor) |
| UI | Manual: stepper, banners, stub label, template create (automated later if harness exists) |

Characterization: `cd server && .venv/bin/python -m pytest tests/test_strategy_lab.py tests/test_strategy_packs*.py tests/test_access_control_keys.py -q`

---

## 8. Risks & mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Construct quality weak without real chain | Medium | Stub deterministic + labeled; Massive later behind same provenance |
| Payoff preview scope creep | Medium | PR-5 minimum viable curve; full MSC risk graph deferred |
| Convexity heuristic disputed | Low | Provisional stamp; Q1 research out of plan |
| replace_lab data loss | High | PR-6 before promoting coach replace UX in demos |
| Large PR-2 | Medium | Keep construct minimal (ATM symmetric + simple BWB); expand later |

---

## 9. Non-goals (repeat)

- Live Tradier / OMS  
- Verticals pack  
- Hard evidence gate on promote  
- Win-rate ranking or leaderboards  
- merge_update import  
- Changing foundation phase enums  

---

## 10. Definition of Done (Phase 1)

- [ ] All PR-1…PR-7 acceptance blocks green  
- [ ] Pack Spec §11 Phase 1 acceptance criteria satisfied  
- [ ] Portability recovery acceptance 11–12 satisfied  
- [ ] No silent primary_metric substitution in UI or API  
- [ ] Coach can load butterfly template pack on demo account with recovery undo  
- [ ] Docs: plan status → **COMPLETE** (amendment note)  

---

## 11. Suggested first execution steps

1. Merge **PR-0** (this plan + review-resolved specs).  
2. Start **Track A PR-1** and **Track B PR-6** in parallel if capacity allows.  
3. Do not open PR-4 until PR-1 validate API is stable.  
4. Do not demo `replace_lab` teaching packs to members until PR-6 lands.

---

## 12. Document history

| Date | Note |
|------|------|
| 2026-08-04 | v1.0 — Initial implementation plan; committed as build authority after Claude review resolutions |

---

## 13. One-line charter

> **Build Butterfly as a Strategy Pack on the existing Labs foundation: honest ranking, schema-driven Development UI, portable attributes, and recoverable replace — no live execution, no phase invention.**
