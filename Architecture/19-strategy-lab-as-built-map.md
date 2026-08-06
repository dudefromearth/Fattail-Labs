# Strategy Lab — As-built map (2026-08-06)

**Status:** Architecture index for implemented Curate/Deploy surfaces  
**Authority:** Specs below · Decision log DL-185–DL-229  

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
| [`Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md`](../Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md) | **Curate runtime, marks, symbols, correlation, dashboards, Deploy reports** |
| [`Specs/Strategy-Lab-Process-Runtime-Spec-v1.2.md`](../Specs/Strategy-Lab-Process-Runtime-Spec-v1.2.md) | Runtime modes amended for multi-member Curate |
| [`Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md`](../Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md) | Base entities (instance, envelope, decision log) still largely valid |
| Pack / Development / Continuity / Versioning Specs | Unchanged parents |

---

## Architecture docs

| Doc | Role |
|-----|------|
| [09-strategy-lab-tradier.md](./09-strategy-lab-tradier.md) | Massive data · Tradier orders |
| [14-strategy-lab-execution-responsibility.md](./14-strategy-lab-execution-responsibility.md) | OA-class host + user/broker custody |
| [16-strategy-lab-vs-option-alpha-positioning.md](./16-strategy-lab-vs-option-alpha-positioning.md) | Same service type, opposite doctrine |
| [17-strategy-lab-growth-playbook.md](./17-strategy-lab-growth-playbook.md) | Design+Curate all → Deploy Coach → provision |
| [18-shared-live-marks-stream.md](./18-shared-live-marks-stream.md) | Universe, stream, VIX/VIX1D, proxies |
| [19-strategy-lab-as-built-map.md](./19-strategy-lab-as-built-map.md) | This file |

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
| Curate domain + tick | `server/strategy_runtime/` |
| Shared marks + stream | `server/market_data/live_marks.py`, `live_stream.py` |
| Correlation | `server/market_data/correlation.py` |
| Reports book | `server/strategy_runtime/reports_book.py` |
| API | `server/routes/strategy_lab_curate.py` (+ strategy_lab.py for cards) |
| Phase dashboards | `web/components/strategy-lab/PhaseRunDashboard.tsx`, `CuratePhaseDashboard.tsx`, `DeployPhaseDashboard.tsx` |
| Deploy reports UI | `web/components/strategy-lab/DeployReportsPanel.tsx` (reuses Practice `components/reports/*`) |
| Symbols | `web/app/app/strategy-lab/symbols/` |
| Mini equity | `web/components/strategy-lab/MiniEquityChart.tsx` |

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

---

## Member routes (UI)

| Route | Phase |
|-------|--------|
| `/app/strategy-lab?phase=development` | Design |
| `/app/strategy-lab?phase=curation` | **Curate dashboard** + work area |
| `/app/strategy-lab?phase=deployment` | **Deploy dashboard + reports** |
| `/app/strategy-lab/symbols` | Universe + correlation calculator |
| `/app/strategy-lab/symbols/[symbol]` | Symbol info |
| `/app/strategy-lab/archive` | Archive |

---

## What is live vs pending

| Demo seed | `server/seed_curate_demo.py` — ≥3 Curate strategies + ticks |

| Live | Pending |
|------|---------|
| Multi-member Curate sim | Scheduled platform worker (API ready) |
| Shared Massive marks stream | True index feeds without proxy |
| Symbol picker + info pages | Pack-native multi-leg Curate open |
| Comparison + ρ vs SPY | Tradier multi-member Deploy |
| Deploy Practice-style reports (Curate data) | Deploy rows filled from Tradier |
| Correlation calculator | — |

---

## Document control

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-08-06 | As-built map after Curate/Deploy surface ship |
