# Strategy Lab — Process Runtime Implementation Scope v1.0  
### What we build · what we do not · vertical slice · external GO/NOGO

**Status:** **PLANNING** — implementation **blocked** until Coach program GO + external legal GO/NOGO where noted  
**Date:** 2026-08-05  
**Owner (plan):** Juliet  
**Authority:** Coach  

**Normative specs (implement from these, not from chat)**

| Document | Role |
|----------|------|
| [`Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md`](../Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md) | **Primary authority** (v1.1.1 fold-in: ExitPolicy, O-1…O-5, pause banners, attestation Privacy) |
| [`Architecture/14-strategy-lab-execution-responsibility.md`](../Architecture/14-strategy-lab-execution-responsibility.md) | User + broker run first; M0–M3 |
| [`Architecture/09-strategy-lab-tradier.md`](../Architecture/09-strategy-lab-tradier.md) | Massive data in · Tradier orders out |
| Continuity · Versioning recommendations · Development Phase · Pack Architecture | Cross-locks (place, restore, G-2, packs) |
| Member Data Privacy §2.1 · D-7 | Named consumers (attestation) — **counsel outside this program** |

**Agent board:** [`agents/p-strategy-runtime/`](../agents/p-strategy-runtime/)  
**Full bench plan:** [`Strategy-Lab-Process-Runtime-Full-Agent-Bench-Plan-v1.0.md`](./Strategy-Lab-Process-Runtime-Full-Agent-Bench-Plan-v1.0.md)

---

## 0. Mission

Ship a **process space around deployment** of Strategy Lab strategies:

> **Build, prove, version, hand off** — with a versioned **deployment instance**, **scan/manage** procedures, **decision log**, **risk envelope**, and honest **dry → paper → live** ladder.  
> **Running** automations is primarily the **user** and **Tradier**, not Labs as a 24/7 bot farm.

**Brand promise (in scope):** best-in-class design, validation, versioning, arming, export, Tradier paper path, broker-held exits where possible.  
**Not brand promise (out of scope for v1):** five-nines Labs-hosted bots, guaranteed outcomes, indicator marketplace.

---

## 1. External GO / NOGO (legal outside this work)

Legal counsel and commercial ToS work are **outside the agent bench**. The program records only **status flags** Coach provides:

| Flag | Gates | Default until set |
|------|-------|-------------------|
| **LEGAL-TRACK** | Opened (yes/no) | Unknown |
| **LEGAL-LIVE** | May store production `AttestationRecord` and enable **live** path (PR2 store + PR8) | **NOGO** |
| **LEGAL-COPY** | Arming ceremony / contingency copy may ship to production | **NOGO** for production; staging copy may use “draft not legal” watermark if Coach allows |

**Bench rule:** PR0 opens the *product* review track. PR1/PR3/PR4/PR5/PR6/PR7 may proceed on **paper / dry / export** without LEGAL-LIVE. **No production live orders** and **no production attestation retention** until Coach sets **LEGAL-LIVE = GO**.

Schema for attestation may land empty; runtime must **fail loud** if live promote is attempted without LEGAL-LIVE + attestation rules.

---

## 2. Execution modes (priority)

| Mode | Who runs the loop | Program priority |
|------|-------------------|------------------|
| **M0** Export / manual at broker UI | User | **P0** |
| **M1** Entry + Tradier working exits | Broker for protect | **P0** |
| **M2** User-local worker + Deployment Pack | User infra | **P1** |
| **M3** Labs-hosted workers + fleet admin | Labs residual | **P3 — Coach GO only (PR10)** |

---

## 3. In-scope delivery phases (PR0–PR10)

Aligned with Process Runtime Spec §12. Each phase is a **program phase** (may be multiple seeds/PRs).

| Phase | In scope | Mode | Hard depends |
|-------|----------|------|--------------|
| **PR0** | Spec lock reviews (India/Mike/Tango/Hotel); Coach program GO; open LEGAL-TRACK externally; DL entry | — | Spec v1.1.1 |
| **PR1** | `DeploymentInstance` schema/API; envelope; runners (metadata); `decision_log` append API; **no Labs tick loop**; Deploy place binding | M0 shell | Continuity Deploy place; strategy card SoR |
| **PR2** | Arming ceremony UI + `AttestationRecord` storage (schema + API); fail loud without attestation on live path | M0 | PR1; **LEGAL-LIVE for production store** |
| **PR3** | Deployment Pack export (`integrity_hash`); no broker secrets | M0/M2 | PR1 |
| **PR4** | Tradier OAuth (member) + **paper** multi-leg open; on-demand reconcile; **O-1…O-5** from first order path | M1 | Arch/09; PR1 |
| **PR5** | ExitPolicy → Tradier advanced exits matrix (OCO/OTO/OTOCO paper spike → product); structure-agnostic field names | M1 | PR4 |
| **PR6** | Dry-run evaluator (in-app optional); typed decision catalog v1 (schedule/envelope/pack/position — **no indicators**) | M0 assist | PR1 |
| **PR7** | User-local worker docs + CLI/reference consuming Deployment Pack (M2) | M2 | PR3 |
| **PR8** | Live Tradier path; freeze/drift; status strip; G-2 gate; L4 self-manage attest | M1 live | G-2 evidence; **LEGAL-LIVE + LEGAL-COPY** |
| **PR9** | Journal / Retro / Habit hooks (process events only) | — | PR8 optional; Habit Catalog may lag |
| **PR10** | Optional M3 queue/workers + §17 scale rules + admin console thin→full | M3 | **Explicit Coach GO** |

### 3.1 Vertical slice (v1 “done enough” for member value)

Must all land for **v1 slice complete** (before M3):

1. Defined-risk pack strategy card (existing)  
2. Deployment instance + envelope + decision_log (PR1)  
3. Arming ceremony (PR2; production store after LEGAL-LIVE)  
4. Deployment Pack export (PR3)  
5. Tradier **paper** multi-leg open + reconcile (PR4)  
6. Broker-held exits where paper spike allows (PR5)  
7. Order-level dedupe O-1…O-5 on all order paths (PR4+)  
8. Pause/halt/archive + disconnect banners (§4.1.1)  
9. Deploy place restore / empty-on-unknown (Continuity)  
10. Dry-run or export path so member can operate without Labs ticks (PR3 and/or PR6)

**Not required for v1 slice:** Labs multi-tenant scheduled scan farm (PR10), full indicator catalog, live capital.

---

## 4. Cross-cutting requirements (every phase that touches risk)

| ID | Requirement | Source |
|----|-------------|--------|
| **X-1** | ExitPolicy structure-agnostic: `take_profit_frac_of_max_profit`, `stop_multiple_of_premium_risked` — **never** `*_frac_of_credit` | Spec §2.7 |
| **X-2** | Order intents carry `client_order_tag`; retry reconciles before resubmit (O-1…O-5) | Spec §21.4 |
| **X-3** | Job idempotency ≠ order dedupe (Q-2 vs O-*) | Spec §17 / §21 |
| **X-4** | Labs pause/halt/archive/disconnect ≠ cancel broker working orders (banner) | Spec §4.1.1 |
| **X-5** | Explore version ≠ rebind instance; restore pack ≠ silent instance mutate | Spec §1.2–1.3 |
| **X-6** | Live requires G-2 validation evidence + Deploy phase (defaults L3/L4) | Spec §1.4 · §14 |
| **X-7** | Process metrics from decision_log / lifecycle SoR — not place `updated_at` | Continuity + Spec |
| **X-8** | Family B isolation on instances, graphs, logs, order intents, attestations | Privacy + Spec |
| **X-9** | No profit theater in UI/metrics (process language) | North Star / Hotel |
| **X-10** | Standalone repo — no MSC imports | Labs doctrine |

---

## 5. Out of scope (hard)

| Item | Why |
|------|-----|
| Legal counsel, ToS drafting, DPIA | External; Coach GO/NOGO only |
| M3 as brand promise / five-nines SLA | Spec non-goal |
| Indicator-first decision catalog | L6 default No |
| Full arbitrary flowchart IDE | Spec non-goal |
| Labs-owned pooled trading accounts | Spec §21.1 |
| Tradier market data streaming | Massive / Coach pipe only |
| Auto-restore pack into live instance | V-5 |
| Git branch UI inside strategy card | P8 clone only |
| Versioning Wave A full (snapshots UI) | Separate track; runtime only **consumes** bind/drift rules |
| Continuity place → server multi-device | Continuity Q1 optional later |
| MSC shared code / second SPX feed if Coach feed exists | Doctrine |
| Profit leaderboards / win-rate open gates | Doctrine |
| Content Studio (Quebec/Bravo/November/Romeo/Papa) | Not this board |
| Practice suite hardening / Journal redesign | Other boards |

---

## 6. As-built substrate (honest — do not re-build)

| Already landed | Path / note |
|----------------|-------------|
| Strategy Lab app shell, phase bins, place memory (`localStorage`) | `web/components/strategy-lab/*`, `web/lib/strategyLabPlace.ts` |
| Strategy cards, phase/phase_state, lifecycle_log, version | `server/strategy_lab_domain.py`, migrations `078`+ |
| Butterfly pack + designer + validation@1 BT/FW | `server/strategy_packs/*`, Design validation UI |
| Portability export/import + replace_lab recovery | Portability Spec; recovery blobs |
| Tradier architecture design (not full member OAuth product) | Architecture/09 |
| Execution responsibility narrative | Architecture/14 |

| Not landed (this program owns) | |
|--------------------------------|--|
| DeploymentInstance / runners / envelope tables | PR1 |
| Decision log runtime SoR | PR1 |
| Arming + attestation | PR2 |
| Deployment Pack | PR3 |
| Member Tradier paper open + O-* dedupe | PR4–5 |
| Live path | PR8 |
| M3 workers + admin fleet | PR10 |

### As-built overlay (2026-08-06 — not a substitute for PR1–PR10)

Multi-member **Curate sim** surface shipped ahead of full Deploy Tradier path. Authority:

| Spec / arch | Content |
|-------------|---------|
| `Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md` | Curate runtime, marks, symbols, correlation, dashboards, Deploy reports |
| `Specs/Strategy-Lab-Process-Runtime-Spec-v1.2.md` | Mode priority amended for multi-member Curate |
| `Architecture/19-strategy-lab-as-built-map.md` | Code + migration map |

| Landed outside original PR table | Path |
|----------------------------------|------|
| Curate instances/positions/decision_log | migration 083 · `strategy_runtime/` |
| Shared live marks + universe + VIX/VIX1D | 084–087 · `market_data/live_*` |
| Comparison, tick-all, platform-tick | routes `strategy_lab_curate.py` |
| Phase dashboards + Deploy reports UI | `PhaseRunDashboard`, `DeployReportsPanel` |
| Correlation calculator + ρ on grid | `market_data/correlation.py` |

**Still pending for full Process Runtime program:** Tradier member OAuth/paper/live, Deployment Pack export, arming attestation production store, scheduled workers, pack-native multi-leg open.

---

## 7. Likely file neighborhood (implementation)

Exact files declared per seed (change control). Expected **neighborhood**:

### Server

```text
server/migrations/NNN_strategy_runtime_*.sql
server/strategy_runtime/          # domain package (new)
server/routes/strategy_runtime.py # or under strategy_lab routes
server/strategy_lab_domain.py     # bind/hooks only — no fat god module
server/brokers/tradier/           # adapter (new or extend)
server/tests/test_strategy_runtime*.py
server/tests/test_tradier_*.py
```

### Web

```text
web/components/strategy-lab/deploy/   # instance, arming, ladder, log, banners
web/components/strategy-lab/StrategyLabApp.tsx  # wire Deploy work area
web/lib/strategyRuntime*.ts
web/app/app/strategy-lab/**           # routes if split
web/app/admin/strategy-runtime/**     # PR10 only
```

### Specs / docs / bench (this program)

```text
Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md
Architecture/09-strategy-lab-tradier.md
Architecture/14-strategy-lab-execution-responsibility.md
Architecture/00-decision-log.md
docs/Strategy-Lab-Process-Runtime-Implementation-Scope-v1.0.md  # this file
docs/Strategy-Lab-Process-Runtime-Full-Agent-Bench-Plan-v1.0.md
agents/p-strategy-runtime/**
```

---

## 8. Acceptance map (program DoD)

### 8.1 Core (Spec §13.1) — all modes

1. No live-path without G-2 evidence — fail loud  
2. Explore historical version does not rebind instance  
3. Restore pack does not silently change running instance  
4. Envelope block prevents open + logs  
5. Dry-run never sends orders  
6. Manual open under instance logs when Labs path used  
7. Deploy place empty-on-unknown  
8. Process metrics from SoR not place  
9. Stale data → fail loud on Labs-assisted path  
10. Family B isolation tests  

### 8.2 Offload-first (Spec §13.2)

11. Export Deployment Pack without Labs-hosted runners  
12. Arming + attestation before live (LEGAL-LIVE for prod store)  
13. Copy states who runs scan vs manage  
14. Broker-held exits paper matrix documented per pack  
15. No marketing claim of Labs strategy uptime/outcomes  
16. M3 behind flag; default M0–M2  

### 8.3 Review fold-ins (v1.1.1)

17. ExitPolicy uses structure-agnostic names only  
18. O-1…O-5 on paper open path (tests: double-submit / timeout retry)  
19. Pause/halt/archive banners about broker working orders  
20. Attestation named in Privacy §2.1; production store only after LEGAL-LIVE  

---

## 9. Risk register (implementation)

| Risk | Mitigation |
|------|------------|
| Double order on timeout | O-1…O-5 before any paper multi-leg |
| Credit-language ExitPolicy in PR5 | Schema forbidlist; Hotel/India review |
| Live before legal | LEGAL-LIVE gate; fail loud |
| Scope creep into M3 | PR10 Coach GO only |
| Drift explore → rebind | V-4/V-5 tests |
| Member thinks pause = flat | §4.1.1 banners + Tango copy |

---

## 10. Sequencing diagram

```text
                    LEGAL-TRACK (external)
                           │
PR0 ──► PR1 ──┬──► PR2 (arming) ──► PR8 (live) ──► PR9 (hooks)
              ├──► PR3 (export) ──► PR7 (user worker)
              ├──► PR6 (dry-run)
              └──► PR4 (paper open) ──► PR5 (broker exits) ──► PR8
                                                                    │
PR10 (M3) ◄── explicit Coach GO only ───────────────────────────────┘

v1 vertical slice = PR1 + PR2 + PR3 + PR4 + PR5 (+ banners/O-*)
                    live optional (PR8) after LEGAL-LIVE
```

---

## 11. Document history

| Date | Note |
|------|------|
| 2026-08-05 | v1.0 — Implementation scope for Process Runtime v1.1.1; external legal GO/NOGO; PR0–PR10; vertical slice |
