# FatTail Labs — StudioOne Archive Read API Spec v0.8

**Status:** DRAFT v0.8 — **buildable**. **Corrects a defect this spec introduced.** v0.2 recorded filenames as carrying their own date and retired the reconstruction section on that basis. The disk read of 2026-08-27 shows filenames are **time-of-day only** — `snap-HHMMSSmmmZ.json`. Reconstruction returns, written against the **tap window** rather than a local-date test, because the local-date test is silently wrong for prior-evening snapshots. One consequence is raised as **§9b** and is blocking. Corrects v0.6: **stats are a property of the collection**, so they are computed and stored **on StudioOne**, beside the days they describe. Labs reads and caches. Also corrects the scope statement — **three-OK guards against drift into trees Coach did not designate; Coach has designated StudioOne**, so no count applies to this work. Adds the **nightly stats capture** (§7.2), a **stored stats API** that answers without touching StudioOne (§7.3), and the **admin corpus panel** (§7.4). v0.5 folded the Coach interview of 2026-08-26. Folds the Coach interview of 2026-08-26: the archive is **0DTE only** by design; the capture band is **~2.5σ around spot and monotonic within a session**; StudioOne and MiniTwo are **on the same rack and LAN**; StudioOne is the **permanent corpus home** and will take further functions; **every member gets replay**, no tier and no depth limit. Adds **§4.7 cadence statistics**, which settles the DL-400 question with evidence rather than recollection. Every mechanical value is set. Values marked **[advisor-set]** are engineering defaults chosen so nobody has to ask; overrule any of them in one line and the rest still holds. Product decisions carry a written position, not a blank. **Four** things remain genuinely yours (§9). Adds the operational half the interface needs to survive contact: **collection outranks reads**, response bounds, cache and immutability, window overlap, API versioning, and the unaddressed disk. v0.2 folded three Coach rulings of 2026-08-26. Folds three Coach rulings of 2026-08-26: StudioOne is an **external resource** and Labs boots without it; the collection lives on an **external drive**, not a macOS cache; **filenames carry their own date**. **Not BUILD AUTHORITY.** No StudioOne process change until Coach **three OKs** (DL-539).  
**Type:** StudioOne document — read API the Labs API calls so Time Machine can paint a calendar and fetch past days.  
**Short name:** **SO-AR**  
**Host:** StudioOne (`studioone.local` · `192.168.1.111`). **Not** MiniTwo as writer. **Not** a browser target.  
**Canonical filename:** `Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md`
**Supersedes:** v0.7, v0.6, v0.5, v0.4, v0.3, v0.2, v0.1  
**Date:** 2026-08-26  
**Parents:** SSR live tap as-built (`ssr_live_capture`) · Snapshot dash (`ssr_snapshot_dash`, `:5055`) · Arch **28** · OT-EF / **DL-309** · Time Machine Day (AZ-ATM) · Time Machine Instant Replay (TMI) · **DL-539** · Config invariant 2 (fail loud)

**Does not:** write the gold disk or the SSD cache · restart the dash · sidecar index · MiniTwo deploy · member cookies on StudioOne · client Massive · upsample · cross-fill expiry · a build plan (that waits on this stamp)

---

## Scope statement (DL-539)

**Active program:** StudioOne Archive Read API (this document).

**Trees this spec names (Labs repo, not a StudioOne write):**

- StudioOne HTTP surface — new routes on the existing dash, live at the process bounce: coverage, index, day fetch, cadence, stats, health  
- Labs API proxy: member session in, StudioOne out (`LABS_SSR_ARCHIVE_URL` + token at boot)

**On StudioOne and the three-OK rule (corrected in v0.7).** DL-539's three-OK count guards against **drift** — the advisor or an implementation agent reaching into a tree Coach did not name. **Coach has designated StudioOne for this work.** There is no drift to guard against, and no count applies. v0.1 through v0.6 carried a three-OK condition on every StudioOne write; that was the advisor's constraint, not Coach's, and it is removed.

**This spec therefore writes on StudioOne:** the archive read routes, the health and version surface, and the nightly stats pass (§7.2). The dash is bounced when the work is ready, on Coach's word.

**Touches outside this program:**

- Time Machine chrome / replay packets — **not this spec**  
- The **admin surface** where §7.4's panel mounts — content specified here, surface owned there  
- Gold volume copy / `LABS_SSR_GOLD_COPY` — **not this spec**

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
| **NY session date** | Folder `day=YYYY-MM-DD` is `today_ny()` — **America/New_York calendar date**, not UTC date. |
| **Filenames are time-of-day only — CONFIRMED 2026-08-27** | `snap-HHMMSSmmmZ.json` (e.g. `snap-051730882Z.json`); the flat Friday 2026-08-14 tree uses `snap-HHMMSSZ.json`. **No calendar date in the name.** The folder `day=YYYY-MM-DD` carries the NY session date. **v0.2 recorded the opposite and retired the reconstruction section on that basis; that was this spec's error and it is reversed here.** Reconstruction is restored below, and **this program does not change the tap.** |
| **Layout (current tap)** | `day=D/chain/<SYM>/snap-HHMMSSmmmZ.json` plus `marks/`, `COUNTS.json`, `PROVENANCE.json`, `CADENCE.json`. Friday **2026-08-14** on gold is **flat** `chain/snap-HHMMSSZ.json` (SPY only, 5-min) and is not rewritten. |
| **Store root — CONFIRMED 2026-08-27** | `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` (**DL-597**). The tap writes here. v0.1 named a macOS cache directory; that was wrong and is retired. No longer a fact awaiting confirmation. |
| **One file = one snapshot** | One JSON file per snapshot. Level 0 is every `S`-th path **in time order** (§4.3). **Byte offsets are not required.** **Sorted filename order equals time order only while a folder's clocks stay within one UTC date — see §9b, which is blocking.** |
| **Index without envelope opens** | `file` = name. `bytes` = `stat`. `t` = read from the filename, which carries its own date. `hole` = null on a file that exists. **No `open()` of JSON.** Spot and `content_hash` stay in the envelope; Level 0 fetch carries spots for the mini chart. |
| **0DTE archive** *(Coach, 2026-08-26)* | **Only the 0DTE expiration is captured.** This is deliberate, not an omission: capturing beyond 0DTE balloons the data past what can be delivered for archive replay. One expiration per symbol per NY date, permanently, including for days already collected. |
| **Capture band** *(Coach, 2026-08-26)* | A property of **OPF**, not of this API: roughly **2.5σ around spot**, with a buffer before the range changes, so only the reasonable range is captured. |
| **The band ratchets** *(Coach, 2026-08-26)* | **The range grows within a session; it never drops strikes.** A strike admitted at any point stays for the rest of the day. Nothing vanishes mid-session, a replayed structure keeps every leg it started with, and the band is widest at the close — which is when a trending day needs it. Consequence for sizing: a day's footprint tracks **how far the underlier moved**, not only how long the session ran. |
| **Placement** *(Coach, 2026-08-26)* | StudioOne and MiniTwo sit **on the same rack, on the same LAN**. The link between Labs and the archive is not a constraint; the **member's own connection is the only real ceiling** on a past-day download. No copy or staging step is required. |
| **Permanent home** *(Coach, 2026-08-26)* | StudioOne **is** the corpus, not a staging point, and will take on further functions over time. Two consequences carried into this spec: §6.3's version and health calls are a **seam for what comes next**, not merely defensive; and §4.4's concurrency ceiling is **per machine, not per feature** — the next function added must not silently halve the tap's headroom. |
| **Book on disk** | Path is **symbol-only**. The tap writes **one listed expiration per symbol per NY date** (`front_expiration` = that session day if listed). Envelope and `COUNTS.json` name that expiration. Two expiries are **not** two directories. |

**Reconstructing `t` — by window, not by local-date test.**

The filename gives a UTC time of day. The folder gives an NY session date **D**. The instant is one of two candidates: that clock as UTC on **D**, or as UTC on **D+1**.

**The rule is: the folder's tap window for D is an explicit UTC interval `[window_start, window_end)`. Take the one candidate that falls inside it.** The window is config, fail loud if absent, and is the same window the tap itself uses.

**Why not the obvious rule.** The natural test — *pick the candidate whose America/New_York local date equals D* — is **silently wrong for every prior-evening snapshot**, and wrong by exactly twenty-four hours. Worked case: a snapshot written at 20:17 ET the evening before D has the clock `001730Z`. As UTC on D that instant is 20:17 ET on **D-1** — local date D-1, test fails. As UTC on D+1 it is 20:17 ET on **D** — local date D, test passes, and the rule takes it. The snapshot lands a full day late, and any fallback clause never fires because the primary test already matched. A window test has no such failure: only one candidate is ever inside it.

A filename that does not parse is **UNREADABLE** for that index — skipped, never guessed, never moved to occupy a gap. A parsed clock with **no** candidate inside the window is **OUT OF WINDOW**: named, never forced to the nearer edge.

Emit RFC3339 with offset.

*(v0.1 carried this reconstruction and was right to. v0.2 removed it on the understanding that filenames were dated; the disk read of 2026-08-27 showed otherwise. It is restored, and hardened against the local-date trap that the original rule contained.)*

**Seek (as-built · W8 honesty):** order by reconstructed `t`, never by filename (`sorted` / `i % 64` is leftover and silently wrong across 00:00Z). Level 0 is every `S`-th index of that sequence; `S` is derived per day (§4.3). A sidecar is not needed and **must not** be added by this program.

---

## 2. Book identity

A Time Machine **book** is `(symbol, listed expiration, wing window)`. OPF must not cross-fill.

On this archive, a `day=D` + `symbol` folder holds **one** book: the listed expiration the tap used that NY day (typically D itself for a 0DTE name; `not_today` and zero snaps when the name does not expire that day). Wing window is whatever `PROVENANCE.json` / the tap wrote that day — not a second folder.

**Symbols are a first-class dimension, not SPX with others bolted on.** Coach: *"I need an API so I can retrieve selected dates and symbols."* Coverage takes a symbol set; index and fetch take one symbol each. Which symbols the tap actually collects is **§9**, item 4 — the interface does not assume, and a symbol with no folder for a date is **NONE**, not an error.

**The date determines the expiration.** Because the archive is 0DTE only (§1), a past day holds exactly **one** book per symbol and there is nothing to select between. `expiration` is therefore **not a required parameter** on index or fetch — the client sends `day` + `symbol`, and coverage tells it which expiration that resolves to.

`expiration` remains **accepted and optional** as an assertion: if supplied and it does not match what that folder holds, the request is refused with **WRONG BOOK** rather than served another expiry's files. A client that asserts nothing cannot construct a wrong book at all, which is the stronger position — the failure mode is designed out rather than caught.

*(v0.4 required the parameter, written before the 0DTE ruling. Required → optional-assertion is the whole change; the cross-fill protection is unchanged.)*

Coverage lists `expiration` and `wings` per book from **COUNTS.json + PROVENANCE.json** (two small files, not 30k envelopes). If COUNTS is missing, `expiration` is named **UNKNOWN** and index/fetch of that book are refused (not guessed).

---

## 3. Today

**Today** (America/New_York) is a **growing book**. Coverage marks it `live: true` so the calendar can tell growing from settled. Growing is **selectable**, not grey.

- **Index and fetch of today return snaps when files exist** (200). Empty today → **NONE** / empty snaps, not 409 `TODAY_LIVE`. One Source **TMI-85** (spec v0.4). `TODAY_LIVE` as a fetch refusal is **retired**.
- Hash of a growing day still moves. **`day_changed` (409) is in-flight only** — while a download is running, a `day_hash` mismatch means resume, do not restart. A completed hold does not re-check the hash (TMI-88).
- Collection still outranks reads. The live tap is not paused to serve today.

08-17 (folder exists, started 23:56, zero chain snaps) is not today and not a session — coverage `status: none`, not a green cell.

---

## 4. The calls

All JSON, gzip when `Accept-Encoding: gzip`. `ETag` = book `hash`. `If-None-Match` may 304. `day_hash` query on fetch: mismatch → **409** `{ "error": "day_changed", "hash": "…" }` — resume, do not restart.

Host: existing dash bind (`0.0.0.0:5055` LAN or `127.0.0.1`). Not the public internet — StudioOne and MiniTwo share a rack and a LAN (§1).

### 4.1 Coverage — `GET /api/coverage`

Query: `from`, `to` (NY dates) and/or `days=`; `symbols=` (repeatable or comma).

Per **date**, per **book**:

| Field | Meaning |
|-------|---------|
| `symbol` · `expiration` · `wings` | Book. No cross-fill. |
| `count` | Snap files on disk |
| `first_at` · `last_at` | From **filename+folder date**, not envelope |
| `cadence_s` | Median consecutive filename-clock delta; null if fewer than two snaps |
| `gaps[]` | `{ after_file, until_file, missing_s, hole: "GAP" }` when delta > **2.5 × cadence, with a floor of 15 s** [advisor-set] — the multiplier alone would flag noise on a fast book, the floor alone would miss a stall on a slow one. **Not** a filled minute |
| `hash` | sha256 of `filename\\tsize\\n` in time order. Growing vs settled |
| `status` | `none` · `partial` · `rth_complete` from first/last vs 09:30–16:00 ET. An 11:00 start is **partial** |
| `live` | `true` only for today / unfinalized — **not archive-routable** |

If the cache root is missing: `days: []` and `store_missing: true` (disk, not network).  
**Do not** treat folder existence as a day. **Do not** use `CHECKLIST.CHAIN` as coverage (finalize can say NO CHAIN after a full RTH).

Calendar: grey `none` and `live`; distinct paint for `partial` vs `rth_complete`.

### 4.2 Day index — `GET /api/index`

Query: `day` (NY date), `symbol`, `expiration` (optional assertion — §2).

For one book: **every** snap file in time order, **no envelope open**:

| Field | Source |
|-------|--------|
| `t` | From the filename, which carries its own date (§1) |
| `file` | Name |
| `bytes` | `stat` |
| `hole` | `null` if the file exists. Collection gaps are **missing rows**, not interpolated times. Named in coverage; the index simply does not contain a snap there |

No `spot`. No `content_hash`. No `generation`. No `rows`.

Also: `count`, `hash` (same function as coverage), `expiration`. Wrong book or today → named hole, empty `snaps`.

This is the timeline. The member sees the whole day’s shape and a working scrubber before Level 0 arrives. Level 0 carries spots for the mini chart (~90 snapshots).

### 4.3 Day fetch — `GET /api/fetch`

Query: `day`, `symbol`, `expiration` (optional assertion — §2), `level=0..6`, optional `from`/`to` (RFC3339 window), optional `day_hash`.

Number snapshots `0..n-1` in **filename time order**.

**The stride is derived per day, not fixed [advisor-set].** Let `n` be the snapshot count. The stride is the largest power of two `S = 2^k` such that `n / S >= 64`; floor `S` at 1. Level 0 is then always **64 to 127 snapshots** — a usable coarse pass on a dense day and on a thin one alike. The level count is `k`, and **both `S` and `k` are returned in the index and in coverage**, so nothing is hardcoded on the client.

A fixed stride of 64 was v0.1's value, sized to a 5,800-snapshot day. It gives eight snapshots on a 500-snapshot day and no mini chart. Deriving it costs nothing: the dyadic property holds for any power of two.

Worked example, `n = 5800` → `S = 64`, `k = 6`:

| Level | Indices | Count |
|-------|---------|-------|
| 0 | `0, 64, 128, …` | ~91 |
| 1 | `32, 96, …` (midpoints of level 0) | ~91 |
| 2 | `16, 48, …` | ~181 |
| 3 | `8, 24, …` | ~363 |
| 4 | `4, 12, …` | ~725 |
| 5 | `2, 6, …` | ~1450 |
| 6 | `1, 3, 5, …` | ~2900 |

Levels are **disjoint**. Union of `0..k` is `{0..n-1}`. Nothing fetched twice. `k+1` levels = full fidelity.

`from`/`to`: only indices whose `t` lies in the window (deeper around the scrubber). Global ladder without a window is the baseline.

Response: full snap envelopes for those indices (chain payload included). `hash` of the book. `409` if `day_hash` does not match.

Interrupt at level 3 → uniform density, not a dense morning and empty afternoon.

### 4.4 Collection outranks reads

**StudioOne is a collector first.** The same machine is writing the live tap at a two-to-five second cadence while this API opens thousands of files to serve a day. **A read that starves the writer costs a snapshot that can never be recovered.** No archive request may degrade live capture. That is the ranking, and it is not negotiable by load.

What that requires of the implementation:

- **A concurrency ceiling on archive work** — a bounded worker pool, not one goroutine or thread per request. Exhausted → **429** `ARCHIVE BUSY`, named, with a retry hint. Never an unbounded queue, which is a slow starvation rather than a fast refusal.
- **The tap's write path takes priority** over archive I/O by whatever mechanism the host offers (nice level, separate pool, I/O throttle). If the platform cannot express that, the concurrency ceiling is the only lever and must be set low enough that it does not matter.
- **A per-request timeout**, so one pathological day cannot hold a worker indefinitely.
- **Capture health is observable** — if archive load ever correlates with a cadence gap in the live tap, that has to be visible after the fact, not inferred.

**Set values [advisor-set]:**

| Value | Setting | Why |
|---|---|---|
| Archive worker pool | **4 concurrent requests** per StudioOne **machine** [advisor-set, revised in v0.5] | Sized against **overlap of long operations**, not requests per second: a replay is one member pulling for minutes, not a click that ends. Coach expects a handful concurrent and a few dozen across a session at 500 members. Four is comfortable there and at ten times it, while staying far below what the tap would notice. Per **machine**, so functions added to StudioOne later share this ceiling rather than each claiming their own. |
| Queue depth beyond the pool | **8** [advisor-set, revised in v0.5] | Arrivals are bursty rather than sustained, so the queue matters more than the pool. Eight makes a busy signal genuinely rare rather than something a member meets on an ordinary session. Beyond 8 → `ARCHIVE BUSY`. |
| Retry hint on `ARCHIVE BUSY` | **`Retry-After: 2`** | Two seconds is one capture interval. The client backs off by the natural rhythm of the machine. |
| Per-request timeout | **30 s** | A bounded fetch (§4.5) at level 0–3 is well under this; anything longer is pathological and should release the worker. |
| Tap write priority | Archive work runs **niced below** the capture process | Whatever mechanism the host offers. If none is available, the pool of 2 is the only lever and stands alone. |
| Capture health record | Per NY date, record **observed cadence and any gap**, alongside archive request counts | So a cadence gap that coincides with archive load is visible after the fact rather than inferred. |

All config, fail loud if present and unparseable, defaults as above if absent.

### 4.5 Response bounds

Level 6 of a dense day is roughly 2,900 envelopes. As a single JSON body that is tens of megabytes assembled in memory on the collector, which §4.4 forbids.

- Every fetch response is **bounded**. A request whose result would exceed the bound returns what fits, **in index order**, plus a **continuation marker** naming the next index. Never a truncated body without one, and never a silent partial that reads as a complete level.
- The client completes a level by following continuations, and a level is only complete when the marker is absent.
- **The bound is 8 MB uncompressed per response [advisor-set]**, or **512 envelopes**, whichever is reached first. Eight megabytes is a comfortable single body over LAN and keeps peak memory on the collector modest; 512 caps envelope-count on days with small books.
- **The continuation marker is the next index** in that level's sequence, returned as `next_index`. Absent means the level is complete. The client re-requests the same level with `from_index=next_index`.
- **Deep levels are the ones that need this.** Levels 0 through 3 are small; the ladder is designed so the member is already working long before any level needs chunking.

### 4.6 Windows, overlap, and what the client already holds

A window and the global ladder can ask for the same snapshot twice — pull level 3 around 14:30, then pull level 3 globally, and the window's indices come back again.

- **The index set for a level is deterministic**, so the client can compute what a global request will return and skip what it holds. Fetch does not need to know the client's state.
- Fetch **may** accept an exclusion — a set of indices already held — as an optimization. It is never required, and a request without one must return the full level.
- **The union rule survives windowing:** levels stay disjoint, and the union of 0 through the deepest level is still exactly the day. A window narrows *which* of a level's indices come back; it never changes which indices belong to that level.

### 4.7 Cadence statistics — `GET /api/cadence`

**Coach, 2026-08-26:** there are no interval metrics on actual chain snapshots. The heatmap *appears* to refresh about every two seconds, but that is the app's refresh and not necessarily the write cadence, and DL-400 records the configured capture at four seconds with a fail-loud band of three to five. **This call replaces recollection with measurement.**

It is computed **from filenames and `stat` alone** — no envelope opens, no write to StudioOne, and therefore free to run over the whole corpus.

Query: `from`, `to` (NY dates) and/or `days=`; `symbols=`.

Per date, per book:

| Field | Meaning |
|---|---|
| `count` | Snapshots on disk |
| `span` | `first_at` → `last_at`, and elapsed seconds |
| `delta_min` · `delta_p05` · `delta_median` · `delta_p95` · `delta_max` | Consecutive filename-clock deltas in seconds. The median is the same value coverage reports as `cadence_s` |
| `delta_hist` | Bucketed distribution, **1-second buckets to 15 s** then a tail bucket [advisor-set]. This is what shows whether a cadence is tight or merely averages to a number |
| `gaps` | Count and total missing seconds, by the §4.1 rule |
| `within_dl400` | Fraction of deltas inside **[3, 5]** — **leftover.** DL-609 reversed the capture band to **[2, 5]**. Stats emit both `within_dl400` (this cell) and `within_dl609` (`[2, 5]`, the law). Do not size a ladder on `[3, 5]`. |
| `by_hour` | The same summary bucketed by session hour, so an open-and-close slowdown is visible rather than averaged away |

And across the requested range: the same summary pooled, plus **per-day medians in date order**, so drift over the life of the collection is visible.

**What this settles.** Run it across every collected day and the DL-400 question answers itself. Three possible outcomes, and the spec does not presume which:

- Deltas cluster near **2 s** → the running capture is outside DL-400's fail-loud band and DL-400 needs a reversal logged. Time Machine's ladder is sized on 2 s.
- Deltas cluster near **4 s** → DL-400 is accurate, the browser observation was the app's refresh rather than the write, and the ladder is sized on 4 s.
- Deltas are **wide or bimodal** → cadence is not a constant, `cadence_s` as a single number is misleading in coverage, and the ladder should be sized on the p95 rather than the median.

**This is a read.** It measures what the collector already wrote. Changing what the collector writes — enforcing a cadence, recording metrics at capture time — is a StudioOne write and is out of scope here (§8).

---

## 5. Named holes

Never a silent blank. Never a filled minute. Never a lying last paint.

| Name | When |
|------|------|
| **GAP** | Coverage (and as absence in the index) |
| **WRONG BOOK** | `expiration` / wings do not match what that folder holds |
| **TODAY_LIVE** | **Retired as a fetch refusal** (TMI-85). Coverage may still mark today `live: true`. |
| **NONE** | No snaps for that book |
| **NOT TODAY** | Symbol has no listed expiry on that NY date (`COUNTS.not_today`) |
| **UNREADABLE** | Fetch opened a snap that is not JSON, or a filename that does not parse — skip that index, do not invent a chain |
| **OUT OF WINDOW** | A parsed clock has no candidate instant inside the folder's tap window (§1). Named, never forced to the nearer edge |
| **ARCHIVE NOT CONFIGURED** | This Labs host has no archive URL or token. Labs runs; the archive path fails loudly |
| **STUDIOONE UNREACHABLE** | Labs → StudioOne network failure at **runtime** |
| **ARCHIVE AUTH** | StudioOne rejected the token (host is up) |
| **STORE MISSING** | Store root not a directory — includes an **external drive that is not mounted** |
| **ARCHIVE BUSY** | Concurrency ceiling reached (§4.4). Named refusal with a retry hint, never an unbounded wait |
| **VERSION MISMATCH** | StudioOne speaks an API version Labs does not understand (§6.3) |
| **TAP RESTART** | Two capture runs inside one NY date produced overlapping or duplicate filename clocks. Named, never silently deduplicated |
| **STATS STALE** | The stored summaries are older than the nightly schedule allows (§7.2). Named, never served as current |
| **STATS DISAGREE** | A stored summary does not match the files it describes. The files win; the summary is recomputed (§7.2) |

OT-EF still applies to **payload** snaps (missing strikes stay missing). This API does not invent a print.

---

## 6. Auth boundary and boot

**Browser never calls StudioOne.** Member session (`ft_session`) hits **Labs**. Labs calls StudioOne server-to-server. Same reason as no client Massive: no collector URL, no archive secret in a tab.

### 6.1 Labs boot — StudioOne is external (Coach, 2026-08-26)

**StudioOne is an external resource. Its availability has zero bearing on production functioning. Time Machine simply fails loudly.**

| Env | Boot |
|-----|------|
| `LABS_SSR_ARCHIVE_URL` absent | **Labs boots normally.** No abort. |
| `LABS_SSR_ARCHIVE_TOKEN` absent | **Labs boots normally.** No abort. |
| Present but malformed — unparseable URL, token below the required length | **Abort boot.** Invariant 2 governs config that is *present and invalid*. Absent is a supported state; configured-wrong is a deployment error. |

Where present, Labs sends `Authorization: Bearer <token>`.

With the archive unconfigured, **every archive route fails loudly and by name** — `ARCHIVE NOT CONFIGURED`. Time Machine surfaces that state rather than an empty calendar, because an empty calendar says *there are no days* when the truth is *this host has no archive*. Nothing else changes: no route outside `/api/me/options-lab/archive/*` behaves differently, and no other feature degrades.

This closes v0.1's open 1. MiniTwo does not need archive config to boot, and a Labs process that never serves the archive never needs it at all.

### 6.2 StudioOne (once the new routes are live)

The archive routes **require** the same bearer. No member cookie. LAN bind only.

| Event | Result |
|-------|--------|
| Token missing or wrong | **401** `ARCHIVE AUTH`. Labs does **not** map this to empty coverage. Named auth failure. |
| TCP / timeout / 5xx / connection refused | **Unreachable.** Coverage: `{ "unreachable": true, "days": [] }` — **nothing stale**. Index/fetch: **503** `STUDIOONE UNREACHABLE`. |
| Archive not configured on this Labs host | **501** `ARCHIVE NOT CONFIGURED`. Labs boots and runs; only the archive path is unavailable, and it says so. |

**Three silences, three names, never collapsed:** not configured · not reachable · not authorized. A member looking at an empty calendar must be able to learn which one they are looking at.

If StudioOne is still the **old dash** (no token check), Labs still sends the bearer; the extra header is ignored until the bounced process enforces it. Labs therefore works across the bounce in either order — nothing has to be deployed in lockstep.

### 6.3 API version and health

Labs and StudioOne are deployed separately and will drift.

- Every response carries an **API version**. Labs checks it. A version Labs does not understand is **VERSION MISMATCH** — named and refused, never parsed hopefully. A field Labs does not recognize is ignored; a *contract* it does not recognize is not.
- A **health call** — `GET /api/health` — that does not touch the archive: process up, store mounted, tap running, API version, store root path. **Labs polls it every 60 s [advisor-set]** and uses the result to distinguish *up but storeless* from *down*, rather than pulling coverage to ask whether anyone is home.
- **API version is `1`** and travels as a top-level `api_version` field on every response [advisor-set]. Labs accepts exactly what it knows; anything else is `VERSION MISMATCH`. Bump on any breaking change to coverage, index, or fetch shape.
- **The store being unmounted is its own state.** An external drive that is not mounted is not an empty archive and not a dead host — it is **STORE MISSING**, already named in §5, and health reports it before a member ever picks a date.

---

## 7. Labs side — re-serve, cache, stats, admin

| Member | Labs → StudioOne |
|--------|------------------|
| `GET /api/me/options-lab/archive/coverage` | `GET /api/coverage` |
| `GET /api/me/options-lab/archive/index` | `GET /api/index` |
| `GET /api/me/options-lab/archive/fetch` | `GET /api/fetch` |

**Session only. No tool entitlement, no tier, no depth limit** *(Coach, 2026-08-26: "everyone gets replay to their browser")*. Every authenticated member may replay every collected day. v0.4 carried a tool-entitlement gate that was never a ruling; it is removed. Gzip. Coverage `Cache-Control: max-age=0, must-revalidate` (v0.3 `no-store` is dropped — resolved below). Index/fetch may 304 on matching `ETag` / `day_hash` for the **same** book hash only.

### 7.1 Labs-side cache and immutability

**A settled day never changes.** Once the tap has finalized an NY date, its files are fixed: same names, same sizes, same hash, forever. That is the property everything else here leans on.

Because of it:

- **Labs caches what it pulls.** Ten members replaying the same day must not become ten passes over the collector — that is §4.4's concern arriving through the front door. Coverage for settled days, indices, and fetched levels are all cacheable at Labs, keyed by book hash.
- **The cache is authoritative until the hash moves**, and for a settled day it never does. `409 day_changed` should therefore be rare, and if it fires on a settled day, something rewrote history and that is worth knowing rather than absorbing.
- **A growing day is the exception** and is already excluded — today is not archive-routable at all (§3).
**Set values [advisor-set]:**

| Value | Setting | Why |
|---|---|---|
| Where | **Labs disk**, under a configured cache root | A day is tens of megabytes; memory is the wrong place and it must survive a Labs restart or the collector pays again. |
| Size ceiling | **20 GB** | Roughly a year of trading days at current rates. Generous enough that eviction is rare and bounded enough to be a real limit. |
| Eviction | **Least recently used, whole days only** | A half-evicted day is a lying cache. Days go whole. |
| Key | `(symbol, expiration, NY date, level, book hash)` | The hash in the key means a changed day can never serve stale bytes; it simply misses. |
| Settled-day coverage TTL | **Indefinite** — settled days never change | Immutability is the point of this section. |
| Growing-day coverage TTL | **30 s** | Today is not archive-routable, but coverage still mentions it as `live`; a short TTL keeps the calendar honest as a session fills. |

Without this section the interface is correct and the system still falls over, because every member is a fresh full pull.

### 7.2 Nightly stats pass (runs on StudioOne)

**Coach, 2026-08-26: stats are a property of the collection.** They are computed and stored **on StudioOne, beside the days they describe** — not derived remotely by a consumer. v0.6 put the job on Labs to avoid a StudioOne write; that constraint was the advisor's, not Coach's, and it is removed.

What that buys, beyond correctness of ownership:

- **No round trip.** The job reads filenames on local disk instead of pulling lists across the network.
- **One answer, not one per consumer.** Every reader — this API, the admin panel, anything StudioOne grows later — sees the same computed value rather than each deriving its own. A second derivation is a second truth waiting to disagree.
- **The stats survive with the day.** A day and its measurement move, back up, and expire together, because they are the same artifact.

**Settled days are immutable, so a day is measured exactly once.** Each night the pass measures only NY dates finalized since the last run, then writes that day's summary beside the day. A day already carrying a summary is never recomputed, so the nightly cost is one day's filenames no matter how large the corpus grows. A full recompute exists as an explicit admin action, never as a schedule.

| Value | Setting |
|---|---|
| Where | **StudioOne**, launchd, same machine as the tap. The agent is `user/$(id -u)` with **`LimitLoadToSessionType` `Background`** — SSH `launchctl` is that domain; an Aqua-only plist bootstrap fails (I/O error 5) and the calendar never fires. A one-shot backfill is not this job. |
| Schedule | **02:00 America/New_York** [advisor-set] — after the session finalizes, before the next global session opens |
| Scope per run | NY dates finalized since the last successful run, all symbols |
| Written | A per-day summary **beside the day**, plus a small store-level roll-up (`days_collected`, `bytes_total`, growth, run health) |
| Cost | Filenames and `stat` only — **no envelope opens**, so a full backfill of the corpus is cheap |
| Backfill on first run | Every collected day, oldest first. **This is what answers DL-400.** |
| Retention | **Indefinite.** A day's summary is kilobytes; discarding it buys nothing |
| Failure | **Fail loud and record it.** A run that cannot complete records the attempt and the reason. It never writes a partial day's summary and never silently skips one |
| Concurrency | The pass takes a worker from the §4.4 pool like any other archive work. **Collection still outranks it** — a stats pass must never be the reason a snapshot is missed |

**The pass's own health is part of the data.** A stats job that quietly stopped is a monitor that lies: the panel would show a healthy corpus because it is showing an old answer. `last_run_at` and `last_run_status` travel with every response, and a roll-up older than the schedule allows is named **STATS STALE** rather than served as current.

**A summary is not a second source of truth about a day.** It is a derived measurement of files that remain the record. If a summary and the files ever disagree, the files win and the summary is recomputed — never the reverse.

### 7.3 Stats API

`GET /api/stats` on StudioOne, re-served by Labs at `GET /api/admin/options-lab/archive/stats`.

Serves the stored summaries. Because they are files beside the days, this call is cheap and does not re-measure anything.

**Labs caches what it reads**, keyed the same way as §7.1 — a settled day's summary is as immutable as the day. That cache is what lets the admin panel answer **when StudioOne is down**, which is exactly when someone is looking at it. It is a cache of an immutable value, not a second computation.

Query: `from`, `to` (NY dates), `symbols=`, optional `granularity=day|range`.

Returns the §4.7 shape per day, plus:

| Field | Meaning |
|---|---|
| `last_run_at` · `last_run_status` | The job's own health (§7.2) |
| `days_collected` · `bytes_total` | Corpus size |
| `growth_bytes_per_day` | Trailing mean [advisor-set: **20 sessions**], and a projected date for any ceiling asked about |
| `medians_by_day` | Per-day median cadence in date order — the drift series |
| `flags[]` | Days carrying `GAP`, `TAP RESTART`, `partial`, `none`, or a cadence excursion |

A live pass-through to §4.7 stays available at `GET /api/admin/options-lab/archive/cadence` — for a day the pass has not reached yet, and to check a stored summary against the files it describes. **Administrator role only**, both routes: this is operational data, not member data.

### 7.4 Admin corpus panel

The panel belongs to the **admin surface**, which is **outside this program**. This section specifies **what it shows and why**; where it mounts and how it is styled is a one-line amendment to the admin spec and its own seed. Nothing here authorizes an edit to the admin tree.

Four blocks, in this order — most actionable first:

**Alarms.** Only what needs a human. A finalized date with no chain. A date that came in `partial`. A cadence excursion outside the configured band. A `TAP RESTART`. A failed or stale stats run. **Empty is the normal state and empty should look normal** — a panel that always shows something teaches people to stop reading it.

**Last session.** Yesterday's capture at a glance: snapshot count, span, median and p95 delta, gap count and total missing seconds, fraction inside the DL-400 band, and bytes. This is the row that tells you the collector did its job last night.

**Cadence drift.** Per-day median as a line over the collection's life, with the configured band drawn behind it. A collector that is slowly degrading shows here and nowhere else. The distribution histogram (§4.7) available for any single day, because a median of three can be a tight three or a bimodal two-and-four, and those are different machines.

**Corpus.** Days collected, total bytes, growth per day, and the projected date at whatever ceiling you are watching. This is the row that turns retention (§9, item 1) from a someday question into a dated one. **Hold resident bytes sit on this row** (Time Machine C11 watch): tab JS heap after a completed full-fidelity download — count, avg / min / max, how many crossed 400 MiB, largest holds. Aggregates only.

**Not on this panel:** anything member-facing, anything about who replayed what, and any control that writes. It is a window on the collector, not a console for it. Hold-resident is operational heap, not a member replay log.

---

## 8. Out of scope

- Sidecar, packed day file, gold copy, rewriting Friday 5-min  
- Restarting `ssr-snapshot-dash` or any StudioOne launchd  
- Stochastic sampling · `step_s` retrieve as the product  
- Index fields `spot` / `content_hash`
- Reconstructing by local-date test (silently wrong). Reconstruction **by tap window** is in §1 and is not retired.
- Aborting Labs boot on absent archive config
- ~~Serving `marks/` (§9, item 2)~~ **closed by Amendment A2_1** — the tape is served. This line is leftover and must not be followed.
- Deleting or thinning anything on StudioOne (§9, item 1 decides retention; this API never writes)
- Unbounded fetch responses and unbounded concurrency
- Capturing beyond 0DTE, or widening the capture band (§1 — an OPF property and a deliberate Coach limit)
- Recording cadence metrics **at capture time**, or enforcing a cadence (a StudioOne write; §4.7 only measures what is already written)
- Recomputing a settled day's summary on a schedule (measured once; explicit admin action only)
- Building or styling the admin panel itself (§7.4 specifies the content; the surface is the admin spec's tree)
- Alerting and notification routing — the flags exist here; whether one raises a notification belongs to the admin notifications spec
- Corpus backup and offsite copy — parked by Coach pending a network appliance decision. When built: nightly incremental of new days only (settled days are immutable, §7.1), verified against the day hash, and **never in any read path**  
- Browser → `studioone.local:5055`  
- MiniTwo until asked  
- Time Machine chrome, Instant Replay RAM ring, Algo Alert  
- Build plan (separate document **after** this stamp)

---

## 9. Settled values and the four that are yours

**Closed in v0.2 by Coach:** v0.1's open 1. StudioOne is external, Labs boots without it, Time Machine fails loudly. §6.1.

**Two facts this spec asserts and must confirm against the running implementation before stamp.** Both were wrong in v0.1 and were corrected by Coach, not by a disk read:

1. **The store root** on the external drive.  
2. **The exact snapshot filename format**, now that filenames are known to carry their own date.

Neither is invented here. If the implementation contradicts either, this spec is the bug.

**Settled in v0.4 [advisor-set] — overrule any in one line, nothing else moves:** level-0 stride derived per day (§4.3) · response bound 8 MB / 512 envelopes with `next_index` (§4.5) · pool 2, queue 4, `Retry-After: 2`, 30 s timeout, niced below the tap (§4.4) · Labs cache on disk, 20 GB, whole-day LRU, hash in the key (§7.1) · GAP at 2.5 × cadence with a 15 s floor (§4.1) · API version `1` and a 60 s health poll (§6.3) · coverage `Cache-Control` resolved below · hole statuses resolved below · wings resolved below.

**Coverage caching, resolved:** v0.3 carried both an `ETag` and `no-store`, which contradict. **`no-store` is dropped.** Coverage returns `ETag` plus `Cache-Control: max-age=0, must-revalidate` — the client always revalidates, and a 304 costs nothing. Nothing stale is ever served and the round trip stays cheap.

**HTTP status per named hole, resolved:**

| Hole | Status |
|---|---|
| `GAP` | **200** — a property of a real day, not an error |
| `NONE` | **200**, empty `snaps` — that book genuinely has nothing that day |
| `NOT TODAY` | **200**, empty — the symbol did not expire that day |
| `WRONG BOOK` | **404** — the requested expiration is not what that folder holds |
| `TODAY_LIVE` | **Retired.** Do not return 409 for today when files exist. |
| `OUT OF WINDOW` | **200** with the row named — data truth, surfaced not resolved |
| `UNREADABLE` | **200** with the index skipped and named |
| `ARCHIVE BUSY` | **429** + `Retry-After` |
| `STORE MISSING` | **503** |
| `ARCHIVE NOT CONFIGURED` | **501** |
| `STUDIOONE UNREACHABLE` | **503** |
| `ARCHIVE AUTH` | **401** |
| `VERSION MISMATCH` | **502** — Labs reached StudioOne and could not speak to it |
| `TAP RESTART` | **200** with the day flagged |

**Wings, resolved:** **coverage-declared only.** The disk holds one wings setting per day folder, so a wings parameter on fetch could only ever be a filter over what is already there — and a filter that can silently return less than the book is a cross-fill risk. Coverage declares the wings; index and fetch return the book whole.

---

**Four things are genuinely yours.** Each carries a written position rather than a blank.

1. **Retention.** The corpus grows about 20 GB a year and nothing in this design ever deletes. *Position: keep everything for now and revisit at 100 GB.* Storage is cheap against the value of a gold corpus, and the decision is cheap to defer — but not deciding is itself a choice, so it should be a logged one. The alternative shape, if you ever want it, is the decay ladder run against old days: thin them the way today's cache thins rather than dropping them whole.

2. **The `marks/` directory.** It sits on disk and this API never serves it. *Position: leave it unserved.* Under your ruling that past days come from the chain, marks are redundant for every date the chain covers, and serving a second source of spot is the two-truths problem the Time Machine merge already flagged. The case for the other answer is dates before the chain collection started — but those are greyed on the calendar anyway.

3. **A tap restart inside one NY date.** Two runs can produce duplicate or overlapping clocks. *Position: keep both as distinct indices and flag the day `TAP RESTART`.* Deduplicating throws away real captured data on a guess about which run was right, and marking the day unusable throws away a whole session for a seam. Keeping both is the only option that loses nothing — but it means the timeline can contain two snapshots at the same instant, and Time Machine has to tolerate that.

4. **Which symbols the tap collects**, and whether the calendar advertises a symbol whose folders exist on some dates and not others. Only you know the collection set. *Position: coverage reports per symbol per date honestly, and the calendar greys a symbol-date with no folder, exactly as it greys an uncollected date.* No position is possible on the set itself.

---

**Closed by the Coach interview of 2026-08-26, no longer open:** capture depth (0DTE only, deliberate) · capture band (~2.5σ, ratcheting) · StudioOne placement (same rack, same LAN — no bandwidth ceiling, no copy step) · corpus permanence (StudioOne is the home and will take further functions) · replay entitlement (everyone, no tier, no depth limit) · concurrency sizing (pool 4, queue 8, per machine).

**Answered by measurement rather than ruling:** the capture cadence, via §4.7. Nothing numeric downstream of it should be frozen until that call has run over the collected days.

---

## 9b. BLOCKING — does sorted filename order actually equal time order?

**This is the spec's foundational law and it may be false.** Everything rests on it: the index, the stride, every level of the ladder, and the disjoint-union property.

Filenames carry a UTC time of day with no date (§1). Sorting them lexically therefore sorts by clock, which equals time order **only if a folder's snapshots all fall inside one UTC calendar date.**

- **Cash RTH is safe.** 09:30–16:00 ET is 13:30–20:00Z. No wrap.
- **The prior evening is not.** The tap window reaches back into the previous global session. 18:00 ET onward is 22:00Z and later, running past 00:00Z. Across that boundary `snap-235959Z` sorts *before* `snap-000117Z` while the true order is the reverse.

**The test is one command per day folder:** does any folder hold both a file with a clock at or after **22:00Z** and one at or before **05:00Z**? 

- **No** → sorting is time order, the law stands as written, nothing downstream changes.
- **Yes** → sorting is **not** time order for that folder. The index must order by **reconstructed `t`** (§1), not by name, and every level of the ladder must be built on that ordering. The ladder itself is unaffected in shape — it is the sequence underneath it that changes.

Ordering by reconstructed `t` is correct in both cases and costs nothing, since `t` is computed for every row anyway. **The safe implementation is to order by `t` unconditionally** and treat name-order as an optimization only where the check comes back clean.

Nothing built on the ordering should be gated to green until this is answered.

---

## 9a. Two boundaries that belong in writing, not in discovery

Neither is a question. Both are consequences of §1 that will otherwise be found by someone at the wrong moment.

**Time Machine's date picker is choosing a 0DTE session.** A member who scrubs a past day and reaches for a 7DTE structure gets a named hole, and that is permanent for every day already collected. The chrome should say what the archive *is* rather than letting them discover it leg by leg. That copy belongs to the Time Machine spec, not this one, but the constraint originates here.

**The gold data plane is 0DTE-only.** Any Strategy Lab bot tested against this corpus is tested on 0DTE. That is fine if 0DTE is the target and it is a real boundary either way — better named now than found by a strategy that appears to backtest cleanly because the days it needed could not hold it.

Everything in §0 is **law**, not an open.

---

## 10. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.8 post-WG** | 2026-08-29 | **Not a reissue.** §7.2 launchd is `Background` (SSH bootstrap); a hand backfill is not the nightly. §7.4 corpus row carries hold-resident heap aggregates (C11 watch). Surface is `/admin/archive`. |
| **v0.8 TMOS W1 §3** | 2026-08-29 | §3 rewritten: today retrieve is in. `TODAY_LIVE` as a fetch refusal is retired (TMI-85). `day_changed` in-flight only. Live dash process may still refuse today until a bounce. |
| **v0.8 W8 honesty** | 2026-08-29 | **Not a reissue.** Leftover lines repaired in place (A1 “does not carry”): Seek is reconstructed-`t` not `i % 64`; §4.2/§4.3 `expiration` optional assertion; §7 coverage `must-revalidate` not `no-store`; §8 reconstruction-retired line withdrawn. §9 item 2 serving-marks withdrawn (A2_1). **Still leftover (flagged, not followed):** §4.7 `within_dl400` band `[3, 5]` (DL-609 reversed to `[2, 5]`). Dash `Cache-Control: no-store` as-built until a bounce. |
| **v0.8** | 2026-08-27 | **Corrects a defect this spec introduced.** The disk read confirms filenames are **time-of-day only**; v0.2's "filenames are dated" was wrong and retired a section that was right. **Reconstruction restored, hardened:** the instant is chosen by the folder's **UTC tap window**, not by a New York local-date test — that test picks the wrong candidate by exactly twenty-four hours for every prior-evening snapshot, and does so silently. `DATE MISMATCH` retires (it described a filename date that does not exist) and **OUT OF WINDOW** replaces it. **Store root CONFIRMED** as `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` (DL-597) — no longer a fact awaiting confirmation. New **§9b, blocking**: sorted filename order equals time order only inside one UTC date, and the tap window reaches into the prior evening; if any folder spans 00:00Z the index must order by reconstructed `t` rather than by name, and the ladder is built on that sequence. Ordering by `t` unconditionally is correct either way. |
| **v0.7** | 2026-08-26 | **Two Coach corrections.** **Stats are a property of the collection** — the nightly pass moves from Labs to **StudioOne**, computing and storing each day's summary beside the day. One answer for every consumer rather than one derivation per reader; the measurement travels with the day it describes. Labs caches the summaries, which is what keeps the admin panel answerable while StudioOne is down. New hole `STATS DISAGREE` with the files winning. **Three-OK corrected** — DL-539's count guards drift into trees Coach did not designate; Coach designated StudioOne, so no count applies. The condition v0.1–v0.6 carried on every StudioOne write was the advisor's constraint and is removed from the scope statement. |
| **v0.6** | 2026-08-26 | **Nightly stats and the admin panel.** §7.2 nightly job at 02:00 ET runs **on Labs**, calls §4.7, stores on Labs — no StudioOne write, so no three-OK for this piece. Immutability means each day is measured once and never recomputed; first run backfills every collected day, which is what answers DL-400. The job's own health travels with its data, and stale stats are named rather than served as current. §7.3 stored-stats API answers **without touching StudioOne**, so it works when StudioOne is down — which is when someone is looking; live pass-through retained for un-measured days. §7.4 specifies the admin panel's **content** — alarms, last session, cadence drift, corpus growth — while leaving the surface to the admin spec. New hole `STATS STALE`. |
| **v0.5** | 2026-08-26 | **Coach interview folded.** Archive is **0DTE only** by deliberate limit — the date determines the expiration, so `expiration` drops from required to an optional assertion and a wrong book becomes unconstructable. Capture band recorded as an **OPF property, ~2.5σ, monotonic within a session** — nothing vanishes mid-day, and footprint tracks movement as well as duration. StudioOne and MiniTwo **same rack, same LAN** — no bandwidth ceiling, no copy step, member connection is the only real limit. StudioOne is the **permanent corpus home and will take further functions** — version and health become a seam, and the concurrency ceiling is **per machine**. **Every member gets replay**; v0.4's tool-entitlement gate removed as never-ruled. Pool and queue revised **2/4 → 4/8** on Coach's expected concurrency. New **§4.7 cadence statistics**, filename-only, which settles DL-400 by measurement. New **§9a** recording the two boundaries 0DTE-only imposes on Time Machine chrome and the Strategy Lab gold plane. Backup scoped out and parked. |
| **v0.4** | 2026-08-26 | **Buildable.** Every mechanical value set [advisor-set]: derived per-day stride with `S` and `k` returned rather than a fixed 64; response bound 8 MB / 512 envelopes with `next_index` continuation; archive pool 2, queue 4, `Retry-After: 2`, 30 s timeout, niced below the tap; Labs cache on disk at 20 GB with whole-day LRU and the book hash in the key; GAP at 2.5 × cadence with a 15 s floor; API version `1` with a 60 s health poll. Three v0.3 opens resolved outright: coverage caching (`no-store` dropped for `must-revalidate`), an HTTP status for every named hole, and wings as coverage-declared only. Open list cut from fourteen to **four**, each carrying a written position. No change to coverage, index, or ladder semantics. |
| **v0.3** | 2026-08-26 | The operational half. **§4.4 collection outranks reads** — bounded concurrency, tap write priority, per-request timeout, `ARCHIVE BUSY`; a read that starves the writer costs an unrecoverable snapshot. **§4.5 response bounds** with continuation markers, so a deep level is never a truncated body reading as a complete one. **§4.6** window/global overlap resolved by determinism, with the disjoint-union rule preserved. **§6.3** API version check and a health call that separates *up but storeless* from *down*; unmounted external drive is its own state. **§7.1 settled days are immutable**, therefore Labs caches and ten members are not ten passes over the collector. Symbols made first-class. Four holes added: `ARCHIVE BUSY`, `VERSION MISMATCH`, `TAP RESTART`, and `STORE MISSING` widened to unmounted. Seven new opens including retention, the `marks/` directory, and all tuning numbers. No change to coverage, index, or ladder semantics. |
| **v0.2** | 2026-08-26 | Three Coach corrections. **StudioOne is external** — Labs boots without archive config; absent is supported, present-but-malformed still aborts; `ARCHIVE NOT CONFIGURED` joins unreachable and auth-rejected as a third distinct named state. Closes v0.1's open 1. **Store is an external drive**, not `~/Library/Caches`; root confirmed against the implementation. **Filenames carry their own date**; the folder-date reconstruction is retired and `DATE MISMATCH` added. Stride, coverage caching, and hole statuses raised as opens. Coverage, index, and ladder semantics unchanged. |
| **v0.1** | 2026-08-26 | Interface: coverage, filename+stat index, dyadic fetch 0..6, named holes, Labs proxy, fail-loud URL+token at boot, unreachable ≠ missing config, NY session date, today excluded, book = symbol+expiration (+ wings as written), no StudioOne write, no sidecar, no build plan. |

**One-line law:**  
**The archive is 0DTE, one book per symbol per day, in a band that only ever grows; a snapshot's instant comes from its clock placed inside the folder's window, and the timeline is that instant in order — never the sorted name, which lies across midnight UTC. Labs asks StudioOne for the archive of NY-session days that are not today: coverage tells the calendar the hours and the holes; the index is time-order from dated names and sizes; fetch fills a disjoint dyadic ladder in bounded pieces — reading never outranks collecting, because a starved writer loses a snapshot that cannot be recovered; a settled day is immutable so Labs caches it once for everyone; and StudioOne is external, so Labs runs whether or not it answers and Time Machine says plainly which silence it is hearing: not configured, not mounted, not reachable, or not authorized — everyone who logs in gets it; and every night StudioOne measures what it actually wrote and lays the answer beside the day, Labs keeps a copy so the answer survives the collector being down, and shows an admin an empty alarm list on a good morning.**
