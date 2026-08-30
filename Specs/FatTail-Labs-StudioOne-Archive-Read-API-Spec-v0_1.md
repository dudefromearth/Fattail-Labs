# FatTail Labs — StudioOne Archive Read API Spec v0.1

**Status:** DRAFT v0.1 — interface only. **Not BUILD AUTHORITY.** No StudioOne process change until Coach **three OKs** (DL-539).  
**Type:** StudioOne document — read API the Labs API calls so Time Machine can paint a calendar and fetch past days.  
**Short name:** **SO-AR**  
**Host:** StudioOne (`studioone.local` · `192.168.1.111`). **Not** MiniTwo as writer. **Not** a browser target.  
**Canonical filename:** `Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_1.md`  
**Date:** 2026-08-26  
**Parents:** SSR live tap as-built (`ssr_live_capture`) · Snapshot dash (`ssr_snapshot_dash`, `:5055`) · Arch **28** · OT-EF / **DL-309** · Time Machine Day (AZ-ATM) · Time Machine Instant Replay (TMI) · **DL-539** · Config invariant 2 (fail loud)

**Does not:** write the gold disk or the SSD cache · restart the dash · sidecar index · MiniTwo deploy · member cookies on StudioOne · client Massive · upsample · cross-fill expiry · a build plan (that waits on this stamp)

---

## Scope statement (DL-539)

**Active program:** StudioOne Archive Read API (this document).

**Trees this spec names (Labs repo, not a StudioOne write):**

- StudioOne HTTP surface (new routes on the existing dash **when** three OKs allow a process bounce): coverage, index, day fetch  
- Labs API proxy: member session in, StudioOne out (`LABS_SSR_ARCHIVE_URL` + token at boot)

**Touches outside this program:**

- StudioOne **launchd dash process** and **disk** — **no writes, no restart**, until Coach records **three successive OKs**  
- Time Machine chrome / Instant Replay packets — **not this spec**  
- Gold volume copy / `LABS_SSR_GOLD_COPY` — **not this spec**

The running dash stays on the **old process** until those three OKs. Code may exist in the Labs repo; it is not the interface until this spec is BUILD and the dash is bounced under that grant.

---

## 0. Coach intent (do not drop)

Verbatim Coach, this thread, preserved in order:

1. I need an API so I can retrieve selected dates and symbols. I also need to be able to see what is there and available for download.  
2. Three calls, and the interesting part is the third. **Coverage.** What days exist. Per date: first and last snapshot time, count, observed cadence, any mid-day gaps, and a hash. Not just a list of dates — the calendar has to grey a session that started collecting at eleven, and it can only do that if coverage says so. The hash lets the client cache the answer and lets you tell a growing day from a settled one.  
3. **Day index.** For one date and book: just the timestamps, file, bytes, and hole. Level 0 is about ninety snapshots and lands in a second or two carrying its own spots — that's enough to paint the mini chart. So the index does **not** need spot or content_hash.  
4. **Day fetch.** Snapshots, by level. Not stochastic. Number the snapshots in time order. Level 0 is every 64th. Level 1 is the midpoints of those. Level 2 the midpoints again. Each level is disjoint from every level before it, and each doubles the density. Seven levels reach full fidelity and they sum to exactly the day, with nothing fetched twice.  
5. Interrupting at any point leaves a **uniform** day rather than a patchy one. Optional time window so when the scrubber is parked the client can pull deeper levels around there first.  
6. This ladder is the decay curve running backwards. Same structure, one shedding and one filling.  
7. The browser should never call StudioOne. Labs calls it server-to-server and re-serves to the member.  
8. Responses compressed, and a per-day content hash so a client that already holds levels 0 through 3 can resume rather than restart.  
9. A gap in collection is a named absence in coverage and in the index. Never a filled minute.  
10. When StudioOne is unreachable, coverage returns nothing rather than something stale.  
11. Missing config and StudioOne being unreachable are different events and must not share a path. Missing archive URL aborts boot, fail loud, per invariant 2.  
12. Time Machine's cache is per book — symbol, listed expiration, wing window — and must never cross-fill one expiry into another.  
13. Today shouldn't be reachable on this path — today comes from the live cache.  
14. Confirm the date directory is a New York session date, not a UTC one.  
15. Good work on the disk read — the index cost is a real finding and you were right not to fix it with a sidecar.  
16. Nothing gets written to StudioOne and the dash stays on the old process until I give three OKs. Build plan after I stamp the spec, not with it.

---

## 1. Disk facts (law for the interface)

Read 2026-08-26 on StudioOne. Not a sidecar. Not a packed day file.

| Fact | On disk |
|------|---------|
| **NY session date** | Folder `day=YYYY-MM-DD` is `today_ny()` — **America/New_York calendar date**, not UTC date. Filename clock is UTC time-of-day with **no date**. |
| **Layout (current tap)** | `day=D/chain/<SYM>/snap-HHMMSSmmmZ.json` plus `marks/`, `COUNTS.json`, `PROVENANCE.json`, `CADENCE.json`. Friday **2026-08-14** on gold is **flat** `chain/snap-HHMMSSZ.json` (SPY only, 5-min) and is not rewritten. |
| **Live SoR** | FatTail2TB `…/ssr/live_capture` (`LABS_MARKET_DATA_ROOT`). `~/Library/Caches/fattail-ssr` was a stall workaround and is **not** the store. Coach 2026-08-26: archive belongs on the external drive, not Library. |
| **One file = one snapshot** | Sorted filenames **are** time order. Level 0 = every 64th path after sort. **Byte offsets are not required.** |
| **Index without envelope opens** | `file` = name. `bytes` = `stat`. `t` = filename UTC clock reconstructed against folder date D (below). `hole` = null on a file that exists. **No `open()` of JSON.** Spot and `content_hash` stay in the envelope; Level 0 fetch carries spots for the mini chart. |
| **Book on disk** | Path is **symbol-only**. The tap writes **one listed expiration per symbol per NY date** (`front_expiration` = that session day if listed). Envelope and `COUNTS.json` name that expiration. Two expiries are **not** two directories. |

**Reconstruct `t` from filename (no envelope):** UTC time-of-day from `snap-HHMMSS[mmm]Z.json`, on UTC calendar date chosen so the instant is the write. Operational rule: interpret the clock as UTC on date **D** (the folder’s NY date used as a UTC date) **and** on **D+1**; pick the instant whose America/New_York local date is **D**, else the later candidate that falls in the tap window for D (GTH the prior evening through NY midnight of D+1). Document the chosen instant as RFC3339 with offset. Do not invent a snap to occupy a gap.

**Seek:** `paths = sorted(chain/SYM/snap-*.json)`; level 0 is `paths[i]` for `i % 64 == 0`. Cheap. A sidecar is not needed and **must not** be added by this program.

---

## 2. Book identity

A Time Machine **book** is `(symbol, listed expiration, wing window)`. OPF must not cross-fill.

On this archive, a `day=D` + `symbol` folder holds **one** book: the listed expiration the tap used that NY day (typically D itself for a 0DTE name; `not_today` and zero snaps when the name does not expire that day). Wing window is whatever `PROVENANCE.json` / the tap wrote that day — not a second folder.

**Book selection is a fetch/index parameter, not a client-side filter.** There is nothing in the path to filter. The client sends `symbol` + `expiration`. StudioOne compares to `COUNTS.json` (and `PROVENANCE` wings). Mismatch → named hole **WRONG BOOK**, empty payload, **never** another expiry’s files.

Coverage lists `expiration` and `wings` per book from **COUNTS.json + PROVENANCE.json** (two small files, not 30k envelopes). If COUNTS is missing, `expiration` is named **UNKNOWN** and index/fetch of that book are refused (not guessed).

---

## 3. Today

**Today** (America/New_York) is the live cache. This API is the **archive**.

- Coverage **may** mention today only as `live: true` / `growing: true` so the calendar **does not** route archive playback there. Hash of a growing day moves; every fetch would 409.  
- **Index and day fetch refuse today** — named **TODAY_LIVE**. No snapshots.  
- A day is archive-eligible when `CHECKLIST.json` exists (tap finalized the NY date) **and** the date is not `today_ny()`.  

08-17 (folder exists, started 23:56, zero chain snaps) is not today and not a session — coverage `status: none`, not a green cell.

---

## 4. Three calls

All JSON, gzip when `Accept-Encoding: gzip`. `ETag` = book `hash`. `If-None-Match` may 304. `day_hash` query on fetch: mismatch → **409** `{ "error": "day_changed", "hash": "…" }` — resume, do not restart.

Host (after three OKs): existing dash bind (`0.0.0.0:5055` LAN or `127.0.0.1`). Not the public internet.

### 4.1 Coverage — `GET /api/coverage`

Query: `from`, `to` (NY dates) and/or `days=`; `symbols=` (repeatable or comma).

Per **date**, per **book**:

| Field | Meaning |
|-------|---------|
| `symbol` · `expiration` · `wings` | Book. No cross-fill. |
| `count` | Snap files on disk |
| `first_at` · `last_at` | From **filename+folder date**, not envelope |
| `cadence_s` | Median consecutive filename-clock delta; null if fewer than two snaps |
| `gaps[]` | `{ after_file, until_file, missing_s, hole: "GAP" }` when delta > 2.5 × cadence. **Not** a filled minute |
| `hash` | sha256 of `filename\\tsize\\n` in time order. Growing vs settled |
| `status` | `none` · `partial` · `rth_complete` from first/last vs 09:30–16:00 ET. An 11:00 start is **partial** |
| `live` | `true` only for today / unfinalized — **not archive-routable** |

If the cache root is missing: `days: []` and `store_missing: true` (disk, not network).  
**Do not** treat folder existence as a day. **Do not** use `CHECKLIST.CHAIN` as coverage (finalize can say NO CHAIN after a full RTH).

Calendar: grey `none` and `live`; distinct paint for `partial` vs `rth_complete`.

### 4.2 Day index — `GET /api/index`

Query: `day` (NY date, not today), `symbol`, `expiration` (required).

For one book: **every** snap file in time order, **no envelope open**:

| Field | Source |
|-------|--------|
| `t` | Filename clock + folder NY date (§1) |
| `file` | Name |
| `bytes` | `stat` |
| `hole` | `null` if the file exists. Collection gaps are **missing rows**, not interpolated times. Named in coverage; the index simply does not contain a snap there |

No `spot`. No `content_hash`. No `generation`. No `rows`.

Also: `count`, `hash` (same function as coverage), `expiration`. Wrong book or today → named hole, empty `snaps`.

This is the timeline. The member sees the whole day’s shape and a working scrubber before Level 0 arrives. Level 0 carries spots for the mini chart (~90 snapshots).

### 4.3 Day fetch — `GET /api/fetch`

Query: `day`, `symbol`, `expiration` (required), `level=0..6`, optional `from`/`to` (RFC3339 window), optional `day_hash`.

Number snapshots `0..n-1` in **filename time order**.

| Level | Indices |
|-------|---------|
| 0 | `0, 64, 128, …` |
| 1 | `32, 96, …` (midpoints of level 0) |
| 2 | `16, 48, …` |
| 3 | `8, 24, …` |
| 4 | `4, 12, …` |
| 5 | `2, 6, …` |
| 6 | `1, 3, 5, …` |

Levels are **disjoint**. Union of 0..6 is `{0..n-1}`. Nothing fetched twice. Seven levels = full fidelity.

`from`/`to`: only indices whose reconstructed `t` lies in the window (deeper around the scrubber). Global ladder without a window is the baseline.

Response: full snap envelopes for those indices (chain payload included). `hash` of the book. `409` if `day_hash` does not match.

Interrupt at level 3 → uniform density, not a dense morning and empty afternoon.

---

## 5. Named holes

Never a silent blank. Never a filled minute. Never a lying last paint.

| Name | When |
|------|------|
| **GAP** | Coverage (and as absence in the index) |
| **WRONG BOOK** | `expiration` / wings do not match what that folder holds |
| **TODAY_LIVE** | Index or fetch of today / unfinalized NY date |
| **NONE** | No snaps for that book |
| **NOT TODAY** | Symbol has no listed expiry on that NY date (`COUNTS.not_today`) |
| **UNREADABLE** | Fetch opened a snap that is not JSON — skip that index, do not invent a chain |
| **STUDIOONE UNREACHABLE** | Labs → StudioOne network failure at **runtime** |
| **ARCHIVE AUTH** | StudioOne rejected the token (host is up) |
| **STORE MISSING** | Cache root not a directory |

OT-EF still applies to **payload** snaps (missing strikes stay missing). This API does not invent a print.

---

## 6. Auth boundary and boot

**Browser never calls StudioOne.** Member session (`ft_session`) hits **Labs**. Labs calls StudioOne server-to-server. Same reason as no client Massive: no collector URL, no archive secret in a tab.

### 6.1 Labs boot (invariant 2)

| Env | Boot |
|-----|------|
| `LABS_SSR_ARCHIVE_URL` | **Required.** Missing or empty → **abort boot**. Not a runtime empty calendar. |
| `LABS_SSR_ARCHIVE_TOKEN` | **Required** (≥32 characters). Missing or short → **abort boot**. Labs **always sends** `Authorization: Bearer <token>`. |

These two are **config**. They are not “StudioOne is down.”

### 6.2 StudioOne (when the new routes are live under three OKs)

The archive routes **require** the same bearer. No member cookie. LAN bind only.

| Event | Result |
|-------|--------|
| Token missing or wrong | **401** `ARCHIVE AUTH`. Labs does **not** map this to empty coverage. Named auth failure. |
| TCP / timeout / 5xx / connection refused | **Unreachable.** Coverage: `{ "unreachable": true, "days": [] }` — **nothing stale**. Index/fetch: **503** `STUDIOONE UNREACHABLE`. |
| URL/token missing at Labs boot | Process never starts. |

If StudioOne is still the **old dash** (no token check), Labs still sends the bearer; extra header is ignored until the bounced process enforces it. That bounce is three OKs.

---

## 7. Labs re-serve (member)

| Member | Labs → StudioOne |
|--------|------------------|
| `GET /api/me/options-lab/archive/coverage` | `GET /api/coverage` |
| `GET /api/me/options-lab/archive/index` | `GET /api/index` |
| `GET /api/me/options-lab/archive/fetch` | `GET /api/fetch` |

Session + tool read entitlement. Gzip. `Cache-Control: no-store` on coverage (must not serve a stale day list). Index/fetch may 304 on matching `ETag` / `day_hash` for the **same** book hash only.

---

## 8. Out of scope

- Sidecar, packed day file, gold copy, rewriting Friday 5-min  
- Restarting `ssr-snapshot-dash` or any StudioOne launchd  
- Stochastic sampling · `step_s` retrieve as the product  
- Index fields `spot` / `content_hash`  
- Browser → `studioone.local:5055`  
- MiniTwo until asked  
- Time Machine chrome, Instant Replay RAM ring, Algo Alert  
- Build plan (separate document **after** this stamp)

---

## 9. Open for Coach (not silently decided)

1. **MiniTwo** also boots Labs API. Requiring `LABS_SSR_ARCHIVE_URL` + token there means MiniTwo must have them set even if Time Machine archive is unused. Confirm that is intended for every Labs API process, or only hosts that serve `/api/me/options-lab/archive/*`.  
2. Wing window as a fetch parameter vs coverage-declared only (disk has one wings setting per day folder).  
3. Exact 2.5× cadence multiplier for GAP (named here; override if you want a fixed seconds floor).

Everything in §0 is **law**, not an open.

---

## 10. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1** | 2026-08-26 | Interface: coverage, filename+stat index, dyadic fetch 0..6, named holes, Labs proxy, fail-loud URL+token at boot, unreachable ≠ missing config, NY session date, today excluded, book = symbol+expiration (+ wings as written), no StudioOne write, no sidecar, no build plan. |

**One-line law:**  
**Labs asks StudioOne for the archive of NY-session days that are not today: coverage tells the calendar the hours and the holes; the index is time-order from names and sizes; fetch fills a disjoint 64-stride ladder — never a second market, never a filled gap, never a cross-filled expiry, never a browser on the collector.**
