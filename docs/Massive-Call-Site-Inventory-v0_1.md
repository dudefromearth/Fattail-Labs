# Massive call-site inventory v0.1

**Inventory v0.1.** Read-only. Nothing in this inventory is built.
**Machine:** StudioTwo. Tree was not checked out onto the production sha. Citations are `git show` / `git grep` / `git blame` of `refs/remotes/minitwo/prod-2026-09-24`.
**Sha:** `70453700a3225ea5f4920f8f44000f6cdda3cb71`. Commit 2026-09-24 12:32 ET, `fix(help): dark-mode text invisible in Help widget inputs`. That object is MiniTwo's production checkout. It is not on origin.
**Pattern:** `MassiveClient(`, `.fetch_<method>(`, `MASSIVE_API`, `api.massive.com`, `polygon.io`, under `server/` and `web/`, tests separated.
**Web:** zero matches. The browser does not call Massive. It calls Labs routes.

Production observation, not re-sampled this turn. Diagnostic v0.1 read the environment of API pid 77873 (started Mon 2026-09-28 11:26:52 ET, `uvicorn main:app --host 127.0.0.1 --port 4000`, no `--workers`). That process had no `LABS_MARKET_BUS` and no `LABS_SSR_ARCHIVE_URL`. The process was not restarted for this inventory.

---

## 1. Every direct call

"Direct" is a line that constructs `MassiveClient`, calls a `fetch_*` method, or opens `api.massive.com` without the client. Comments and the client's own internal `self.fetch_*` calls are not rows. A job is not a member request.

The bus column is `LABS_MARKET_BUS` / `get_store()` in that file. "Unset" means the production API process above had the variable absent, so `bus_enabled()` is false in that process. A feed that forces the variable on inside its own process is a different process.

| File:line | Call | Reached from | Member request | Bus or archive beside it |
|---|---|---|---|---|
| `server/routes/chain_ladder.py:284` then `:301` | `MassiveClient()` + `fetch_option_chain` (max_pages=3) | `GET /api/me/market/chain-ladder` → `_fetch_ladder` → `_fetch_ladder_uncached` on Redis miss or bus off | Yes. Runner live ladder | Yes. `_fetch_ladder` reads `mb:ladder:{chain_ul}:{exp}:w{wings}:dual` when the bus is on (`:409`). **Unset in the production API.** Miss still calls this row |
| `server/routes/chain_ladder.py:220` | `fetch_option_chain` spot probe | Same fill, `_probe_spot`, called at `:288` | Yes | Same bus branch. Probe runs only after the miss falls through to the fill |
| `server/routes/chain_ladder.py:756` then `:770` | `MassiveClient()` + `fetch_option_chain_until` (max_pages 20–80) | `GET /api/me/market/chain-ladder/expirations` → `_scan_expirations_live` when the preform calendar is missing or short | Yes. Runner page loads this (`web/lib/chainLadderApi.ts:124`, `HeatmapChainPanel.tsx` expiration load) | No bus read. MySQL preform calendar is preferred when `calendar_is_fresh`. Live scan is the miss |
| `server/routes/market_session.py:62` | `MassiveClient()` then `urlopen` `/v1/marketstatus/now` (timeout 12s) | `GET /api/me/market/session-status` | Yes | Yes. Redis `mb:session:market_status` first (`:33–37`). **Unset, so the request calls Massive** |
| `server/market_data/ohlc_service.py:247` then `:253` | `MassiveClient()` + `fetch_aggs` | `GET /api/me/market/ohlc` → `aggs_service.fetch_product_ohlc` | Yes. Options Lab charts | No bus flag. A MySQL bar store is tried first (`:199–241`). Massive is the fall-through when that store does not return bars. `ohlc_feed.py:172` is the writer job, not this request |
| `server/market_data/underlier_marks.py:268` | `MassiveClient()` inside `ensure_fresh_underlier_marks` | `GET /api/me/market/universe` and `GET /api/admin/market-universe` | Yes, when marks are stale | Yes. Bus read when `bus_enabled()` (`:97–101`, `:193–198`). **Unset, so a stale mark refreshes from Massive on the request** |
| `server/market_data/universe_admin.py:201` | `MassiveClient()` inside `validate_with_massive` | `POST /api/admin/market-universe/validate` | Admin request | No |
| `server/market_data/correlation.py:141` and `:196` | `MassiveClient()` + `fetch_daily_closes` | `GET /api/me/strategy-lab/curate/correlation` and `…/correlation/relative` | Yes | No |
| `server/market_data/trade_chart_service.py:221` then `:257` and `:382` | `MassiveClient()` + `fetch_aggs` | `GET /api/me/trade-log/trades/{trade_id}/chart` | Yes | No bus and no archive URL in this file |
| `server/routes/algo_replay.py:53` then `:61` | `MassiveClient()` + `fetch_aggs` (1-minute) | `GET /api/me/options-lab/algo-replay/path` when the stored path has no samples | Yes, that miss only | Stored primitive path is preferred. No bus |
| `server/market_data/chain_feed.py:70` | calls `chain_ladder._fetch_ladder_uncached` (the `:284` client) | `python -m market_data.chain_feed` | No. Feed process | This is the writer of the Redis ladder. It is supposed to be the Massive caller |
| `server/market_data/chain_collector.py:130` then `:75` | `MassiveClient()` + `fetch_option_chain` | collector CLI | No | No bus branch in the file |
| `server/market_data/live_stream.py:294` then `:45`, `:107`, `:146`, `:200` | `MassiveClient()` + chain, underlier mark, prev-day | `live_stream` poller (`--interval` default 5s) | No | No |
| `server/market_data/sym_feed.py:69` then `:114`, `:118`, `:120`, `:125` | `MassiveClient()` + index mark / underlier mark | `sym_feed` process. The process sets `LABS_MARKET_BUS` default `1` (`:45`) and exits if the bus is off | No | The bus is the store it writes. It does not skip Massive |
| `server/market_data/ohlc_feed.py:172` then `:51` | `MassiveClient()` + `fetch_aggs` | OHLC feed job | No | Writes the durable store the member OHLC route reads first |
| `server/market_data/raw_campaign.py:276` then `:158`, `:160`, `:162` | `MassiveClient()` + trades, quotes, aggs | campaign job | No | No |
| `server/market_data/vp_ingest/vendor_day.py:175` and `:189` | `MassiveClient()` + `fetch_trades_day` / `fetch_futures_trades_session` | VP vendor-day job | No | No |
| `server/market_data/vp_ingest/futures_contracts.py:105` | raw `https://api.massive.com` (not `MassiveClient`) | VP futures-contract job | No | No |
| `server/market_data/vp_ingest/futures_feed.py:222` | Massive websocket key | VP futures WS job | No | No |
| `server/market_data/vp_ingest/capture.py:219` | Massive websocket key for SPY trades | VP capture job | No | No |
| `server/sa_dev/futures_history.py:238` | `MassiveClient()` + `fetch_futures_aggs` | History provider. Member VP OHLC hops to StudioOne `:4012` first (`server/routes/vp_display.py:230`) | The hop is the member path. This call is the provider behind it when that provider runs | The hop is the beside-path. This line is the Massive side of that provider |
| `server/market_data/p2_conditions_probe.py:61` | `MassiveClient()` + `fetch_aggs` | probe script | No | No |
| `server/market_data/p2_index_entitlement.py:32` | `MassiveClient()` + `fetch_trades_day` | probe script | No | No |

`server/market_data/massive_client.py` is the client. Default `timeout_s` is 60.0 (`:38`). `urlopen` uses that timeout (`:68`). Host default `https://api.massive.com` (`:50`). `POLYGON_API_KEY` is an env-name fallback (`:43`). No production line calls `polygon.io`.

`server/routes/market_ohlc.py` catches `MassiveClientError`. It does not construct the client. The call is the OHLC row above.

### Tests

Not production routes. `server/tests/test_chain_ladder.py`, `test_futures_history.py`, `test_opf_session_envelope.py`, `test_trade_chart_service.py` construct or patch `MassiveClient`.

---

## 2. Runner template → fetch → Massive

Registry at this sha: `web/lib/options-lab/templates/registry.ts`. Switcher list is `memberHeatmapTemplates()`. `gex-cal` is included because production `web/.env.production` has `NEXT_PUBLIC_LABS_HEATMAP_TERM_MASS=1` (`termMassFlagOn`, `gexCal.ts:68–70`). Default template id is `sym-fly`.

Every template on the live page mounts `useOptionChainBus` (`HeatmapChainPanel.tsx:695`). That poll is `GET /api/me/market/chain-ladder`. With the bus unset, a cache miss calls Massive (section 1, first row). The page also loads expirations (`chainLadderApi.ts:124`), which calls Massive when the preform calendar is missing or short.

Replay does not call Massive. `useChainAtPlayhead` (`HeatmapChainPanel.tsx:934`) returns the live context when replay is off (`tmChainAtT.ts:274`). When replay is on and the projector is the archive, `fetchChainAtT` reads the archive.

| Id | Picker label | Layout | Live fetch | Calls Massive on the request |
|---|---|---|---|---|
| `sym-fly` | Butterfly (advanced) | matrix | `useOptionChainBus` → chain-ladder | Yes, on bus miss. Bus unset in production |
| `bw-fly` | Broken Wing Butterfly | matrix | same | Yes, on bus miss |
| `width-fit` | Butterfly (width fit) | matrix | same | Yes, on bus miss |
| `vertical` | Vertical Spread | matrix | same | Yes, on bus miss |
| `lim` | GEX (quad window) | quadrant | same | Yes, on bus miss |
| `gex` | GEX (traditional) | profile | same | Yes, on bus miss |
| `ladder` | Strike Ladder (raw data) | table | same | Yes, on bus miss |
| `gex-cal` | GEX (term mass) | matrix-profile | the bus poll, plus `useGexCalPack` serial `pollChainLadder` for up to 7 expirations (`useGexCalPack.ts:105–114`, `TERM_MASS_EXPIRY_COUNT = 7`) | Yes. Seven serial chain-ladder fills, each a Massive miss path |

`gex-cal` is the only template whose layout is `matrix-profile`. The pack runs only then (`HeatmapChainPanel.tsx:705`).

---

## 3. When each direct call was introduced

`git blame -L` on `refs/remotes/minitwo/prod-2026-09-24`. Author on every line is the git author Ernie Varitimos. A DL is listed only when the decision log, on that date, names the program the commit names. "None" means no decision-log entry was matched to that line.

| Call | Date (ET) | Commit subject | DL or spec |
|---|---|---|---|
| `chain_ladder.py:284`, `:756` | 2026-08-10 11:22 | feat(chain-picker): ladder API, H/E/U/K/P heal, preform calendar | DL-285, DL-286. Chain Picker Spec v1.0.2. Market Bus Spec. Arch 28 is the disabled-bus path (process cache, Massive on miss) |
| `chain_ladder.py:220`, `:301`, `:770` | 2026-08-10 13:12 | fix(options-lab): broker-style wings, listed strikes, exact strike display | Same day as DL-285 / DL-286. OC6a is the picker spec |
| `market_session.py:62` | 2026-08-10 20:59 | feat(market): dual-side option chain generation (HM15–20) | Same day as DL-286. No separate entry names this urlopen |
| `sym_feed.py:69` | 2026-08-10 14:45 | feat(market-bus): Options Lab on shared client, sym feed, deploy, AT pack | DL-286 |
| `sym_feed.py:114` | 2026-08-29 21:39 | feat(market-bus): native VIX/VIX1D index snapshot marks | DL-625 |
| `ohlc_service.py:247` | 2026-08-10 15:42 | feat(options-lab): Volume Profile candles with 3y history all TFs | None for this line |
| `ohlc_feed.py:51`, `:172` | 2026-08-11 11:47 | feat(ohlc): durable store with one-shot bootstrap and morning append | None for this line |
| `trade_chart_service.py:221` | 2026-08-10 07:52 | fix(trade-chart): selection-aware Entry/Exit markers; Yahoo SPX fallback | None for this line |
| `underlier_marks.py:268`, `live_stream.py:45` | 2026-08-11 13:20 | fix(marks): bind underlier rows to native product mids on the data plane | None for this line. `live_stream.py:294` is older (2026-08-06 07:57, Curate marks) |
| `correlation.py:141`, `:196` | 2026-08-06 07:57 | feat(strategy-lab): multi-member Curate bots, shared marks, Deploy reports | None for this line |
| `universe_admin.py:201` | 2026-08-09 13:56 | feat(practice): positions valuation, mark universe admin, marked underliers | None for this line |
| `chain_collector.py:75`, `:130` | 2026-08-01 14:15 | feat: Strategy Lab Tradier/Massive path, chain archive, lesson body save fix | None for this line |
| `algo_replay.py:53` | 2026-08-20 22:53 | feat(options-lab): Analyzer Time Machine day replay (AZ-ATM) | DL-486 is that feature, same day. The log does not separately authorize this aggs fill |
| `raw_campaign.py:276`, `p2_conditions_probe.py:61` | 2026-08-12 17:22 | feat(market-data): full-estate raw campaign, VP bins, catalog migration | None for this line |
| `p2_index_entitlement.py:32` | 2026-08-13 10:29 | feat(ssr,vp): land surface-replay thesis and VP plane honesty | None for this line |
| `vp_ingest/vendor_day.py:175`, `:189`, `capture.py:219` | 2026-09-18 15:42 | feat(vp): vendor day REST fetch, autorun continues, horizon 126 (DL-759) | DL-759 |
| `vp_ingest/futures_contracts.py:105` | 2026-09-19 10:04 | fix(vp): add futures_contracts so production API can import lead_contract | None for this line |
| `vp_ingest/futures_feed.py:222` | 2026-09-19 23:55 | chore: land leftover untracked specs, boards, and VP service files | None for this line |
| `sa_dev/futures_history.py:238` | 2026-09-19 23:14 | feat(sodp): F3 history on StudioOne :4012; hop; delete fill | StudioOne Data Plane spec v0.1, SODP-5. The commit names the hop |

`chain_feed.py:70` is a call into the 2026-08-10 ladder fill. The feed's own file is not a second Massive client.

---

## 4. GO / NO-GO

**GO.** The structural spec covers the Runner live-ladder request path: `GET /api/me/market/chain-ladder` and `GET /api/me/market/chain-ladder/expirations`. Those are the Massive calls the Runner page makes. The bus read already exists on the ladder route and is unset in the production API. That is the failure the 500 diagnostic measured (85,309 chain-ladder proxy failures on 2026-09-28 11:26–19:06 ET).

**NO-GO.** This spec does not take the whole market-data path. OHLC, session-status, underlier marks, Curate correlation, trade-chart, algo-replay, the collector, the feeds, and VP ingest are real Massive sites. They stay listed here. Coach scoped the spec to the live ladder and said nothing else in Runner changes. Session-status (6,867 proxy failures that day) and OHLC (1,782) are adjacent member paths. They are out of this spec until Coach names them.

The spec that follows this GO is `docs/Runner-Live-Ladder-Data-Plane-v0_1.md`. Its plan is `docs/Runner-Live-Ladder-Data-Plane-Full-Agent-Bench-Plan-v1.0.md`. Status of both is PLAN.
