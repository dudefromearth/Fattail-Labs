# VPS-Q2 — verification

**Token:** `VPS-Q2-W0` · **CP-1** · StudioOne READ-ONLY · 2026-09-16 after 16:00 ET  
**Clock:** StudioTwo `2026-09-16 19:58:12 EDT` GATE PASS, then executed.  
**Pre-flight:** `head -1` v0.5 · sha1 `a487a702dff7de45f3a0d4ba0ca09199bd2586dd` · `grep -c Q2` = 3  

**Rollback (d):** end SSH. No writes. Stray `find /Users/ernie` from a glob-failed remote shell was killed (not a feed).

---

## CP-1 (c) BEFORE / AFTER

| | BEFORE 19:58:39 ET | AFTER 20:04 ET |
|--|--|--|
| `chain_feed` | PID **538** · `python -m market_data.chain_feed --interval 2` · since Tue 07AM · launchctl `ai.fattail.labs.chain-feed` enabled −15 | PID **538** same · log mtime 20:04 · still `wrote mb:ladder:…` · Redis IDLETIME 0 |
| `sym_feed` | PID **535** · `--interval 5` · `ai.fattail.labs.sym-feed` | PID **535** same |
| Last snapshot freshness | `chain-feed.out.log` mtime 19:59; last lines `wrote mb:ladder:SPX:2026-09-16:w15:dual` / w25 | log still growing (14.6MB→14.68MB); new hashes on SPX w25 |

**AFTER: chain_feed not degraded.** Same PIDs.

---

## 1. Job + config paths

| | Path |
|--|--|
| launchd | `~/Library/LaunchAgents/ai.fattail.labs.sym-feed.plist` (birth **2026-09-15 07:26:31**) |
| wrapper | `~/Library/LaunchAgents/ai.fattail.labs.sym-feed.run.sh` |
| cwd / code | `/Users/ernie/Fattail-Labs/server` · `-m market_data.sym_feed --interval 5` |
| chain twin | `ai.fattail.labs.chain-feed.plist` + `.run.sh` (same cutover) |
| logs (supervised) | `~/Library/Logs/fattail-labs/sym-feed.out.log` (birth Sep 15 07:27:45) |
| logs (unsupervised) | `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/logs/sym_feed.restart.log` (birth **Aug 29 00:37**, mtime Sep 15 07:27:40, 165 767 384 bytes, 4 667 467 lines) |

Repo is **Fattail-Labs**, not a separate FatTail-Intelligence tree.

---

## 2. Massive streams (cited, StudioOne files)

Running job is **REST snapshot poll**, not a trades/quotes tape, not aggs.

`sym_feed.py`:
- L4: `REST snapshots by default`
- L95–120: `MassiveClient.fetch_underlier_mark` (stocks path for SPY)
- L141: `store.set_json(f"mb:sym:{product}", doc, ttl_s=30.0)`

`massive_client.py`:
- L243–254: `GET /v2/snapshot/locale/us/markets/stocks/tickers/{symbol}`
- L564–567: prefers **snapshot lastQuote mid**, else last trade
- L235–241: fallback `GET /v2/last/trade/{symbol}` (only if snapshot yielded no mid/last)
- Also L23–34 `sym_feed.py`: `GET /v1/marketstatus/now`

`--probe-ws` exists; **not** on the launchd argv. `fetch_aggs` / `fetch_trades_day` / `fetch_quotes_day` exist on the client and are **not** called by this process.

---

## 3. TODAY stored SPY (verbatim)

Durable store is **last tick only** (Redis + MySQL upsert). Five Redis GETs ~6 s apart, 20:03:45–20:04:10 ET:

```
{"symbol":"SPY","feed":"SPY","mid":757.4649999999999,"bid":757.43,"ask":757.5,"prev_close":null,"source":"massive","label":"Market Bus underlier (massive)","ts":1789603424.771521,"seq":1789603424771}
{"symbol":"SPY","feed":"SPY","mid":757.4649999999999,"bid":757.43,"ask":757.5,"prev_close":null,"source":"massive","label":"Market Bus underlier (massive)","ts":1789603431.6013079,"seq":1789603431601}
{"symbol":"SPY","feed":"SPY","mid":757.4649999999999,"bid":757.43,"ask":757.5,"prev_close":null,"source":"massive","label":"Market Bus underlier (massive)","ts":1789603431.6013079,"seq":1789603431601}
{"symbol":"SPY","feed":"SPY","mid":757.4649999999999,"bid":757.43,"ask":757.5,"prev_close":null,"source":"massive","label":"Market Bus underlier (massive)","ts":1789603438.483902,"seq":1789603438483}
{"symbol":"SPY","feed":"SPY","mid":757.4649999999999,"bid":757.43,"ask":757.5,"prev_close":null,"source":"massive","label":"Market Bus underlier (massive)","ts":1789603445.257707,"seq":1789603445257}
```

MySQL `market_live_marks` PK=`symbol` (one row): mid 757.465, bid 757.43, ask 757.50, **last_trade null**, **prev_close null**, source massive, `raw_json` same shape as Redis.

**Present:** mid, bid, ask, ts/seq, source.  
**ABSENT:** size, exchange, sale-condition codes, print tape, bars.

---

## 4. Earliest record / format / rotation

**This process:** no print archive. Redis TTL ~30 s. MySQL one row overwritten. Supervised stdout log from **2026-09-15 07:27:45** (no rotation observed; single growing file).

**Unsupervised stdout (Aug 29 → Sep 15 cutover):** `sym_feed.restart.log` birth **2026-08-29 00:37:17**, last write **2026-09-15 07:27:40** (handoff to launchd). Same line format (`sym SPY mid=… src=massive`). **No timestamps on lines.** 70 `fail:` lines; **4** `sym SPY fail:` — SSL self-signed, connection refused, HTTP 503 on `/v2/last/trade/SPY`, remote closed. Not a format drift.

**Not this process (histogram dual-store raw, for backfill only):** `/Volumes/FatTail2TB/fattail-market-data/raw/SPY/trades/year=*/month=*/day=*/part-000.parquet` (+ `.ok`). Earliest file `year=2004/month=01/day=02`. Latest **2026-08-18**. **No `year=2026/month=09`.** Aug 2026 days present through 18 (gap 1, 8–9, 15–16 weekends/missing). Columns include `price, size, exchange, conditions, sip_timestamp` — that is a **print parquet**, **not** written by today’s `sym_feed`.

---

## 5. Feeds untouched

PIDs **538 / 535** unchanged from BEFORE to AFTER. launchctl still `ai.fattail.labs.chain-feed` / `sym-feed`. SSH ended.

---

## Q2 ANSWER

**Quotes-only** (REST stock **snapshot** lastQuote → mid, 5 s poll). Not a print tape. Not aggregate bars.

## Extend vs sibling

**Extend** the existing StudioOne `sym_feed` process — do not add a sibling Massive client (CP-1 shared-limit vector). Snapshot poll cannot feed VP histograms; print ingest is a **later named redesign of this job**, not a second connection.

## VPS1 readiness

**NO-GO.** Q2 is answered (not prints). Q5 still deferred. No print SoR from this feed. `VPS1-W0` not created.
