# Ladder book view

**Spec v0.1.**  
Date: 2026-09-29  
Machine for the build: StudioTwo, `~/Fattail-Labs`.  
Machine for the land: StudioOne, after Wednesday 2026-09-30 close, and only if that day's parallel full-book run is clean. The land is the same step as the full-book swap.  
CP-1 governs every StudioOne step.

**Coach, 2026-09-29, verbatim.** The `:5055` ladder route serves any wings window as a view over `mb:book:{name}:{date}` when that key is present, falling back to `mb:ladder` when it is not. `chain_feed` stops fetching per-wings topics for SPX and XSP once the full-book worker is live; six fetches per name per pass. The member response JSON does not change. Wednesday's parallel full-book run is the proof; if it is clean, this and the swap land on Wednesday's close together.

This file does not revise OPF spec v0.3, Runner ladder spec v0.1, or either of those plans. It does not change the member ladder document.

---

## 1. The key

`{name}` is the feed symbol the full-book worker already writes. The key is `mb:book:I:SPX:{YYYY-MM-DD}` or `mb:book:I:XSP:{YYYY-MM-DD}`, one expiration per key, from `feed_key` in `server/market_data/ssr_fullbook.py`. No other name has a book key. The dash does not write the book key and does not write `mb:ladder-last` from it.

## 2. The route

`GET /api/ladder` on `:5055` (`ssr_snapshot_dash.py`):

1. Resolve the symbol the way the route already does.
2. When `LABS_LADDER_BOOK_VIEW` is unset, look up `mb:book:I:{product}:{expiration}`. `off` skips the lookup.
3. Key present: the response is a wings window over that book's `contracts`. The window is `select_listed_wing_window` at the requested wings, capped at 50, the same cap the member ladder uses. Wings 10 and wings 100 are two views of one book. Wings 100 is stored and returned as wings effective 50.
4. The document is the ladder document `build_ladder` already returns, plus the same envelope fields the feed writes today (`product`, `kind`, `spot_source`, `vol_source`, `atm_strike`, `listed_in_window`, `wings_requested`, `wings_effective`, `occ_root`, `occ_roots`, `max_strikes_per_dte`, `massive_page_limit`, `bus`, `stale`, `epoch_quality`). No key is added. `content_hash` stays the market hash. `as_of` and `fetched_at_unix` are the book's `captured_unix`. `stale` is age against `LABS_MARK_STALE_SECONDS`, the same rule as every other chain document. A book serve is not a last-key serve, so it is not forced stale.
5. Spot is the underlying price already on the contracts. The route does not call Massive.
6. Key absent: today's hot key, else today's last key. Unchanged, including the forced-stale last-key rule.
7. Key present but the book has no window (no contracts, no underlying price, no listed strikes): HTTP 502, detail `No option contracts returned for {product} {expiration}`. The route does not fall through to `mb:ladder` and does not call Massive.
8. Interest on the ladder topic is still touched. The response header `X-Labs-Ladder-Served` is `book`, `hot`, or `last`. That header is not a member JSON key.

## 3. The feed

Dedicated SPX and XSP workers stay as proved on 2026-09-29. Every other name stays on the shared pass.

`LABS_CHAIN_FEED_BOOKS` unset or `off`: those workers keep fetching per-wings topics. That is the process that lands tonight.

`LABS_CHAIN_FEED_BOOKS=on`, and at least one `mb:book:I:{product}:{date}` key is present: the worker does not fetch per-wings topics for that name. The six fetches per name per pass are the full-book worker's pass, one load for each expiration from 0 DTE through 5 DTE. `chain_feed` does not take those six. It does not construct a second Massive client for them. It logs `chain_feed_books product=SPX per_wings=0 fullbook_fetches=6`.

The full-book worker is not live for this rule until that flag is on and the key is present. Wednesday's parallel run can write book keys without this feed stopping, because the flag stays off until the close.

## 4. What the member sees

The browser JSON keys are the keys a ladder document has today. Wings effective stays 50. No new field. No Runner control, screen, selector, or default.

## 5. Proof and land

StudioTwo proves the view and the feed gate with no Massive call. The recorded 09:45 chain-feed pass still describes the per-wings workers.

Wednesday 2026-09-30, 09:30–10:00 ET, the ladder watch reports the stale fraction and, beside it, the age of each served ladder (request time minus `as_of`): median, p90, and max, split by hot versus last, in the same five-minute buckets.

Wednesday's parallel full-book run is the proof that the six-fetch worker is clean. If that report is clean, this view, the feed flag, and the full-book swap land together after that close. If it is not clean, none of the three land.

Tonight after 16:00 ET is not this land. Tonight is the dedicated workers already proved, then the MiniTwo P5/P1/P2 API restart as its own step. Data-plane code is not in that restart.

## 6. Rollback

Tonight's chain-feed restart: `LABS_CHAIN_FEED_DEDICATED=off`.

Wednesday, if this spec has landed: `LABS_CHAIN_FEED_BOOKS=off` resumes per-wings fetches. `LABS_LADDER_BOOK_VIEW=off` on the `:5055` process resumes the ladder keys. Neither line restarts `chain_feed` and the dash in one step. A degraded `chain_feed` after the Wednesday step is a fail, and the feed rollback runs.

## 7. Out of this spec

A change to `ssr_fullbook.py`. A second Massive client. A new Redis key. A new member JSON key. Editing the live feed or the live dash during Tuesday's session. Loading the full-book job before Wednesday 09:30 ET. Putting this view into Tuesday's MiniTwo API restart.
