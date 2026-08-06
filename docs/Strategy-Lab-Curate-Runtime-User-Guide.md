# Strategy Lab — Curate Run Environment  
### User guide (v1)

**Audience:** Members using **Curate** to prove a process with fake money  
**Status:** Shipped v1 (DL-219) · terminology v1.0.1 (Bot / Strategy / Position)  
**Not this guide:** Design pack designer, Deploy/Tradier live, journal/habits  

### Terminology (read this first)

| Term | Meaning |
|------|---------|
| **Bot** | The thing you design and run (dashboard cards). Correct name for “items running in Curate.” |
| **Strategy** | An **attribute of the bot** — pack / methodology type (e.g. butterfly), not the bot itself |
| **Position** | An **instance of the bot** — one open or closed package the bot created |

---

## 1. What Curate is (and is not)

| Curate **is** | Curate is **not** |
|---------------|-------------------|
| A **run environment** for process automation | Your broker account |
| **Fake money** + **simulated broker** | Tradier paper or live |
| **Real-market-shaped** marks (v1 = labeled stubs) | Live Massive feed yet (same interface later) |
| Scan + manage loops with a **decision log** | Guaranteed P&L or edge proof |
| Safe multi-member practice | Deploy (orders to Tradier) |

**Doctrine:** process over profit theater. Curate answers: *Does my envelope + open/close logic behave honestly under a clock?* — not *How much would I have made?*

**Fill model id:** `mark_mid_v1` (always labeled in API and UI).

---

## 2. How to use it (UI)

### 2.1 Prerequisites

1. Sign in to FatTail Labs.  
2. Open **Apps → Strategy Lab**.  
3. Have a strategy card (or create one).  
4. Move/promote it into the **Curate** bin (phase `curation`).  
   - Design path: Back test → Forward walk → **Deployed** (settings ready) → **→ Curate**.

### 2.1a Multi-strategy demo seed (≥3 running)

To populate the Curate dashboard with **three** armed/running books (SPY, QQQ, IWM):

```bash
cd server && set -a && source ../.env && set +a
.venv/bin/python seed_curate_demo.py --email you@example.com --replace --ticks 5
```

Then open **Strategy Lab → Curate** (signed in as that email). You should see ≥3 cards in the grid with equity paths. Use **Tick all** to advance them together.

### 2.2 Open the run panel

1. Select the strategy in the **Curate** column.  
2. In the work area, find **Curate run environment**.  
3. Set:
   - **Allocation $** — fake capital for this instance (default path uses your inputs).  
   - **Risk / open $** — defined risk reserved per new sim position.  
4. Click **New instance**.

### 2.3 Arm and tick

| Control | Meaning |
|---------|---------|
| **Arm** | Instance may run ticks (`draft`/`paused`/`halted` → `armed`) |
| **Run tick** | One full cycle: **manage first**, then **scan** |
| **Pause** | Stop further ticks until re-armed |

First successful tick promotes `armed` → `running`.

### 2.4 What you should look at

| Surface | Meaning |
|---------|---------|
| **Status** | `draft` → `armed` → `running` (or `paused`) |
| **Cash** | Fake cash remaining after risk reserved for opens |
| **Realized** | Closed-position P&L (fake dollars) |
| **Open positions** | Sim packages still open |
| **Decision log** | Ordered record of every gate, open, mark update, close |

---

## 3. Under the covers — architecture

```text
  You click "Run tick"
           │
           ▼
  ┌────────────────────────────┐
  │  Process tick (manage→scan)│
  └────────────┬───────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
  Manage loop         Scan loop
  (open positions)    (new risk?)
     │                   │
     │                   ├─ envelope checks
     │                   ├─ get_mark(symbol)
     │                   ├─ SimulatedAdapter.accept
     │                   └─ fill_sim open → position
     │
     ├─ walk package mark (pnl fraction)
     ├─ TP / stop / max_loss?
     └─ if yes: sim close → cash + realized
```

| Component | Role |
|-----------|------|
| **Curate instance** | One bound run of one strategy version + envelope + fake ledger |
| **Risk envelope** | Hard caps (concurrent, per day, per symbol, cash, allocation) |
| **SimulatedAdapter** | Thin pipe: accept/reject only — **no fills** |
| **fill_simulator** | After accept: invent fill at model `mark_mid_v1` |
| **Marks provider** | Symbol mid (v1 stub map or override) — **not Tradier** |
| **Decision log** | Append-only process truth |

**Never called:** Tradier API. Deploy is a separate rail.

---

## 4. Under the covers — the “position” object

A Curate **position** is **not** a multi-leg OCC order at a broker.  
v1 opens a **synthetic defined-risk package** so the **runtime, envelope, and exits** can be exercised before pack-native structures are wired.

### 4.1 Fields (what each means)

| Field | Meaning in v1 |
|-------|----------------|
| `symbol` | Underlier tag for scan (default **SPX**) |
| `side` | `long` — treat as debit-style package |
| `entry_price` | **Package price units** at open (not a stock share price). Set to `0.35 × risk_per_open` |
| `max_loss_usd` | Defined risk = **risk / open $** (reserved from cash) |
| `max_profit_usd` | Cap for TP math = `0.45 × risk_per_open` (sim ratio, not a real butterfly quote) |
| `mark_price` | Current **package mark** (same units as `entry_price`) |
| `unrealized_pnl_usd` | Mark-implied open P&L in fake dollars |
| `qty` | Always `1` package in v1 |
| `structure_json` | Metadata: `family: curate_sim_defined_risk`, underlying mid, mark source label |
| `client_order_tag` | Idempotency tag for the open intent |
| `status` | `open` \| `closed` |
| `close_reason` | `take_profit` \| `stop` \| `max_loss` (when closed) |

### 4.2 Cash accounting (fake money ledger)

On **open** (after sim accept + fill):

1. Envelope must allow open (see §5).  
2. **Cash decreases by `max_loss_usd`** (capital reserved for defined risk).  
3. Position stored with `mark_price = entry_price`, `unrealized = 0`.

On **close**:

1. `realized_pnl = unrealized_pnl` at close mark.  
2. **Cash increases by `max_loss_usd + realized_pnl`**  
   - Returns reserved risk, then applies P&L.  
3. Full loss (`realized = −max_loss`): cash change net `−max_loss` from pre-open.  
4. Full profit at max: cash gains `+max_profit` net of reservation release.

**Example** (allocation 5000, risk/open 400):

| Step | Cash | Notes |
|------|------|--------|
| Create instance | 5000 | `cash = allocation` |
| Open one package | 4600 | reserve 400 |
| Close at +100 uPnL | 5100 | +400 reserve back +100 pnl |
| Close at −400 (max loss) | 4600 | +400 −400 = flat vs post-open; net −400 from start |

### 4.3 How mark and unrealized move each tick (manage)

Each tick, **before scan**, every **open** position is re-marked:

1. Recover a **P&L fraction** `f ∈ [−1, +1]` from current unrealized:
   - `f ≥ 0` → fraction of `max_profit`  
   - `f < 0` → fraction of `max_loss`  
2. Add **step** (default `mark_step_frac = +0.15` per tick) → new `f` clamped to [−1, 1].  
3. Map to package mark:

```text
if f ≥ 0:  unrealized = f × max_profit
if f < 0:  unrealized = f × max_loss   (f negative → loss)
mark_price = entry_price + unrealized
```

So **default behavior walks marks toward max profit** each tick (positive step). That is **sim dynamics for process testing**, not a claim about SPX path.

**API override (advanced):** tick body may send:

- `mark_step_frac` — change walk speed/direction  
- `force_pnl_frac` — set absolute fraction (−1..1) for this tick (used in tests / demos)  
- `mark_overrides` — override underlier mid for scan provenance (e.g. `{"SPX": 5250}`)

### 4.4 When manage closes a position

After re-mark, close if **any** of:

| Rule | Condition | `close_reason` |
|------|-----------|----------------|
| Take profit | `unrealized ≥ take_profit_frac × max_profit` | `take_profit` |
| Stop | `unrealized ≤ −stop_multiple × premium_risked` (`premium_risked ≈ |entry_price|`) | `stop` |
| Max loss | `unrealized ≤ −max_loss` | `max_loss` |

Defaults (envelope):

- `take_profit_frac_of_max_profit` = **0.5**  
- `stop_multiple_of_premium_risked` = **2.0**

Close path:

1. `SimulatedAdapter.submit_order(close)` → accept  
2. `fill_close` at current `mark_price`  
3. Update cash/realized; position `closed`  
4. Decision log: `position_closed`

### 4.5 How scan opens a position

After manage, **scan** may open **one** new package if envelope allows:

1. Load mark for `scan_symbol` (default SPX).  
   - **Fail loud** if symbol has no stub mark (e.g. `NOTASYMBOL` → 422).  
2. Build synthetic structure:
   - `max_loss = scan_risk_per_open_usd`  
   - `max_profit = 0.45 × risk`  
   - `entry_price = 0.35 × risk`  
3. Envelope check (§5).  
4. Sim accept → fill open → reserve cash → log `position_opened`.

If blocked: log `open_blocked` with `reason_code` (no silent skip).

### 4.6 What “structure” is **not** yet

v1 does **not**:

- Price a real butterfly from chain  
- Store OCC legs  
- Use bid/ask touch for multi-leg  
- Correlate pack designer settings into the open (beyond strategy bind version/hash)

Those land when **pack-native open** is wired. The position is still the right **runtime object** for that future work.

---

## 5. Risk envelope (gates before any open)

| Field | Default (v1) | Effect |
|-------|--------------|--------|
| `allocation_usd` | 10000 | Starting cash; max capital framing |
| `max_positions_concurrent` | 3 | Cap open packages |
| `max_positions_per_day` | 5 | Cap new opens by calendar day |
| `max_positions_per_symbol` | 1 | One open package per symbol |
| `defined_risk_only` | true | Reject non-positive risk |
| `scan_symbol` | SPX | Underlier for scan |
| `scan_risk_per_open_usd` | 500 | Risk reserved per open |
| `take_profit_frac_of_max_profit` | 0.5 | Manage TP |
| `stop_multiple_of_premium_risked` | 2.0 | Manage stop |

**Block reason codes** (decision log):

- `envelope_max_positions_concurrent`  
- `envelope_max_positions_per_day`  
- `envelope_max_positions_per_symbol`  
- `envelope_insufficient_cash`  
- `envelope_allocation`  
- `envelope_defined_risk_only`  

---

## 6. Instance lifecycle

```text
 draft ──arm──► armed ──first tick──► running
   ▲               │                    │
   │             pause                pause
   │               ▼                    ▼
   └────────── paused / halted ◄────────┘
```

| Status | Can tick? |
|--------|-----------|
| `draft` | No |
| `armed` | Yes (becomes `running`) |
| `running` | Yes |
| `paused` / `halted` | No until arm again |
| `archived` | No |

**Bind at create:**

- `bound_version` = strategy semver at create  
- `pack_config_hash` = hash of version + spec + attributes (drift detection later)  

---

## 7. Decision log (process truth)

Every material event is appended (newest first in UI).

| `event_type` | When |
|--------------|------|
| `instance_created` | New Curate instance |
| `status_change` | Arm / pause / first tick → running |
| `mark_update` | Manage re-marked open position (no close) |
| `position_opened` | Scan opened sim package |
| `position_closed` | Manage closed (with `reason_code`) |
| `open_blocked` | Envelope refused scan open |
| `open_rejected` / `close_rejected` | Sim adapter reject |
| `mark_error` | Missing mark for symbol |
| `tick_complete` | End of tick; payload includes event summary + cash |

Use the log for **replay of process**, not for marketing returns.

---

## 8. Marks (underlier mid) — shared live stream

**One stream for every member.** Strategies do not open private Massive sockets.

| Source | When |
|--------|------|
| **Shared live stream** | `market_live_marks` filled by `python -m market_data.live_stream` from Massive |
| **Universe** | `market_symbol_universe` (default SPY, QQQ, IWM + Mag 7) |
| **Override** | Tick `mark_overrides` (tests) |
| **Stub** | Only if live mark missing **and** `LABS_LIVE_MARKS_REQUIRED` is off |
| **Missing/stale** | Fail loud when required |

UI: Curate phase → **Shared live marks stream** strip (auto-refresh 10s).

Ops: see `Architecture/18-shared-live-marks-stream.md`.

**Important:** Package mark walk (§4.3) for sim uPnL is still separate from underlier mid in v1; underlier mid is **shared provenance** for opens and future pack pricing.

---

## 8b. Multi-member + multi-strategy comparison (core purpose)

**Product law:** Multi-member is required. Curate exists so **many strategies run**
and can be **compared** for **promote** and **portfolio inclusion**.

| Capability | How |
|------------|-----|
| Many members | Every API is **identity-scoped** (Family B); no cross-tenant data |
| Many strategies per member | One Curate instance per strategy (or more); run in parallel |
| Compare | **Strategy comparison** table (equity≈, vs alloc, open risk, TP/stop shares) |
| Advance all clocks | **Tick all armed/running** (member) |
| Platform worker | `POST .../curate/platform-tick` (administrator) — all members’ tickable instances |

### UI

Curate phase → **Strategy comparison** (above positions report) → **Tick all armed/running**.

### API

| Method | Path | Who |
|--------|------|-----|
| GET | `comparison` | Member — their strategy runs |
| POST | `tick-all` | Member — all their armed/running |
| POST | `platform-tick` | Admin — multi-member batch |

---

## 9. Positions report (all packages + progress)

### 9.1 In the UI

On Strategy Lab → **Curate** phase (top of the board):

**Positions report** lists every Curate sim package across **all** your instances:

- Open vs closed filter  
- Strategy name, bound version, symbol  
- Risk (max loss), unrealized or realized P&L  
- **Progress** bar: −1 (max loss) … 0 (flat) … +1 (max profit)  
- Approximate % of path toward default take-profit (50% of max profit)  
- Instance id + instance status  
- Opened time  

**This is not Tradier Deploy.** Only sim packages from Curate.

### 9.2 API

```http
GET /api/me/strategy-lab/curate/positions-report?status=all|open|closed&strategy_id=&limit=200
```

**Summary fields:** `open_count`, `closed_count`, `open_risk_usd`, `open_unrealized_pnl_usd`, `closed_realized_pnl_usd`.

**Per position:** base position fields + `strategy_name`, `instance_id`, `progress_frac`, `progress_to_tp_pct`, `not_tradier: true`.

---

## 10. API reference (member)

Base: `/api/me/strategy-lab/curate/` (session required)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `meta` | Fill model label, broker=sim |
| GET | `positions-report` | All positions + progress (see §9) |
| GET | `instances?strategy_id=` | List |
| POST | `instances` | Create `{ strategy_id, envelope? }` |
| GET | `instances/{id}` | Instance + positions + recent decisions |
| POST | `instances/{id}/arm` | Arm |
| POST | `instances/{id}/pause` | Pause |
| POST | `instances/{id}/tick` | One tick; optional mark controls |
| GET | `instances/{id}/decisions` | Decision log |

---

## 11. Visualization: charts and graphs

### 11.1 What exists **today**

| Visualization | Status |
|---------------|--------|
| Position list (cash, uPnL, mark) | **Yes** — Curate panel |
| **Positions report** (all instances + progress bar) | **Yes** — Curate phase |
| Decision log timeline (text) | **Yes** |
| Equity / cash curve chart | **Not yet** |
| Underlier price chart | **Not yet** |
| Options risk graph (tent / payoff) | **Not yet** (Design pack has designer; Curate sim is package-level) |
| Payoff at expiry vs spot | **Not yet** (no real legs) |

So: **process is visible as numbers + log; not yet as a chart.**

### 11.2 What **can** be visualized (data already supports it)

These charts are **feasible without Tradier**, from Curate tables + decision log:

| Chart | Data source | Use |
|-------|-------------|-----|
| **Cash / equity over ticks** | Instance cash after each `tick_complete` + realized | Process capital path |
| **Open risk over time** | Sum `max_loss` of open positions per tick | Envelope discipline |
| **uPnL path per position** | `mark_update` + close events | See walk to TP/stop |
| **Event timeline** | decision_log by `created_at` | Open / block / close markers |
| **Open count vs caps** | Concurrent opens vs envelope | Capacity teaching |

### 11.3 What needs **more** data before it’s honest

| Chart | Needs |
|-------|--------|
| Real multi-leg **risk graph** | Pack-native legs + chain/marks (Massive) |
| Live underlier path | Massive (or Coach) time series, not stub constant mid |
| Slippage / fill quality | Richer fill model than package mid |

### 11.4 Recommendation (product)

**Phase 1 (honest now):** equity + open-risk line charts from decision log / tick snapshots.  
**Phase 2:** per-position uPnL strip.  
**Phase 3:** when pack-native opens exist — classic payoff diagram at open + live mark on structure.

Until then, treat the **decision log + position table** as the primary visualization of process integrity.

---

## 12. Honest limitations (read this)

1. **Not a broker.** No custody, no real fills, no margin call.  
2. **Synthetic opens** — not your butterfly pack legs yet.  
3. **Stub marks** — not live options chain.  
4. **Default mark walk is optimistic** (+0.15 toward max profit per tick) — for exercising TP/manage, not forecasting.  
5. **Member-triggered ticks** — no 24/7 scheduled worker in v1 (button = clock).  
6. **Deploy is separate** — Curate success does not send Tradier orders.  
7. **No profit claims** — process outcomes only.

---

## 13. Quick troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Tick 422 “cannot tick… draft” | Arm first |
| Tick 422 “no mark for …” | Unknown `scan_symbol` — use SPX/SPY/QQQ/IWM or override |
| No second open | Envelope concurrent / day / symbol / cash |
| Closes immediately | TP/stop/max_loss with forced mark or large step |
| Empty panel | Strategy not in Curate phase / none selected |
| Expected Tradier | Wrong phase — that’s Deploy, not Curate |

---

## 14. Related docs

| Doc | Role |
|-----|------|
| `Architecture/17-strategy-lab-growth-playbook.md` | Design+Curate for all → Deploy Coach → members |
| `Architecture/16-strategy-lab-vs-option-alpha-positioning.md` | Opposite strategic direction |
| `docs/Strategy-Lab-MSC-Broker-Adapter-Assessment-2026-08-06.md` | Two-layer brokerage (sim + management) |
| Process Runtime Spec v1.1 | Instance / envelope / decision log language |

---

## 15. Document control

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-08-06 | Curate run environment user guide; position internals; chart feasibility |
| 1.1 | 2026-08-06 | Positions report API + UI |
| 1.2 | 2026-08-06 | Spec authority: Curate-and-Deploy-Surface-Spec-v1.0; Process Runtime v1.2 |

**Spec authority:** [`Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md`](../Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md)
