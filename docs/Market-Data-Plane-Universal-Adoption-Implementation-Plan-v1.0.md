# Market Data Plane — Universal Adoption Implementation Plan v1.0

**Date:** 2026-08-11  
**Status:** **IN PROGRESS / PARTIAL LAND** (Coach GO 2026-08-11 — core remediation merged)  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Parents:**  
- Market Bus Spec v1.0.1 — [`Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md`](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md)  
- OPF Spec v0.2.1 — [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md)  
- Arch/28 Market Bus — [`Architecture/28-massive-market-bus.md`](../Architecture/28-massive-market-bus.md)  
- Arch/18 marks (migrate-away) — [`Architecture/18-shared-live-marks-stream.md`](../Architecture/18-shared-live-marks-stream.md)  
- Audit baseline — conversation 2026-08-11 (all-apps data-plane audit)

**Mission:** Every Labs surface that consumes **live market facts** or **structure marks** uses the **new pipe only**:

```text
Massive → feed(s) → Redis mb:* → labs-api → one WS/tab + HTTP
                → web/lib/market/* (shared client)
                → OPF (package-quote / resolve) for multi-leg structure marks
```

**Non-mission:** Live main-header chrome; MSC pricing; per-widget Massive; permanent dual-truth MySQL + Redis.

---

## 0. Law (do not re-litigate)

| ID | Law |
|----|-----|
| **U1** | Browsers never call Massive. Only feeds + single-flight API miss paths. |
| **U2** | At most **one** market WebSocket per tab (`getMarketSocket()`). |
| **U3** | All apps obtain market data through `web/lib/market/*` (and OPF client for packages). No app-local Massive clients. |
| **U4** | Underlier last/mid SoR migrates to **`mb:sym:{PRODUCT}`** (sym_feed). MySQL `market_live_marks` is **migration cache only** (O2 dual-write → exit). |
| **U5** | Multi-leg / option **open book** marks use **OPF package-quote** over dual-side chain generations — never fabricate mids, never silent ATM theater. |
| **U6** | Equity-like share positions may mark on underlier mid from bus (× qty × 1). |
| **U7** | Fail loud: missing gen / incomplete package / stale when required → explicit degraded/error, not $0. |
| **U8** | Proxy honesty (MB8/OC2): labeled proxy; no proxy mid for SPX strike math. |
| **U9** | Historical OHLC (charts) may use a **shared server OHLC service** with cache; must not open N Massive clients from the browser; prefer one process-level cache path already used by Options Lab. |
| **U10** | No MSC code/schemas. |

---

## 1. Current state (audit freeze 2026-08-11)

### 1.1 On the new pipe (do not break)

| Surface | Path | Evidence |
|---------|------|----------|
| Heatmap | `/app/options-lab/heatmap` | `useOptionChainBus` + templates |
| Analyzer | `/app/options-lab/analyzer` | OPF package-quote + resolve + dual-side hydrate |
| WS gateway | `/api/me/market/stream` | Requires `websockets` in venv (prod fix 2026-08-11) |
| Chain HTTP | `/api/me/market/chain-ladder` | Bus-backed when `LABS_MARKET_BUS=1` |

### 1.2 Off the new pipe (must remedy)

| Surface | Today | Gap |
|---------|-------|-----|
| Practice **Positions** / Capital valuation | MySQL marks; options **at-cost** | No OPF; no bus; no live open options |
| Practice **Trade chart** | Direct Massive/Yahoo in `trade_chart_service` | Parallel Massive path |
| Strategy Lab **Curate** live strip + ticks | MySQL `market_live_marks` · 15s poll | Not `mb:sym` / not shared WS |
| Strategy Lab **Deploy** / runtime | `strategy_runtime.marks` → MySQL | Same |
| **Marked underliers** (Practice + Design Symbols) | Universe + MySQL marks | Read path not bus-first |
| Volume Profile OHLC | Shared API but process Massive cache | Acceptable under U9 if unified; document as **shared OHLC service**, not second plane |
| Correlation (Curate) | On-demand Massive dailies | Keep on-demand; route through one server module only |

### 1.3 No market plane required (out of remediation)

Journey · Toughness · Community · Wiki · Journal · Retrospective · Playbook · Campaigns (charter only) · Courses · Live sessions · Reports (fill-derived book stats only).

---

## 2. Target architecture

```text
                    ┌─────────────────────────────────────┐
                    │  Member tab                          │
                    │  getMarketSocket()  (singleton)      │
                    │  · chains (Heatmap / Analyzer / …)   │
                    │  · symbols (Positions / Curate / …)  │
                    │  · session                           │
                    │  opfPricingApi (package-quote)       │
                    └───────────────┬─────────────────────┘
                                    │ wss …/market/stream
                                    │ POST …/pricing/*
                                    ▼
┌──────────────────────────────────────────────────────────┐
│ labs-api                                                 │
│  market_stream · chain_ladder · pricing · capital        │
│  positions valuation (bus + OPF) · strategy marks reader │
└───────────────┬──────────────────────┬───────────────────┘
                │                      │
                ▼                      ▼
         Redis mb:*              OPF ContractStore
         · ladder gens           (reads bus gens)
         · mb:sym:PRODUCT
         · session
                ▲
                │
     chain_feed · sym_feed  (sole Massive writers for live topics)
                │
                ▼
             Massive

Optional dual-write (Phase B only):
  sym_feed → Redis AND MySQL market_live_marks
  Exit: readers use bus only → stop MySQL write (DL entry)
```

### 2.1 Shared client expansions (required)

| Module | Today | After |
|--------|-------|--------|
| `MarketSocket` | chain + optional symbols | **First-class** `setSymbols` / sym message handlers used by Practice + Strategy Lab |
| `useOptionChainBus` | Heatmap | Unchanged primary for chains |
| **New** `useSymbolMarks` (or extend socket hooks) | — | Subscribe underliers; apply `t:"sym"`; hydrate HTTP once |
| **New** `useOpenBookValuation` | — | Positions UI: poll or push-backed valuation |
| `opfPricingApi` | Analyzer only | Capital / Positions open option structures |

### 2.2 Server expansions (required)

| Module | Change |
|--------|--------|
| `sym_feed` | Ensure launchd on MiniTwo; dual-write MySQL while O2 active |
| `capital_positions.py` | Equity: bus-first mark; Options: OPF package-quote (not at-cost default) |
| `strategy_runtime/marks.py` | Read bus `mb:sym` (fallback MySQL only during O2) |
| `routes/strategy_lab_curate.py` live-marks | Project from bus (or dual-read with bus preferred) |
| `trade_chart_service` / OHLC | Single `MassiveClient` service layer; no browser Massive; shared cache policy |
| `routes/capital.py` | Optional: stream-friendly `marks_as_of` + generation metadata |

---

## 3. Work packages (implement in order)

Phases are **sequenced**. Do not start C before B gates pass.

---

### Phase A — Pipe readiness (ops + client foundation)

**Goal:** Production always has bus + WS + sym topics available before app rewires.

| ID | Work | Owner | Done when |
|----|------|-------|-----------|
| **A1** | Confirm MiniTwo: Redis up, `LABS_MARKET_BUS=1`, `REDIS_URL`, `websockets` in venv | Foxtrot | `bus-metrics` + WSS accept |
| **A2** | launchd for `chain_feed` + `sym_feed` (not only `live_stream`) | Foxtrot | Feeds KeepAlive; logs show LIVE/PROXY |
| **A3** | `MarketSocket` sym path: on `t:"sym"` fan-out; reconnect resub | Charlie | Unit + browser: symbols update without full reload |
| **A4** | Hook `useSymbolMarks({ symbols })` using A3 + one HTTP hydrate (universe marks endpoint bus-backed or `/api/me/market/…`) | Charlie | Curate-style strip can switch later without new socket |
| **A5** | Deploy checklist: websockets + bus env + feed plists in `infra/deploy.md` | Foxtrot | Doc + smoke script |

**Gate A:** Two tabs open Heatmap + a symbols strip; one Massive rate class for shared topics (not O(tabs)); no `No supported WebSocket library` in api.log.

---

### Phase B — Underlier marks: bus-first + O2 dual-write

**Goal:** Every underlier mid reader prefers Redis; MySQL remains temporary mirror.

| ID | Work | Owner | Done when |
|----|------|-------|-----------|
| **B1** | `sym_feed` dual-write: `mb:sym:{P}` + upsert `market_live_marks` (labeled source) | India | Both stores update same poll |
| **B2** | Reader helper `get_underlier_mark(product)`: bus → MySQL fallback → fail/degrade | India | Single import for capital + strategy + curate |
| **B3** | Curate `GET …/live-marks` uses B2; response includes `source: bus|mysql|proxy` | Bravo | Strip shows live; provenance honest |
| **B4** | `strategy_runtime.marks.get_mark` uses B2 | Bravo | Ticks fail loud when bus+mysql empty and required |
| **B5** | Practice/Strategy Symbols pages read B2 | Charlie | Marked underliers page bus-honest |
| **B6** | Positions equity rows use B2 | Charlie + India | Equity MTM age tracks bus |

**Gate B:** With `live_stream` **stopped**, Curate strip + equity Positions still update from `sym_feed` alone (or explicit dual-write proof). With bus down and MySQL warm, fallback works and is labeled. DL notes O2 start.

**O2 exit (later Phase F):** N=20 green sessions or 14 calendar days → remove MySQL write path; readers bus-only; DL entry.

---

### Phase C — Open option positions on OPF (Practice + Capital)

**Goal:** Open multi-leg books show **live package marks**, not permanent at-cost.

| ID | Work | Owner | Done when |
|----|------|-------|-----------|
| **C1** | Spec freeze: open-book mark law — package mid = OPF package-quote debit/credit; cost basis from fill; unrealized = mark − cost; incomplete gen → `degraded` + at-cost **display only with label** | Tango + India | Written in Positions / Capital note or short Spec addendum |
| **C2** | Server: for each open option structure, build `StrategyIntent` / legs from trade_log legs; ensure dual-side gen interest for (symbol, exp, wings covering strikes) | India | Interest registered; gen present or fail-loud |
| **C3** | `PackagePricer.quote` (or package-quote route internal) per open structure; batch/limit concurrency | India | Valuation payload has `last`, `value`, `unrealized`, `value_label: package_mark` |
| **C4** | Multi-exp opens: OPF multi-exp rules; epoch skew labeled | India | Calendars/diagonals honest or degraded |
| **C5** | Client PositionsView: refresh on interval (e.g. 2–5s RTH) **or** invalidate when socket receives chain/sym for subscribed keys — **no second WS** | Charlie | UI moves without full page reload |
| **C6** | Accounts & Capital same valuation path (already shared server) | Charlie | One code path |
| **C7** | Remove “options always at-cost” as default (V13 supersede for live book; keep at-cost only as degraded fallback) | India | Golden tests |

**Gate C:** Long SPX fly open in Trade Log Positions shows package debit/credit changing with market (RTH); tooltip/provenance shows OPF; missing chain → labeled at-cost, not silent $0.

---

### Phase D — Strategy Lab fully on pipe

| ID | Work | Owner | Done when |
|----|------|-------|-----------|
| **D1** | CurateLiveMarksStrip → `useSymbolMarks` (WS) instead of 15s HTTP-only (HTTP hydrate-if-empty ok) | Charlie | Strip updates via stream |
| **D2** | Runtime ticks already B4; verify paper fills use bus mids | Bravo | Integration test |
| **D3** | Correlation: keep on-demand; ensure only `market_data.correlation` + MassiveClient; document as research path not live bus | India | No browser Massive |
| **D4** | Deploy phase dashboards consume same marks helper | Charlie | No private mark fetch |

**Gate D:** Curate works with MySQL writer off (bus only, post dual-write or B2 fallback rules). Zero direct Massive from web.

---

### Phase E — Charts / OHLC consolidation (U9)

| ID | Work | Owner | Done when |
|----|------|-------|-----------|
| **E1** | Inventory: `ohlc_service` (Volume Profile) vs `trade_chart_service` (Trade Log) | India | Doc matrix |
| **E2** | Unify behind one server facade (`market_data/aggs_service` or extend ohlc) with shared cache keys | India | One Massive entry for aggs |
| **E3** | Trade chart + Volume Profile call facade only | Charlie | No duplicate client logic |
| **E4** | Optional: last underlier mid on chart header from `useSymbolMarks` | Charlie | Spot line consistent with bus |

**Gate E:** Two UIs requesting same SPY 5m window → one cache hit class; no second Massive key path.

---

### Phase F — Dual-write exit + kill Arch/18 as SoR

| ID | Work | Owner | Done when |
|----|------|-------|-----------|
| **F1** | Evidence: 14d or 20 sessions bus-primary | Delta | Report |
| **F2** | Stop MySQL writes from sym_feed dual-write; optional keep table read-only archive | India | Code + DL |
| **F3** | Deprecate / stop requiring `com.fattail.labs.marks-stream` for product paths | Foxtrot | launchd optional or retired |
| **F4** | Arch/18 status → **SUPERSEDED for live SoR**; pointer to Arch/28 | India | Doc |
| **F5** | Grep gate: no product path imports `live_marks.get_live_mark` without bus-first wrapper | Delta | CI or script |

**Gate F:** Product live marks work with `live_stream` process **stopped**.

---

### Phase G — Hardening & proof

| ID | Work | Owner | Done when |
|----|------|-------|-----------|
| **G1** | AT pack: AT-U1…U10 mapping to pytest + browser smoke | Delta | Pass on MiniTwo |
| **G2** | Scale: N Positions tabs + Heatmap → Massive O(hot topics) | Delta | mb_scale_smoke extended |
| **G3** | RTH / closed session: held labels consistent across Heatmap, Positions, Curate | Echo + Charlie | HIS compliance |
| **G4** | Decision log DL entry for universal adoption ship | Juliet | Filed |

---

## 4. Per-app remediation checklist (explicit)

Use this as the execution punch list.

### 4.1 Options Lab

| App | Action |
|-----|--------|
| Heatmap | **Keep** — regression only (WS websockets dep, bus env) |
| Analyzer | **Keep** — ensure Positions handoff uses same OPF quote shape if deep-linked later |
| Volume Profile | **E2–E4** — shared OHLC facade; optional bus spot |

### 4.2 Practice

| App | Action |
|-----|--------|
| Trade Log blotter | No live marks required — **no change** |
| Trade Log **Positions** | **B6 + C1–C7** — bus equity + OPF options + refresh |
| Trade chart | **E2–E3** |
| Reports | No tape — **no change** |
| Journal / Retro / Playbook / Campaign | **no change** |
| Marked underliers | **B5** |

### 4.3 Strategy Lab

| App | Action |
|-----|--------|
| Design board | No live tape — **no change** |
| Curate strip / ticks | **B2–B4 + D1–D2** |
| Deploy | **D4** |
| Symbols | **B5** |
| Archive | **no change** |
| Correlation | **D3** |

### 4.4 Capital

| App | Action |
|-----|--------|
| Accounts & Capital | Same valuation as Positions (**C6**) |

### 4.5 Other

| App | Action |
|-----|--------|
| Journey / Toughness / Community / Wiki | **out of scope** |

---

## 5. API / payload changes (sketch)

### 5.1 Positions valuation (extend, fail loud)

```json
{
  "marks_as_of": "…",
  "marks_plane": "market_bus_v1",
  "valuation_uses_latest_mark": true,
  "accounts": [{
    "positions": [{
      "trade_id": 1,
      "asset_class": "option",
      "last": 1.25,
      "value": 125.0,
      "value_label": "package_mark",
      "unrealized": 40.0,
      "degraded": false,
      "mark_meta": {
        "engine": "package_quote",
        "pack_id": "day_trade.mark_hybrid@…",
        "complete": true,
        "generations": { "…": "hash" }
      }
    }]
  }]
}
```

`value_label` enum: `package_mark` | `underlier_mark` | `prev_close` | `at_cost` (degraded only).

### 5.2 Live-marks Curate response

Add `plane: "mb:sym" | "mysql_fallback"` per row.

### 5.3 Client hooks

```ts
// web/lib/market/useSymbolMarks.ts
useSymbolMarks({ symbols: string[], enabled?: boolean })
  → { marks: Map<string, SymbolMark>, transport, error }

// web/lib/capital/usePositionsValuation.ts  
usePositionsValuation({ accountId, campaignId, …, refreshMs })
  → { data, reload, transport }
```

---

## 6. Acceptance tests (must ship with phases)

| ID | Assertion |
|----|-----------|
| **AT-U1** | Browser network tab: zero calls to Massive hosts |
| **AT-U2** | One WS to `/api/me/market/stream` with Heatmap + Curate strip + Positions open |
| **AT-U3** | Open option structure valuation uses OPF complete quote or labeled degraded |
| **AT-U4** | Equity open uses underlier mid; age from bus |
| **AT-U5** | `live_stream` stopped + sym_feed running → product underlier marks still update (post B) |
| **AT-U6** | `websockets` missing → deploy check fails (or api fails loud at boot in prod) |
| **AT-U7** | Session closed → held/stale labels, no fake ticks |
| **AT-U8** | Proxy SPX mark labeled; not used as chain center |
| **AT-U9** | N concurrent valuation requests do not multiply Massive chain pulls O(N) when gens warm |
| **AT-U10** | No product import of MSC risk pricing for marks |

---

## 7. Ops (MiniTwo)

| Item | Requirement |
|------|-------------|
| Redis | Localhost; `REDIS_URL`; health on deploy |
| Env | `LABS_MARKET_BUS=1`, Massive key, `websockets` package |
| launchd | `ai.fattail.labs.api`, `ai.fattail.labs.web`, **chain_feed**, **sym_feed**, (optional dual-write era) `marks-stream` |
| Smoke | WSS accept; `mb:sym:SPY` key present; Heatmap live; Positions option mark non-at-cost in RTH |
| Rollback | Feature flag `LABS_POSITIONS_OPF=0` reverts options valuation to at-cost labeled; underlier stays bus-first if possible |

---

## 8. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| OPF quote cost for many open legs | Batch by (symbol, exp); cache package hash; wings band from strikes |
| Interest explosion | Interest budget (OPF); cap concurrent open structures per identity |
| Dual-truth during O2 | Prefer bus; label fallback; timed exit F |
| WS regression (prod) | Pin `websockets` in requirements; boot check or deploy smoke |
| Scope creep into header | Explicitly out of scope (U / Spec) |

---

## 9. Suggested schedule (calendar-agnostic)

| Wave | Phases | Outcome |
|------|--------|---------|
| **W0** | A | Pipe + client foundation ready on MiniTwo |
| **W1** | B | Underlier bus-first everywhere |
| **W2** | C | Live open options on Positions/Capital |
| **W3** | D | Strategy Lab stream consumers |
| **W4** | E | Charts unified |
| **W5** | F + G | Dual-write exit + proof |

Do not parallelize C with incomplete B (equity vs options share interest/gen plumbing).

---

## 10. File touch map (expected)

| Area | Paths |
|------|--------|
| Client market | `web/lib/market/MarketSocket.ts`, **new** `useSymbolMarks.ts`, optional `usePositionsValuation.ts` |
| Positions UI | `web/components/capital/PositionsView.tsx`, `PositionsValuationTable.tsx`, `AccountsCapitalApp.tsx` |
| Curate UI | `web/components/strategy-lab/CurateLiveMarksStrip.tsx` |
| Capital server | `server/capital_positions.py`, `server/routes/capital.py` |
| Marks | `server/market_data/live_marks.py` → bus-first helper; `sym_feed.py` dual-write |
| Strategy | `server/strategy_runtime/marks.py`, `server/routes/strategy_lab_curate.py` |
| OPF glue | `server/routes/pricing.py` or internal package helper for open-book |
| Charts | `server/market_data/ohlc_service.py`, `trade_chart_service.py` |
| Ops | `infra/deploy.md`, launchd examples under `infra/launchd/` |
| Docs | Arch/18 supersede note; this plan; DL on ship |

---

## 11. Explicit non-goals (refuse scope)

- Profit claims / marketing chrome on P&amp;L  
- Broker order routing  
- Full OPRA options WebSocket as default (REST gen remains OK)  
- Live always-on site header without surface Spec  
- Copying MSC heatmap/redis schemas  
- Silent defaults for missing config  

---

## 12. GO criteria

Coach may **GO** this plan when:

1. This document is accepted as the remediation program.  
2. Phase A ops inventory on MiniTwo is acknowledged (Redis + feeds + websockets).  
3. First implementation PR is **A1–A5** or **B1–B2** only (no big-bang C without B).

**Ship complete** when Gates A–G pass and AT-U1…U10 have evidence on production host.

---

## 13. First commit / PR slice (when GO)

Recommended first implementation PR after GO:

1. **A3–A4** `useSymbolMarks` + MarketSocket sym handling polish  
2. **B1–B2** bus-first `get_underlier_mark` + sym_feed dual-write  
3. Wire **B3** Curate live-marks to B2 (quick win, visible)  

Then **C** as its own PR stack (largest product change).

---

## 14. Revision history

| Ver | Date | Note |
|-----|------|------|
| **1.0** | 2026-08-11 | Initial plan from full-app audit; Options Lab already on pipe; Practice/Strategy/Capital remediation program |
