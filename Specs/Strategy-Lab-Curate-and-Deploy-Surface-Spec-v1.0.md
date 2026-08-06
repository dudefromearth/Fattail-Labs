# Strategy Lab — Curate & Deploy Surface Spec v1.0  
### Multi-member Curate runtime · shared marks · symbols · correlation · phase dashboards · Deploy reports

**Status:** **SPEC AUTHORITY** (as-built + intended; 2026-08-06)  
**Product:** FatTail Strategy Lab (`/app/strategy-lab`)  
**Decisions:** DL-214–DL-233 · growth DL-218 · positioning DL-217  
**Parents:**  
- [`Strategy-Lab-Process-Runtime-Spec-v1.2.md`](./Strategy-Lab-Process-Runtime-Spec-v1.2.md) (runtime entities)  
- [`Architecture/14-strategy-lab-execution-responsibility.md`](../Architecture/14-strategy-lab-execution-responsibility.md)  
- [`Architecture/09-strategy-lab-tradier.md`](../Architecture/09-strategy-lab-tradier.md)  
- [`Architecture/18-shared-live-marks-stream.md`](../Architecture/18-shared-live-marks-stream.md)  
- [`Architecture/17-strategy-lab-growth-playbook.md`](../Architecture/17-strategy-lab-growth-playbook.md)  
- [`Architecture/16-strategy-lab-vs-option-alpha-positioning.md`](../Architecture/16-strategy-lab-vs-option-alpha-positioning.md)  

**User guide:** [`docs/Strategy-Lab-Curate-Runtime-User-Guide.md`](../docs/Strategy-Lab-Curate-Runtime-User-Guide.md)

**Doctrine:** Multi-member absolute · process over P&L theater · fail loud · Family B isolation · no Tradier streaming for marks · OA-class service type, opposite strategic direction  

**Legal:** Product boundary only; counsel for live Deploy ToS.

---

## 0. Terminology (normative — Coach 2026-08-06)

> Earlier docs used “strategy” for the runnable unit. **Correct member language:**

| Term | Meaning | As-built storage (do not rename DB in v1) |
|------|---------|------------------------------------------|
| **Bot** | The primary product unit — a named, versioned automation the member designs and runs (Curate/Deploy). **Most correct name** for items on the Curate grid. | Row in `strategy_lab_strategies` + runtime row in `strategy_lab_curate_instances` |
| **Strategy** | An **attribute of the bot** — pack / methodology type (e.g. butterfly pack, structure family), not the bot itself | Pack id / `product_key` / pack config on the bot |
| **Position** | An **instance of the bot** in the market (sim or live) — one open or closed structure the bot created | Row in `strategy_lab_curate_positions` |

```text
Bot (name, version, envelope, phase)
  ├── strategy attribute  →  pack / methodology
  ├── runners (scan / manage)
  └── positions[]         →  instances of the bot (open/closed)
```

**UI law:** Prefer **Bot** in Curate/Deploy dashboards, reports, and comparison. Prefer **Position** for open/closed packages. Use **Strategy** only when referring to pack type / methodology attribute.

**API law (v1):** JSON may still emit legacy keys (`strategy_id`, `strategy_name`) for compatibility; **also emit** `bot_id`, `bot_name` as aliases. New fields should use bot/position language.

**Process Runtime Spec “Deployment instance”** maps to **bot runtime** in Curate (`account_mode=curate_sim`). “Strategy card” in Design is the **bot** product record.

---

## 0.1 Intent

### 0.1 Product law

1. **Multi-member is absolute.** Every member has an isolated collection (Family B via `identity_id`).  
2. **Curate exists so many bots run and can be compared** for **promote** and **portfolio inclusion**.  
3. **Design + Curate for everyone** (plan-gated). **Deploy** validates on Coach first, then provisions members (Tradier).  
4. **One shared live marks stream** feeds every collection — not per-member market sockets.  
5. **Curate and Deploy share UI structure:** high-visibility dashboard (grid | table + mini equity charts); Deploy adds Practice-style equity/stats reporting.

### 0.2 Ladder

| Phase | Mode | Money | Orders |
|-------|------|-------|--------|
| **Design** | Bot config · pack (strategy attr) · BT / FW | None | None |
| **Curate** | Labs Process Runtime + **sim broker** | Fake | Sim only (`mark_mid_v1`) |
| **Deploy** | Labs workers + **Tradier** (when provisioned) | Real paper/live | Tradier adapter |

---

## 1. Curate run environment (as-built)

### 1.1 Domain tables (migrations 083+)

| Table | Member language | Purpose |
|-------|-----------------|---------|
| `strategy_lab_strategies` | **Bot** product | Named bot, version, phase, pack attributes |
| `strategy_lab_curate_instances` | **Bot runtime** | Bound run: version, hash, envelope, cash, status |
| `strategy_lab_curate_positions` | **Position** | Instance of the bot (open/closed package) |
| `strategy_lab_curate_orders` | Order intent log | Sim order log (client_order_tag unique per instance) |
| `strategy_lab_decision_log` | Decision log | Append-only process truth |

### 1.2 Instance lifecycle

```text
draft → armed → running
          ↘ paused / halted
```

- **Arm** required before tick.  
- First tick: `armed` → `running`.  
- Tick order: **manage before scan**.

### 1.3 Risk envelope (normative fields)

| Field | Default | Rule |
|-------|---------|------|
| `allocation_usd` | 10000 | Starting fake cash |
| `max_positions_concurrent` | 3 | Hard |
| `max_positions_per_day` | 5 | Hard |
| `max_positions_per_symbol` | 1 | Hard |
| `defined_risk_only` | true | Open risk > 0 |
| `scan_symbol` | SPY | Must be **tradeable** universe symbol |
| `scan_risk_per_open_usd` | 500 | Reserved cash = max_loss |
| `take_profit_frac_of_max_profit` | 0.5 | Manage exit |
| `stop_multiple_of_premium_risked` | 2.0 | Manage exit |

Breach → `open_blocked` + `reason_code` `envelope_*` (fail loud, no silent skip).

### 1.4 Position model (v1 honesty)

v1 opens a **synthetic defined-risk package** (not pack-native multi-leg OCC yet):

- Cash reserves `max_loss_usd` on open; returns `max_loss + realized` on close.  
- Manage walks package mark (pnl fraction); closes on TP / stop / max_loss.  
- Fill model id: **`mark_mid_v1`** (always labeled).  
- **Never** calls Tradier.

### 1.5 API surface (member)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/me/strategy-lab/curate/meta` | Fill model, universe list, stream heartbeat |
| GET/POST | `/api/me/strategy-lab/curate/instances` | List / create |
| GET | `/api/me/strategy-lab/curate/instances/{id}` | Instance + positions + decisions |
| POST | `.../arm` · `.../pause` · `.../tick` | Lifecycle / one tick |
| POST | `/api/me/strategy-lab/curate/tick-all` | All armed/running for member |
| POST | `/api/me/strategy-lab/curate/platform-tick` | **Admin** multi-member worker tick |
| GET | `/api/me/strategy-lab/curate/comparison` | Multi-bot compare + **compact** equity series (**no** live corr — see §1.5.1) |
| GET | `/api/me/strategy-lab/curate/positions-report` | All positions + progress |
| GET | `/api/me/strategy-lab/curate/reports-book` | Practice-style stats book |
| GET | `/api/me/strategy-lab/curate/live-marks` | Shared stream snapshot |
| GET | `/api/me/strategy-lab/curate/vol-reference` | VIX + VIX1D |
| GET | `/api/me/strategy-lab/curate/symbols` | Catalog by type |
| GET | `/api/me/strategy-lab/curate/symbols/{sym}` | Symbol detail |
| GET | `/api/me/strategy-lab/curate/correlation` | Pair ρ calculator (**on-demand**) |
| GET | `/api/me/strategy-lab/curate/correlation/relative` | vs benchmark + pairwise (**on-demand**) |

### 1.5.1 Comparison hot path (performance law — DL-231)

`GET .../comparison` is polled by the Curate board. It **must remain fast and lean**:

| Law | Requirement |
|-----|-------------|
| **No live Massive on comparison** | Do **not** call correlation/HTTP inside comparison. Response may set `correlation.deferred=true`. |
| **Batched SQL** | Position aggregates and equity samples are **O(1) batches**, not 3N per-instance queries. |
| **Last-N equity** | Sparkline points = **last** N `tick_complete` samples (default 24), compact `{equity}` only. |
| **Primary array `bots`** | Full run rows under `bots`. Do **not** dual-serialize the same rows as `strategies` (legacy key may be empty). |
| **Runtime fields** | `run_started_at`, `runtime_seconds`, `runtime_label` (arm resets clock — DL-230). |
| **ρ vs SPY** | On-demand via correlation endpoints / calculator; grid may show `corr_vs_spy` only when cheaply attached later (cache). Default comparison may leave `corr_vs_spy: null`. |

### 1.6 Package layout (server)

```text
server/strategy_runtime/
  curate_domain.py      # CRUD, comparison, reports hooks
  tick.py               # manage→scan; tick_many
  envelope.py
  marks.py              # shared stream first, stub if allowed
  sim_adapter.py        # thin accept pipe
  fill_simulator.py     # mark_mid_v1
  reports_book.py       # Practice-compatible DTO

server/market_data/
  live_marks.py         # universe, marks SoR, vol_reference, catalog
  live_stream.py        # Massive poller CLI
  correlation.py        # Pearson daily returns
  massive_client.py
```

Migrations: `083` Curate runtime · `084–087` marks/universe/VIX · **`088` `run_started_at`** · (see Architecture/04 when mapped).

Instance column **`run_started_at`**: wall clock of last **Arm** (start/restart). Used for dashboard Runtime.

---

## 2. Shared live marks stream

### 2.1 Normative design

| Law | |
|-----|--|
| **S-1** | One enabled **symbol universe** for all members. |
| **S-2** | One **stream process** writes `market_live_marks`; all Curate ticks **read** that table. |
| **S-3** | No per-member Massive/Tradier sockets for underlier marks. |
| **S-4** | Stale policy: `LABS_MARK_STALE_SECONDS` (default 60). |
| **S-5** | Optional fail-loud: `LABS_LIVE_MARKS_REQUIRED=1` disables stub fallback. |
| **S-6** | Index feeds may use **labeled proxy** series (SPX/XSP→SPY, VIX/VIX1D→VIXY) until entitled — never silent. |

### 2.2 Coach universe (enabled)

| Kind | Symbols | Role |
|------|---------|------|
| Indexes | SPX, XSP, VIX, **VIX1D** | VIX/VIX1D = **reference**; SPX/XSP tradeable |
| ETFs | SPY, QQQ, IWM, GLD, TLT, SLV, USO, XLF, UNG | tradeable |
| Stocks | AAPL, AMZN, NVDA, TSLA, GOOGL, META, MSFT | tradeable |

Options cadence: **3–5 expirations/week** class (0DTE where listed).

### 2.3 Vol reference

| Symbol | Meaning |
|--------|---------|
| **VIX** | 30-day IV regime |
| **VIX1D** | Daily / 1-day VIX for 0DTE and daily decisions |

Each mark stores `mid`, `prev_close`, `day_change_pct` when available.

### 2.4 Ops

```bash
cd server && set -a && source ../.env && set +a
export MASSIVE_API_KEY="${MASSIVE_API_KEY:-$POLYGON_API_KEY}"
.venv/bin/python -m market_data.live_stream --interval 5
```

---

## 3. Symbols UI & selection

### 3.0 Suite placement (normative — DL-232)

**Top suite nav:** Design · Curate · Deploy · Archive only.  
**Symbols is not a suite tab.** It is a **Design sub-nav** item (Board | Symbols).

| Phase | Symbol role |
|-------|-------------|
| **Design** | Assign **underlying** (bot attribute) for back test / forward walk — designer picker + Design → Symbols catalog |
| **Curate** | Select **scan_symbol** when creating a sim run (may match Design underlying) |
| **Deploy** | **No** symbol step — only bots that completed Curate |

### 3.1 Curate picker

- Member selects **scan_symbol** when creating a Curate instance.  
- Organized by type: **Indexes · ETFs · Stocks**.  
- Only **tradeable** symbols allowed for scan open (API 422 otherwise).  
- Reference symbols (VIX, VIX1D) appear on Design → Symbols for decisions, not as default scan underliers.

### 3.2 Design designer

- Pack field **`underlying`** uses the shared symbol picker (`CurateSymbolPicker`).  
- Catalog links: **Design → Symbols** (`/app/strategy-lab/symbols`).

### 3.3 Pages

| Route | Content | Chrome |
|-------|---------|--------|
| `/app/strategy-lab/symbols` | Catalog by type + correlation calculator | Suite **Design** + sub-nav **Symbols** |
| `/app/strategy-lab/symbols/{symbol}` | Detail: mark, prev, feed/proxy, usage, related | Same |

---

## 4. Correlation

### 4.1 Method

- **Pearson** coefficient on **daily simple returns**.  
- Source: Massive daily aggregates (`fetch_daily_closes`).  
- Index product symbols resolve to **proxy series tickers** when needed (documented in API response).

### 4.2 On-demand only for board load (DL-231)

**Do not** block `GET .../comparison` on Massive correlation.  
Grid may show **ρ vs SPY** when a future cheap cache attaches values; default comparison leaves ρ empty.  
Members use the **correlation calculator** (or correlation APIs) for interactive ρ.

### 4.3 Calculator

Any two universe symbols → ρ, n returns, date window, series tickers, interpretation.  
UI: **Design → Symbols** + optional Curate dashboard footer (not required for load).

---

## 5. Phase dashboards (Curate & Deploy)

### 5.1 Shared primitive

`PhaseRunDashboard` — high-visibility shell used by **both** phases:

| Control | |
|---------|--|
| View toggle | **Grid** \| **Table** |
| Per run | Status, symbol, **Runtime** (since arm), equity≈, vs alloc, open/risk/uPnL, mini equity chart, ρ vs SPY (if present) |
| Filter / sort | Search, status chips, symbol, outcome (win/lose/flat), opens; multi-key sort; **shown/total** (e.g. `4/22`) + amber **Filter on** |
| Pagination | **Max 12 mounted** runs per page (`PHASE_RUN_PAGE_SIZE`) — browser stability |
| Toolbar | Tick-all (Curate), Refresh |
| Poll | Silent ~30s, pause when tab hidden; no loading flash on silent refresh |

**Performance law:** Runtime live updates must **not** re-render the entire board at 1 Hz (per-cell clocks only). Charts are memoized. See Architecture/20.

### 5.2 Curate dashboard

- Live marks strip + VIX / VIX1D cards  
- Multi-bot rows from `GET .../comparison` (compact `equity_series`)  
- Positions report (expandable)  
- Work area: instance create (**symbol picker**), arm, tick  

### 5.3 Deploy dashboard

- Same run-card shell (Tradier instances when provisioned).  
- **No symbol sub-nav** — curated bots only.  
- **Deploy reports panel** — Practice Reports parity:

| Block | Practice component reused |
|-------|---------------------------|
| Stats table | `StatsTable` |
| Equity curve | `EquityChart` |
| Drawdown | `DrawdownChart` |
| Featured | Avg win/loss, Sharpe, max DD cards |
| Distributions | `BarDist` (outcomes + by strategy) |

### 5.4 Reports book DTO

`GET /api/me/strategy-lab/deploy/reports-book` (and curate twin) returns the **same shape** as Trade Log `reports-book` so `reportsBookFromServer` works.

**Until Tradier Deploy outcomes exist:** book is built from **closed Curate sim packages** with honest `source_note`.
---

## 6. Multi-member & multi-strategy

| Requirement | Implementation |
|-------------|----------------|
| Isolation | All Curate tables keyed by `identity_id` |
| Many strategies per member | N instances; tick-all; comparison |
| Platform clock | Admin `platform-tick` (oldest `last_tick_at` first); scheduled worker later |
| Compare for portfolio | Equity≈, exits, ρ vs SPY, reports book |

---

## 7. Non-goals (this Spec version)

| Out | Later |
|-----|--------|
| Pack-native multi-leg open in Curate | Pack Architecture open path |
| True index mids without entitlement | Massive upgrade or Coach index pipe |
| Per-member private symbol sockets | Optional union into shared universe |
| Tradier multi-member Deploy live | Stage B/C growth playbook |
| Profit leaderboards | Doctrine forbid |

---

## 8. Acceptance criteria (verifiable)

1. Member A cannot read Member B Curate instances/positions/logs.  
2. Two strategies: create, arm, tick-all → comparison shows both + equity series.  
3. Symbol picker groups by Indexes/ETFs/Stocks; VIX not selectable for scan open.  
4. Live stream updates `market_live_marks`; ticks use shared marks when present.  
5. Correlation API returns ρ ∈ [−1,1] for SPY/QQQ (with Massive).  
6. Correlation calculator returns ρ ∈ [−1,1] for SPY/QQQ (with Massive); comparison load does **not** require Massive.  
7. Deploy reports page renders Practice-style equity/stats without console error.  
8. Tests: `test_strategy_lab_curate.py`, `test_live_marks_stream.py`, `test_correlation.py`.  
9. Comparison @ multi-bot: batched SQL; no dual full `strategies` payload; runtime fields present.  
10. Board: filter shows **N/M**; at most **12** run cards/rows mounted per page.  
11. Suite nav is Design · Curate · Deploy · Archive; Symbols under Design only.  
12. **Perf guards green:** `tests/test_strategy_lab_curate_perf_guards.py` (no live corr on comparison, SQL ≤12, payload lean, wall &lt; 2s for N=8).

---

## 9. Document control

| Ver | Date | Note |
|-----|------|------|
| **1.0** | **2026-08-06** | As-built Curate runtime, shared stream, symbols, correlation, phase dashboards, Deploy reports |
| 1.0.1 | 2026-08-06 | Terminology: **Bot** primary unit; **Strategy** = attribute; **Position** = instance of bot |
| **1.0.2** | **2026-08-06** | Comparison hot path (no live corr); board pagination/filter/runtime; suite nav Design/Curate/Deploy/Archive; Symbols under Design (DL-230–233) |
