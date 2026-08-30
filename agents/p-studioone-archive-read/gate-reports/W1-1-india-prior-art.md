# W1-1 — India prior art (drift table)

**Project:** p-studioone-archive-read  
**Agent:** India  
**Phase:** W1  
**Date:** 2026-08-27  
**Law:** SO-AR v0.8 + Amendment A1 · plan v2.1 FP1–FP24  
**Depends:** W0-BA GO  
**Edits:** none in `server/` or `web/` this packet

**Verdict:** **REPLACE** the reader, proxy, and workspace dash archive handlers as W2/W3/W5. **KEEP** store path, snap glob (nested + Friday-flat SPY), `today_ny`/`data_root`, hash *format*, COUNTS/CHECKLIST/PROVENANCE seams. This tree is unfinished prior art (spec v0.1 docstring, local-date `t`, name-sort, required expiration). It must not ship.

---

## 1. Must-quote files

### 1.1 `server/market_data/ssr_archive_read.py`

Untracked. Header still names **spec v0.1**.

| Lines | Quote | vs law | Keep / replace |
|------|--------|--------|----------------|
| 1–4 | `SO-AR spec v0.1.` | Law is v0.8 + A1 | **Replace** header |
| 32–33 | `Live store is FatTail2TB. Cache remains readable for leftover days.` / `return data_root() / "ssr" / "live_capture"` | FP4 store path | **Keep** `archive_root()` path. Cache leftover is dash/ops, not a second SoR |
| 75–91 | nested `chain/{SYM}/snap-*.json`; Friday-flat `chain/snap-*.json` if `SPY`; **`return sorted(found, key=lambda p: p.name)`** | FP2 / §9b: order by reconstructed `t`. Coach: no name-sorted ladder | **Keep** glob. **Replace** sort — this is the name-sorted ladder |
| 108–117 | `_read_captured_at`: `doc = json.loads(path.read_text(...))` then `captured_at` | FP20: open JSON **only** for two-in-window files. Coach: never quiet `json.loads` on the hot path | **Replace**. Coverage hours are filename+stat (AT-SOAR-1) |
| 172–173 | `symbol_availability`: `first_at = _read_captured_at(paths[0])` (same for last) | AT-SOAR-1 | **Replace** |
| 224, 263 | `"store": "cache"` on `day_available` / `available` | Store is FatTail2TB; never call it gold; do not label the live store “cache” | **Replace** label |
| 270–296 | `snap_instant`: candidates D and D+1 UTC; **`if dt.astimezone(NY).date() == day: return`**; else `candidates[-1]` | FP1 window `[D 00:00 NY, D+1 00:00 NY)`. A1-1: no local-date test. Coach: no local-date candidate test | **Replace**. This *is* the local-date test A1 struck |
| 403–412 | `paths_hash` walks `paths` as given (`filename\tsize\n`) | FP23 format **and** `t` order | **Keep** format. **Replace** walk order (today = name order) |
| 415–437 | cadence from `filename_utc_seconds`; wrap `d += 86400`; GAP `max(GAP_MULT * cadence, cadence + 1)` | FP14 GAP = 2.5× **and** 15 s floor. FP2 deltas from reconstructed `t` | **Replace** |
| 452–466 | `level_indices`: hard stride **64**, levels 0..6 | FP9 derived `S=2^k` with `n/S ≥ 64`; return `S` and `k` | **Replace** |
| 468–479 | `_index_row`: `t, file, bytes, hole` only; comment “No envelope open” | AT-SOAR-6 | **Keep** field set. `t` still comes from local-date `snap_instant` |
| 511–532 | `_book_hole`: `if not expiration: return "WRONG BOOK"` | spec-C / FP5: expiration **optional** assertion; omit → that day’s 0DTE book | **Replace**. Omitting expiration is currently always a hole |
| 518–519 | `if _is_today(day): return "TODAY_LIVE"` | FP6 today → **409** `TODAY_LIVE` | **Keep** named hole; HTTP mapping is W2/W3 |
| 647–651 | `day_index(day, symbol, expiration: str, ...)` required positional | spec-C | **Replace** — optional |
| 701–705 | `day_fetch(..., expiration: str, ...)` required positional | spec-C | **Replace** |
| — | no `OUT OF WINDOW`, no `AMBIGUOUS INSTANT`, no DST cascade, no `next_index`, no health, no pool | FP3, FP8, FP15, FP19, FP20 | **Add** in W2 |

Index itself (`_index_row`) does **not** `json.loads`. Coverage `available` / `symbol_availability` **does**. Fetch `load_snap` is correct for fetch, not for index.

### 1.2 `server/routes/ssr_archive.py`

Untracked. Labs proxy. Browser never given StudioOne URL — **keep that shape**.

| Lines | Quote | vs law | Keep / replace |
|------|--------|--------|----------------|
| 1 | `Browser never calls StudioOne.` | Arch 28 / FP24 | **Keep** |
| 17 | `from routes.trade_log.common import _require_tool_member` | FP12 member archive = **session only** | **Replace** tool-gate |
| 28–36 | missing `LABS_SSR_ARCHIVE_URL` → `ConnectionError` at request time | FP10 absent env → Labs **boots**; routes **501** `ARCHIVE NOT CONFIGURED` | **Replace**. Absent is not 501 today |
| 39–41 | Bearer sent **only if** token present | v0.8: send when configured; malformed/short **abort boot** | **Replace** boot check (W3). Do not send empty Bearer |
| 68 | `headers = {"Cache-Control": "no-store"}` | FP11 coverage `max-age=0, must-revalidate`. A1 leftover §7 `no-store` is spec-side; implement must-revalidate | **Replace** |
| 87–95 | `require_session` then `_require_tool_member(..., capability="read")` | FP12 | **Keep** session. **Drop** tool gate |
| 117–165 | index/fetch: no `expiration` query (good vs spec-C); down → **503** | AT-SOAR-21 coverage empty+named; 503 for index is a later mapping | Partial — W3 |
| — | no `/api/admin/options-lab/archive/{stats,cadence}` | §7 / W3 seed | **Add** in W3 |
| — | no disk cache 20 GB | FP13 | **Add** in W3 |
| — | `config.py` has **no** `LABS_SSR_ARCHIVE_*` keys | FP10 present-and-malformed abort; absent OK | **Add** in W3 |

`server/main.py` 79 / 166 includes the router. **Keep the mount point**; rewrite the router in W3.

### 1.3 Workspace dash vs StudioOne dash

`server/market_data/ssr_snapshot_dash.py` **in this repo already imports the reader.** Live StudioOne was **not** probed this packet (W5 does not fire without Coach word; no bounce).

| Lines | Quote | vs law | Keep / replace |
|------|--------|--------|----------------|
| 4 | `Read-only view of the gold archive on disk.` | Never call the store “gold” | **Replace** copy (W5-1, after W5-GO) |
| 67–68 | `capture_root()` → `data_root() / "ssr" / "live_capture"` | FP4 / DL-597 | **Keep** |
| 77–83 | `scan_roots()`: archive first, SSD cache leftover | leftover cache is not the SoR | **Keep** scan order; do not serve cache as archive |
| 265–348 | `_available_from_qs` / `_coverage_from_qs` / `_index_from_qs` / `_fetch_from_qs` import `ssr_archive_read` | W5 wires this **after** W5-GO. W1 claim: **running** StudioOne dash lacks the module | Workspace is ahead of the live process. **Do not bounce.** |
| 317 | `return day_index(parse_day(day_raw), symbols[0])` — **no expiration** | current `day_index` requires `expiration` | TypeError if hit. **Replace** with W2 signatures |
| 342–349 | `day_fetch(day, symbol, level, start=..., end=..., day_hash=...)` — **no expiration** | same | TypeError. **Replace** |
| 669–689 | HTTP `/api/coverage`, `/api/index`, `/api/fetch` | W5 after GO | **Keep routes**, rewrite after W2 reader exists |

Collector HTML `/` and `/api/status` stay LAN-open (FP / AT-SOAR-27). Not re-audited line-by-line this packet; W4/W5 own Bearer vs `/`.

### 1.4 Store root vs “cache” / “gold”

| Path | Quote | Keep / replace |
|------|--------|----------------|
| `ssr_live_capture.py` 207–211 | `LABS_MARKET_DATA_ROOT` else `/Volumes/FatTail2TB/fattail-market-data` | **Keep** |
| `ssr_live_capture.py` 220–221 | fail-loud: OPF live_capture on FatTail2TB, not `~/Library/Caches` | **Keep** |
| `ssr_archive_read.py` 224, 263 | `"store": "cache"` | **Replace** |
| `ssr_snapshot_dash.py` 4 | “gold archive” | **Replace** wording at W5 |

No product string still names the FatTail2TB store “gold” except the dash docstring.

---

## 2. FP1–FP24 vs this tree

| FP | As-built | Keep / replace |
|----|----------|----------------|
| 1 window `t` | Local-date test `snap_instant` 293–295 | **Replace** |
| 2 `t`-order | `sorted(..., key=name)` 91 | **Replace** |
| 3 holes | TODAY_LIVE, WRONG BOOK, NONE, UNKNOWN, NOT TODAY, UNREADABLE. No OUT OF WINDOW / AMBIGUOUS INSTANT | **Replace** / add |
| 4 store + Friday-flat | `archive_root` + SPY flat glob 85–90 | **Keep** |
| 5 expiration optional | required positional + omitted → WRONG BOOK | **Replace** |
| 6 today 409 | hole string only; HTTP not 409 | Partial |
| 7 pool 4 / nice | absent | **Add** W5 |
| 8 8 MB / 512 / `next_index` | absent; old `retrieve` max_return 4000 | **Replace** |
| 9 derived `S`/`k` | hard 64 | **Replace** |
| 10 absent env 501 | request-time ConnectionError / 200 UNREACHABLE or 503 | **Replace** W3 |
| 11 ETag + must-revalidate | `no-store` 68; index ETag from hash | **Replace** header |
| 12 session-only | session **and** tool-gate | **Replace** tool-gate |
| 13 20 GB disk cache | absent | **Add** W3 |
| 14 GAP 2.5× and 15 s | 2.5× only, filename seconds | **Replace** |
| 15 health 60 s / STORE MISSING | coverage `store_missing` only | **Add** health |
| 16–17 stats / wings | wings from PROVENANCE 482–492; no nightly stats | Keep wings seam; stats W6 |
| 18–21 window / DST / `captured_at` | local-date; no cascade; `_read_captured_at` used on **coverage** not DST | **Replace** |
| 22 AT-SOAR-45 | not runnable until W5 | Hold |
| 23 hash `t` order | format OK, order = name | **Replace** order |
| 24 no sidecar / no TM chrome / no admin-tree | no sidecar in this module | **Keep** |

---

## 3. Tests as prior art (evidence, not a ship)

Command: `server/.venv/bin/python -m pytest tests/test_ssr_archive_read.py tests/test_ssr_archive_ladder.py tests/test_ssr_archive_proxy.py -q`

**3 failed, 8 passed.** Failures:

- `test_day_index_has_no_chain_rows` — `TypeError: day_index() missing 1 required positional argument: 'expiration'` (`test_ssr_archive_ladder.py:92`)
- `test_fetch_level_zero_then_one_disjoint` — same for `day_fetch` (`:118`)
- `test_fetch_window_around_scrubber` — same (`:144`)

`test_day_index_has_no_chain_rows` also asserts `idx["snaps"][0]["spot"]` and `content_hash` — that is the **old envelope-open index**. Current `_index_row` does not emit those fields. Tests and code are two layers of unfinished prior art. **Replace tests in W2** (AT-SOAR reader set). Proxy unreachable-empty test may be kept as a shape.

---

## 4. Git (this packet did not ship)

Pre-existing, not created by W1:

```
 M server/main.py
 M server/market_data/ssr_snapshot_dash.py
?? server/market_data/ssr_archive_read.py
?? server/routes/ssr_archive.py
?? server/tests/test_ssr_archive_ladder.py
?? server/tests/test_ssr_archive_proxy.py
?? server/tests/test_ssr_archive_read.py
```

W1 made **no** edits under `server/` or `web/`. W2 is allowed to replace the untracked reader.

---

## 5. What W2 must not inherit

1. Name-sorted `snap_paths`.  
2. Local-date `snap_instant`.  
3. Quiet `json.loads` in coverage/index.  
4. Required `expiration` / omitted → WRONG BOOK.  
5. Hard stride 64.  
6. `"store": "cache"` and “gold” copy.  
7. Tool-gate on member replay.

Envelope open is allowed **only** as the named two-in-window branch (A1-2 / FP20).
