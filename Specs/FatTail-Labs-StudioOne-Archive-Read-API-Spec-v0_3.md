# FatTail Labs — StudioOne Archive Read API Spec v0.3

**Status:** DRAFT v0.3 — interface only. Adds the operational half the interface needs to survive contact: **collection outranks reads**, response bounds, cache and immutability, window overlap, API versioning, and the unaddressed disk. v0.2 folded three Coach rulings of 2026-08-26. Folds three Coach rulings of 2026-08-26: StudioOne is an **external resource** and Labs boots without it; the collection lives on an **external drive**, not a macOS cache; **filenames carry their own date**. **Not BUILD AUTHORITY.** No StudioOne process change until Coach **three OKs** (DL-539).  
**Type:** StudioOne document — read API the Labs API calls so Time Machine can paint a calendar and fetch past days.  
**Short name:** **SO-AR**  
**Host:** StudioOne (`studioone.local` · `192.168.1.111`). **Not** MiniTwo as writer. **Not** a browser target.  
**Canonical filename:** `Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_3.md`
**Supersedes:** v0.2, v0.1  
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
| **NY session date** | Folder `day=YYYY-MM-DD` is `today_ny()` — **America/New_York calendar date**, not UTC date. |
| **Filenames are dated** *(Coach, corrects v0.1)* | Each snapshot file carries **its own date** in the name. No date is reconstructed from the folder and there is no ambiguity to resolve. **Exact format confirmed against the running implementation** before stamp. |
| **Layout (current tap)** | `day=D/chain/<SYM>/snap-HHMMSSmmmZ.json` plus `marks/`, `COUNTS.json`, `PROVENANCE.json`, `CADENCE.json`. Friday **2026-08-14** on gold is **flat** `chain/snap-HHMMSSZ.json` (SPY only, 5-min) and is not rewritten. |
| **Store location** *(Coach, corrects v0.1)* | The collection lives on an **external drive**. v0.1 named a macOS cache directory (`~/Library/Caches/...`); that is **not** the store. The exact root is **confirmed against the running implementation** before stamp, and the API reads that root. |
| **One file = one snapshot** | Sorted filenames **are** time order. Level 0 = every 64th path after sort. **Byte offsets are not required.** |
| **Index without envelope opens** | `file` = name. `bytes` = `stat`. `t` = read from the filename, which carries its own date. `hole` = null on a file that exists. **No `open()` of JSON.** Spot and `content_hash` stay in the envelope; Level 0 fetch carries spots for the mini chart. |
| **Book on disk** | Path is **symbol-only**. The tap writes **one listed expiration per symbol per NY date** (`front_expiration` = that session day if listed). Envelope and `COUNTS.json` name that expiration. Two expiries are **not** two directories. |

**`t` comes from the filename.** The name carries its own date, so there is no candidate-picking and no dependence on the folder. Emit RFC3339 with offset. A filename that does not parse is **UNREADABLE** for that index — skipped, never guessed, never moved to occupy a gap. If a filename's date and its folder's NY date disagree, that is a named **DATE MISMATCH**, not something the API silently resolves.

*(v0.1 carried a paragraph reconstructing the date from the folder because it recorded filenames as time-only. Coach corrected that; the paragraph is retired, not amended.)*

**Seek:** `paths = sorted(chain/SYM/snap-*.json)`; level 0 is `paths[i]` for `i % 64 == 0`. Cheap. A sidecar is not needed and **must not** be added by this program.

---

## 2. Book identity

A Time Machine **book** is `(symbol, listed expiration, wing window)`. OPF must not cross-fill.

On this archive, a `day=D` + `symbol` folder holds **one** book: the listed expiration the tap used that NY day (typically D itself for a 0DTE name; `not_today` and zero snaps when the name does not expire that day). Wing window is whatever `PROVENANCE.json` / the tap wrote that day — not a second folder.

**Symbols are a first-class dimension, not SPX with others bolted on.** Coach: *"I need an API so I can retrieve selected dates and symbols."* Coverage takes a symbol set; index and fetch take one symbol each. Which symbols the tap actually collects is **§9.8** — the interface does not assume, and a symbol with no folder for a date is **NONE**, not an error.

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
| `t` | From the filename, which carries its own date (§1) |
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

The specific numbers — pool size, timeout, retry hint — are **§9.5**. This section states the requirement, not the tuning.

### 4.5 Response bounds

Level 6 of a dense day is roughly 2,900 envelopes. As a single JSON body that is tens of megabytes assembled in memory on the collector, which §4.4 forbids.

- Every fetch response is **bounded**. A request whose result would exceed the bound returns what fits, **in index order**, plus a **continuation marker** naming the next index. Never a truncated body without one, and never a silent partial that reads as a complete level.
- The client completes a level by following continuations, and a level is only complete when the marker is absent.
- The bound itself is **§9.6**.
- **Deep levels are the ones that need this.** Levels 0 through 3 are small; the ladder is designed so the member is already working long before any level needs chunking.

### 4.6 Windows, overlap, and what the client already holds

A window and the global ladder can ask for the same snapshot twice — pull level 3 around 14:30, then pull level 3 globally, and the window's indices come back again.

- **The index set for a level is deterministic**, so the client can compute what a global request will return and skip what it holds. Fetch does not need to know the client's state.
- Fetch **may** accept an exclusion — a set of indices already held — as an optimization. It is never required, and a request without one must return the full level.
- **The union rule survives windowing:** levels stay disjoint, and the union of 0 through the deepest level is still exactly the day. A window narrows *which* of a level's indices come back; it never changes which indices belong to that level.

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
| **UNREADABLE** | Fetch opened a snap that is not JSON, or a filename that does not parse — skip that index, do not invent a chain |
| **DATE MISMATCH** | A filename's date and its folder's NY date disagree. Named, not resolved |
| **ARCHIVE NOT CONFIGURED** | This Labs host has no archive URL or token. Labs runs; the archive path fails loudly |
| **STUDIOONE UNREACHABLE** | Labs → StudioOne network failure at **runtime** |
| **ARCHIVE AUTH** | StudioOne rejected the token (host is up) |
| **STORE MISSING** | Store root not a directory — includes an **external drive that is not mounted** |
| **ARCHIVE BUSY** | Concurrency ceiling reached (§4.4). Named refusal with a retry hint, never an unbounded wait |
| **VERSION MISMATCH** | StudioOne speaks an API version Labs does not understand (§6.3) |
| **TAP RESTART** | Two capture runs inside one NY date produced overlapping or duplicate filename clocks. Named, never silently deduplicated |

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

### 6.2 StudioOne (when the new routes are live under three OKs)

The archive routes **require** the same bearer. No member cookie. LAN bind only.

| Event | Result |
|-------|--------|
| Token missing or wrong | **401** `ARCHIVE AUTH`. Labs does **not** map this to empty coverage. Named auth failure. |
| TCP / timeout / 5xx / connection refused | **Unreachable.** Coverage: `{ "unreachable": true, "days": [] }` — **nothing stale**. Index/fetch: **503** `STUDIOONE UNREACHABLE`. |
| Archive not configured on this Labs host | **501** `ARCHIVE NOT CONFIGURED`. Labs boots and runs; only the archive path is unavailable, and it says so. |

**Three silences, three names, never collapsed:** not configured · not reachable · not authorized. A member looking at an empty calendar must be able to learn which one they are looking at.

If StudioOne is still the **old dash** (no token check), Labs still sends the bearer; extra header is ignored until the bounced process enforces it. That bounce is three OKs.

### 6.3 API version and health

Labs and StudioOne are deployed separately and will drift.

- Every response carries an **API version**. Labs checks it. A version Labs does not understand is **VERSION MISMATCH** — named and refused, never parsed hopefully. A field Labs does not recognize is ignored; a *contract* it does not recognize is not.
- A **health call** exists that does not touch the archive: is the process up, is the store mounted, is the tap running. Labs uses it to distinguish *up but storeless* from *down*, and to avoid pulling coverage merely to ask whether anyone is home.
- **The store being unmounted is its own state.** An external drive that is not mounted is not an empty archive and not a dead host — it is **STORE MISSING**, already named in §5, and health reports it before a member ever picks a date.

---

## 7. Labs re-serve (member)

| Member | Labs → StudioOne |
|--------|------------------|
| `GET /api/me/options-lab/archive/coverage` | `GET /api/coverage` |
| `GET /api/me/options-lab/archive/index` | `GET /api/index` |
| `GET /api/me/options-lab/archive/fetch` | `GET /api/fetch` |

Session + tool read entitlement. Gzip. `Cache-Control: no-store` on coverage (must not serve a stale day list). Index/fetch may 304 on matching `ETag` / `day_hash` for the **same** book hash only.

### 7.1 Labs-side cache and immutability

**A settled day never changes.** Once the tap has finalized an NY date, its files are fixed: same names, same sizes, same hash, forever. That is the property everything else here leans on.

Because of it:

- **Labs caches what it pulls.** Ten members replaying the same day must not become ten passes over the collector — that is §4.4's concern arriving through the front door. Coverage for settled days, indices, and fetched levels are all cacheable at Labs, keyed by book hash.
- **The cache is authoritative until the hash moves**, and for a settled day it never does. `409 day_changed` should therefore be rare, and if it fires on a settled day, something rewrote history and that is worth knowing rather than absorbing.
- **A growing day is the exception** and is already excluded — today is not archive-routable at all (§3).
- **Where the Labs cache lives, and how large it is allowed to get, is §9.7.** Whether it is memory, disk, or the same store Time Machine's past-day download already uses is not decided here.

Without this section the interface is correct and the system still falls over, because every member is a fresh full pull.

---

## 8. Out of scope

- Sidecar, packed day file, gold copy, rewriting Friday 5-min  
- Restarting `ssr-snapshot-dash` or any StudioOne launchd  
- Stochastic sampling · `step_s` retrieve as the product  
- Index fields `spot` / `content_hash`
- Reconstructing a date from the folder (retired — filenames carry their own)
- Aborting Labs boot on absent archive config
- Serving `marks/` (§9.13)
- Deleting or thinning anything on StudioOne (§9.12 decides retention; this API never writes)
- Unbounded fetch responses and unbounded concurrency  
- Browser → `studioone.local:5055`  
- MiniTwo until asked  
- Time Machine chrome, Instant Replay RAM ring, Algo Alert  
- Build plan (separate document **after** this stamp)

---

## 9. Open for Coach (not silently decided)

**Closed in v0.2 by Coach:** v0.1's open 1. StudioOne is external, Labs boots without it, Time Machine fails loudly. §6.1.

**Two facts this spec asserts and must confirm against the running implementation before stamp.** Both were wrong in v0.1 and were corrected by Coach, not by a disk read:

1. **The store root** on the external drive.  
2. **The exact snapshot filename format**, now that filenames are known to carry their own date.

Neither is invented here. If the implementation contradicts either, this spec is the bug.

**Still open, none picked:**

3. **Level 0 stride.** v0.1 fixes it at 64 with seven levels. That was sized to a 5,800-snapshot day, where level 0 is about ninety files — a usable coarse pass. On a 500-snapshot day the same stride gives eight, and there is no mini chart. Keep 64 fixed and accept a thin first pass on thin days, or derive the stride per day as the power of two putting level 0 near ninety, with the level count returned in the index rather than hardcoded. *Advisor lean, ADVISORY: derive it — the dyadic property holds for any power of two, so nothing else in the ladder changes.*  
4. **Coverage caching.** Coverage carries an `ETag` so a client can cache it; §7 sets `Cache-Control: no-store` on the same response, which forbids that. One or the other.  
5. **HTTP status per named hole.** Wrong book, today, and none are all "named hole, empty payload," which a proxy cannot tell from a successful empty day. §5 names the holes; it does not say what each returns.  
6. **Wing window** as a fetch parameter vs coverage-declared only (disk has one wings setting per day folder).  
7. **The 2.5× cadence multiplier for GAP** — named here; override if you want a fixed seconds floor.  
8. **Which symbols the tap collects**, and whether the calendar advertises a symbol that has folders on some dates and not others. §2 makes symbols first-class; it does not know the set.  
9. **§4.4 numbers** — concurrency ceiling, per-request timeout, retry hint. The requirement is law; the tuning is yours, and it depends on what the collector can spare.  
10. **§4.5 response bound** — the byte or envelope ceiling per fetch response.  
11. **§7.1 Labs cache** — where it lives, how big it may get, and whether it shares storage with Time Machine's past-day download.  
12. **Retention.** At 70–80 MB per day the corpus grows roughly 20 GB a year and nothing here ever deletes. Keep everything, roll off after a period, or thin old days the way today's cache thins. This is the same shape as the decay ladder and it may want the same answer.  
13. **The `marks/` directory.** §1 records it on disk and this API never serves it. Under your ruling that past days come from the chain, marks may be dead weight — or they may be the honest fallback for a date the chain does not cover. Not decided here.  
14. **A tap restart inside one NY date** (§5, `TAP RESTART`). Two runs can produce duplicate or overlapping clocks. Whether the later run wins, both are kept as distinct indices, or the day is marked unusable is a data-truth question, not an interface one.

Everything in §0 is **law**, not an open.

---

## 10. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.3** | 2026-08-26 | The operational half. **§4.4 collection outranks reads** — bounded concurrency, tap write priority, per-request timeout, `ARCHIVE BUSY`; a read that starves the writer costs an unrecoverable snapshot. **§4.5 response bounds** with continuation markers, so a deep level is never a truncated body reading as a complete one. **§4.6** window/global overlap resolved by determinism, with the disjoint-union rule preserved. **§6.3** API version check and a health call that separates *up but storeless* from *down*; unmounted external drive is its own state. **§7.1 settled days are immutable**, therefore Labs caches and ten members are not ten passes over the collector. Symbols made first-class. Four holes added: `ARCHIVE BUSY`, `VERSION MISMATCH`, `TAP RESTART`, and `STORE MISSING` widened to unmounted. Seven new opens including retention, the `marks/` directory, and all tuning numbers. No change to coverage, index, or ladder semantics. |
| **v0.2** | 2026-08-26 | Three Coach corrections. **StudioOne is external** — Labs boots without archive config; absent is supported, present-but-malformed still aborts; `ARCHIVE NOT CONFIGURED` joins unreachable and auth-rejected as a third distinct named state. Closes v0.1's open 1. **Store is an external drive**, not `~/Library/Caches`; root confirmed against the implementation. **Filenames carry their own date**; the folder-date reconstruction is retired and `DATE MISMATCH` added. Stride, coverage caching, and hole statuses raised as opens. Coverage, index, and ladder semantics unchanged. |
| **v0.1** | 2026-08-26 | Interface: coverage, filename+stat index, dyadic fetch 0..6, named holes, Labs proxy, fail-loud URL+token at boot, unreachable ≠ missing config, NY session date, today excluded, book = symbol+expiration (+ wings as written), no StudioOne write, no sidecar, no build plan. |

**One-line law:**  
**Labs asks StudioOne for the archive of NY-session days that are not today: coverage tells the calendar the hours and the holes; the index is time-order from dated names and sizes; fetch fills a disjoint dyadic ladder in bounded pieces — reading never outranks collecting, because a starved writer loses a snapshot that cannot be recovered; a settled day is immutable so Labs caches it once for everyone; and StudioOne is external, so Labs runs whether or not it answers and Time Machine says plainly which silence it is hearing: not configured, not mounted, not reachable, or not authorized.**
