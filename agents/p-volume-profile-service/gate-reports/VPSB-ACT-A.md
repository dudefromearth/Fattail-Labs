# VPSB ACT A — StudioTwo collector (capacity + live)

**Clock:** 2026-09-17 ~08:01–08:12 ET  
**Token:** `VPSB-W0` · **DL-719** capacity guard

## Capacity (before launch)

| | |
|--|--|
| Volume | Macintosh HD Data (`/dev/disk3s5`) **1.8 Ti** |
| Free | **758 Gi** (~41% of volume) |
| 10% of volume | ~181 Gi — **PASS** (758 ≥ 181) |
| Estimate 1 day ES+MES compressed | **5 Gi** (low single-digit GB, conservative) |
| 20× estimate | **100 Gi** — **PASS** (758 ≥ 100) |
| `vp/ingest` before | empty / 0 |
| App `:3000`/`:4000` | **same APFS Data volume** — no second larger disk on StudioTwo (`/Volumes/FatTail2TB` **not mounted**) |
| Store path | **`/Users/ernie/fattail-market-data`** (not inside `web/`; FatTail2TB path from `.env` overridden — unmounted) |
| Guard | every 15 min; stop writes below **5 GiB** with `DISK_GUARD` |

## Launch

- launchd `gui/$(id -u)/ai.fattail.labs.vp-futures`
- Subscribe `ESU6, ESZ6, MESU6, MESZ6` (front+next from `/futures/v1/contracts`)
- **Not** the stocks `T.SPY` socket

## Prints (within 15 min) — BOTH landing

ES `.../ES/trades/day=2026-09-17/prints.jsonl.gz`:
`{"sym":"ES","contract":"ESZ6","p":"7701.75","s":2,"t":1789647149244,"q":51581571,"session_end_date":"2026-09-17"}`

MES `.../MES/trades/day=2026-09-17/prints.jsonl.gz`:
`{"sym":"MES","contract":"MESZ6","p":"7701.75","s":1,"t":1789647149244,"q":426349568,"session_end_date":"2026-09-17"}`

Mandatory: price, size, timestamp **raw**, contract ticker, `session_end_date`. `c`/`x` absent on this stream — **not a defect**.

WS was **not** refused. Job left running all day.

## ACT B tonight

After 16:00 ET, **after** VPS2 ACT 3: CP-1 on StudioOne, stop StudioTwo writer **before** StudioOne starts, rsync with checksums, no two writers.
