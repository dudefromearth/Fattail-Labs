# Labs member market-data path on the StudioOne data plane

**Spec v0.2.** Supersedes `docs/Labs-Member-Market-Path-Data-Plane-v0_1.md`.
**Status: PLAN.**
v0.1 stays on disk and is not edited.

| Change from v0.1 | What v0.2 says |
|---|---|
| Row 2, and §2 "with `stale`" | Session-status keeps today's keys. No `stale` field is added. A served-last document is signalled by nothing new. §2's "no new JSON key" governs. This is the correction DL-805 scheduled for the next version cut |
| India's four member paths | Three are Phase 5, same rules as the earlier phases. The VP futures route is not one of them |
| Ship bar | The bar covers the Phase 5 callers. The StudioOne futures history provider stays a Massive caller, because SODP-5 names that path |
| §6 | Q1 and Q2 are ruled. They are not re-opened |

Grants: SODP-MB — the hop for `/api/me/market/*` and every other member request that reaches Massive, which the inventory listed and the Runner spec declined, plus the three Phase 5 callers below.
Source: `docs/Massive-Call-Site-Inventory-v0_1.md` (2026-09-28). The Phase 5 rows are India's W0-G finding of 2026-09-29, `agents/p-labs-member-market-path/gate-reports/W0-G-v0_1-2026-09-29.md`.
Phase 1: `docs/Runner-Live-Ladder-Data-Plane-v0_1.md` and ladder plan v1.1, already accepted and in flight. This spec does not revise them.
Date: 2026-09-29
Law this restores: TOPO-1 / SODP-1 through SODP-4 — data services and data APIs live on StudioOne; a UI host does not call Massive; the browser never talks to StudioOne.

## 0. Coach's intent

The apps run as they were designed. Every member request in Labs that today reaches Massive from MiniTwo reaches the StudioOne data plane instead. The design already exists in the code — bus reads, durable stores, hops — and production never got it. This spec removes the fallback everywhere it survives on a member path, so the design cannot be silently bypassed by an unset variable again.

The program ship bar has to be true on the day it is met. A member path that still reaches Massive after the last cut makes the bar false.

## 1. Scope — the member-path call sites

From the inventory, section 1, rows marked "Member request: Yes", plus the three callers W0-G found outside that table:

| # | Route | Massive call today | Data-plane replacement |
|---|---|---|---|
| 1 | `GET /api/me/market/chain-ladder` and `/expirations` | ladder fill, expirations scan | **Phase 1, in flight.** `:5055` `/api/ladder` and sibling; last-document store; no Massive on the handlers |
| 2 | `GET /api/me/market/session-status` | `/v1/marketstatus/now`, 12 s | `:5055` read of `mb:session:market_status` that `sym_feed` writes; the last document is served with today's keys; no new field; no Massive |
| 3 | `GET /api/me/market/universe` (and admin universe) | `ensure_fresh_underlier_marks` on stale | `:5055` read of the marks `sym_feed` / `live_stream` write; a stale mark is served with the existing `mark_stale` true; refresh is the feed's job, never the request's |
| 4 | `GET /api/me/market/ohlc` | `fetch_aggs` when the MySQL bar store has no bars | bars come from the durable store `ohlc_feed` fills; a missing range is a 503 with the range named, never a request-thread fetch; the feed's bootstrap and morning append close gaps |
| 5 | `GET /api/me/trade-log/trades/{id}/chart` | `fetch_aggs` | same store as row 4, same rule |
| 6 | `GET /api/me/strategy-lab/curate/correlation` (and `/relative`) | `fetch_daily_closes` | a daily-closes store on the data plane, written by a StudioOne job on a schedule; the route reads it; missing symbol or range is a 503 naming it |
| 7 | `GET /api/me/options-lab/algo-replay/path` | 1-minute `fetch_aggs` when the stored path has no samples | the stored path is the only source; no samples is a 503 naming the path; a StudioOne job may pre-fill paths, never the request |
| 8 | `POST /api/admin/market-universe/validate` | `validate_with_massive` | admin-only, not a member path; stays as is, noted so it is not mistaken for a gap |
| 9 | `GET /api/me/capital/positions-valuation` | `ensure_fresh_underlier_marks`, and `_fetch_ladder` when positions OPF is on | **Phase 5.** Marks use the row 3 read. The ladder read uses the Phase 1 hop. No Massive on either call |
| 10 | WebSocket `/api/me/market/stream` | `_fetch_ladder` on subscribe and on the push loop | **Phase 5.** Same Phase 1 hop, on subscribe and on each push. No Massive |
| 11 | `GET /api/app/vp/v1/ohlc/{source}` | hop into `serve_history` / `fetch_futures_aggs` on `:4012` | **Not Phase 5.** SODP already names this Massive-first path. See the exception under this table |

Jobs and feeds — `chain_feed`, `sym_feed`, `ohlc_feed`, `live_stream`, collectors, VP ingest, probes — stay on StudioOne and keep their Massive calls. That is their job. The futures history provider is in that class. See the exception.

**VP futures exception.** SODP-5 (`Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md` §2): futures chart history is one provider, Massive-first, on StudioOne. SODP-7: that provider is born on StudioOne, and the in-process fill on a UI host is deleted. §4 seats it at `:4012`. §11 names the consumer: `SaPriceChart` `GET /api/app/vp/v1/ohlc/{source}` re-points to the Labs hop onto StudioOne history, attested by `price_source=massive_futures_aggs`. The Massive call inside that provider is the design. Phase 5 does not remove it and does not move it. An in-process Massive fill on the MiniTwo side of that route would violate SODP-7. That is the only VP clause in this spec.

## 2. Rules for every hop

- **Reach path:** an HTTP read on a StudioOne process, bearer-authenticated, server-side from MiniTwo. The `:5055` OPF process for options and session data. The `:4012` price plane for bars (Q1, ruled): `GET /history/v1/store-bars`, token `LABS_HISTORY_READ_TOKEN`. Never a Redis client on MiniTwo; never a StudioOne URL or token in the browser.
- **Timeout:** 2 seconds on the hop. Never the 60-second client timeout on a request thread.
- **Stale over wait:** when the hot value is absent, the last value is served. Where the route already has `stale` or `mark_stale`, that existing field is set true. Session-status has neither. Its served-last document keeps today's keys and is signalled by nothing new. When there is no last value, the existing failure status for that route, immediately. No request ever waits on Massive.
- **Fail loud, not fall through:** a route configured to hop with its URL unset returns 503 at that request. It does not fill from Massive. The fallback branches are deleted at each route's production cut, not left behind a flag.
- **Browser JSON unchanged:** no new key on any route. `stale` and `epoch_quality` are already on the wire where they exist. `mark_stale` is already on the universe rows.
- **Feeds own freshness:** if a route needs a value the plane does not yet keep, the fix is a StudioOne job that writes it, then a read. A request never becomes a fetcher.
- **CP-1:** every StudioOne route added has a stated footprint (reads, shadow writes, zero Massive connections), before/after `chain_feed` status, and a one-line rollback.

## 3. Sequencing

Phase 1 — Runner ladder (ladder plan v1.1, in flight; W0 MATCH; W1 after Tuesday's P2 restart).
Phase 2 — session-status and universe marks (rows 2, 3). Small, same pattern, same `:5055` process; they share Phase 1's canary mechanism and the P2 duration log.
Phase 3 — bars (rows 4, 5). One store, two routes; the gap-closing job is the work.
Phase 4 — correlation and algo-replay (rows 6, 7). New scheduled jobs on StudioOne; the routes lose their fetch.
Phase 5 — positions valuation and the market-stream ladder (rows 9, 10), after Phase 4. Same rules. The stream loses its fetch on subscribe and on the push loop. The valuation loses `ensure_fresh_underlier_marks`, and its OPF ladder read uses the Phase 1 hop.
Each phase: canary on the server-side identity list, one regular-hours hour in the P2 log inside the 2-second hop, then a production cut after a close, then the fallback deleted. One cut per phase (Q2, ruled). Phase 5 is the fifth cut.

## 4. Ship bar for the program

`git grep` on the deployed MiniTwo tree: no member route, and nothing reachable from one, constructs `MassiveClient`, calls any `fetch_*`, or opens `api.massive.com`, except the StudioOne futures history provider that SODP-5 names. Rows 9 and 10 are member paths. Leaving them on Massive makes this bar false. The history provider's `fetch_futures_aggs` on `:4012` is the designed caller for row 11, and it stays. One regular-hours session after the last cut, the P2 log shows every hopped route inside 2 seconds and the proxy log shows zero `Failed to proxy` on those routes. The `bus: not_configured` line in Arch 30 is replaced by the hop configuration, and an unset hop URL is a boot failure, not a silent fallback.

## 5. Not in this spec

Any Labs control, screen, selector, or default. Wings above 50. A second uvicorn worker (measured first with P2, then its own packet if the log says so). A MiniTwo Redis. Any edit to a feed or collector's Massive call. Tuesday's full-book capture. The Agent Spaces work. A staging host, unless Coach names one. Removing the SODP-5 futures provider's Massive call.

## 6. Ruled

**Q1 — Bars home.** `:4012`. Route `GET /history/v1/store-bars`. Token `LABS_HISTORY_READ_TOKEN`. Ruled 2026-09-29.

**Q2 — Cut cadence.** One production cut per phase. Ruled 2026-09-29. Phase 5 adds a fifth cut. The rule is unchanged.

**Q3 — Session-status.** Today's keys. No `stale` field. Served-last is signalled by nothing new. Ruled 2026-09-29. Row 2 of v0.1 said "with `stale`". That wording is the error this version corrects.

Canary composition is Coach's own identity and one administrator, for every phase, including Phase 5. The id strings are not in this spec. They go on file when Coach confirms them. No canary loads until then. No member identity.
