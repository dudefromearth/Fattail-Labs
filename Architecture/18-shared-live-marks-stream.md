# Shared live marks stream (multi-member Curate)

**Status:** **AS-BUILT** (DL-222–224, DL-227)  
**Spec authority:** [`Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md`](../Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md) §2–4  
**Rule:** One symbol universe · one live stream · every member collection reads the same marks.

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
| `GET /api/me/strategy-lab/curate/correlation?a=&b=&days=` | Pair Pearson ρ |
| `GET .../correlation/relative` | Each symbol vs SPY (+ pairwise) |
| Comparison `corr_vs_spy` | Grid/table relative correlation |

Method: daily simple returns from Massive aggregates; proxy series for indexes when needed.

## UI

- Curate strip + Symbols pages · correlation calculator  
- Symbol picker by type (tradeable only for scan open)

## Non-goals (v1)

- Per-member custom symbol lists (later: union into shared universe)  
- Tradier streaming  
- Full option chain stream (chain_collector remains separate)  
- WebSocket fan-out to browsers (UI polls `live-marks` every 10s)
