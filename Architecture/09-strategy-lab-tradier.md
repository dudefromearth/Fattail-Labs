# Strategy Lab — market data, tests, Tradier deploy

**Status:** Locked Coach direction (DL-185, DL-186, 2026-08-01; **DL-214** execution offload 2026-08-05)  
**App:** Strategy Lab · `/app/strategy-lab` · slug `strategy-lab`  
**First broker target:** **Tradier** (only near-term execution venue)

**Execution responsibility:** User + broker own **running**; Labs owns **design/proof/handoff**.  
See `Architecture/14-strategy-lab-execution-responsibility.md`. Prefer broker-held exits (OCO/OTO/OTOCO where supported) over Labs-hosted manage loops.

## Provider split (cost-aware)

| Layer | Provider | Notes |
|-------|----------|--------|
| **Market data** (Build signals, Test, live marks) | **Massive** | Coach already pays; WebSocket + history REST/flat files |
| **Execution** (paper → live orders, fills) | **Tradier** | **First target**; Deploy / handoff — **do not** buy Tradier ~$400/mo streaming |
| **SPX option surface** | **Chain snapshots we collect** | No deep historical archive today; **build forward** |

```
Build Spec → Test (historical | live) → Handoff / user-or-broker run
  Massive (+ chain archive) in · Tradier orders out
```

## Test modes (both required)

Strategy Lab **Test** is not one thing. Both modes are first-class:

### 1. Historical tests

| | |
|--|--|
| **What** | Replay a **frozen** dataset offline: underlier bars/trades + option chain snaps over a date range |
| **Data** | Massive history (stocks/ETFs/futures) + **stored SPX (and later other) chain snapshots** |
| **Goal** | Fair-ish Test with costs, freeze params, kill/keep — no orders |
| **Honesty** | Document coverage: “N weeks of SPX snaps, M underlier days.” No pretence of multi-year OPRA |

### 2. Live tests

| | |
|--|--|
| **What** | Bot runs against **live Massive** stream (and latest chain snap or live underlier) **without** (or with tiny) capital |
| **Orders** | Optional: Tradier **paper/virtual only** during live test; or signal-only (no orders) |
| **Goal** | Path continuity, latency, staleness, adherence — “does the path continue on live tape?” |
| **Gate** | Stale Massive data → **fail loud**, no order |

Historical ≠ live. A strategy can pass history and fail live (and vice versa). Both gates matter before **Deploy live**.

## SPX market data — Coach production feeds (primary)

Coach already receives (upstream of Labs):

| Feed | Cadence | Content | Use in Strategy Lab |
|------|---------|---------|---------------------|
| **Full chain** | **As fast as vendor delivers (~5–10 s)** | Chain + Greeks (snapshot style) | Historical archive + structure marks |
| **SPX underlier diffs** | **~4 Hz** | Differential price updates | Live Test / bot clock / underlier path |

**Implication:** Labs does **not** need to out-poll that for SPX. Prefer **ingest + local store** of the feeds Coach already has. Do not pay twice (Massive/Tradier stream) for the same SPX surface.

| Mode | Storage / path |
|------|----------------|
| **Historical Test** | **Local only** — replay archived chain snaps (+ underlier ticks/diffs). Past at 5–10s cannot be rebuilt cheaply on demand. |
| **Live Test** | Live **4 Hz SPX diffs** + **latest chain snap** (5–10s) |
| **Multi-year vendor chain** | **Out of scope** (prohibitively expensive) |

### Local archive (Labs)

`server/market_data/chain_store.py` — append-only local files for historical Test:

```text
{LABS_CHAIN_STORE_ROOT|data/market/chains}/{underlier}/YYYY-MM-DD/snapshots.jsonl.gz
```

**Ingest path (Coach — preferred):** **Pipe / tee a copy** of what already lands on the
FatTail app every trading day (chain @ ~5–10s + SPX diffs @ ~4 Hz). Store that copy
append-only for historical Test. No second market subscription.

```
FatTail app feed  ──┬──►  production consumers (unchanged)
                    └──►  archive pipe  ──►  local ChainStore / underlier log
```

| Rule | |
|------|--|
| **Source of truth for history** | The archive copy, not a later API pull |
| **When** | Every **trading day** the feed runs (RTH + whatever the app already takes) |
| **Format** | Prefer raw-as-delivered + `received_at` UTC; normalize later for Test |
| **Labs wire** | Drop files, queue, or HTTP into `ChainStore` / underlier log (adapter TBD) |

**Fallback / secondary (Massive poll):** `server/market_data/chain_collector.py` only if we need a Labs-owned poller for other underliers or backup:

```bash
.venv/bin/python -m market_data.chain_collector --once
.venv/bin/python -m market_data.chain_collector --interval 5
```

| Item | Notes |
|------|--------|
| **Primary SPX cadence** | Whatever the feed delivers (~5–10s chain; ~4 Hz underlier diffs) — do not invent a tighter chain poll |
| **Underlier diffs** | Store separately (tick/diff log) for live replay alignment — schema TBD |
| **Store root** | `LABS_CHAIN_STORE_ROOT` or `<repo>/data/market/chains/` (gitignored) |

After ~2–4 weeks of **local** archive, historical option structure tests are real. Until then: underlier-only history + live 4 Hz + latest chain still ship.

## Symbol universe and history strategy

| Class | Example | Live | Historical |
|-------|---------|------|------------|
| **SPX option chain** | full surface + Greeks | Tee from FatTail app feed (~5–10s) | **Forward archive only** (no multi-year buy) |
| **SPX underlier** | SPX / ES mark | Diffs ~4 Hz from app feed | From tee + optional Massive bars |
| **Mag 7 / ETFs / few futures** | AAPL…, SPY, QQQ, ES, NQ | Massive WS allowlist | **Bulk download ~1 year** underlier history (Massive REST/flat files) — affordable |

**Coach direction:** Tee SPX chain/diffs daily; for **other supported symbols**, pull **~one year** of underlier history once (and refresh incrementally). Do **not** buy multi-year full option chains for Mag 7.

Config-driven allowlist; fail loud if required symbol missing from plan.

## Stages (member language)

**Build → Test (historical + live) → Run bots → live and paper (Tradier deploy)**

1. **Build** — Spec + Risk Shell  
2. **Test — historical** — replay stored window (Massive + chain archive)  
3. **Test — live** — Massive stream; paper Tradier optional  
4. **Run bots / Deploy** — Massive signals → Tradier paper then live  

## Non-goals (v1)

- Paying Tradier for streaming market data  
- Multi-year fabricated SPX chain history  
- Full OPRA live for all names  
- IB / TradeStation / Robinhood as required paths  

## Implementation notes (when build packet opens)

- `MarketDataAdapter` (Massive) separate from `BrokerAdapter` (Tradier)  
- `ChainSnapshotStore` append-only collector job  
- Test runner flags: `mode=historical|live`, `dataset_id=…`  
- Every decision log: data source + timestamp; every order: Tradier id  

## Related

- Decision log: DL-185 (Tradier deploy), DL-186 (Massive data + dual Test + chain collect-forward)  
- Landing: `web/app/app/strategy-lab/page.tsx`  
