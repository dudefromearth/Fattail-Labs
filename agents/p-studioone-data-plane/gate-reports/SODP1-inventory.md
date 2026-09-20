# SODP1 — Census inventory (Kilo + Foxtrot-shaped process)

**Verdict:** inventory complete (read-only). Not a Delta gate. Not BUILD.  
**Date:** 2026-09-19 22:42–22:45 ET (Saturday, post-close)  
**Seats:** Kilo (consumers + tests) · Foxtrot-shaped (lsof / launchctl / ps)  
**Machines:** StudioTwo local · StudioOne SSH **read-only** (`ernie@192.168.1.111`, `~/.ssh/id_studioone`). **MiniTwo not this tree.**  
**Seed:** `agents/p-studioone-data-plane/seeds/SODP1-kilo.md`  
**Spec:** `Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md` **v0.1.5** §11 · §12  
**Token:** `agents/go/SODP0-W0.md` (intake — **not** SODP2-W0)

**This packet did not:** history code · StudioOne install · git pull · bootout · kickstart · Massive `GET /futures/v1/aggs` · MiniTwo SSH.

Open REQs (every report): **REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN.** No “done.” D6 / D7 / D8 open. ES/MES model ACTIVE blocked on VPS Q1.

---

## CP-1 — CHAIN PRIMACY (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its expected resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

This packet: **read-only** (`lsof` / `launchctl list` / `ps` / `tail` logs / repo grep). No overlay. No Massive aggs. Rollback: none (no change).

---

## 1. Consumer table (spec §11) — file:line

Hop pins on StudioTwo `.env` (names only): `LABS_SA_DEV_VP_API_BASE=http://192.168.1.111:4010` · `LABS_SYMBOLOGY_API_BASE=http://192.168.1.111:4011`. Browser never talks to StudioOne; Next rewrite `web/next.config.ts:13–16` sends `/api/:path*` to Labs `:4000`.

**Attest column is empty on purpose.** SODP3 fills command + output. A row without file:line here is the SYM-SWAP hole.

| # | Service (StudioOne target) | Consumer today | file:line | Re-point (spec) | Today (honesty) |
|---|----------------------------|----------------|-----------|-----------------|-----------------|
| 1 | History / OHLC | `SaPriceChart` `GET {apiBase}/ohlc/{source}` default `/api/app/vp/v1` | `web/components/sa/SaPriceChart.tsx:86` (default) · `:182` (hydrate) · `:535` stream sibling · `:602` live re-GET · mounted `web/components/options-lab/VolumeProfileSaSurface.tsx:180` (no `apiBase` override) · also `web/components/admin/SaDevCanvas.tsx:260` (same default) | Labs hop → StudioOne history | **In-process fill** on StudioTwo Labs `:4000` |
| 2 | History / OHLC | `vp_display.get_source_ohlc` → `ohlc_for_source` | `server/routes/vp_display.py:108–123` · `server/sa_dev/service.py:369` (`ohlc_for_source`) · struck fill `server/sa_dev/service.py:307` (`_aggs_price_fill`) · call site `:413` | **delete** in-process BASE; hop only | Massive burst when `requested` or `span_days < 90`. Labs `:4000` has `POLYGON_API_KEY=SET` (pid 71066/71070) |
| 3 | History / OHLC | StudioOne `vp_api` `/v1/ohlc` print-chunks | `server/market_data/vp_api/app.py:397` (`ohlc_window`) · live listener StudioOne pid **74792** `*:4010` | **replace** with Massive-first provider | Print-store chunks only. **No Massive.** `:4012` empty (history not born) |
| 4 | Contracts | `VolumeProfileSaSurface` `/contracts/{source}` | `web/components/options-lab/VolumeProfileSaSurface.tsx:91` · route `server/routes/vp_display.py:101–105` · `server/sa_dev/service.py:224` (`contracts_for_source`) · vendor `server/market_data/vp_ingest/futures_contracts.py:72–83` | StudioOne | **In-process Massive REST** `GET /futures/v1/contracts` from StudioTwo Labs on each member GET (burst, not hopped) |
| 5 | Stream | `SaPriceChart` `/stream` | `web/components/sa/SaPriceChart.tsx:535` · `web/lib/saStream.ts:30` (`openVpStream`) · Next SSE hop `web/app/api/app/vp/v1/stream/route.ts:6–11` · Labs `server/routes/vp_display.py:126–138` · relay `server/sa_dev/stream.py:182` (`iter_live_sse`) → `:97` `GET {pin}/v1/stream` · sidecar `server/market_data/vp_api/app.py:474` | StudioOne (live tail only) | Hopped to StudioOne `:4010` when pin live; print-tail fallback `stream.py:123` if upstream ≠ 200 |
| 6 | VP structure / range / health | member surface + hop client | **health** `VolumeProfileSaSurface.tsx:67` → `vp_display.py:41` → `sa_dev/service.py:504` → `sa_dev/vp_client.py:334` (`GET {pin}/v1/health`) · sidecar `vp_api/app.py:209` **structure** `VolumeProfileSaSurface.tsx:64` → `vp_display.py:48` → `service.py:42` → `vp_client.py:241` (`GET {pin}/v1/profile/{target}/{kind}` `:274`) **range** `SaPriceChart` via `web/lib/saVpBand.ts:114` (`rangeUrl` → `{apiBase}/range/{target}`) → `vp_display.py:74` → `service.py:149` → `vp_client.py:287` (`GET {pin}/v1/profile/{target}/range` `:323`) | stay; attest still StudioOne | **Already hopped** (`vp_api_base` pin). Computing-class headers `vp_display.py:28–34` — member cookie not forwarded |
| 7 | Symbology | picker + Labs hop + sidecar | UI `web/lib/symbology/api.ts:3` `BASE=/api/symbology/v1` · `:27` `fetchUniverse` · `:38` `fetchResolve` · dialog `web/components/symbology/SymbolSearchDialog.tsx:86,113,219` · tile `VolumeProfileSaSurface.tsx:15` · Next hop `web/app/api/symbology/v1/[...path]/route.ts:4,14` · Labs hop `server/routes/symbology.py:128–162` (`_maybe_hop`) · sidecar `server/symbology_app.py:48–75` | stay; attest still `:4011` | **Already hopped.** StudioOne pid **26514** `*:4011`. Pin `http://192.168.1.111:4011` |
| 8 | `fetchGen` localStorage | short print series cache | `web/lib/saDelivery.ts:30` `LS_KEY=ft_sa_delivery_v1` · persist `:36–40` · `fetchGenWait` `:147` (OHLC; no `If-None-Match`) · `fetchGen` `:162` (cache-first) · `SaPriceChart.tsx:183–221` (`peek` only applied if `ohlcSpanDays >= 90`) | bust / refuse if `short_history` or span < window | Cache still wins on structure/range. OHLC hydrate uses `fetchGenWait` |
| 9 | Admin `/admin/sa-dev` | same Labs OHLC + admin-dev tree | page `web/app/admin/sa-dev/page.tsx:9` · canvas `web/components/admin/SaDevCanvas.tsx:107` health `/api/dev/sa/v1/health` · `:113` structure · `:260` `SaPriceChart` (**member** `/api/app/vp/v1` default) · admin routes `server/routes/sa_dev.py:40` health · `:47` structure · `:73` range · `:101` OHLC · `:116` stream · Next SSE `web/app/api/dev/sa/v1/stream/route.ts:6` · admin index `web/app/admin/page.tsx:95` | same hop | Two trees: admin-dev `/api/dev/sa/v1/*` **and** member OHLC via default `apiBase` |
| 10 | Tests | TestClient in-process | member OHLC/health/stream `server/tests/test_vp_display.py:7,13,16,28` · admin OHLC deny `server/tests/test_sa_dev_api.py:231` · admin stream `server/tests/test_vp_stream.py:28,46` · sidecar health `server/tests/test_vp_api_http.py:20` · live symbology pin `server/tests/test_symbology_studioone_live.py:20` · `fetchGen` unit `web/lib/saDelivery.test.ts:7,15` | in-process mock **or** live StudioOne pin | No silent fill in these tests (sa_dev tests pin `mock://`). Live OHLC fill is **not** covered as a hop |
| 11 | Market Bus `/api/me/market/*` + WS | Labs Redis + **StudioTwo** `chain_feed` | **SODP-MB hold — do not bootout this writer in SODP5.** Routes: `server/routes/market_ohlc.py:21` · `market_stream.py:113` · `chain_ladder.py:477` bus-metrics · `:495` ladder · `:782` expirations · `market_session.py:20` · `market_universe_admin.py:137` · `volume_profile.py:55` · `:132` raw/day. UI: `web/lib/market/MarketSocket.ts:13` · `web/lib/marketOhlcApi.ts:86` · `web/lib/marketOhlcSeries.ts:160` · `web/lib/chainLadderApi.ts:124,186` · `web/lib/capitalApi.ts:268` · `web/lib/market/sharedUniversePoll.ts:8,39` · `web/lib/market/useLiveUnderlierMarks.ts:30` · `web/lib/market/usEquitySession.ts:66` · `web/components/options-lab/surface/SurfaceApp.tsx:607` · `web/components/options-lab/OpfRiskAnalyzer.tsx:232` · `web/lib/options-lab/timeOrthoTapeCache.ts:136` | **SODP-MB** (named) | StudioTwo `chain_feed` pid **99058** `--interval 2` **live** (idle tonight). Writer for this row is **not** StudioOne chain_feed |

### Also in tree (do not orphan at SODP3)

| Path | file:line | Note |
|------|-----------|------|
| Unmounted `SaStructureChart` admin OHLC | `web/components/sa/SaStructureChart.tsx:118,145,154,242` | Calls `/api/dev/sa/v1/ohlc` + structure + range. **No other importer** (grep). Still a source path |
| Computing-class VP proxy | `server/routes/vp_contract_proxy.py:54` health · `:66` range · `:134` stream | Admin-only hop `/api/vp/v1/*` → pin. Not the member surface |
| Struck fill (TS-1) | `server/sa_dev/service.py:307–413` | SODP-7 delete target. Not a consumer to re-point — a writer to erase |

Three UI hosts (spec §14) consume the **same** hop contract. Tonight only StudioTwo is live as a UI host. MacBook = SODP6 named. MiniTwo = SODP4 named — **not this tree.**

---

## 2. Massive writers — StudioOne and StudioTwo

Recognition cache **named** (not “none found” as a blank). Standing Massive on that process = **0**.

### Recognition cache (Coach-named · SYM-13)

| Field | Evidence |
|-------|----------|
| **Name** | Cached recognition set `RECOGNIZED_UNSUPPORTED` |
| **Process** | StudioOne `python -m symbology_app` · launchd `ai.fattail.labs.symbology` · pid **26514** · listen `*:4011` |
| **Code** | `server/symbology/service.py:44` comment `Cached recognition set (SYM-13). Not a live Massive scrape.` · dict `:45–66` · resolve hit `:794–797` |
| **Standing Massive** | **0.** Sidecar docstring `server/symbology_app.py:4`: “No Massive on the hot path (SYM-13).” SYM1-DEPLOY-G: 0 connections |
| **Dedicated daemon** | **none found.** No `recognition-cache` launchd, no refresh interval, no Massive poller. In-process dict only |
| **Budget impact** | Do **not** add an interval before SODP2 GO. History remains burst-only |

### Standing / burst writers (live 22:42–22:45 ET)

| Host | Process | launchd | pid | Interval | Standing vs burst | Massive? | Notes |
|------|---------|---------|-----|----------|-------------------|----------|-------|
| **StudioOne** | `chain_feed --interval 2` | `ai.fattail.labs.chain-feed` | **538** | 2 s REST | **standing** (idle when no interest keys) | REST ladders | CP-1 sacred. RSS **71088**. last line `no interest keys; idle`. log `~/Library/Logs/fattail-labs/chain-feed.out.log` |
| **StudioOne** | `sym_feed --interval 5` | `ai.fattail.labs.sym-feed` | **82012** | 5 s REST | **standing · live tonight** | REST underlier mids | AFTER last line `sym MSFT mid=493.89 src=massive`. RSS **58928**. CPU 16.9% at 22:42, 0.0% at 22:45 |
| **StudioOne** | `vp_ingest.futures_feed` | `ai.fattail.labs.vp-futures` | **53424** | session WS | **standing WS** + daily `fetch_active_contracts` burst | `wss://socket.massive.com/futures` | prints = tail only for price. RSS 44624, 0.0% CPU |
| **StudioOne** | `ssr_live_capture` | `ai.fattail.labs.ssr-live-capture` | **2712** | disk 2 s | standing **reader** | **no** (`ssr_live_capture.py:4`) | SODP5 does **not** touch. Holds bus interest (warms chain_feed) |
| **StudioOne** | `symbology_app` | `ai.fattail.labs.symbology` | **26514** | — | not a writer | **0** | recognition cache (above) |
| **StudioOne** | `vp_api` | `ai.fattail.labs.vp-api` | **74792** | — | HTTP | **no** | print chunks `/v1/ohlc`. `*:4010` |
| **StudioOne** | `vp_engine.bin_loop` | `ai.fattail.labs.vp-engine` | **53072** | — | histograms | **no** | |
| **StudioOne** | history provider | — | — | — | **not built** | — | `:4012 empty`. no `ai.fattail.labs.history.plist`. no `/Users/ernie/fattail-market-data/history` |
| **StudioTwo** | `chain_feed --interval 2` | `ai.fattail.labs.chain-feed` | **99058** | 2 s REST | **standing** (idle) | REST ladders | **must count** until SODP-MB. RSS **73584**. elapsed **18d**. log `/tmp/labs-chain-feed.log` `no interest keys; idle`. `POLYGON_API_KEY=SET` |
| **StudioTwo** | `sym_feed` | — | — | — | — | — | **none found.** No process. No loaded label. **No plist** `~/Library/LaunchAgents/ai.fattail.labs.sym-feed.plist` |
| **StudioTwo** | leftover `vp_api` | `ai.fattail.labs.vp-api` | **66270** | — | HTTP `127.0.0.1:4010` | **no** (print store) | ghost that can mask hop. SODP5 (not SODP-MB) |
| **StudioTwo** | leftover `vp_engine.bin_loop` | `ai.fattail.labs.vp-engine` | **31332** | — | local store | **no** | looping `ES sessions_ingested would not be contiguous` |
| **StudioTwo** | Labs `uvicorn :4000` | (dev, not launchd) | **71066/71070** | on request | **burst** | yes (`POLYGON_API_KEY=SET`) | `_aggs_price_fill` · `fetch_product_ohlc` `/api/me/market/ohlc` · `contracts_for_source` → `/futures/v1/contracts` |
| **StudioTwo** | Next `:3000` | — | **25784** | — | UI | **no** | keep |
| **StudioTwo** | `plane-interest` | `ai.fattail.labs.plane-interest` | **14535** | — | Labs OPF | **no** | not a SODP5 target |

`vp_ingest/capture.py` (SPY stocks WS) — **none found** as a live process on either box tonight.

---

## 3. Combined CP-1 budget (spec §12 v0.1.5)

**Law (v0.1.5):** interim combined standing Massive = StudioOne (`chain_feed` + `sym_feed` + capture + recognition if standing) **plus StudioTwo (`chain_feed` + `sym_feed`)** until SODP-MB. A number that omits a live writer does **not** satisfy SODP-8.

### Standing set tonight (both machines)

| Slot | Counted? | Live evidence |
|------|----------|---------------|
| StudioOne `chain_feed` 2 s REST | **yes** | pid 538, idle |
| StudioOne `sym_feed` 5 s REST | **yes** | pid 82012, `src=massive` mids |
| StudioOne capture WS (`vp-futures`) | **yes** | pid 53424 |
| Recognition cache if standing | **no interval** | named; standing Massive = 0 |
| StudioTwo `chain_feed` 2 s REST | **yes** | pid 99058, idle — **omitting this is FAIL** |
| StudioTwo `sym_feed` 5 s REST | **slot empty** | none found (do not invent a 4th REST loop) |

**Interim combined standing = 3 REST loops + 1 futures WS.** Not 2. Not “StudioOne only.” After SODP-MB, StudioTwo `chain_feed` drops out of the standing set (and only then).

### Arithmetic vs chain_feed headroom

| Resource | chain_feed (sacred, both) | Combined tonight | History (SODP2 draft — do not run) |
|----------|---------------------------|------------------|-------------------------------------|
| Massive REST standing | SO 2 s idle + ST 2 s idle | **+ SO `sym_feed` 5 s live** | **0 standing** |
| Massive WS standing | none | + SO `vp-futures` | none |
| Burst | 0 while idle | Labs `:4000` fill / contracts / `/api/me/market/ohlc` on demand | 1 paginated GET/(vendor,tf) on miss; first ES+MES = **2 REST bursts**, post-close or HOLD |
| CPU (22:42 ET) | SO 0.1% · ST 0.0% | SO `sym_feed` **16.9%** at first sample (0.0% at 22:45) | expect ~60 MB idle FastAPI; burst only during fill |
| RSS | SO **71088** · ST **73584** | SO `sym_feed` 58928 · capture 44624 | sibling `:4012` |
| Disk | Redis `mb:*` + logs | capture on StudioOne 2TB path (not touched) | **internal Data** `/Users/ernie/fattail-market-data/history` — **absent tonight** |
| Port | none | SO `:4010` `:4011` · ST leftover `:4010` | `:4012` empty |
| Redis CONFIG | — | do not raise `vp:hot` | **none** for history cache |

**Headroom (Foxtrot measure):** both `chain_feed` processes are idle (`no interest keys`). That is **not** a free Massive account. StudioOne `sym_feed` is the live REST consumer on this Saturday night (`src=massive` mids still writing at 22:45). Shared one account. Two historical aggs pages (ESZ6 ~5 pages) **must HOLD** against that combined set, or wait until standing is unchanged **and** after 16:00 ET. CP-1 pessimism: **SODP2 fill is HOLD** until a named GO shows headroom vs **3 REST + 1 WS**, not vs StudioOne `chain_feed` alone.

History remains **0 standing**. Recognition adds **0**. Do not edit chain-feed plists. No Redis `CONFIG SET`.

### CP-1 (c) BEFORE / AFTER this packet

| | BEFORE 22:42:54 ET | AFTER 22:45:00 ET |
|--|--------------------|-------------------|
| StudioOne `chain_feed` | pid **538** · RSS **71088** · 0.1% CPU · elapsed 04-15:13:15 · `--interval 2` | pid **538** same · RSS **71088** same · 0.0% CPU · elapsed 04-15:15:21 |
| last-snapshot SO | log mtime 22:42 · last line `no interest keys; idle` · size 38 014 955 | mtime **22:44** · last line `no interest keys; idle` · size **38 016 335** (still writing) |
| StudioTwo `chain_feed` | pid **99058** · RSS **73584** · 0.0% CPU · elapsed 18-07:00:30 | pid **99058** same · RSS **73584** same · 0.0% CPU · elapsed 18-07:02:36 |
| last-snapshot ST | `/tmp/labs-chain-feed.log` mtime 22:42 · idle · size 32 484 969 | mtime **22:44** · idle · size **32 486 372** |
| SO `sym_feed` | pid **82012** · 16.9% CPU · `src=massive` | pid **82012** · 0.0% CPU · last `sym MSFT mid=493.89 src=massive` |
| SO vp-api `:4010` | pid **74792** `*:4010` | pid **74792** unchanged |
| SO symbology `:4011` | pid **26514** `*:4011` | pid **26514** unchanged |
| `:4012` | empty both hosts | empty both hosts |

**AFTER: chain_feed not degraded** on either machine. Saturday idle on ladders is expected (ES closed Friday 17:00 ET). `sym_feed` still talking to Massive.

**Rollback of this packet:** none (read-only). SODP2 rollback (when named): `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.history.plist` — does **not** exist tonight.

---

## 4. Leftover StudioTwo launchd (vp-api, chain-feed, vp-engine)

Hostname `StudioTwo.local` uid **501**. Keep: Next `:3000` (pid 25784) · Labs `:4000` (71066/71070) · Redis 127.0.0.1:6379 · `plane-interest` (14535). **`:4011` / `:4012` empty.** FatTail2TB **not** mounted. Local store `/Users/ernie/fattail-market-data`.

| Leftover | launchd | pid | Listen | Notes |
|----------|---------|-----|--------|-------|
| `vp-api` | `ai.fattail.labs.vp-api` **running** | **66270** | **127.0.0.1:4010** | health 401. RSS 121 MB. elapsed 1d9h. `POLYGON_API_KEY=SET` (not a standing Massive poll). Ghost vs hop |
| `chain_feed --interval 2` | `ai.fattail.labs.chain-feed` **running** | **99058** | — | **second Massive account caller.** idle. RSS 73584. elapsed **18d**. **SODP-MB hold — do not bootout in SODP5** |
| `vp-engine bin_loop` | `ai.fattail.labs.vp-engine` **running** | **31332** | — | local store. looping `ES sessions_ingested would not be contiguous` (sessions 2026-09-08…18, weekend gap). RSS 123 MB |

**Plist on disk, not loaded (do not load):**

- `~/Library/LaunchAgents/ai.fattail.labs.ssr-live-capture.plist`
- `~/Library/LaunchAgents/ai.fattail.labs.vp-futures.plist`

**No StudioTwo `sym-feed` plist.** No `symbology` / `history` labels.

SODP5 (after SODP3 attests) still targets leftover **vp-api** + **vp-engine** (process, plist, grep). **Not** `chain_feed` until **SODP-MB** (SODP-11). Capture on StudioOne stays. Do not execute SODP5 tonight.

---

## Isolation

No LIM / QFRIC / XS / PPL / Help Watch / GC files. No `_aggs_price_fill` repair. No StudioOne git pull (left at **`36699be9`**). No MiniTwo. No stop of `:3000`/`:4000`. Capture untouched.

---

**REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN.** Combined standing counted **both** machines. Recognition cache **named** (`symbology_app` / SYM-13 dict, standing Massive = 0). StudioTwo `sym_feed` = **none found**. SODP2 history code is **not** authorized by this inventory.
