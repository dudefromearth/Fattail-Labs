# Labs member market-data path — full agent bench plan v1.0

**Plan v1.0.** Status: **PLAN.** Not accepted. No packet in this file runs until Coach accepts it.
**Law:** `docs/Labs-Member-Market-Path-Data-Plane-v0_1.md` (spec v0.1, Status PLAN). This plan does not revise that file.
**Phase 1 law, untouched:** `docs/Runner-Live-Ladder-Data-Plane-Full-Agent-Bench-Plan-v1.1.md`. W0 of that plan is MATCH. W1 of that plan has not started. This plan does not add a packet to it, and it does not edit spec v0.1, plan v1.0, or plan v1.1 of the ladder.
**Inventory:** `docs/Massive-Call-Site-Inventory-v0_1.md`. The ladder-era GO line there stays. This spec is the grant that line declined.
**Machine:** StudioTwo writes and tests. MiniTwo is production. StudioOne is the data plane. CP-1 on every StudioOne packet.
**Date:** 2026-09-29.

Nothing in this plan restarts an API, edits a feed's Massive call, changes a Labs control, screen, selector, or default, or puts data-plane code on Tuesday's restart.

---

## What Coach already ruled, and what this plan uses until he overrides it

Spec §6 leaves two questions open and writes a default for each. Silence after this plan is not a ruling. The defaults are how the packets below are written, so a later override is a new plan version.

| Question | Default this plan executes | Override does |
|---|---|---|
| Q1. Bars home for rows 4 and 5 | `:4012`, the price plane. Token and route are stated in Phase 3 | A new plan version. Spec v0.1 stays |
| Q2. Cut cadence | One production cut per phase. Four MiniTwo API restarts, each after a close: ladder W4, then Phase 2, then Phase 3, then Phase 4 | A new plan version that batches Phases 2–4 |

Q1 and Q2 are repeated at the end so they can be answered without reading the packets.

---

## Phase 1 — not re-planned

Phase 1 is the Runner ladder. Packets, gates, the Tuesday restart, and the canary composition are plan v1.1.

| Fact this plan relies on | Where it already lives |
|---|---|
| Reach path `GET /api/ladder` on StudioOne `:5055`. The bus is not | Plan v1.1, DL-803 |
| W0 MATCH | `agents/p-runner-live-ladder/gate-reports/W0-G-v0_1-2026-09-28.md` |
| W1 starts only after that MATCH and after P2 is on the production API | Plan v1.1 schedule. P2 is not on the process yet |
| Tuesday 2026-09-29 after 16:00 ET | One restart of `ai.fattail.labs.api` carries P5, P1, and P2. Data-plane code is not in it |
| W3 canary | `LABS_LADDER_HOP_IDENTITIES`. Coach's own identity and one administrator. He names both ids before that close. No member identity. This plan does not invent the ids |
| W4 | Deletes `LABS_LADDER_HOP_IDENTITIES` and the Massive branches of the two ladder handlers. One MiniTwo API restart. This plan does not move W4 and does not edit it |

REQ-013 stays open. Accepting this plan does not accept, delay, or close the ladder.

---

## Allow-list, shared with Phase 1 without editing W4

Phase 2 uses the same two identities and the same variable, `LABS_LADDER_HOP_IDENTITIES`.

- While the variable still exists (after ladder W3, before ladder W4), session-status and universe read it. The ladder handlers keep reading it exactly as plan v1.1 says.
- Ladder W4 still deletes the variable on its own close. This plan does not ask W4 to wait.
- If W4 has already deleted the variable when Phase 2's canary is ready, Phase 2 restores the same variable and the same two ids, and only session-status and the universe lists consult it. The ladder stays on the hop for every identity, because W4 already removed the ladder's Massive branches.
- Phase 2's canary does not load until Coach has named the two ids. No member identity is added.

Phases 3 and 4 use those same two ids. They do not create a second list.

---

## CP-1, on every StudioOne packet (DL-707)

The chain-snapshot collection on StudioOne (`chain_feed` and its supporting jobs) is never disrupted. If any step could disrupt it — including indirectly via shared Massive account connection or rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is redesigned or held until after 16:00 ET. Every StudioOne packet carries this, states its footprint, records `chain_feed` pid and last-snapshot freshness before and after, and has one rollback line. A degraded `chain_feed` after the step is a FAIL, and the rollback runs.

A new job that calls Massive runs its first cycle after 16:00 ET. `ohlc_feed`, `sym_feed`, `live_stream`, `chain_feed`, collectors, VP ingest, and probes keep the Massive calls they already have. This plan does not edit those calls.

---

## Schedule

| When | What | Restart |
|---|---|---|
| This plan, while Status is PLAN | Nothing beyond the documents | None |
| After Coach accepts this plan | W0 India, read-only, StudioTwo | None |
| Phase 1, already scheduled | Plan v1.1. W1 after P2 is on the production process | Tuesday's one API restart is P5+P1+P2 only |
| After W0-G MATCH of this plan, and after the two ids exist | Phase 2 tests, then code, then a canary on `:5055` | StudioOne: `:5055` only, after a close. MiniTwo: one API restart for the Phase 2 hop behind the two ids. Not Tuesday's restart |
| A later close, after Phase 2's canary hour is in the P2 log | Phase 2 production cut. Fallback deleted | One MiniTwo API restart |
| After that cut | Phase 3. The gap-closing job first, then the two bar routes | StudioOne job after 16:00 ET. MiniTwo cut is its own later close |
| After Phase 3's cut | Phase 4. Scheduled jobs, then the routes lose their fetch | StudioOne jobs after 16:00 ET. One MiniTwo cut of its own |
| The close of Phase 4, after one regular-hours session | Program ship bar. Lima replaces the Arch 30 `not_configured` line | No extra restart for the doc |

P2's access line (time, duration, status, path) is the clock for every canary hour. A phase does not measure until that line is on the production API. The proxy log is read at the program ship, not as a substitute for the hop timeout.

An unset hop URL is a 503 on a route that has been configured to hop, from that route's canary onward. It becomes a boot failure at the Phase 4 cut, with the Arch 30 edit. Routes that have not reached their cut keep today's behavior until that cut.

---

## W0 — India

Starts only after Coach accepts this plan. StudioTwo. Read-only. Spec v0.1 against SODP-1, SODP-2, SODP-3, SODP-4, the inventory's member rows, and plan v1.1 as Phase 1.

Confirm:

- This plan does not revise ladder spec v0.1, ladder plan v1.0, or ladder plan v1.1, and it does not add a ladder packet.
- Phase 2's reach path is an HTTP read on `:5055`, bearer `LABS_SSR_ARCHIVE_TOKEN`, base `LABS_SSR_ARCHIVE_URL`. No MiniTwo Redis client.
- Hot session key is `mb:session:market_status`, written by `sym_feed` (`server/market_data/sym_feed.py`). Hot mark key is `mb:sym:{product}`, written by `sym_feed` and by `live_stream` through `write_bus_sym`.
- `GET /api/me/market/session-status` has no `stale` field on the tree India reads. Universe rows already carry `mark_stale`. Spec row 2 names `stale`. Spec §2 forbids a new key. That collision is Q3 below. India confirms it and does not pick a field.
- Phase 3's route and token match the Phase 3 section. `GET /history/v1/ohlc/{source}` on `:4012` stays the futures Massive path (`serve_history`, `price_source: massive_futures_aggs`). Member rows 4 and 5 do not use it.
- `ohlc_feed`'s Massive call is unchanged. India states which host runs that schedule today, from the plist or the unit file, not from the module's comment.
- Row 8, `POST /api/admin/market-universe/validate`, stays.
- No Labs control, screen, selector, or default is in any packet.
- The allow-list section does not require a change to plan v1.1 W4.

India also lists any member-reachable `MassiveClient` or `fetch_*` the spec table does not name. `capital_positions.py` calls `ensure_fresh_underlier_marks`. That call is a finding if a member route reaches it. It is not a packet in this plan.

Gate: MATCH or FAIL, written to `agents/p-labs-member-market-path/gate-reports/W0-G-v0_1-2026-09-29.md` (the date India actually runs). FAIL stops Phase 2. India does not edit the spec or this plan. A miss is a new version.

---

## Phase 2 — session-status and universe (rows 2 and 3)

Same `:5055` process as the ladder. Same bearer. Same P2 log. No new port.

**Read routes added on `:5055`.**

- Session: read `mb:session:market_status`. On a hot hit, copy the document to `mb:session-last:market_status`. The copy is a Redis SET of that key. It is not `BusStore.set_json`. `set_json` publishes `mb:pub` and multiplies the TTL by three. The last key is not an interest topic. TTL 18 hours, same shape as `mb:ladder-last`.
- Marks: read `mb:sym:{product}`. Same rule for `mb:sym-last:{product}`. One key per product the route was asked for. Not `set_json`.

**MiniTwo handlers.**

- `GET /api/me/market/session-status` (`server/routes/market_session.py`) hops. It does not construct `MassiveClient` and it does not open `/v1/marketstatus/now` once this phase is cut. The 12-second urlopen is deleted at the cut, not left behind a flag.
- `GET /api/me/market/universe` and `GET /api/admin/market-universe` hop for marks. They do not call `ensure_fresh_underlier_marks`. A stale mark is served with the existing `mark_stale` true. Refresh stays on `sym_feed` and `live_stream`.
- Hot key absent, last document present: the last document is served. For universe, `mark_stale` is set true on that row. For session-status, no key is added. Q3 holds the question of how that response carries "last" until Coach rules. The hop still does not call Massive.
- Neither document: that route's existing failure, immediately. Session-status keeps the failure it already returns when Massive is unreachable. Universe keeps null mids and `mark_stale` true, which the handler already sets when no mark is attached.
- Hop timeout 2 seconds. URL configured and unset: 503. No Massive fill.
- Browser JSON gains no key.

**Q3, shown here, not written into the spec.** Row 2 says the last document is served with `stale`. §2 says no new key, and `stale` is already on the wire where it exists. On 2026-09-29, `server/routes/market_session.py` contains no `stale`. Universe already has `mark_stale`. This plan does not add `stale` to session-status. Phase 2's session-status code serves the last document with today's keys until Coach rules Q3. A ruling that adds the word `stale` is a spec version, then a plan version.

**Packets.** Kilo, tests on StudioTwo, no production process. Alpha, repo code, not loaded during RTH. Foxtrot, canary, after a close, only after the two ids are named.

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

One store, two routes. The work is the gap-closing job. The member request never fetches.

**Why `:4012`.** SODP puts price data on the price plane. `:5055` is the OPF process and already carries the ladder hop and `LABS_SSR_ARCHIVE_TOKEN`. Bar reads do not join that process under Q1's default.

**What `:4012` is today.** `server/history_app.py`. Computing-class session cookie, role at least administrator (`verify_computing_session`). Routes `/history/v1/health`, `/history/v1/ohlc/{source}`, `/history/v1/contracts/{source}`. Health returns `price_source: massive_futures_aggs`. `serve_history` is Massive-first futures bars. MiniTwo already hops VP at `server/routes/vp_display.py` `_history_hop`: base `LABS_HISTORY_API_BASE`, headers from `issue_computing_session` ("Never forward the member cookie"), timeout 180 seconds, and a missing base returns None. That hop is not the member bar hop. This phase does not copy the 180-second timeout, does not copy the fall-through, and does not send rows 4 or 5 through `serve_history`.

**Route this plan adds.** `GET /history/v1/store-bars` on the `:4012` process. Query: product, tf, from, to. It reads the durable store `ohlc_feed` fills (`market_data/ohlc_store`). A missing range returns 503 and the body names the product, the tf, and the range. It does not call `fetch_aggs`. It does not call `serve_history`.

**Token.** `LABS_HISTORY_READ_TOKEN`, at least 32 characters, same shape as `LABS_SSR_ARCHIVE_TOKEN`. MiniTwo sends `Authorization: Bearer` on this route only. The browser never sees it. The member `ft_session` is not forwarded. The futures routes keep the computing cookie. `LABS_HISTORY_API_BASE` is the base URL, already the VP hop's base, pointed at StudioOne `:4012`.

**MiniTwo handlers, after the store can answer.**

- `GET /api/me/market/ohlc` (`server/routes/market_ohlc.py` → `fetch_product_ohlc`). Today a missing or short MySQL series calls `ohlc_feed.sync_symbol_tf` on the request thread, and the except path calls `fetch_aggs` directly (`server/market_data/ohlc_service.py`). Both of those request-thread fetches are deleted at the cut.
- `GET /api/me/trade-log/trades/{trade_id}/chart` (`server/routes/trade_log/trades.py` → `build_trade_chart`). Same store, same rule. The `fetch_aggs` calls in `server/market_data/trade_chart_service.py` that a member chart request can reach are deleted at the cut.
- Browser JSON unchanged. Hop timeout 2 seconds. URL configured and unset: 503 naming the range. No Massive fill.

**Gap-closing job.** `ohlc_feed` keeps `_fetch_aggs_range`. This phase does not edit it. The feed's bootstrap and morning append are what close gaps. W0 states where that schedule runs today. If it is not already on StudioOne, Foxtrot places the existing schedule on StudioOne. The first cycle of a moved or new bootstrap runs after 16:00 ET. The morning append keeps the feed's existing clock once that first cycle has not degraded `chain_feed`. The member cut waits until the store holds the ranges the two routes serve on a normal session. A range still missing is a 503 that names it, including on the canary.

The store `:4012` reads is the store the StudioOne feed writes. The hop does not point `:4012` at MiniTwo's MySQL. W0 states which database `ohlc_store` opens on the tree it reads. Pointing the read at a different database is the Foxtrot packet, not a request-thread fetch.

**CP-1 footprint of the route.** One MySQL read of the bar store. Zero Massive connections. No `chain_feed` plist. No new port. `:4012` is an existing process.
**CP-1 footprint of a moved bootstrap.** The feed's existing Massive calls, first cycle after 16:00 ET, disk as the store already uses. Before and after: `chain_feed` pid and last-snapshot freshness.
Rollback of the route: remove `GET /history/v1/store-bars` and kickstart the `:4012` process only. Do not kickstart `chain_feed`. Rollback of a moved schedule: unload the new StudioOne job and leave the previous schedule as W0 recorded it.

Canary: the same two ids, one regular-hours hour, P2 durations inside 2 seconds, a request outside the list still on today's fill. Then a later close, one MiniTwo API restart, fallback deleted.

Gate: the two handlers do not reach `fetch_aggs`, `sync_symbol_tf`, or `MassiveClient`. A named missing range is 503. A range the feed has written returns today's JSON. `ohlc_feed._fetch_aggs_range` still resolves.

---

## Phase 4 — correlation and algo-replay (rows 6 and 7)

New scheduled jobs on StudioOne. The routes lose their fetch at this phase's cut. First cycle of each new job is after 16:00 ET.

**Correlation.** `GET /api/me/strategy-lab/curate/correlation` and `/relative` (`server/routes/strategy_lab_curate.py` → `server/market_data/correlation.py`, `fetch_daily_closes`). A StudioOne job writes a daily-closes store on a schedule. The route reads that store through a bearer hop. Missing symbol or missing range is 503 and the detail names the symbol or the range. The route does not call `fetch_daily_closes` after the cut.

Home of the read: `:4012`, beside the bar read, because these are price series. Route: `GET /history/v1/daily-closes`. Same bearer, `LABS_HISTORY_READ_TOKEN`. Timeout 2 seconds. This is a plan placement under Q1's default. A Q1 override to `:5055` moves rows 4, 5, and these reads together.

**Algo-replay.** `GET /api/me/options-lab/algo-replay/path` (`server/routes/algo_replay.py`). `load_primitive_path` is the only source. No samples is 503 and the detail names the path (product and day). The `fetch_aggs` branch (1-minute, `limit=50000`) is deleted at the cut. A StudioOne job may pre-fill stored paths. The request does not.

**CP-1 footprint of each job.** Massive reads on the shared account, first cycle after 16:00 ET, disk for the store it writes. Zero new connections from MiniTwo. No `chain_feed` plist. No new port.
Before and after: `chain_feed` pid and last-snapshot freshness.
Rollback: unload the new job. Do not kickstart `chain_feed`. The route cut rolls back by restoring the previous MiniTwo revision of those two handlers. There is no flag that re-enables Massive while the hop stays configured.

Canary, then one MiniTwo API restart after a close, then the fetches deleted. Same two ids. Same P2 hour inside 2 seconds.

Gate: those handlers do not reach `fetch_daily_closes`, `fetch_aggs`, or `MassiveClient`. A missing symbol, range, or path is 503 and names it.

---

## Program ship

After the Phase 4 cut, one regular-hours session.

- `git grep` on the deployed MiniTwo tree: no member route, and nothing reachable from one, constructs `MassiveClient`, calls any `fetch_*`, or opens `api.massive.com`. The Massive callers left are jobs and feeds that run on StudioOne. Row 8 remains.
- That session's P2 log: every hopped route inside 2 seconds.
- That session's proxy log: zero `Failed to proxy` on those routes.
- Lima replaces the Arch 30 line `bus: "not_configured"` (Architecture/30-options-pricing-foundation.md, the 2026-09-01 as-built paragraph) with the hop configuration: `:5055` for the ladder, session-status, and marks; `:4012` `GET /history/v1/store-bars` and `GET /history/v1/daily-closes` for bars and daily closes; bearer env names; unset URL is a boot failure. That edit is this close, not this plan's writing.
- REQ-014 closes on Coach AP-1 of that session, not on acceptance of this plan. REQ-013 closes on its own bar, the ladder cut.

---

## Out of this plan

Any Labs control, screen, selector, or default. Wings above 50. A second uvicorn worker. A MiniTwo Redis. An edit to a feed or collector's Massive call. Tuesday's full-book capture. Tuesday's API restart contents. Agent Spaces. A staging host. A member identity on the canary. Putting Phase 2, 3, or 4 code on the ladder's W1, W2, W3, or W4. Committing `ssr_fullbook.py` or the uncommitted `member_clamp` diff. Revising diagnostic v0.1, audit v0.1, the inventory, or any numbered ladder or OPF artifact.

---

## Open, for Coach, before any packet past Phase 1

**Q1.** Bars on `:4012` or on `:5055`. This plan uses `:4012`. Route `GET /history/v1/store-bars`. Token `LABS_HISTORY_READ_TOKEN`. The futures route `GET /history/v1/ohlc/{source}` stays Massive-first and is not the member hop.

**Q2.** One cut per phase, or one cut for Phases 2–4 after their canaries. This plan uses one cut per phase.

**Q3.** Session-status has no `stale` key. This plan will not add one. Say if the last-document response should gain `stale` (that is a spec version) or should keep today's keys.

Naming the two canary ids is still the ladder's W3 gate. This plan waits on the same names.

---

## Acceptance

Not accepted. W0 of this plan is not dispatched. Phase 2 has not started. Phase 1 continues under plan v1.1, and this acceptance line does not start W1 of that plan.
