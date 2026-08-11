# Massive Market Bus (shared market data plane)

**Status:** **AS-BUILT** (2026-08-10 · DL-282…286)  
**Spec authority:** [`Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md`](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) **v1.0.1**  
**Chain surface law:** [`Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md`](../Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md)  
**Bench / program:** [`docs/Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md`](../docs/Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md) · board `agents/p-market-bus/`  
**Related:** [Arch/18 shared live marks](./18-shared-live-marks-stream.md) (MySQL marks path — still lawful for Curate)  
**Deploy:** [`infra/deploy.md`](../infra/deploy.md) § Market Bus  

---

## 0. Why this exists

Member tools (chain ladder, future charts, capital marks consumers) must **not** each open Massive. Concurrent users must **not** multiply upstream calls.

**Law:** headcount multiplies **sockets and fan-out**; Massive multiplies only with **hot topics**.

**Posture (DL-286):** Redis as shared generation store for multi-worker live market data is a **named reversal** of the earlier “no always-on multi-worker Redis pipeline” line in the chain picker era. Arch/18 MySQL marks remain for non-WS / Curate until dual-write exit (Spec O2).

---

## 1. Topology (as-built)

```text
Browsers (N tabs)
  · Options Lab /app/options-lab
  · (future apps via shared client)
        │
        │  one WebSocket / tab   WS /api/me/market/stream
        │  HTTP poll fallback    GET /api/me/market/chain-ladder  (Redis-backed when bus on)
        ▼
labs-api (FastAPI, 1+ workers)
  · auth (session + tool-member)
  · single-flight fill on miss
  · read/write Redis generations
        │
        ▼
Redis (localhost)     keys mb:*  · pub channel mb:pub
        ▲
        │ SET + interest TTL
        │
┌───────┴────────┐
│ chain_feed     │  python -m market_data.chain_feed
│ sym_feed       │  python -m market_data.sym_feed
└───────┬────────┘
        │ Massive REST (sole writers for bus topics)
        ▼
     Massive API
```

**Hard rules for agents:**

| Do | Do not |
|----|--------|
| Call Massive only from **feed** processes or single-flight fill on miss | Open Massive from Next.js or per-request without single-flight |
| Use Admin `market_symbol_universe` for symbols | Hardcode symbol lists |
| One market **WebSocket per tab** (`web/lib/market/MarketSocket.ts`) | One socket per chart/widget |
| Label proxy marks (`massive_proxy_v1`) | Use proxy mid for SPX strike center (OC2) |
| Exact listed strikes (OC6a), e.g. 302.50 | Round half-strikes to integers |

---

## 2. Components & paths

| Piece | Path | Role |
|-------|------|------|
| Bus package | `server/market_data/market_bus/` | config, Redis store, singleflight, metrics |
| Ladder API | `server/routes/chain_ladder.py` | Generations + poll + bus-metrics |
| WS gateway | `server/routes/market_stream.py` | Multiplex sub/unsub; snapshot-then-delta |
| Chain feed | `server/market_data/chain_feed.py` | Warms interest keys from Massive |
| Sym feed | `server/market_data/sym_feed.py` | Universe marks + `marketstatus/now` |
| Shared client | `web/lib/market/` | `MarketSocket`, `useOptionChainBus`, **`useLiveUnderlierMarks`** |
| Live underlier UI | `web/components/market/LiveMid.tsx`, `LiveUnderliersTable.tsx` | Canonical mid display (Arch §4.4) |
| Options Lab UI | `web/app/app/options-lab/page.tsx` | Consumer of shared client |
| Legacy route | `/app/market/chain-ladder` → redirect to `/app/options-lab` |
| Scale smoke | `server/scripts/mb_scale_smoke.py` | N concurrent fills → Massive O(1) |
| AT evidence | `server/scripts/mb_at_evidence.py` | Formal AT-MB pack |

---

## 3. Redis key layout

| Key | Content |
|-----|---------|
| `mb:ladder:{feed}:{exp}:{side}:w{N}` | Full ladder JSON + `content_hash` |
| `mb:chain:{feed}:{exp}:{side}` | Optional wide chain generation (feed) |
| `mb:sym:{PRODUCT}` | Last mid/bid/ask + `source` + seq |
| `mb:session:market_status` | Massive market status document |
| `mb:interest:{topic}` | Demand TTL (grace default 45s) |
| `mb:pub` | Pub/sub notify (topic + hash) |

Enable bus:

```bash
export LABS_MARKET_BUS=1
export REDIS_URL=redis://127.0.0.1:6379/0
# optional: LABS_MB_CHAIN_TTL_S=2.0  LABS_MB_INTEREST_GRACE_S=45
```

When **disabled**, ladder uses process-local TTL only (H1-2 minimal OC15 — single worker honest).

---

## 4. Member transport

### 4.1 WebSocket (primary)

```text
WS /api/me/market/stream
```

- Session cookie auth; unauth → close / err  
- Client ops: `hello` · `sub` · `unsub` · `ping`  
- Server: `hello` · `chain` (mode full) · `sym` · `session` · `err` · `pong`  
- **MB7:** on sub/reconnect, **snapshot first**, then updates  

### 4.2 HTTP poll (fallback / Redis-backed)

```text
GET /api/me/market/chain-ladder?symbol=&expiration=&side=&wings=&since_hash=
```

Modes: `full` · `diff` · `unchanged` (Options Chain Picker Spec).

Options Lab: `useOptionChainBus` prefers WS; polls when stream stale.

### 4.3 One socket law

`getMarketSocket()` is a **tab singleton**. Multiple widgets register interest; they must not create additional WebSockets (aged-browser socket limits).

### 4.4 Live underlier mids — site-wide UI standard (mandatory)

Any surface that shows underlier **mid / last / live price** for symbols in
`market_symbol_universe` uses **one** pattern. Do not invent a third path.

| Layer | Path | Role |
|-------|------|------|
| Contract + bind | `web/lib/market/liveUnderlierPattern.ts` | `bindUnderlierMark`, formatters, poll constants |
| Hook | `web/lib/market/useLiveUnderlierMarks.ts` | HTTP poll (`GET` market universe / ensure_fresh) + optional WS via `useSymbolMarks` |
| Display | `web/components/market/LiveMid.tsx` | `<LiveMid />` · `<LiveProxyMid />` · `<LiveDayPct />` · status |
| Table | `web/components/market/LiveUnderliersTable.tsx` | Practice / Admin / Lab shared table |

**Rules:**

1. **HTTP ensure_fresh is primary** for tables; WS overlays **non-proxy** mids only.  
2. **Bind by product key only** — never apply SPY mid to an SPX row (or any cross-fill).  
3. **Proxy honesty** — native mid vs labeled proxy mid are separate fields; UI shows both when relevant.  
4. **Do not** poll `/api/me/strategy-lab/curate/live-marks` solely for mid chips (legacy Curate strip path retired).  
5. **Do not** use raw `useSymbolMarks` alone when you need a hydrated table mid (WS-only is incomplete without HTTP).  
6. **Exceptions (different planes):** options **chain** → `useOptionChainBus`; multi-leg **package** marks → OPF package-quote.

**Consumers (as-built):** Practice Marked underliers · Admin Market universe · Strategy Lab Symbols · Curate live marks strip · Curate symbol picker · Symbol detail · Positions equity Last · Volume Profile live tip.

Server SoR for mids: `get_underlier_mark` (bus → MySQL dual-write) + `ensure_fresh_underlier_marks` on list/valuation paths. Writers: `sym_feed` / `live_stream`.

---

## 5. Topic families

| Topic | Writer | Consumers |
|-------|--------|-----------|
| Chain ladder generations | chain_feed + API single-flight miss | Options Lab |
| `sym:{PRODUCT}` | sym_feed | Future charts; WS sub; dual-write path optional |
| `session:market_status` | sym_feed | Future header (**not** shipped product without surface Spec) |

**Header live marks:** Spec allows topics; **no always-on header UI** until a separate surface Spec (Tango/Echo). Do not invent header chrome in bus work.

**Naming:** Product catalog name for the chain app is **OD-nav open**. As-built route/card: `/app/options-lab` / “Options Lab”. Spec law says **chain ladder surface**.

---

## 6. OC15 stages (do not double-claim)

| Stage | Meaning | Evidence |
|-------|---------|----------|
| **H1-2 minimal** | In-process generation + single-flight (one API worker) | Picker program |
| **MB-P1 production** | Redis multi-worker shared generation | Market Bus program · **successor** |

Delta must not pass “OC15 complete” twice without successor language (Spec §1.2).

---

## 7. Proxy & display invariants (carry into every market PR)

| Law | Meaning |
|-----|---------|
| **OC2** | Spot for strikes: chain `underlying_asset.value` first; never proxy mid for index strike math |
| **OC5a** | Proxy vol never σ; VIX1D for short DTE when native |
| **OC6a** | Display **exact** listed strikes (302.50 not 303) |
| **MB8** | Proxy `source` survives on bus documents |

---

## 8. Ops (MiniTwo)

See `infra/deploy.md` § Market Bus.

| Process | Command |
|---------|---------|
| Redis | `brew services start redis` · bind 127.0.0.1 |
| API | uvicorn with `LABS_MARKET_BUS=1` `REDIS_URL=…` |
| Chain feed | `python -m market_data.chain_feed --interval 2` |
| Sym feed | `python -m market_data.sym_feed --interval 5` |

Plist examples: `infra/launchd/ai.fattail.labs.chain-feed.plist.example`,  
`infra/launchd/ai.fattail.labs.sym-feed.plist.example`.

**One writer per feed class.** Never two chain-feeds without leader election.

### Smoke

```bash
cd server && set -a && source ../.env && set +a
export LABS_MARKET_BUS=1 REDIS_URL=redis://127.0.0.1:6379/0
.venv/bin/python scripts/mb_at_evidence.py
.venv/bin/python scripts/mb_scale_smoke.py --n 10
.venv/bin/python -m market_data.sym_feed --once
```

---

## 9. Agent checklist (before changing market data)

1. Read this doc + Market Bus Spec MB1–MB12.  
2. Will this add a **second** Massive consumer? If yes, stop — extend feeds/single-flight.  
3. Will this open another browser socket? If yes, use `web/lib/market` interest API instead.  
4. Universe-only symbols?  
5. Proxy path labeled?  
6. Strikes cent-exact in any UI?  
7. Fail loud if Redis/bus required but missing (`LABS_MARKET_BUS=1` without `REDIS_URL`)?  
8. Showing an underlier **mid/last**? Use `useLiveUnderlierMarks` + `<LiveMid />` (§4.4) — no ad-hoc poll.  
9. Update Spec / DL / this Arch file when behavior changes (documentation parity).

---

## 10. Out of scope (agents must not invent)

- Live main **header** product UI without surface Spec  
- Full OPRA options WebSocket as default chain input (v1 = REST snapshot)  
- MSC Redis schemas or MSC code  
- Browsers talking to Redis or Massive directly  
- Kafka / multi-region bus  

---

## 11. Decisions

| DL | Topic |
|----|--------|
| DL-282 | Spec DRAFT filed |
| DL-283 | Review fold (gates, header speculative, H1-2/MB-P1) |
| DL-284 | Bench plan filed |
| DL-285 | Overrule≠waive; Picker v1.0.2 filename |
| DL-286 | W0 GO + land Redis posture + implementation |
