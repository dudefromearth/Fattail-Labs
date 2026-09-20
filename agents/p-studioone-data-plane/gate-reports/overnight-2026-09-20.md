# Overnight/weekend head start — 2026-09-20

Nothing closed. No R0/H0.

## 1. REQ-007 v2 server half — **GO** (staging)

- Endpoint: `GET /v1/profile/{target}/window?from_t=&to_t=&source=`
- Member hop: `/api/app/vp/v1/window/{target}`
- Coverage floor **queried** (live: ES floor `2026-09-08` from store — not a constant)
- PP-1: covered session window **200** `bin_source=prints` bin_count **438**
- Pre-coverage window **200** `bin_source=aggs-derived` (empty if no aggs cache)
- Client: Visible Range default, Full History toggle, A22 `profileMode`, chrome `data-testid=sa-profile-mode`, **no** client bin-assembly, **no** POC/VA (HOLD)
- Stream: existing `/stream`; live tick attests next RTH
- CP-1: chain_feed pid **538** RSS **71088** undegraded
- Tests: `test_window_bins` + `test_req007_hygiene` pass

## 2. Eligibility — **GO** (on Coach's desk)

`agents/p-symbology-registry/gate-reports/eligibility-2026-09-20.md`

| Symbol | 28d expirations | median/week | ≥3? |
|--------|-----------------|-------------|-----|
| SPX | 10 | 5 | YES |
| XSP | 13 | 5 | YES |
| SPY | 12 | 5 | YES (volume-source, not options-role for picker) |

Options-role COMING rows: SPX, XSP. Coach picks toward ~20.

## 3. 2TB print-store — **GO** (already mounted)

- `/Volumes/FatTail2TB` mounted, writable
- `LABS_MARKET_DATA_ROOT=/Volumes/FatTail2TB/fattail-market-data`
- vp-futures run.sh exports that root; ingest ES 11 session days present
- **VPS Q1 still needs:** per-contract print depth toward 90d (coverage is ~11 sessions), ES/MES **model** ACTIVE still blocked, no code change from mount alone

## 4. Structure 500 — **diagnosed, fix NOT executed**

- `include_bins=true` + `kind=developing` + `harness=live` → **200**, 457 bins (not 500)
- `kind=session` without `session_date` → **200** named `CONTRACT MISMATCH` wrapping sidecar **422 `bad_range`**
- The **500** is the leak-guard in `vp_display.py` / `sa_dev.py`: `if "bins" in payload and not include_bins: HTTP 500`. Current `structure_for` only attaches `bins` when opted in, so the tripwire should not fire on the member developing URL.
- **Proposed packet (HOLD):** (a) session kind without date defaults to queried coverage ceiling, not 422; (b) leak-guard becomes **422 named `BINS_LEAKED`**, not 500.

## 5. F2 empty Stocks chip — **GO** (StudioTwo)

Copy: “No stocks in the supported universe yet” (`data-testid=symbol-search-empty-class`). Gray reason `no-stocks-in-universe`. SPY remains volume-source, `member_visible=false`.
