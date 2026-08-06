# Strategy Lab — As-built map (2026-08-06)

**Status:** Architecture index for implemented Curate/Deploy surfaces  
**Authority:** Specs below · Decision log DL-185–DL-233  

### Terminology (member language)

| Term | Meaning | DB (v1 keeps legacy names) |
|------|---------|----------------------------|
| **Bot** | Runnable product unit | `strategy_lab_strategies` + curate instance |
| **Strategy** | Attribute of bot (pack/methodology) | pack / product_key |
| **Position** | Instance of bot (open/closed) | `strategy_lab_curate_positions` |

---

## Specs (read in this order)

| Spec | Role |
|------|------|
| [`Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md`](../Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md) | **Curate runtime, marks, symbols, correlation, dashboards, Deploy reports** (v1.0.2 board perf + nav) |
| [`Specs/Strategy-Lab-Process-Runtime-Spec-v1.2.md`](../Specs/Strategy-Lab-Process-Runtime-Spec-v1.2.md) | Runtime modes amended for multi-member Curate |
| [`Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md`](../Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md) | Base entities (instance, envelope, decision log) still largely valid |
| [`Specs/Strategy-Lab-Navigation-Continuity-Spec-v1.0.md`](../Specs/Strategy-Lab-Navigation-Continuity-Spec-v1.0.md) | Suite Design·Curate·Deploy·Archive + place memory |
| Pack / Development / Versioning Specs | Unchanged parents |

---

## Architecture docs

| Doc | Role |
|-----|------|
| [09-strategy-lab-tradier.md](./09-strategy-lab-tradier.md) | Massive data · Tradier orders |
| [14-strategy-lab-execution-responsibility.md](./14-strategy-lab-execution-responsibility.md) | OA-class host + user/broker custody |
| [16-strategy-lab-vs-option-alpha-positioning.md](./16-strategy-lab-vs-option-alpha-positioning.md) | Same service type, opposite doctrine |
| [17-strategy-lab-growth-playbook.md](./17-strategy-lab-growth-playbook.md) | Design+Curate all → Deploy Coach → provision |
| [18-shared-live-marks-stream.md](./18-shared-live-marks-stream.md) | Universe, stream, VIX/VIX1D, proxies, on-demand correlation |
| [19-strategy-lab-as-built-map.md](./19-strategy-lab-as-built-map.md) | This file |
| [20-strategy-lab-curate-board-performance.md](./20-strategy-lab-curate-board-performance.md) | **Multi-bot board performance contract + audit** |

**Assessments / guides**

| Doc | Role |
|-----|------|
| `docs/Strategy-Lab-MSC-Broker-Adapter-Assessment-2026-08-06.md` | Two-layer brokerage (thin adapter + order management) |
| `docs/Strategy-Lab-Curate-Runtime-User-Guide.md` | Member operator guide |
| `docs/Strategy-Lab-Execution-Architecture-Review-2026-08-05.md` | Earlier execution review |

---

## Code map

| Area | Path |
|------|------|
| Curate domain + tick | `server/strategy_runtime/` (`comparison_report` batched, no live corr) |
| Shared marks + stream | `server/market_data/live_marks.py`, `live_stream.py` |
| Correlation (on-demand) | `server/market_data/correlation.py` |
| Reports book | `server/strategy_runtime/reports_book.py` |
| API | `server/routes/strategy_lab_curate.py` (+ strategy_lab.py for cards) |
| Suite nav | `web/lib/strategyLabSuite.ts` — Design · Curate · Deploy · Archive |
| Design sub-nav | `web/components/strategy-lab/StrategyLabDesignSubNav.tsx` (Board \| Symbols) |
| Phase dashboards | `PhaseRunDashboard.tsx` (paginate/filter/runtime), `CuratePhaseDashboard.tsx`, `DeployPhaseDashboard.tsx` |
| Deploy reports UI | `web/components/strategy-lab/DeployReportsPanel.tsx` (reuses Practice `components/reports/*`) |
| Symbols (under Design) | `web/app/app/strategy-lab/symbols/` |
| Mini equity | `web/components/strategy-lab/MiniEquityChart.tsx` (memoized) |
| Exercise seed | `server/seed_curate_demo.py` (diverse outcome cases) |

---

## Migrations (Strategy Lab data plane)

| # | Purpose |
|---|---------|
| 078–079 | Strategy cards / recovery |
| **083** | Curate instances, positions, orders, decision_log |
| **084** | Live marks + universe + heartbeat |
| **085** | Coach symbol universe (indexes/ETFs/stocks) |
| **086** | VIX → VIXY proxy |
| **087** | VIX1D Daily VIX + prev_close columns + roles |
| **088** | `run_started_at` on curate instances (runtime since arm) |

---

## Member routes (UI)

| Route | Phase / chrome |
|-------|----------------|
| `/app/strategy-lab?phase=development` | **Design** board (+ Design sub-nav Board) |
| `/app/strategy-lab/symbols` | **Design → Symbols** catalog (not a suite tab) |
| `/app/strategy-lab/symbols/[symbol]` | Symbol detail (Design chrome) |
| `/app/strategy-lab?phase=curation` | **Curate** dashboard + work area |
| `/app/strategy-lab?phase=deployment` | **Deploy** dashboard + reports |
| `/app/strategy-lab/archive` | Archive |

---

## What is live vs pending

| Live | Pending |
|------|---------|
| Multi-member Curate sim | Scheduled platform worker (API ready) |
| Shared Massive marks stream | True index feeds without proxy |
| Symbol assign in Design + Curate picker | Pack-native multi-leg Curate open |
| Comparison (fast hot path) + on-demand ρ | Cached ρ on grid without Massive per poll |
| Board: filter/sort, runtime, page size 12 | Optional virtualization if needed |
| Deploy Practice-style reports (Curate data) | Tradier multi-member Deploy rows |
| Exercise seed case matrix | — |

**Demo seed:** `server/seed_curate_demo.py` — diverse win/lose/status/envelope cases for UI exercise.

---

## Document control

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-08-06 | As-built map after Curate/Deploy surface ship |
| **1.1** | **2026-08-06** | Board performance (Arch 20), suite nav, migration 088, DL-230–233 |
