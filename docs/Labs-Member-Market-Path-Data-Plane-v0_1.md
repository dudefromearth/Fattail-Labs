# Labs member market-data path on the StudioOne data plane

**Spec v0.1 — DRAFT.** Status: PLAN.
Grants: SODP-MB — the hop for `/api/me/market/*` and every other member request that reaches Massive, which the inventory listed and the Runner spec declined.
Source: `docs/Massive-Call-Site-Inventory-v0_1.md` (2026-09-28). Phase 1: `docs/Runner-Live-Ladder-Data-Plane-v0_1.md` and plan v1.1, already accepted and in flight; this spec does not revise them.
Date: 2026-09-29
Law this restores: TOPO-1 / SODP-1 through SODP-4 — data services and data APIs live on StudioOne; a UI host does not call Massive; the browser never talks to StudioOne.

## 0. Coach's intent

The apps run as they were designed. Every member request in Labs that today reaches Massive from MiniTwo reaches the StudioOne data plane instead. The design already exists in the code — bus reads, durable stores, hops — and production never got it. This spec removes the fallback everywhere it survives on a member path, so the design cannot be silently bypassed by an unset variable again.

## 1. Scope — the member-path call sites

From the inventory, section 1, rows marked "Member request: Yes":

| # | Route | Massive call today | Data-plane replacement |
|---|---|---|---|
| 1 | `GET /api/me/market/chain-ladder` and `/expirations` | ladder fill, expirations scan | **Phase 1, in flight.** `:5055` `/api/ladder` and sibling; last-document store; no Massive on the handlers |
| 2 | `GET /api/me/market/session-status` | `/v1/marketstatus/now`, 12 s | `:5055` read of `mb:session:market_status` that `sym_feed` writes; last-document fallback with `stale`; no Massive |
| 3 | `GET /api/me/market/universe` (and admin universe) | `ensure_fresh_underlier_marks` on stale | `:5055` read of the marks `sym_feed` / `live_stream` write; a stale mark is served marked stale; refresh is the feed's job, never the request's |
| 4 | `GET /api/me/market/ohlc` | `fetch_aggs` when the MySQL bar store has no bars | bars come from the durable store `ohlc_feed` fills; a missing range is a 503 with the range named, never a request-thread fetch; the feed's bootstrap and morning append close gaps |
| 5 | `GET /api/me/trade-log/trades/{id}/chart` | `fetch_aggs` | same store as row 4, same rule |
| 6 | `GET /api/me/strategy-lab/curate/correlation` (and `/relative`) | `fetch_daily_closes` | a daily-closes store on the data plane, written by a StudioOne job on a schedule; the route reads it; missing symbol or range is a 503 naming it |
| 7 | `GET /api/me/options-lab/algo-replay/path` | 1-minute `fetch_aggs` when the stored path has no samples | the stored path is the only source; no samples is a 503 naming the path; a StudioOne job may pre-fill paths, never the request |
| 8 | `POST /api/admin/market-universe/validate` | `validate_with_massive` | admin-only, not a member path; stays as is, noted so it is not mistaken for a gap |

Jobs and feeds — `chain_feed`, `sym_feed`, `ohlc_feed`, `live_stream`, collectors, VP ingest, probes — stay on StudioOne and keep their Massive calls. That is their job.

## 2. Rules for every hop

- **Reach path:** an HTTP read on a StudioOne process, bearer-authenticated, server-side from MiniTwo. The `:5055` OPF process for options and session data; the `:4012` price plane for bars if the bench judges that the right home (say why). Never a Redis client on MiniTwo; never a StudioOne URL or token in the browser.
- **Timeout:** 2 seconds on the hop. Never the 60-second client timeout on a request thread.
- **Stale over wait:** when the hot value is absent, the last value is served with the existing `stale` field true. When there is no last value, the existing failure status for that route, immediately. No request ever waits on Massive.
- **Fail loud, not fall through:** a route configured to hop with its URL unset returns 503 at that request. It does not fill from Massive. The fallback branches are deleted at each route's production cut, not left behind a flag.
- **Browser JSON unchanged:** no new key on any route. `stale` and `epoch_quality` are already on the wire where they exist.
- **Feeds own freshness:** if a route needs a value the plane does not yet keep, the fix is a StudioOne job that writes it, then a read. A request never becomes a fetcher.
- **CP-1:** every StudioOne route added has a stated footprint (reads, shadow writes, zero Massive connections), before/after `chain_feed` status, and a one-line rollback.

## 3. Sequencing

Phase 1 — Runner ladder (plan v1.1, in flight; W0 MATCH; W1 after Tuesday's P2 restart).
Phase 2 — session-status and universe marks (rows 2, 3). Small, same pattern, same `:5055` process; they share Phase 1's canary mechanism and the P2 duration log.
Phase 3 — bars (rows 4, 5). One store, two routes; the gap-closing job is the work.
Phase 4 — correlation and algo-replay (rows 6, 7). New scheduled jobs on StudioOne; the routes lose their fetch.
Each phase: canary on the server-side identity list, one regular-hours hour in the P2 log inside the 2-second hop, then a production cut after a close, then the fallback deleted.

## 4. Ship bar for the program

`git grep` on the deployed MiniTwo tree: no member route, and nothing reachable from one, constructs `MassiveClient`, calls any `fetch_*`, or opens `api.massive.com`. The only Massive callers left in the tree are jobs and feeds that run on StudioOne. One regular-hours session after the last cut, the P2 log shows every hopped route inside 2 seconds and the proxy log shows zero `Failed to proxy` on those routes. The `bus: not_configured` line in Arch 30 is replaced by the hop configuration, and an unset hop URL is a boot failure, not a silent fallback.

## 5. Not in this spec

Any Labs control, screen, selector, or default. Wings above 50. A second uvicorn worker (measured first with P2, then its own packet if the log says so). A MiniTwo Redis. Any edit to a feed or collector's Massive call. Tuesday's full-book capture. The Agent Spaces work. A staging host, unless Coach names one.

## 6. Open — needs Coach

**Q1 — Bars home.** `:5055` (OPF) or `:4012` (price plane) for rows 4 and 5. Consequence: `:4012` is the designed home for price data under SODP; `:5055` already has the hop and token. Default if unruled: `:4012`, with the bench stating the token and route.

**Q2 — Cut cadence.** One production cut per phase (four restarts over ~two weeks) or batch Phases 2–4 into one cut after their canaries. Consequence: per-phase is safer and slower. Default if unruled: per-phase.
