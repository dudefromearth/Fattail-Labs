# Strategy Lab — Development Phase Spec v1.0  
### Design phase (coach language) · Back test · Forward walk · Gate to Curation

**Status:** **SPEC AUTHORITY** (as-built + normative contract)  
**Date:** 2026-08-05  
**Product:** FatTail Strategy Lab (`/app/strategy-lab`)  
**Phase key:** `development` (UI label: **Design**)  
**Board labels (short, correct spelling):** **Design · Curate · Deploy** · Archive

**Parents / siblings**

| Document | Role |
|----------|------|
| [`Strategy-Lab-Architecture-Design-v1.0.md`](./Strategy-Lab-Architecture-Design-v1.0.md) | Life-cycle spine, bins, promote |
| [`Strategy-Lab-Life-Cycle-Architecture-v1.0.md`](./Strategy-Lab-Life-Cycle-Architecture-v1.0.md) / [v1.1](./Strategy-Lab-Life-Cycle-Architecture-v1.1.md) | PDF stages D1–D5, plugin path |
| [`Strategy-Lab-Strategy-Pack-Architecture-v1.0.md`](./Strategy-Lab-Strategy-Pack-Architecture-v1.0.md) | Packs (Butterfly / Batman); config under test |
| [`Strategy-Lab-Portability-Spec-v1.0.md`](./Strategy-Lab-Portability-Spec-v1.0.md) | `validation@1` travels in attributes |
| This document | **What happens inside Development** — especially validation before Curation |

**Doctrine:** Process over profit claims · defined risk · fail loud · **label data proxies** · stop-the-bleeding first  

---

## 0. Is there a “Design Phase” spec?

**No separate Design Phase document.** Coach / older materials say **Design Phase**. In FatTail Labs that phase is **`development`** (UI: **Development**).

| Coach language | Labs phase key | UI (short) |
|----------------|----------------|------------|
| Design Phase | `development` | **Design** |
| Curation Phase | `curation` | **Curate** |
| Campaign / live book | `deployment` | **Deploy** |
| Kill / archive | `bin` | **Archive** |

API/DB keys stay `development` | `curation` | `deployment` | `bin`.

This spec **is** the Design/Development phase contract for validation work (back test + forward walk). Pack configuration detail lives in the Strategy Pack Architecture; this doc owns **when** and **how** settings are proven before Curation.

---

## 1. Intent

### 1.1 What Development is for

1. **Specify** a strategy (pack config: Batman, BWB, capital, exits, …).  
2. **Validate** those settings with:
   - **Back test** — in-sample (IS) check  
   - **Forward walk** — walk-forward / holdout path  
3. Mark **Deployed** only after validation succeeds.  
4. **Only then** hand off to **Curation** (paper / live-sim prep, portfolio readiness).  

### 1.2 What Development is not

| Not in Development | Where it belongs |
|--------------------|------------------|
| Live brokerage execution | Deployment (+ future Tradier) |
| Portfolio grouping / capital allocation for the book | Curation → Deployment |
| Treating win rate as the primary success metric | Forbidden (HC-3 / pack doctrine) |

### 1.3 Governing rule

> **Curation assumes settings already survived Development validation.**  
> Live sim or live market must not be the first place a member discovers the pack is nonsense.

---

## 2. Development state machine

Ordered `phase_state` values (foundation):

| Order | Key | UI label | Meaning |
|------:|-----|----------|---------|
| 1 | `hypothesis` | Hypothesis | Idea / thesis |
| 2 | `model` | Model | Structure / pack shape chosen |
| 3 | `is_test` | **Back test** | In-sample validation of pack settings |
| 4 | `oos_test` | **Forward walk** | Walk-forward / holdout validation |
| 5 | `deployed` | **Deployed** | Development path complete — eligible for Curation |

**Naming note:** Keys stay `is_test` / `oos_test` for compatibility with life-cycle docs. UI and product copy use **Back test** and **Forward walk**.

**Deployed (Development)** ≠ Deployment phase. It means “finished Development validation path.”

```text
hypothesis → model → Back test (is_test) → Forward walk (oos_test) → Deployed
                              │                      │
                              │                      └──[pass]──► Deployed (auto after successful forward walk)
                              └── requires pack settings (recommended)
                                                                      │
                                                                      ▼
                                                         Promote / move → Curation
                                                         (blocked without validation evidence)
```

---

## 3. Validation pipeline (normative)

### 3.1 Back test

| Item | Rule |
|------|------|
| **Product name** | Back test |
| **State key** | `is_test` |
| **Evidence kind** | `is_backtest` |
| **Purpose** | Run the **current pack settings** over an in-sample window; produce process metrics (drawdown, sample count, risk-adjusted proxies) |
| **Precondition** | Strategy in phase `development` |
| **Postcondition (success)** | `phase_state = is_test`; `attributes["validation@1"].backtest` written; lifecycle log event `backtest` |
| **Failure** | `status: fail` still recorded; do not treat as complete for promote |

### 3.2 Forward walk

| Item | Rule |
|------|------|
| **Product name** | Forward walk |
| **State key** | `oos_test` (transient) then **`deployed`** on pass |
| **Evidence kind** | `forward_walk` |
| **Purpose** | Rolling train/test (or holdout folds) so settings are not IS-only fit |
| **Precondition** | Successful back test (`validation@1.backtest.status` ∈ {`pass`,`completed`}) |
| **Postcondition (success)** | `validation@1.forward_walk` written; `phase_state = deployed`; lifecycle log `forward_walk` |
| **Failure** | Stay on `oos_test` (or last state); promote remains blocked |

### 3.3 Order

1. Configure pack (designer).  
2. **Back test** (required before forward walk).  
3. **Forward walk** (required before Curation).  
4. State **Deployed**.  
5. **Promote** or move to Curation.

Skipping forward walk is **not** allowed for Curation entry (hard gate).

---

## 4. Evidence bag (`validation@1`)

Stored on the strategy card under `attributes_json` → `validation@1` (portable via Portability Spec).

```json
{
  "validation@1": {
    "backtest": {
      "at": "ISO-8601",
      "status": "pass|fail|completed",
      "kind": "is_backtest",
      "schema_version": 1,
      "metrics": { },
      "data_provenance": {
        "source": "stub|historical_chain|backtest_distribution",
        "label": "…",
        "asof": "ISO-8601"
      },
      "pack_id": "butterfly"
    },
    "forward_walk": {
      "at": "ISO-8601",
      "status": "pass|fail|completed",
      "kind": "forward_walk",
      "schema_version": 1,
      "metrics": {
        "folds": [
          {
            "fold": 1,
            "train": "…",
            "test": "…",
            "trades": 0,
            "max_drawdown_dollars": 0,
            "net_pnl_dollars": 0
          }
        ]
      },
      "data_provenance": { "source": "stub", "label": "…", "asof": "…" },
      "pack_id": "butterfly"
    }
  }
}
```

### 4.1 Metrics doctrine

| Allowed focus | Forbidden as primary success |
|---------------|------------------------------|
| Max / avg drawdown vs capital at risk | Win rate as the headline score |
| Return / avg DD, Sortino/Sharpe **proxies** (labeled) | Silent substitution of a metric the member did not choose |
| Fold stability on forward walk | Fantasy fills / unlabeled stub as “live” |

When engine is stub/historical proxy: **`data_provenance.source` must be set** and UI must show it (Architecture honesty §8.4).

### 4.2 Completeness for Curation

```text
validation_gaps(strategy) =
  missing or non-pass backtest  → "Back test not completed"
  missing or non-pass forward_walk → "Forward walk not completed"
```

`ready_for_curation` ⇔  
`phase == development`  
∧ `phase_state == deployed`  
∧ `validation_gaps == []`

---

## 5. Gates into Curation

| Path | Rule |
|------|------|
| **Promote** | Foundation: `phase_state == deployed`. **Plus** `validation_gaps` empty. |
| **Move phase → curation** | Same validation evidence + Deployed (cannot skip via hop). |
| Pack `beforePromoteToCuration` | Config must still validate; does not replace validation@1. |

Error copy (fail loud) must name missing steps, e.g.  
`Curation requires Development validation: Back test not completed; Forward walk not completed.`

---

## 6. API (session-scoped, Family B)

| Method | Path | Behavior |
|--------|------|----------|
| POST | `/api/me/strategy-lab/strategies/{id}/backtest` | Run IS back test; stamp evidence; state → `is_test` |
| POST | `/api/me/strategy-lab/strategies/{id}/forward-walk` | Run walk-forward; requires back test; on pass → `deployed` |
| GET | `/api/me/strategy-lab/strategies/{id}/validation` | `{ validation, gaps, ready_for_curation, phase_state, phase_state_label }` |
| POST | `/api/me/strategy-lab/strategies/{id}/promote` | Enforces Deployed + validation gaps |

All writes: identity_id ownership only.

---

## 7. UI (as-built placement)

| Surface | Content |
|---------|---------|
| Development work area | Compact title / version / phase chrome |
| Butterfly designer | Pack settings (when pack attached) |
| **Development validation** panel | Checklist · Run back test · Run forward walk · result cards · proxy banners · gaps before Curation |
| Phase bins | Move / Promote / Archive on selected card (Promote still server-gated) |

Copy guidance:

- Back test and forward walk happen **in Development**.  
- Curation is **after** proof — paper / live-sim prep, not first validation.

---

## 8. Engine maturity

| Stage | Engine | Provenance |
|-------|--------|------------|
| **Phase 1 (as-built)** | Deterministic **stub** metrics (config-sensitive, not random theater) | `source: stub`, labeled in API + UI |
| **Next** | Historical chain / Massive (or Labs provider) IS + walk-forward | `historical_chain` / `backtest_distribution` |
| **Later** | Full process plugin with member-visible series for true Sortino/Sharpe | Ranked primary metric may become computable (Pack Spec `ranked_by`) |

Stub is **allowed** for shipping the gate and UX; presenting stub as live market is **forbidden**.

---

## 9. Relation to packs (Butterfly / Batman)

- Pack config under test is typically `attributes.butterfly_config@1` / `strategy_pack@1`.  
- **Batman** = dual fly package (call + put); validated as one strategy product.  
- Rank structures (construct/metrics) may feed later real engines; Phase 1 stub does not require a prior rank run (recommended: configure pack first).  
- Pack primary_metric remains risk-adjusted; validation metrics should prefer DD / risk-adjusted proxies over win rate.

---

## 10. As-built map (Labs repo)

| Concern | Location |
|---------|----------|
| States + labels | `server/strategy_lab_domain.py` → `DEVELOPMENT_STATES` |
| Back test / forward walk | `run_backtest`, `run_forward_walk`, `validation_gaps` |
| Promote / move gates | `promote`, `move_phase` (dev→curation) |
| Routes | `server/routes/strategy_lab.py` |
| UI | `web/components/strategy-lab/DevelopmentValidation.tsx` |
| Client | `web/lib/strategyLabApi.ts` → `runBacktest`, `runForwardWalk`, `fetchValidation` |

---

## 11. Acceptance criteria

| # | Criterion |
|---|-----------|
| 1 | Development states include Back test / Forward walk labels for `is_test` / `oos_test` |
| 2 | Back test only in Development; stamps `validation@1.backtest` and sets `is_test` |
| 3 | Forward walk rejects without successful back test |
| 4 | Successful forward walk sets `deployed` and stamps `validation@1.forward_walk` |
| 5 | Promote to Curation fails until both validations pass and state is Deployed |
| 6 | Direct move Development → Curation enforces the same gaps |
| 7 | GET validation returns gaps + `ready_for_curation` |
| 8 | Stub results expose `data_provenance.source` and UI labels proxy |
| 9 | Evidence survives export/import under attributes (Portability) |

---

## 12. Open questions

| # | Question | Default until decided |
|---|----------|------------------------|
| Q1 | Hard vs soft: allow coach demo promote without validation? | **Hard** for all members (fail loud) |
| Q2 | Real chain provider for IS/walk-forward | Stub until Massive (or chosen provider) wired |
| Q3 | Should failed forward walk wipe Deployed if previously set? | N/A — only set Deployed on pass |
| Q4 | Minimum sample size floors | Deferred until real engine |

---

## 13. Document history

| Date | Note |
|------|------|
| 2026-08-05 | v1.0 — Development/Design phase validation: back test, forward walk, validation@1, Curation gate; clarifies no separate Design Phase spec |

---

## 14. Coach lock summary

> **There is no separate Design Phase spec — Design is Development.**  
> In Development you configure the pack, **back test**, then **forward walk**. Only then is the strategy **Deployed** and allowed into **Curation** for paper/live prep. Validation evidence lives on the card (`validation@1`); provenance is never silent.
