# Labs member market-data path — full agent bench plan v1.3

**Plan v1.3.** Supersedes `docs/Labs-Member-Market-Path-Data-Plane-Full-Agent-Bench-Plan-v1.2.md`.
**Status: ACCEPTED.** DL-807. The acceptance records the socket move, the two canary ids, and the Phase 3 naming. It dispatches nothing. Ladder W1 has not started. Ladder W2 reads the socket section below and has not started. Phase 5 has not started. No canary loads.
**Accepted baseline:** plan v1.2, committed as written with spec v0.2 and DL-806 (`a213a1f7`). Those three are not edited.
**Spec:** `docs/Labs-Member-Market-Path-Data-Plane-v0_2.md`. Row 10 still names the stream's replacement. This plan is when that replacement runs. Spec v0.2 is not edited.
**Phase 1 file, not edited:** `docs/Runner-Live-Ladder-Data-Plane-Full-Agent-Bench-Plan-v1.1.md`.

| Change from v1.2 | What v1.3 says |
|---|---|
| Socket | Moved into Phase 1, W2–W4. Same `_fetch_ladder` arguments, same `mb:ladder:{chain_underlier}:{expiration}:w{wings}:dual` key, same `mb:ladder-last:…` read, same 2-second budget. It rides the ladder canary and the ladder cut |
| Canary ids | On file for every phase, including ladder W3: identity_id 10 and identity_id 12 |
| Phase 3 job | A first standing-up of `ohlc_feed` on StudioOne. The feed has never run. The packet is not a gap-closer. The MiniTwo example plist is not installed |
| Phase 5 | Positions valuation only. Spec v0.2 row 9. The stream's ladder calls are the socket section of this plan |

The packet body below is v1.2 with those four amendments. Q1, Q2, Q3, and CP-1 are unchanged. One production cut per phase still holds. The socket shares Phase 1's cut. Phase 5 remains the later cut, and that cut is valuation.

**Phase 1 law:** ladder plan v1.1, plus the socket section in this file. W0 of the ladder plan is MATCH. W1 of the ladder plan has not started. This plan does not edit the ladder spec or either ladder plan. Ladder W2 reads this file before it starts.
**Inventory:** `docs/Massive-Call-Site-Inventory-v0_1.md`. The ladder-era GO line there stays. This spec is the grant that line declined.
**Machine:** StudioTwo writes and tests. MiniTwo is production. StudioOne is the data plane. CP-1 on every StudioOne packet.
**Date:** 2026-09-29.

| Change from v1.0 | What v1.1 says |
|---|---|
| Q1 | Ruled. Bars for rows 4 and 5 are `:4012`, as v1.0 drew them: `GET /history/v1/store-bars`, token `LABS_HISTORY_READ_TOKEN` |
| Q2 | Ruled. One production cut per phase |
| Q3 | Ruled. Session-status keeps today's keys. No `stale` field is added. Spec §2's "no new JSON key" governs over row 2's wording. The served-last document is signalled by nothing new. W0 notes the discrepancy as a spec wording error and does not FAIL for it |
| Canary | Composition, for every phase: Coach's own identity and one administrator. The v1.1 acceptance text left both values as the unfilled tokens `[my identity id]` and `[admin identity id]`. v1.3 names them: identity_id 10 and identity_id 12. No member identity |

The packet body below is v1.0 with those rulings written in. CP-1, the ship bar, and the phase packets are unchanged except where a ruling replaces an open question.

Nothing in this plan restarts an API, edits a feed's Massive call, changes a Labs control, screen, selector, or default, or puts data-plane code on Tuesday's restart.

---

## Phase 1 — ladder plan v1.1, plus the socket

Phase 1 is the Runner ladder. Packets, gates, and the Tuesday restart are plan v1.1. The live-grid socket is the section below. Ladder plan v1.1 is not edited.

| Fact this plan relies on | Where it already lives |
|---|---|
| Reach path `GET /api/ladder` on StudioOne `:5055`. The bus is not | Plan v1.1, DL-803 |
| W0 MATCH | `agents/p-runner-live-ladder/gate-reports/W0-G-v0_1-2026-09-28.md` |
| W1 starts only after that MATCH and after P2 is on the production API | Plan v1.1 schedule. P2 is not on the process yet. This plan does not start W1 |
| Tuesday 2026-09-29 after 16:00 ET | One restart of `ai.fattail.labs.api` carries P5, P1, and P2. Data-plane code is not in it |
| W3 canary | `LABS_LADDER_HOP_IDENTITIES` set to identity_id 10 and identity_id 12. Those two ids are on file for every phase. No member identity. Writing them here does not load the canary. W3 is still a later close, and it is not Tuesday's restart |
| W4 | Deletes `LABS_LADDER_HOP_IDENTITIES` and the Massive branches of the two ladder handlers, and, by the socket section below, the socket's reach to those branches. One MiniTwo API restart, the same restart ladder plan v1.1 already names. This plan does not edit the ladder file |

REQ-013 stays open. Accepting this plan does not accept, delay, or close the ladder.

---

## Socket — Phase 1, W2 through W4

Yes. The market-stream socket's `_fetch_ladder` calls take the same `:5055` hop as the ladder route, inside Phase 1, on W2, W3, and W4.

Subscribe and the push loop call the same function the ladder handler calls, with the same arguments. In `server/routes/market_stream.py` the subscribe loop and `_chain_push_loop` each run `asyncio.to_thread(cl._fetch_ladder, …)` with `product`, `chain_underlier`, `kind`, `expiration`, `side`, `wings`, and `strike_step_cfg`. `_bus_ladder_key` in `server/routes/chain_ladder.py` is `mb:ladder:{chain_underlier}:{expiration}:w{wings}:dual`. Side is an argument of that function and is not in the key. The document returned is the ladder dict the socket already wraps. The `:5055` route is the read of that hot key and of the last document `mb:ladder-last:…`, the shadow key ladder plan v1.1 already assigns that route to write. The hop timeout is 2 seconds. Both calls already run off the event loop, in the thread `asyncio.to_thread` provides, so that budget sits where the fill sits today. `_PUSH_INTERVAL_S` stays 2.0.

Spec v0.2 row 10 places this caller in Phase 5. Coach moved the caller on 2026-09-29. This section is that move. The replacement spec v0.2 names is unchanged: the same hop, the same key, the same last document, the same 2-second budget. Spec v0.2 is not edited.

**W2, read with ladder plan v1.1's W2.** StudioTwo. After W1's tests exist. Not loaded on StudioOne during RTH. Not deployed to MiniTwo. This writing does not start W2.

- The member ladder handler hop stays as ladder plan v1.1 wrote it.
- For an identity on the allow-list, subscribe and every push call that same hop instead of the Massive miss. One helper serves the handler and both socket call sites. The query is the route's query: chain underlier, expiration, and the wings the route clamps to wings_effective, so a wings 100 subscribe addresses `w50` the same way the HTTP hop does. Bearer `LABS_SSR_ARCHIVE_TOKEN`. Base `LABS_SSR_ARCHIVE_URL`. Timeout 2 seconds. The call stays inside `asyncio.to_thread`.
- The allow-list is checked on `claims["identity_id"]` in the socket. The handshake already holds those claims (`claims_or_none` on the websocket, before the push task starts). W2 passes that identity into `_chain_push_loop`. `_fetch_ladder` takes no identity, so the check stays in the caller.
- Allow-list unset, or an identity outside the list: today's `_fetch_ladder` fill. A deploy with the env unset does not change the grid.
- Allow-list non-empty and `LABS_SSR_ARCHIVE_URL` missing: fail loud, the same rule as the handler.
- The socket does not write `mb:ladder-last:…`. The `:5055` route owns that SET. The socket's existing local `set_json` runs only when a local store exists, and when it runs it uses the wings_effective on the document the hop returned. MiniTwo has no Redis, so that block does not run there. It is not a second last-document writer.
- Positions valuation keeps calling `_fetch_ladder` until Phase 5. W2 does not point that caller at the helper.

The socket's symbol frames and its session frame are not these calls. They stay with Phase 2.

**W3.** The same canary, the same close, the same restart as ladder W3. Identities 10 and 12. The hour in the P2 log includes a socket subscribe and a push for those two ids, durations inside 2 seconds, and a socket outside the list still on today's fill. `chain_feed` before and after, undegraded. The report carries no member name and no member identity id.

Footprint on StudioOne is the ladder route's footprint: a Redis GET per subscribed book per push, through the route W2 already adds, and on a hot hit the route's existing SET of `mb:ladder-last:…`. Zero new Massive connections. No `chain_feed` plist. No new port. The socket adds no route.

Rollback is the ladder route's rollback: remove the new route from the `:5055` process and kickstart that process only. Do not kickstart `chain_feed`. The MiniTwo side restores the previous revision of the socket caller and the ladder handler together.

**W4.** The same later close and the same MiniTwo API restart as ladder W4. After that restart the socket is on the hop for every identity, together with the two ladder handlers. Ladder plan v1.1's grep still names `get_chain_ladder` and `list_chain_ladder_expirations`. This plan adds `market_stream` and `_chain_push_loop` to the gate: they do not reach `MassiveClient`, `fetch_option_chain`, `fetch_option_chain_until`, or `_fetch_ladder_uncached`. The Massive miss inside `_fetch_ladder` stays reachable from positions valuation until Phase 5. W4 does not delete that miss out from under that caller, and it does not edit ladder plan v1.1.

Hot key absent, last document present: the socket sends that last ladder. The ladder's existing `stale` field is the one the route already puts on the document. The socket adds no browser key. Neither document: the socket's existing chain error, immediately, inside the 2-second budget.

---

## Allow-list, shared with Phase 1 without editing W4

Phase 2 uses the same two identities and the same variable, `LABS_LADDER_HOP_IDENTITIES`.

- While the variable still exists (after ladder W3, before ladder W4), session-status and universe read it. The ladder handlers keep reading it exactly as plan v1.1 says. The socket reads the same variable, on the same two ids, as the socket section says.
- Ladder W4 still deletes the variable on its own close. This plan does not ask W4 to wait. That close is also the socket's cut.
- If W4 has already deleted the variable when Phase 2's canary is ready, Phase 2 restores the same variable and the same two ids, and only session-status and the universe lists consult it. The ladder and the socket stay on the hop for every identity, because W4 already removed their Massive branches.
- The ids on file, for every phase, are identity_id 10 and identity_id 12. Coach's own identity and one administrator. No member identity. Phase 2's canary still waits for its own close. This writing does not load it.

Phases 3 and 4 use those same two ids. They do not create a second list.

---

## CP-1, on every StudioOne packet (DL-707)

The chain-snapshot collection on StudioOne (`chain_feed` and its supporting jobs) is never disrupted. If any step could disrupt it — including indirectly via shared Massive account connection or rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is redesigned or held until after 16:00 ET. Every StudioOne packet carries this, states its footprint, records `chain_feed` pid and last-snapshot freshness before and after, and has one rollback line. A degraded `chain_feed` after the step is a FAIL, and the rollback runs.

A new job that calls Massive runs its first cycle after 16:00 ET. `ohlc_feed`, `sym_feed`, `live_stream`, `chain_feed`, collectors, VP ingest, and probes keep the Massive calls they already have. This plan does not edit those calls.

---

## Schedule

| When | What | Restart |
|---|---|---|
| W0, already MATCH | India, read-only, StudioTwo. Not re-run for v1.3 | None |
| Phase 1, already scheduled | Plan v1.1, plus the socket section for W2–W4. W1 after P2 is on the production process. W2 has not started | Tuesday's one API restart is P5+P1+P2 only. The socket rides the later ladder canary and the later ladder cut |
| Ids 10 and 12 are on file. Phase 2 still waits for its own dispatch | Phase 2 tests, then code, then a canary on `:5055` | StudioOne: `:5055` only, after a close. MiniTwo: one API restart for the Phase 2 hop behind the two ids. Not Tuesday's restart |
| A later close, after Phase 2's canary hour is in the P2 log | Phase 2 production cut. Fallback deleted | One MiniTwo API restart |
| After that cut | Phase 3. First standing-up of `ohlc_feed` on StudioOne, then the two bar routes | StudioOne job after 16:00 ET. MiniTwo cut is its own later close |
| After Phase 3's cut | Phase 4. Scheduled jobs, then the routes lose their fetch | StudioOne jobs after 16:00 ET. One MiniTwo cut of its own |
| After Phase 4's cut | Phase 5. Positions valuation only. Not dispatched with this draft | One MiniTwo cut of its own, after a close |
| The close of Phase 5, after one regular-hours session | Program ship bar. Lima replaces the Arch 30 `not_configured` line | No extra restart for the doc |

P2's access line (time, duration, status, path) is the clock for every canary hour. A phase does not measure until that line is on the production API. The proxy log is read at the program ship, not as a substitute for the hop timeout.

An unset hop URL is a 503 on a route that has been configured to hop, from that route's canary onward. It becomes a boot failure at the Phase 4 cut, with the Arch 30 edit. Routes that have not reached their cut keep today's behavior until that cut.

---

## W0 — India

Dispatched with the v1.1 acceptance, and already MATCH against spec v0.1. StudioTwo. Read-only. The ladder plan v1.1 is Phase 1. That gate stands. It is not re-run for v0.2.

Confirm:

- This plan does not revise ladder spec v0.1, ladder plan v1.0, or ladder plan v1.1, and it does not add a ladder packet.
- Phase 2's reach path is an HTTP read on `:5055`, bearer `LABS_SSR_ARCHIVE_TOKEN`, base `LABS_SSR_ARCHIVE_URL`. No MiniTwo Redis client.
- Hot session key is `mb:session:market_status`, written by `sym_feed` (`server/market_data/sym_feed.py`). Hot mark key is `mb:sym:{product}`, written by `sym_feed` and by `live_stream` through `write_bus_sym`.
- `GET /api/me/market/session-status` has no `stale` field on the tree India reads. Universe rows already carry `mark_stale`. Spec row 2 names `stale`. Spec §2 forbids a new key. Q3 is ruled: today's keys stay, nothing new signals served-last, and §2 governs. India notes that discrepancy in the gate as a spec wording error. It is not a FAIL. Spec v0.2 is not cut in this gate.
- Phase 3's route and token match the Phase 3 section. `GET /history/v1/ohlc/{source}` on `:4012` stays the futures Massive path (`serve_history`, `price_source: massive_futures_aggs`). Member rows 4 and 5 do not use it.
- `ohlc_feed`'s Massive call is unchanged. India states which host runs that schedule today, from the plist or the unit file, not from the module's comment.
- Row 8, `POST /api/admin/market-universe/validate`, stays.
- No Labs control, screen, selector, or default is in any packet.
- The allow-list section does not require a change to plan v1.1 W4.

India also lists any member-reachable `MassiveClient` or `fetch_*` the spec table does not name. `capital_positions.py` calls `ensure_fresh_underlier_marks`. That call is a finding if a member route reaches it. It is not a packet in this plan.

Gate: MATCH or FAIL, written to `agents/p-labs-member-market-path/gate-reports/W0-G-v0_1-2026-09-29.md` (the date India actually runs). FAIL stops Phase 2. India does not edit the spec or this plan. A miss is a new version.

W0-G stands. It is not re-run for v1.3. The socket section and the Phase 3 standing-up are the amendments in this file. They are not a new W0.

---

## Phase 2 — session-status and universe (rows 2 and 3)

Same `:5055` process as the ladder. Same bearer. Same P2 log. No new port.

**Read routes added on `:5055`.**

- Session: read `mb:session:market_status`. On a hot hit, copy the document to `mb:session-last:market_status`. The copy is a Redis SET of that key. It is not `BusStore.set_json`. `set_json` publishes `mb:pub` and multiplies the TTL by three. The last key is not an interest topic. TTL 18 hours, same shape as `mb:ladder-last`.
- Marks: read `mb:sym:{product}`. Same rule for `mb:sym-last:{product}`. One key per product the route was asked for. Not `set_json`.

**MiniTwo handlers.**

- `GET /api/me/market/session-status` (`server/routes/market_session.py`) hops. It does not construct `MassiveClient` and it does not open `/v1/marketstatus/now` once this phase is cut. The 12-second urlopen is deleted at the cut, not left behind a flag.
- `GET /api/me/market/universe` and `GET /api/admin/market-universe` hop for marks. They do not call `ensure_fresh_underlier_marks`. A stale mark is served with the existing `mark_stale` true. Refresh stays on `sym_feed` and `live_stream`.
- Hot key absent, last document present: the last document is served. For universe, `mark_stale` is set true on that row. For session-status, Q3 is ruled: the response keeps today's keys, no `stale` field is added, and the served-last document is signalled by nothing new. The hop still does not call Massive.
- Neither document: that route's existing failure, immediately. Session-status keeps the failure it already returns when Massive is unreachable. Universe keeps null mids and `mark_stale` true, which the handler already sets when no mark is attached.
- Hop timeout 2 seconds. URL configured and unset: 503. No Massive fill.
- Browser JSON gains no key.

**Q3, ruled 2026-09-29.** Row 2 says the last document is served with `stale`. §2 says no new key. Coach ruled that §2 governs. Session-status keeps today's keys. No `stale` field is added. The served-last document is signalled by nothing new. On 2026-09-29, `server/routes/market_session.py` contains no `stale`. Universe already has `mark_stale`, and that existing field is what a stale mark uses. The row 2 wording was a spec error. Spec v0.2 corrects it. W0 noted the error and did not FAIL for it.

**Packets.** Kilo, tests on StudioTwo, no production process. Alpha, repo code, not loaded during RTH. Foxtrot, canary, after a close. The ids on file are 10 and 12. This writing does not load the canary.

Tests, before any MiniTwo load:

- Hot session document returns through the handler with today's keys. `MassiveClient` is not constructed.
- Hot session key absent, last document present: that document is returned, no new key, `MassiveClient` is not constructed, elapsed time is inside 2 seconds.
- Neither session document: the route's existing failure, immediately, no Massive.
- Universe stale mark: `mark_stale` true, mids from the last document, `ensure_fresh_underlier_marks` not called.
- Neither mark: null mids, `mark_stale` true, no Massive.
- `sym_feed`'s write of `mb:session:market_status` and `mb:sym:{product}` still resolves. `live_stream`'s call to `write_bus_sym` still resolves.

**CP-1 footprint.** Redis GET, and on a hot hit a SET of the last-document key. Zero Massive connections. No `chain_feed` plist. No new port.
Before and after: `chain_feed` pid, and the age of one live ladder key it writes.
Rollback: remove the new `:5055` routes and kickstart that process only. Do not kickstart `chain_feed`.

Then one MiniTwo API restart with the two ids. Everyone else stays on today's fill for these two routes.

Gate: one regular-hours hour of P2 lines for those two identities, on session-status and universe, durations inside 2 seconds, and the same hour for a request outside the list still on the previous path. `chain_feed` before and after, undegraded. The report carries no member name and no member identity id.

**Cut.** A later close. Delete the Massive branch in `get_session_status` and delete both `ensure_fresh_underlier_marks` calls in `server/routes/market_universe_admin.py`. One MiniTwo API restart. If the allow-list variable was restored only for this phase, the cut deletes it again once these routes no longer have a Massive branch. The ladder is not given a Massive branch back.

Gate: `git grep` of the deployed tree shows these handlers do not reach `MassiveClient`, `urlopen` of `marketstatus`, or `ensure_fresh_underlier_marks`. The next regular-hours hour of P2 lines for these routes is inside 2 seconds.

---

## Phase 3 — bars (rows 4 and 5)

One store, two routes. The work is the first standing-up of `ohlc_feed` on StudioOne. The feed has never run. This packet is that standing-up. It is not a gap-closer. The member request never fetches.

**Why `:4012`.** Q1 is ruled. SODP puts price data on the price plane. `:5055` is the OPF process and already carries the ladder hop and `LABS_SSR_ARCHIVE_TOKEN`. Bar reads stay on `:4012`.

**What `:4012` is today.** `server/history_app.py`. Computing-class session cookie, role at least administrator (`verify_computing_session`). Routes `/history/v1/health`, `/history/v1/ohlc/{source}`, `/history/v1/contracts/{source}`. Health returns `price_source: massive_futures_aggs`. `serve_history` is Massive-first futures bars. MiniTwo already hops VP at `server/routes/vp_display.py` `_history_hop`: base `LABS_HISTORY_API_BASE`, headers from `issue_computing_session` ("Never forward the member cookie"), timeout 180 seconds, and a missing base returns None. That hop is not the member bar hop. This phase does not copy the 180-second timeout, does not copy the fall-through, and does not send rows 4 or 5 through `serve_history`.

**Route this plan adds.** `GET /history/v1/store-bars` on the `:4012` process. Query: product, tf, from, to. It reads the durable store `ohlc_feed` fills (`market_data/ohlc_store`). A missing range returns 503 and the body names the product, the tf, and the range. It does not call `fetch_aggs`. It does not call `serve_history`.

**Token.** `LABS_HISTORY_READ_TOKEN`, at least 32 characters, same shape as `LABS_SSR_ARCHIVE_TOKEN`. MiniTwo sends `Authorization: Bearer` on this route only. The browser never sees it. The member `ft_session` is not forwarded. The futures routes keep the computing cookie. `LABS_HISTORY_API_BASE` is the base URL, already the VP hop's base, pointed at StudioOne `:4012`.

**MiniTwo handlers, after the store can answer.**

- `GET /api/me/market/ohlc` (`server/routes/market_ohlc.py` → `fetch_product_ohlc`). Today a missing or short MySQL series calls `ohlc_feed.sync_symbol_tf` on the request thread, and the except path calls `fetch_aggs` directly (`server/market_data/ohlc_service.py`). Both of those request-thread fetches are deleted at the cut.
- `GET /api/me/trade-log/trades/{trade_id}/chart` (`server/routes/trade_log/trades.py` → `build_trade_chart`). Same store, same rule. The `fetch_aggs` calls in `server/market_data/trade_chart_service.py` that a member chart request can reach are deleted at the cut.
- Browser JSON unchanged. Hop timeout 2 seconds. URL configured and unset: 503 naming the range. No Massive fill.

**First standing-up.** `ohlc_feed` has never run. There is no prior schedule to resume and no gap this job is closing. Foxtrot stands the job up on StudioOne. `ohlc_feed` keeps `_fetch_aggs_range`. This phase does not edit that call. The example plist `infra/launchd/ai.fattail.labs.ohlc-feed.plist.example` says install on MiniTwo. That line is a recorded TOPO-1 defect. This packet does not install that plist, on MiniTwo or on StudioOne. The job's first cycle runs after 16:00 ET. The morning append keeps the feed's existing clock once that first cycle has not degraded `chain_feed`. The member cut waits until the store holds the ranges the two routes serve on a normal session. A range still missing is a 503 that names it, including on the canary.

The store `:4012` reads is the store the StudioOne feed writes. The hop does not point `:4012` at MiniTwo's MySQL. W0 states which database `ohlc_store` opens on the tree it reads. Pointing the read at a different database is the Foxtrot packet, not a request-thread fetch.

**Host finding, 2026-09-29, read-only. Coach acknowledged it the same day.** No `ohlc_feed` process was running on StudioOne or on MiniTwo. `launchctl list` on both hosts has no `ai.fattail.labs.ohlc-feed`. The only plist that references `ohlc_feed` is `infra/launchd/ai.fattail.labs.ohlc-feed.plist.example`, in the checkouts, not loaded. Its comment says install on MiniTwo. That install target is a TOPO-1 defect in the example. The Phase 3 packet is the first standing-up on StudioOne, named above. The feed's Massive call stays as written. Nothing in this plan installs the job tonight.

**CP-1 footprint of the route.** One MySQL read of the bar store. Zero Massive connections. No `chain_feed` plist. No new port. `:4012` is an existing process.
**CP-1 footprint of the standing-up.** The feed's existing Massive calls, first cycle after 16:00 ET, disk as the store already uses. Before and after: `chain_feed` pid and last-snapshot freshness.
Rollback of the route: remove `GET /history/v1/store-bars` and kickstart the `:4012` process only. Do not kickstart `chain_feed`. Rollback of the standing-up: unload the new StudioOne job. There is no previous schedule to restore. The example plist stays uninstalled.

Canary: the same two ids, one regular-hours hour, P2 durations inside 2 seconds, a request outside the list still on today's fill. Then a later close, one MiniTwo API restart, fallback deleted.

Gate: the two handlers do not reach `fetch_aggs`, `sync_symbol_tf`, or `MassiveClient`. A named missing range is 503. A range the feed has written returns today's JSON. `ohlc_feed._fetch_aggs_range` still resolves.

---

## Phase 4 — correlation and algo-replay (rows 6 and 7)

New scheduled jobs on StudioOne. The routes lose their fetch at this phase's cut. First cycle of each new job is after 16:00 ET.

**Correlation.** `GET /api/me/strategy-lab/curate/correlation` and `/relative` (`server/routes/strategy_lab_curate.py` → `server/market_data/correlation.py`, `fetch_daily_closes`). A StudioOne job writes a daily-closes store on a schedule. The route reads that store through a bearer hop. Missing symbol or missing range is 503 and the detail names the symbol or the range. The route does not call `fetch_daily_closes` after the cut.

Home of the read: `:4012`, beside the bar read, because Q1 put price series on that process. Route: `GET /history/v1/daily-closes`. Same bearer, `LABS_HISTORY_READ_TOKEN`. Timeout 2 seconds. Rows 4, 5, and these reads stay together on `:4012`.

**Algo-replay.** `GET /api/me/options-lab/algo-replay/path` (`server/routes/algo_replay.py`). `load_primitive_path` is the only source. No samples is 503 and the detail names the path (product and day). The `fetch_aggs` branch (1-minute, `limit=50000`) is deleted at the cut. A StudioOne job may pre-fill stored paths. The request does not.

**CP-1 footprint of each job.** Massive reads on the shared account, first cycle after 16:00 ET, disk for the store it writes. Zero new connections from MiniTwo. No `chain_feed` plist. No new port.
Before and after: `chain_feed` pid and last-snapshot freshness.
Rollback: unload the new job. Do not kickstart `chain_feed`. The route cut rolls back by restoring the previous MiniTwo revision of those two handlers. There is no flag that re-enables Massive while the hop stays configured.

Canary, then one MiniTwo API restart after a close, then the fetches deleted. Same two ids. Same P2 hour inside 2 seconds.

Gate: those handlers do not reach `fetch_daily_closes`, `fetch_aggs`, or `MassiveClient`. A missing symbol, range, or path is 503 and names it.

---

## Phase 5 — positions valuation (spec v0.2 row 9)

After Phase 4's cut. Same rules as the phase it follows: 2-second hop, last document rather than a Massive wait, no new browser key, fallback deleted at the cut, canary on identity_id 10 and identity_id 12, one regular-hours hour in the P2 log, then one MiniTwo API restart after a close. This is still the fifth production cut. The socket is not in it. The socket shares Phase 1's cut, as the socket section says. This phase has not started.

This phase does not reopen the ladder handlers, does not reopen the socket, and does not edit plan v1.1 of the ladder. The caller that still reaches `_fetch_ladder` directly, outside those paths, is positions valuation.

- `GET /api/me/capital/positions-valuation` stops calling `ensure_fresh_underlier_marks`. Marks come from the Phase 2 read. A stale mark uses the existing `mark_stale`. When positions OPF is on, the ladder read uses the Phase 1 `:5055` hop, the same helper Phase 1's W2 added for the handler and the socket. It does not take `_fetch_ladder`'s Massive miss. If Phase 1's W4 left that miss in place for this caller, this phase is the cut that removes the reach. It does not put a Massive branch back on the handler or on the socket.

`GET /api/app/vp/v1/ohlc/{source}` is not in this phase. SODP-5 is the reason, cited in spec v0.2. The Massive call stays inside the StudioOne `:4012` history provider. WebSocket `/api/me/market/stream` ladder calls are Phase 1. Spec v0.2 row 10 names their replacement. This plan moved when they run.

**CP-1.** Phase 5 adds no StudioOne route and no Massive connection. It calls the `:5055` routes Phase 1 and Phase 2 already added. Footprint on StudioOne: none, unless one of those routes is not loaded yet, in which case Phase 5 waits for that phase's cut rather than adding a second route. No `chain_feed` plist. No new port.
Rollback: restore the previous MiniTwo revision of the valuation handler. Do not kickstart `chain_feed`.

Gate: a member valuation does not construct `MassiveClient`, does not call `ensure_fresh_underlier_marks`, and does not reach `_fetch_ladder`'s Massive branch. The socket gate is Phase 1 W4. The futures history provider's `fetch_futures_aggs` still resolves.

---

## Program ship

After the Phase 5 cut, one regular-hours session.

- `git grep` on the deployed MiniTwo tree: no member route, and nothing reachable from one, constructs `MassiveClient`, calls any `fetch_*`, or opens `api.massive.com`, except the StudioOne futures history provider SODP-5 names (`fetch_futures_aggs` on `:4012`, consumed by `GET /api/app/vp/v1/ohlc/{source}`). The other Massive callers left are jobs and feeds that run on StudioOne. Row 8 remains. Row 9 is met at the Phase 5 cut. Row 10 is met at the Phase 1 cut. Both are inside the bar, and the grep is still read after Phase 5.
- That session's P2 log: every hopped route inside 2 seconds.
- That session's proxy log: zero `Failed to proxy` on those routes.
- Lima replaces the Arch 30 line `bus: "not_configured"` (Architecture/30-options-pricing-foundation.md, the 2026-09-01 as-built paragraph) with the hop configuration: `:5055` for the ladder, the market-stream ladder, session-status, and marks; `:4012` `GET /history/v1/store-bars` and `GET /history/v1/daily-closes` for bars and daily closes; bearer env names; unset URL is a boot failure. That edit is this close, not this plan's writing.
- REQ-014 closes on Coach AP-1 of that session, not on acceptance of this plan. REQ-013 closes on its own bar, the ladder cut.

---

## Out of this plan

Any Labs control, screen, selector, or default. Wings above 50. A second uvicorn worker. A MiniTwo Redis. An edit to a feed or collector's Massive call. Tuesday's full-book capture. Tuesday's API restart contents. Agent Spaces. A staging host. A member identity on the canary. Putting Phase 2, 3, 4, or 5 code on the ladder's W1, W2, W3, or W4. The socket section is Phase 1, and W2–W4 read it for the live grid. Committing `ssr_fullbook.py` or the uncommitted `member_clamp` diff. Revising diagnostic v0.1, audit v0.1, the inventory, or any numbered ladder or OPF artifact. Editing spec v0.2, plan v1.2, plan v1.1, ladder plan v1.1, or DL-806. Loading a canary. Starting ladder W1 or ladder W2 from this writing. Installing `infra/launchd/ai.fattail.labs.ohlc-feed.plist.example`.

---

## Ruled 2026-09-29

**Q1.** Bars on `:4012`. Route `GET /history/v1/store-bars`. Token `LABS_HISTORY_READ_TOKEN`. The futures route `GET /history/v1/ohlc/{source}` stays Massive-first and is not the member hop.

**Q2.** One production cut per phase.

**Q3.** Session-status keeps today's keys. No `stale` field is added. The served-last document is signalled by nothing new. Spec §2 governs over row 2. The discrepancy is a spec wording error, noted in W0, corrected in spec v0.2 when the next version is cut for any other reason.

**Canary.** Identity_id 10 and identity_id 12, on file for every phase, including ladder W3. Coach's own identity and one administrator. No member identity. The canary still loads only at each phase's own close. This writing does not load it.

**Socket.** The market-stream `_fetch_ladder` calls, on subscribe and on the push loop, take the Phase 1 `:5055` hop inside W2–W4. Same key, same last-document read, same 2-second budget. Phase 5 keeps positions valuation.

**Phase 3.** The job packet is a first standing-up of `ohlc_feed` on StudioOne. The feed has never run. It is not a gap-closer.

---

## Acceptance

Accepted 2026-09-29. DL-807. Plan v1.2 was accepted the same day and stays the committed baseline (`a213a1f7`, with spec v0.2 and DL-806). This file is the amendment: the socket is in Phase 1, the canary ids are 10 and 12, and Phase 3's job is the first standing-up of `ohlc_feed` on StudioOne. The acceptance dispatches nothing. Phase 5 has not started. No canary loads. Ladder W1 has not started. Ladder W2 reads the socket section and has not started.
