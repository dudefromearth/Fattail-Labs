# TLAB0-1 — India — Book universe

**Agent:** India  
**Date:** 2026-08-25  
**Spec:** Book Universe v0.1 · **O1 = B (DL-590)** · A/C rejected · **not GO SPEC**  
**Isolation:** read-only.

## Verdict

**APPROVED for build readiness** after Coach **GO SPEC** and **O2 + O3** (or an
explicit waiver at GO SPEC). **RETURNED for product code** until GO SPEC.

O1 = B is coherent: reuse `GET /api/me/trade-log/trades` list params that Find
and Badge already sends (`years` / `days` / `strategies` / `symbols` /
`campaigns` — `_find_filter_clauses` / `TradeFindTag.filterQuery`). Trade Log
page fetch today does **not** pass those (`trade-log/page.tsx` `fetchTrades`
limit + playbook + Adhere only).

## One stream

After B, Autofilter `FilterMap` must drive the fetch. A second
`applyAutofilter` on the response as a **membership** gate is the dual mechanism
moved inward. Identity apply (same predicates) is optional and not required.

## Distincts grain (blocking if ignored)

`GET /api/me/trade-log/distincts` → `trade_distincts(cur, iid)` is **identity**
+ **positions-only** (Find and Badge). Blotter Autofilter is **account** +
**trades** (opens, closes, notes). **Do not** wire Trade Log Autofilter menus to
that endpoint as-is. Alpha: account-scoped blotter distincts (new query or
param). Existing columns suffice; no schema required (opinion).

## Alpha

**Not idle.** B needs (1) account-scoped distincts (2) honest `total` if O2 is
book-matches (3) list already filters — confirm page path applies
`_find_filter_clauses` (it does on `_load_member_book_page`).

`full=1` / `_TRADE_BOOK_LIMIT` 10000 is A — **out**.

## Status (O3)

`positionBadge` / `matchOpenClose` are client matching over the loaded set +
opens (`tradeLog.ts`). Not a SQL column. India does not invent O3. Flag: Open
might use `GET .../opens`; Complete/Orphan need match on more than 80 rows.

## Isolation

Journal / Records out. Find and Badge not rewritten. v0.1.1 text not deleted.
Coach Content Law: A/C remain in §2 as rejected options.

## Flagged (opinion)

Reuse list **params**, not the Find and Badge **found-set** grain (positions
vs trades).
