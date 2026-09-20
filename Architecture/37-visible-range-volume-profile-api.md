# 37 — Visible Range Volume Profile API (as-built)

**Law:** **DL-788** REQ-007 v2 · computing VP API + Labs member hop (`vp_display`).  
**SHA this describes:** `2cd6e284`.  
**Widget (client):** [35-options-lab-volume-profile.md](./35-options-lab-volume-profile.md).  
**Topology:** [36-studioone-data-plane.md](./36-studioone-data-plane.md).

The browser never talks to the computing VP API. Members hit Labs; Labs hops with a **computing session**, not the member cookie (**A2.6**).

---

## Planes

| Plane | Process (typical) | Role |
|---|---|---|
| Member hop | Labs FastAPI (`vp_display`) | Cookie session, path rewrite, hop headers |
| Computing VP | `market_data/vp_api` | Bins, health, stream, `/range` (non-member chart) |
| History | StudioOne `:4012` when `LABS_HISTORY_API_BASE` set | Futures OHLC + contracts (REQ-006 N-bar) |
| Print store | VP ingest archive | Tick prints for `bin_source: prints` |

---

## Member hop (`server/routes/vp_display.py`)

Prefix in the Next app: `/api/app/vp/v1/…` (rewritten to Labs).

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/app/vp/v1/health` | member | Coverage / collectors |
| GET | `/api/app/vp/v1/window/{target}` | member | **Visible Range histogram** |
| GET | `/api/app/vp/v1/range/{target}` | member | Full-history slice (not the member chart L2) |
| GET | `/api/app/vp/v1/ohlc/{source}` | member | Candles; hops history |
| GET | `/api/app/vp/v1/contracts/{source}` | member | Active contract list |
| GET | `/api/app/vp/v1/stream` | member | SSE developing edge |
| GET | `/api/app/vp/v1/structure/{target}` | member | Structure overlay payload; bins only if `include_bins=true` else 422 `BINS_LEAKED` |

Hop mint: `auth.issue_computing_session()` → `Cookie: {session}={token}`. Never forward `ft_session`.

OHLC `tf` **422** unless `1m\|5m\|15m\|1h\|1d`.

---

## Computing VP API (`server/market_data/vp_api/app.py`)

Computing gate on every route (`_computing`).

### `GET /v1/profile/{target_symbol}/window`

**Visible Range.** Query:

| Param | Type | |
|---|---|---|
| `from_t` | int, required | Window start, unix **ms** |
| `to_t` | int, required | Window end, unix **ms** |
| `source` | string | Tape (e.g. `ES`); default from `SOURCE_FOR_TARGET` |
| `row` | float | Display grain; native `vp_row` if omitted |

`assemble_window` (`vp_engine/window_bins.py`):

- Grain: `assert_native_grain(src, vp_row)` (ES 0.25).
- Coverage floor from the print store **per contract at serve time** — no date constant.
- Days **on or after** floor: eligible prints in `[from_t, to_t]`, bucketed with `row_price`.
- Days **before** floor: Massive aggs-derived rows.
- `bin_source`: `prints` \| `aggs-derived` \| `mixed`.

Optional display rebin: if requested `row` ≠ native, `flags.approximation = display_rebin`.

Unknown `target` → 404 `unknown_target`. Spec grain mismatch → named spec error JSON.

### `GET /v1/profile/{target_symbol}/range`

Full-history / session-span histogram (A12). Member chart L2 does **not** use this. Query `from` / `to` session dates, optional `price_lo` / `price_hi` / `row` / `source`.

### `GET /v1/profile/{target_symbol}/{kind}`

`kind` = `session` \| `developing`. Composite 404. Developing uses today’s hist + optional hot cache.

### `GET /v1/health`

Collectors + coverage (`floor_session`, `ceiling_session`, `sessions_binned`) for SPY / ES / MES.

### `GET /v1/ohlc/{source_symbol}/{timeframe}`

Computing-side OHLC (member path hops **history**, not this, when `LABS_HISTORY_API_BASE` is set).

### `GET /v1/stream` · `/v1/stream/{source_symbol}`

SSE, `text/event-stream`, tails ingest. Closed market → holding-last (REQ-007).

---

## History hop (candles)

Member `GET /api/app/vp/v1/ohlc/{source}` → `GET {LABS_HISTORY_API_BASE}/history/v1/ohlc/{SOURCE}?tf=&contract=&bars=&before_t=`.

`server/sa_dev/futures_history.py` `serve()`: Massive futures aggs, N-bar lookback (REQ-006), contract listing date. `bars_per_session` metadata for ES/MES.

Contracts: `GET /api/app/vp/v1/contracts/{source}` hops `/history/v1/contracts/{SOURCE}`.

---

## Envelope (histogram payloads)

`sa_dev/vp_client.py` `_validate_envelope` requires:

- `bins[]` of `{price, volume}`
- `flags.mapping` ∈ `OK|STALE|FAILED`
- `flags.approximation`
- `status` ∈ `UNAVAILABLE|GAPPED|COMPLETE`
- `mapping` object with contract keys

Mismatch → member payload `named_state: CONTRACT MISMATCH` (not a 500 leak of internals).

Coverage-only objects (no `bins`) must not be painted as a histogram.

---

## Client window URL

`web/lib/saVpBand.ts` `windowUrl`:

```
/api/app/vp/v1/window/{target}?source={ES}&from_t={ms}&to_t={ms}&row={grain}
```

`profileFetchPlan`: empty window → `wait` (no fetch). Valid span → `kind: window`. Member L2 never selects `kind: range`.

---

## What this API does not do

- Browser CORS to computing VP (blocked by design).
- Client-built product histogram as SoR.
- Structural (SRF-4) re-profile from visible-range bins.
- POC/VA in the window payload (HOLD).
