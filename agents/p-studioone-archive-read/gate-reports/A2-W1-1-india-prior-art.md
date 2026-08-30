# A2-W1-1 India — live dash characterize

**Agent:** India  
**Date:** 2026-08-29  
**Depends:** W0-BA  
**Law:** A2_1 · AT-SOAR-50 · AT-SOAR-55  
**Verdict:** Characterize complete. **No module write.** AT-SOAR-50 and 55 **fail on the live dash.**

Host: `http://192.168.1.111:5055` (StudioOne). Bearer on. Token not reprinted. Dash process started **Thu Aug 27 13:11:34 2026** — not bounced since (W5-GO still Coach).

## As-built quotes (repo, not the running process)

| Seat | Quote |
|------|--------|
| `_book_hole` | `ssr_archive_read.py` L622–633: today → `TODAY_LIVE`; COUNTS missing → `UNKNOWN` except A2-2 flat SPY carve-out **in the Labs tree**. Live dash is the pre-carve-out process. |
| `snap_files` | L182–198: nested `chain/{SYM}/snap-*.json` plus Friday-flat `chain/snap-*.json` for SPY. |
| `ARCHIVE_API_PATHS` | `ssr_snapshot_dash.py` L46–56 **in the repo** includes `/api/marks`. **Live dash does not serve it** (404 `not found`). Wired, not bounced. |
| Labs proxy | `ssr_archive.py` L232 `GET /api/me/options-lab/archive/marks` exists in Labs. **A fixture / Labs unit test does not close 50.** Live proof is the dash. |

## Disk (StudioOne store)

| Path | Fact |
|------|------|
| `day=2026-08-27/marks/vix.jsonl` | **14,622** lines. First mid **17.855**, source `massive_proxy_v1`. |
| `day=2026-08-14/chain/snap-*.json` | **129** flat snaps. No `chain/SPY/`. No `COUNTS.json`. |

## AT-SOAR-50 — FAIL (live dash)

Command: `GET /api/marks?day=2026-08-27&symbols=VIX&t=2026-08-27T14:32:06-04:00`

```
HTTP 404
{"error": "not found"}
```

Chain retrieve of the same tape as if it were a book:

```
GET /api/index?day=2026-08-27&symbol=VIX  →  HTTP 404  hole=UNKNOWN  count=0  snaps=[]
GET /api/fetch?day=2026-08-27&symbol=VIX&level=0  →  HTTP 404  hole=UNKNOWN  count_on_disk=0
GET /api/coverage?days=2026-08-27&symbols=VIX  →  HTTP 200
  books: [{symbol:VIX, expiration:UNKNOWN, count:0, status:none}]
  marks: null
```

That is a present tape (14,622 lines) reported as an **absent chain book**. Spec first print floor `mid=17.855` is on disk and not retrievable. **Fail.** A Labs test that reads the file is not this AT.

## AT-SOAR-55 — FAIL (live dash)

Command: `GET /api/index?day=2026-08-14&symbol=SPY` and fetch level 0.

```
GET /api/coverage?day=2026-08-14&symbols=SPY  →  HTTP 200
  books: [{symbol:SPY, status:rth_complete, count:129, expiration:UNKNOWN}]
GET /api/index?day=2026-08-14&symbol=SPY  →  HTTP 404  hole=UNKNOWN  count=0  snaps=[]
GET /api/fetch?day=2026-08-14&symbol=SPY&level=0  →  HTTP 404  hole=UNKNOWN  count_on_disk=0
```

Coverage can **see** 129 snaps. Index and fetch **cannot retrieve them** (`UNKNOWN` / COUNTS-missing, no live carve-out). The first tape collected is the one day that cannot be replayed. **Fail.**

## Surface today (2026-08-29, weekend)

`GET /api/health` 200 — store `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`, `ok: true`, tap_running true.

`GET /api/status` 200 — `phase: weekend`, `day: 2026-08-29`, wake `2026-08-30T20:15:00-04:00`. Routes on the live process: coverage, index, fetch, cadence, health, status. **No `/api/marks`.** Coverage of a marks-only name is a zero-count UNKNOWN book. Flat 08-14 SPY is counted and then 404'd.

## Drift vs A2_1

| A2_1 | Live dash |
|------|-----------|
| Marks route, nearest-in-time | Path missing (404 not found) |
| Tape ≠ absent book | VIX = count=0 / UNKNOWN / none |
| 08-14 SPY retrievable | Coverage 129; index/fetch 404 UNKNOWN |
| `VIX NOT NATIVE` flag | No marks surface to flag |
| Source travels with mid | Unroutable |

No SO-AR ship in this packet. Dash not bounced.
