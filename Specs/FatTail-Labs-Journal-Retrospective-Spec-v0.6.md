# FatTail Labs — Journal Retrospective Spec v0.6

**Status:** **AS-BUILT · PROGRAM COMPLETE** — Delta RT8-G **PASS** 2026-07-29 · **v0.51 horizons applied** (DL-118)  

**Type:** Product truth for what ships on `main` (2026-07-29)  
**Build authority for the program was:** [v0.5](./FatTail-Labs-Journal-Retrospective-Spec-v0.5.md) (Coach GO 2026-07-29)  
**Supersedes for product shape / honesty:** v0.5 status tables and stale “later” claims;  
**Does not supersede:** locked product decisions (Option C, MIN_INFERENCE_N=20, §10.1 entitlement,  
§19 copy, §20 marketing, Journey §4.1a formula) unless listed under residuals  

**Parents:** Journey Experience Spec v1.0 §4.1a · Trade Log Spec v1.1 · Architecture/12-retrospective-report-dto.md  

**Board:** `agents/p-retrospective/` · gates RT0-G…**RT8-G** **PASS** (program COMPLETE)  

---

## 0. Purpose of v0.6

v0.5 was the **build** document (target + progressive honesty). v0.6 is **as-built**:  
what the code and tests prove, what remains deferred, and what must not be claimed as shipped.

India: approved product decisions stay; honesty patches that would rewrite v0.5 mid-build  
land here instead of silently editing the GO-locked draft.

---

## 1. Implementation honesty (program close)

| Slice | Status | Evidence |
|-------|--------|----------|
| Create / list / gather / complete / abandon / preview-scope | **Shipped** | `routes/retrospectives.py` · mig 046 |
| Plan-aware create (observer-trial) + habit schema + pnl expand pref | **Shipped** | R1b · mig 047 · RT1-G PASS |
| Gather dual report v0.5 + process-first UI + sample banner | **Shipped** | RT2-G PASS · `Architecture/12-…` |
| Normalized comparison + `comparable` | **Shipped** | RT3-G PASS |
| Habit plans CRUD · max 2 active · carry-forward | **Shipped** | RT4-G PASS · `routes/habit_plans.py` |
| Agent analyze (local mode) + panel + validation | **Shipped** | RT5-0 GO · RT5-G PASS |
| What worked + expected vs actual | **Shipped** | RT6-G PASS |
| Cadence meter + invitational nudge | **Shipped** | RT7-G PASS · Journey §4.1a live |
| As-built Spec + decision-log program close | **This document** | RT8-1 · DL-116 |
| Program gate | **COMPLETE** | RT8-G · DL-117 |

### Phase gates (all PASS)

| Gate | Report |
|------|--------|
| RT0-G Spec lock | `agents/p-retrospective/gate-reports/RT0-G-spec-lock.md` |
| RT1-G R1b | `…/RT1-G-r1b.md` |
| RT2-G R2b | `…/RT2-G-r2b.md` |
| RT3-G R3b | `…/RT3-G-r3b.md` |
| RT4-G R4 | `…/RT4-G-r4.md` |
| RT5-G R5 | `…/RT5-G-r5.md` |
| RT6-G R6 | `…/RT6-G-r6.md` |
| RT7-G R7 | `…/RT7-G-r7.md` |
| RT8-G Program close | `…/RT8-G-program-close.md` |

### Characterization suite (close snapshot)

```
cd server && .venv/bin/python -m pytest \
  tests/test_retrospectives.py \
  tests/test_habit_plans.py \
  tests/test_retrospective_agent.py \
  tests/test_journey_scores.py -q
# 82 passed (2026-07-29 RT8-G)
```

---

## 2. As-built surface map

### 2.1 Routes (member)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/me/retrospectives/preview-scope` | Next scope label |
| GET/POST | `/api/me/retrospectives` | List / create (409 concurrent open) |
| GET/PATCH | `/api/me/retrospectives/{id}` | Workspace + body/title |
| POST | `…/gather` | Dual report gather |
| POST | `…/complete` · `…/abandon` | Terminal |
| POST | `…/analyze` | Agent — **503** if mode off; Observer trial **same as Navigator** when on (DL-126/127) |
| GET/POST/PATCH/DELETE | `/api/me/habit-plans[/{id}]` | Cap **2** active → **409** |
| GET | `/api/me/journey/scores` | Process meters incl. cadence |

### 2.2 UI

| Route / component | Role |
|-------------------|------|
| Journal type **Retrospective** | Start |
| `/app/retrospective` | Library + `RetroCadenceNudge` |
| `/app/retrospective/[id]` | Workspace §6 order |
| Home · Journey | `ProcessMeter` + cadence nudge |
| `RetroCadenceNudge.tsx` | N1 only + **Not now** (session dismiss) |

### 2.3 Schema

| Artifact | Role |
|----------|------|
| `migrations/046_retrospectives.sql` | `member_retrospectives` |
| `migrations/047_retrospective_r1b.sql` | `member_habit_plans` · `identities.retrospective_pnl_expanded` |

### 2.4 Code modules

| Module | Role |
|--------|------|
| `server/retrospective_domain.py` | Scope, gather, comparison, habits, entitlement |
| `server/retrospective_agent.py` | Validate + local analyze |
| `server/journey_scores.py` | `retro_horizon_days` · cadence formula · E1–E3 · `nudge` |
| `server/routes/retrospectives.py` · `habit_plans.py` | HTTP |
| `web/…/RetrospectiveWorkspace.tsx` | Process-first UI |
| `Architecture/12-retrospective-report-dto.md` | report_json SoR |

---

## 3. Locked decisions (still authoritative — do not re-open without Coach)

| Decision | Source |
|----------|--------|
| Option C scope gap unreviewed | v0.5 §4.1 |
| `MIN_INFERENCE_N = 20` | Hotel RT0-2 |
| Create = admin **OR** activator+ **OR** active plan `observer-trial` | Mike §10.1 |
| Free no-plan: no create; cadence **empty** (E1) | Coach E.2 |
| Activator = legacy, not marketed funnel | Dual-goal + v0.5 |
| Cadence formula + completed_at-only clock | Journey §4.1a |
| `retro_horizon_days`: trial **7** · nav mo **30** · annual **90** · activator **30** · alumni **90** · free **n/a** | Spec **v0.51** + code + Journey §4.4 (weekly teach; tenure ramp still 42) |
| Nudge invitational; no shame / grade cross-link | Tango §7.5 · §19 |
| Family B isolation · §20 marketing bans | Mike · Sierra |
| Agent trial **off** by default | RT5-0 GO |

### Cadence policy — Spec **v0.51** (Coach amendment)

Observer trial teaching rhythm is **weekly** (`retro_horizon_days = **7**`).  
`grade_ramp_days` for trial remains **42** (tenure / integrity extremes — not cadence).  
Alumni cadence **H=90**. Meter is **signal, not enforcement** (one of six meters).  
See `FatTail-Labs-Journal-Retrospective-Spec-v0.51.md`.

---

## 4. Cadence as-built (matches Journey §4.1a)

```
H = profile.retro_horizon_days
d = days since last COMPLETED retrospective
    (else days since practice_epoch)

d ≤ H        → raw = 100
H < d < 2H   → raw = round(100 × (2H − d) / H)
d ≥ 2H       → raw = 0
```

- Meter **not** `soon`. E1–E3 → `empty` (excluded from average).  
- `nudge = (d > H)` using the **same** H.  
- UI nudge copy shipped: **N1 only** (N2/N3 approved in Spec, not rotated in product).  
- Surfaces: home, journey, retro library.

---

## 5. Agent as-built

| Item | Reality |
|------|---------|
| Mode | `LABS_RETRO_AGENT_MODE=local` only |
| External LLM HTTP | **Not shipped** |
| Anchoring / sample gate / symmetry | Validated (RT5-3) |
| Observer trial analyze | **Same as Navigator** when `LABS_RETRO_AGENT_MODE` on (not trial-flag gated) |
| Fail loud | Unconfigured → **503** |

---

## 6. Residuals (honest — not shipped / not claimed)

| Residual | Owner / note |
|----------|----------------|
| Cost-of-deviation counterfactual | Deferred (v0.5 §21 · Hotel+Tango) |
| External agent provider (HTTP) | Deferred; local deterministic only |
| ~~Agent trial-only flag~~ | **Superseded DL-127** — Observer analyze parity with Navigator when agent mode on |
| Nudge copy rotation N2/N3 | Spec-approved; product uses fixed N1 |
| Journey **milestones** from retro complete | Still “later” — cadence meter shipped; milestone feed not required for R7 |
| Alumni create entitlement | TBD; profile H=60 if create allowed |
| Member-authored `gap` write path | Optional; gather may leave null |
| v0.2 report rows | Fallbacks remain in UI for old `report_json` |

---

## 7. Entitlement matrix (as-built)

| Population | Create / gather | Cadence meter | Agent analyze (default) |
|------------|-----------------|---------------|-------------------------|
| Observer (`observer-trial`) | **Yes** — **same features as Navigator**; membership **term = 6 weeks** (sole difference, DL-128) | Yes (profile H may teach weekly during term) | **Yes** when agent mode on (parity) |
| Free no-plan (not Observer) | **No** (403) | Empty E1 | No |
| Navigator | Yes | Yes | Yes if agent mode on |
| Activator (legacy) | Yes | Yes | Yes if agent mode on |
| Administrator | Yes | Yes | Yes if agent mode on |

---

## 8. Verification inventory (as-built)

Covered by characterization (non-exhaustive; see seeds RT1-2…RT7-3):

1. Isolation — cross-identity 404  
2. Entitlement trial / free / activator  
3. Concurrent open 409  
4. Maiden vs subsequent scope  
5. Comparison comparable flags (e.g. 21d vs 63d)  
6. Habit plan third active 409  
7. Cadence formula + open/abandoned non-freeze + E1–E3 + copy sweep  
8. Agent validation rejects + fail-loud  

---

## 9. Document map

| Doc | Role |
|-----|------|
| **This file (v0.6)** | As-built product truth / program close |
| v0.5 | Historical build authority (Coach GO) |
| **v0.51** | **Coach amendment** — weekly trial H=7; signal-not-enforcement; alumni H=90 |
| **Advisor Gates v0.51** | `Advisor-Gates-Retrospective-v0.51.md` — Hotel…Delta clearance matrix |
| Cadence delta | Folded into v0.5; historical packet |
| Journey Experience Spec §4.1a / §4.4 | Cadence formula + profiles |
| `Architecture/12-retrospective-report-dto.md` | Workspace DTO |
| `agents/p-retrospective/` | Board, seeds, gates |

---

## 10. Decision-log pointer

> **Journal Retrospective program AS-BUILT (RT8-1 / DL-116).** R1b–R7 shipped with  
> Delta gates PASS. Product shape remains v0.5 decisions; honesty and residuals live in  
> Spec v0.6. Cost-of-deviation and external agent remain deferred.
