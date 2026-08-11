# Shared live marks stream (multi-member Curate)

**Status:** **AS-BUILT** (DL-222–224, DL-227, DL-231–232)  
**Spec authority:** [`Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md`](../Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md) §2–4  
**Rule:** One symbol universe · one live stream · every member collection reads the same marks.  
**Correlation:** On-demand only — **never** block `GET .../comparison` on Massive daily bars (DL-231).  
**UI catalog:** Design → **Symbols** sub-nav (not a top suite tab — DL-232).

**Companion (2026-08-10 / updated 2026-08-11):** Real-time multi-worker **chain ladders + WS fan-out** use the **Market Bus** (Redis generations). Product **UI underlier mids** use the site-wide live underlier pattern (Arch **28** §4.4) — not ad-hoc Curate polls. See [`Architecture/28-massive-market-bus.md`](./28-massive-market-bus.md).  
- **Arch/18** = durable MySQL marks (`market_live_marks`) + heartbeat; dual-write from `sym_feed` / `live_stream`; server `get_underlier_mark` falls through bus → MySQL.  
- **Arch/28** = Redis `mb:*` + feeds + one WebSocket + **frontend standard** for live underlier mids.  
- Proxy doctrine (SPY/VIXY labeled `massive_proxy_v1`) applies to **both**. Do not use proxy mids for SPX strike math (OC2).

## Why

- Multi-member Curate cannot open N Massive/Tradier sockets per strategy.  
- Comparison only works if strategies see the **same** underlier tape.  
- Arch/09: market data = Massive / Coach pipe; execution = Tradier (later).

## Architecture

```text
Massive (or Coach tee later)
        │
        ▼
  live_stream process (single poller)
        │  upsert mid/bid/ask/asof
        ▼
  market_live_marks  (MySQL)   ◄── shared SoR for latest marks
        │
        ├─ member A Curate ticks / instances
        ├─ member B Curate ticks / instances
        └─ member N …
```

| Piece | Role |
|-------|------|
| `market_symbol_universe` | Enabled symbol set |
| `market_live_marks` | Latest mid per symbol + provenance |
| `market_stream_heartbeat` | Stream process health |
| `market_data.live_stream` | Poller CLI |
| `strategy_runtime.marks.get_mark` | Reader (shared first, stub only if allowed) |

## Ops

```bash
cd server && set -a && source ../.env && set +a
.venv/bin/python migrate.py
.venv/bin/python -m market_data.live_stream --once      # smoke
.venv/bin/python -m market_data.live_stream --interval 5  # production loop
```

Env:

| Var | Default | Meaning |
|-----|---------|---------|
| `MASSIVE_API_KEY` | required for stream | Massive auth |
| `LABS_MARK_STALE_SECONDS` | 60 | Age after which mark is stale |
| `LABS_LIVE_MARKS_REQUIRED` | off | If 1, Curate fails without fresh shared mark |

## Coach universe (migration 085)

| Kind | Symbols |
|------|---------|
| **Indexes** | SPX, XSP, VIX, **VIX1D (Daily VIX)** |
| **ETFs** | SPY, QQQ, IWM, GLD, TLT, SLV, USO, XLF, UNG |
| **Stocks** | AAPL, AMZN, NVDA, TSLA, GOOGL, META, MSFT |

### Vol reference (strategy decisions)

| Symbol | Role | Use |
|--------|------|-----|
| **VIX** | `reference` | 30-day IV regime |
| **VIX1D** | `reference` | Daily VIX (1-day IV) for 0DTE / daily decisions |

API: `GET /api/me/strategy-lab/curate/vol-reference`  
Fields: `mid`, `prev_close`, `day_change_pct`, proxy flags. Shared by all members.

Options cadence note: **3–5 expirations/week** class (0DTE where listed).

### Index feed honesty

Massive equity plan may **not** entitle `I:SPX` / `I:XSP` / `I:VIX` (403). Stream then:

1. Tries `feed_symbol` (e.g. `I:SPX`)  
2. Falls back to `proxy_symbol` (SPX/XSP → **SPY**) with source `massive_proxy_v1` and label  
3. VIX uses **VIXY** as labeled proxy until `I:VIX` entitled  

True index marks require Massive index entitlement **or** Coach chain/index pipe (Arch/09).  
Proxy mids are **never** silent — source `massive_proxy_v1` + UI `~` marker.

## Extend universe

```sql
INSERT INTO market_symbol_universe
  (symbol, feed_symbol, proxy_symbol, kind, enabled, sort_order, note, options_cadence)
VALUES ('AMD', NULL, NULL, 'equity', 1, 270, 'optional', 'weeklys')
ON DUPLICATE KEY UPDATE enabled = 1;
```

Stream process picks up enabled symbols on next poll.

## Correlation (as-built)

| API | Purpose |
|-----|---------|
| `GET /api/me/strategy-lab/curate/correlation?a=&b=&days=` | Pair Pearson ρ (**on-demand**) |
| `GET .../correlation/relative` | Each symbol vs SPY (+ pairwise) (**on-demand**) |
| Comparison `corr_vs_spy` | **Not** filled by live Massive on poll (DL-231); use calculator |

Method: daily simple returns from Massive aggregates; proxy series for indexes when needed.  
**Do not** call relative correlation from `comparison_report` — that path must stay sub-100ms for board load.

## UI

- Live marks strip on **Curate** dashboard  
- **Design → Symbols** catalog + correlation calculator  
- Symbol picker in **Design** designer (underlying) and **Curate** run panel (scan)  
- UI polls `live-marks` ~15s when tab visible (pause when hidden)

## Non-goals (v1)

- Per-member custom symbol lists (later: union into shared universe)  
- Tradier streaming  
- Full option chain stream (chain_collector remains separate)  
- WebSocket fan-out to browsers  
- Live correlation on every comparison poll
