# StudioOne Archive Read API — Full Agent Bench Plan v2.0

**SUPERSEDED** by [`docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v2.1.md`](./StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v2.1.md) (**v0.8 + Amendment A1**). Do not stamp this revision.

**Date:** 2026-08-27  
**Plan revision:** **v2.0** (superseded)  
**Canonical filename:** `docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v2.0.md`  
**Supersedes:** plan v1.7 … v1.0 (review deltas). **SUPERSEDED as stamp target — stamp v2.1.**  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/SOAR-W0.md`](../agents/go/SOAR-W0.md) — Delta reads **this file**, not chat (**DL-328**).  
**Board:** [`agents/p-studioone-archive-read/`](../agents/p-studioone-archive-read/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

**Primary law:** [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md) **v0.8 DRAFT · buildable**. Coach still strikes the false local-date proof and adds hole `AMBIGUOUS INSTANT`; this plan does not edit the spec.

| Parent | Role |
|--------|------|
| **DL-597** | Store = `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` |
| **DL-596** | Lima retargets to v0.8 at W0-1 |
| **DL-400** | Cadence 3–5 s fail-loud — **measured** by §4.7, not recollection |
| Arch **28** | No client Massive. Browser never calls StudioOne |
| OT-EF / **DL-309** | Fetch payloads; named holes |
| Time Machine Day / TMI | Consumers, **not** this program. §9a copy originates here |

**Store** (only name for that path): `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`.  
**Cache leftover:** `~/Library/Caches/fattail-ssr/ssr/live_capture`. Do not say “gold.”

Juliet does not invent WHAT. Advisor-set numbers are law unless Coach overrules in one line on `SOAR-W0.md`.  
Delta: **PASS / FAIL / BLOCKED**, never waived.  
**No product code in W0.** W1+ after **W0-BA**. Dash bounce on **Coach W5-GO**.

---

## 0. What this program is

Labs asks StudioOne for **settled 0DTE NY-session days** that are not today: coverage, filename+stat index, dyadic fetch, cadence, health, nightly stats. Collection outranks reads. Settled days are immutable so Labs caches. StudioOne is external — Labs boots without it; Time Machine names the silence.

**Not this program:** Time Machine chrome, Instant Replay film, admin panel mount, MiniTwo, >0DTE capture, sidecar, Friday rewrite.

---

## 1. Mission

```text
W0     Review + Coach ticks → W0-G → W0-BA
W1     Characterize prior art (no ship)
W2     Alpha — reader (t, order, ladder, holes, cadence, health)
W3     Alpha — Labs proxy + 20 GB disk cache
W4     Mike — Bearer on archive routes
W5-GO  Coach word → StudioOne dash bounce
W6     Nightly stats launchd 02:00 ET
W7     Kilo AT-SOAR
W8     Lima (DL, leftovers, §9a pointers, admin-spec one-liner)
W-G    Delta
```

---

## 2. Locked (FP)

| ID | Decision |
|----|----------|
| **FP1** | Reconstruct `t`: filename UTC clock on D or D+1; take the candidate in `[D 00:00 NY, D+1 00:00 NY)` from `ensure_day`/`today_ny`. Not `GTH_START`. |
| **FP2** | Index/ladder/hash order = reconstructed `t` (filename tie-break). Never name-sort. Census: **store** `chain/<SYM>/`, 88/127 wrap. |
| **FP3** | Zero in-window candidates → `OUT OF WINDOW`. Two that cannot be separated → `AMBIGUOUS INSTANT`. Never confuse the two. |
| **FP4** | Store path above. Friday 08-14 flat SPY stays readable. |
| **FP5** | 0DTE only. `expiration` optional assertion; mismatch **404** `WRONG BOOK`. |
| **FP6** | Today → **409** `TODAY_LIVE`. Archive-eligible = `CHECKLIST.json` and not `today_ny()`. |
| **FP7** | Pool **4** / queue **8** / timeout **30 s** / `Retry-After: 2` / nice below tap. Per **machine**. |
| **FP8** | Fetch bound **8 MB or 512 envelopes**; `next_index` / `from_index`. |
| **FP9** | Stride derived: largest `S=2^k` with `n/S ≥ 64`, floor 1. Return `S` and `k`. |
| **FP10** | Labs boots if archive env **absent**. Present-and-malformed aborts. Routes **501** `ARCHIVE NOT CONFIGURED`. |
| **FP11** | Coverage `ETag` + `Cache-Control: max-age=0, must-revalidate`. |
| **FP12** | Member archive: **session only**. Admin stats/cadence: **administrator**. |
| **FP13** | Labs disk cache **20 GB**, whole-day LRU, hash in key. |
| **FP14** | GAP: 2.5× cadence **and** 15 s floor. |
| **FP15** | API version `1`. Health every 60 s. Unmounted → `STORE MISSING`. |
| **FP16** | Stats 02:00 ET on StudioOne; measure once; files win vs `STATS DISAGREE`. |
| **FP17** | Wings coverage-declared only. |
| **FP18** | Window **measured**: store `day=2026-08-25/chain/SPX/snap-000000997Z.json` `captured_at` = 20:00 ET Aug 25. |
| **FP19** | Two-in-window only clocks in **`[04:00Z,05:00Z)`** on US fall-back Sunday. |
| **FP20** | DST cascade: nearest envelope (`captured_at` else `as_of`, reject if >**5 min** from candidate) → neighbour-monotonic → **in-window** mtime → `AMBIGUOUS INSTANT`. Named exception to no-open (those files only). |
| **FP21** | Envelope fields **confirmed** on nested + Friday-flat: `captured_at`, `generation.as_of`. Prefer `captured_at`. |
| **FP22** | W5-G requires AT-SOAR-45 (load vs live cadence), not only process-up. |
| **FP23** | Hash = sha256 `filename\tsize\n` in **`t` order**. Same function for ETag, cache, 409. |
| **FP24** | No sidecar. No MiniTwo until asked. No TM chrome. No admin-tree edits. No tool-gate on replay. |

**Coach ticks on `SOAR-W0.md` (block W0-BA if blank):**

| # | Juliet rec |
|---|------------|
| **spec-C** | Implement §2 (`expiration` optional). §4.2/4.3 “required” is leftover. |
| **§9b** | `t`-order always. Census: store `chain/<SYM>/` 88/127 wrap. |
| **env-A** | Accept `captured_at` quote. |
| **dst-A** | FP20 cascade. |
| **§9.1** | Keep everything; revisit 100 GB. |
| **§9.2** | `marks/` unserved. |
| **§9.3** | TAP RESTART: keep both; flag day. |
| **§9.4** | Honest per symbol-date; grey missing folders. |

Advisor-set (stride, bounds, pool, cache, GAP, API v1, 5 min envelope bound) stand unless overridden on that file.

**Lima W8 leftover (Coach owns spec text):** v0.8 local-date “false proof”; §4.2/4.3 expiration required; §1 Seek `sorted` / `i % 64`; §8 “reconstruction retired”; §7 `no-store` vs must-revalidate; hole table add `AMBIGUOUS INSTANT`; §4.4 “pool of 2” vs 4.

---

## 3. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-2 India** | As-built quotes: store, glob, wrap census path, `ensure_day` window, `front_expiration`, prior-art opens. spec-C / §9b / dst-A BLOCKING until ticked. | W0-G |
| **W0-3 Mike** | Bearer on archive routes only. `/` open. 501 ≠ 401. Session-only replay. | W4 |
| **W0-4 Hotel** | No filled GAP. 0DTE named. TAP RESTART keeps both. `OUT OF WINDOW` ≠ `AMBIGUOUS INSTANT`. | W0-G |
| **W0-5 Echo** | Four silences distinguishable. No admin chrome. | W0-G |
| **W0-6 Tango** | Empty calendar ≠ no days. Everyone-gets-replay honest. | W0-G |
| **W0-G** | Token fully ticked. No product code. | W0-BA |
| **W0-BA** | Coach BUILD | W1 |
| **W1-G** | Drift table. Diff empty of ship. | W2 |
| **W2-G** | `t`-order. Window. Index no-open except DST files. Today 409. Optional expiration. `S`/`k`. `next_index`. Nearest+5 min. Neighbour before mtime. | W3 |
| **W3-G** | 501 absent. Malformed abort. Disk cache. Session vs admin. | W4 |
| **W4-G** | 401 ≠ empty coverage. | W5 |
| **W5-GO** | Coach word | W5 |
| **W5-G** | Live routes + **AT-SOAR-45** | W6 |
| **W6-G** | Stats pass; no envelope on stats; pool worker | W7 |
| **W-G** | Fail-closed: name-sorted ladder, sidecar, today-as-archive, invented print, collapsed silences, tool-gate, admin edits, mtime-only DST | ship |

---

## 4. DAG

```text
W0-0 Coach ticks on SOAR-W0.md
  → W0-1 Lima sha1 + DL
  → W0-2 India
       ├── W0-3 Mike
       ├── W0-4 Hotel
       ├── W0-5 Echo
       └── W0-6 Tango
  → W0-G → W0-BA
       → W1 characterize → W1-G
            → W2 reader → W2-G
                 → W3 proxy+cache → W3-G
                      → W4 bearer → W4-G
                           → W5-GO → W5 dash → W5-G
                                → W6 stats → W6-G
       → W7 Kilo (Labs ATs after W2-G; live after W5-G)
       → W8 Lima
  → W-G Delta
```

---

## 5. Packets

### W0 — review (no code)

Seeds on disk under `agents/p-studioone-archive-read/seeds/`. Law = this plan + spec v0.8.

### W1 — characterize

| Seed | Agent | Done when |
|------|-------|-----------|
| `W1-1-india-prior-art.md` | India | Drift vs v0.8 + FP table. StudioOne dash **lacks** `ssr_archive_read.py`. **No edits.** |
| `W1-G-delta.md` | Delta | Product diff empty |

### W2 — reader

| Seed | Agent | Files |
|------|-------|-------|
| `W2-1-alpha-reader.md` | Alpha | `server/market_data/ssr_archive_read.py` + `tests/test_ssr_archive_*.py`. Coverage, index, fetch, cadence, health. `t` via FP1. Order/hash FP2/FP23. DST FP20. Holes. Derived stride. Bounds. |
| `W2-G-delta.md` | Delta | AT-SOAR-1…18, 30–32, 34, 41–43, 46–49 |

### W3 — Labs proxy + cache

| Seed | Agent | Files |
|------|-------|-------|
| `W3-1-alpha-proxy.md` | Alpha | `server/routes/ssr_archive.py` · config (absent OK) · disk cache root. Member `/api/me/options-lab/archive/{coverage,index,fetch}`. Admin `/api/admin/options-lab/archive/{stats,cadence}`. |
| `W3-G-delta.md` | Delta | AT-SOAR-19…26, 29 |

### W4 — auth

| Seed | Agent |
|------|-------|
| `W4-1-mike-bearer.md` | Mike — archive Bearer; HTML `/` and `/api/status` open |
| `W4-G-delta.md` | Delta |

### W5 — StudioOne dash

| Seed | Agent |
|------|-------|
| `W5-0-coach-go.md` | Coach — word to bounce |
| `W5-1-alpha-dash.md` | Alpha — wire reader into StudioOne `ssr_snapshot_dash.py`; nice below tap |
| `W5-2-foxtrot.md` | Foxtrot — bounce `ai.fattail.labs.ssr-snapshot-dash`; token env |
| `W5-G-delta.md` | Delta — AT-SOAR-27, 28, 33, 35, **45** |

### W6 — nightly stats

| Seed | Agent |
|------|-------|
| `W6-1-alpha-stats.md` | Alpha — pass beside the day; fail loud; §4.4 worker |
| `W6-2-foxtrot.md` | Foxtrot — launchd 02:00 ET |
| `W6-G-delta.md` | Delta — AT-SOAR-36…39 |

### W7 / W8 / W-G

| Seed | Agent |
|------|-------|
| `W7-1-kilo-ats.md` | Kilo — full AT table evidence |
| `W8-1-lima.md` | Lima — leftover spec lines; §9a pointers into TM + Strategy Lab specs; admin-spec **one-liner** for §7.4 (no admin code) |
| `W-G-delta.md` | Delta |

---

## 6. Acceptance tests (AT-SOAR)

| ID | Claim |
|----|--------|
| **1** | Coverage hours from names+stat, not envelope |
| **2** | 11:00 start is `partial` |
| **3** | Folder-only day is `none` |
| **4** | GAP when delta > max(2.5× cadence, 15 s) |
| **5** | Hash `t`-sorted `filename\tsize\n`; name-sort of a wrapping book differs |
| **6** | Index fields only `t`, `file`, `bytes`, `hole` |
| **7** | Index does not `open()` JSON **except** two-in-window files |
| **8** | Today → **409** `TODAY_LIVE` |
| **9** | Expiration omitted → that day’s 0DTE book; wrong assertion → **404** |
| **10** | Missing COUNTS → `UNKNOWN`; index/fetch refused |
| **11** | `not_today` → **200** `NOT TODAY` |
| **12** | Derived `S`/`k`; levels `0..k` disjoint; union `{0..n-1}` |
| **13** | Thin day `n≥64` still has ≥64 level-0 snaps |
| **14** | `day_hash` mismatch → **409** |
| **15** | Oversize fetch → prefix + `next_index` |
| **16** | Unparseable filename → `UNREADABLE` |
| **17** | Zero in-window candidates → `OUT OF WINDOW` |
| **18** | Health does not walk snaps; reports mount, tap, `api_version`, store path |
| **19** | Absent env → Labs boots; archive **501** |
| **20** | Malformed URL/short token → boot abort |
| **21** | StudioOne down → coverage `{unreachable:true, days:[]}` |
| **22** | **401** AUTH ≠ empty coverage |
| **23** | Unmounted store → **503** `STORE MISSING` |
| **24** | Browser is not given StudioOne URL or token |
| **25** | Coverage ETag + must-revalidate |
| **26** | Second member, same settled book → Labs disk cache hit |
| **27** | Dash `/` works without Bearer |
| **28** | Archive routes require Bearer after W5 |
| **29** | Member archive session-only; admin stats administrator-only |
| **30** | Friday 08-14 flat chain readable as SPY |
| **31** | `api_version: 1`; unknown → **502** |
| **32** | Pool exhausted → **429** + `Retry-After: 2` |
| **33** | Cadence: filename+`t` only; `within_dl400` present |
| **34** | NY `day=` is session date |
| **35** | After W5 bounce, tap process still running |
| **36** | Stats pass writes beside the day; second night does not recompute settled days |
| **37** | Failed stats run records reason; no partial summary |
| **38** | `STATS STALE` if roll-up older than schedule |
| **39** | `STATS DISAGREE` → files win |
| **40** | Duplicate clocks → `TAP RESTART`; both rows kept |
| **41** | `001730Z` in folder D → **D 20:17 ET** |
| **42** | Wrapping `chain/SPX/` indexed in `t` order |
| **43** | Cadence deltas from `t` are ≥0 across 00:00Z |
| **45** | Full pool ≥60 s; live book cadence (median/p95 / new GAP) vs prior 60 s **unchanged** |
| **46** | Nov 1 file in `[04:00Z,05:00Z)`; `captured_at` **nearest** candidate |
| **46b** | `as_of` ~6 s off still nearest |
| **46c** | Envelope 1 h off → rejected |
| **47** | Non-fall-back: window pick equals NY-local-date pick |
| **48** | Unreadable envelope, **mtime outside window** → neighbour-monotonic wins |
| **49** | No envelope, mtime outside, no neighbours → `AMBIGUOUS INSTANT` |

---

## 7. Non-goals (NX)

| ID | Out |
|----|-----|
| **NX1** | MiniTwo until Coach asks |
| **NX2** | Browser → StudioOne · client Massive |
| **NX3** | TM chrome · Instant Replay · Algo |
| **NX4** | Sidecar · packed day · Friday rewrite |
| **NX5** | Serving `marks/` unless §9.2 overridden |
| **NX6** | Changing tap filename format |
| **NX7** | Capturing >0DTE / widening OPF band |
| **NX8** | Enforcing cadence at capture time |
| **NX9** | Building/styling admin panel |
| **NX10** | Alert routing · offsite backup |
| **NX11** | Product code before W0-BA |
| **NX12** | Re-imposing three-OK on designated StudioOne work |
| **NX13** | Abort Labs boot because archive env is **absent** |
| **NX14** | Tool-entitlement on member replay |
| **NX15** | Unbounded fetch or extra per-feature pool |
| **NX16** | Name-sorted ladder “because RTH is safe” |
| **NX18** | Claiming local-date is silently wrong (it is equivalent except fall-back) |
| **NX19** | Name-order clock-rollback as DST tie-break |
| **NX20** | Equality match to envelope (use nearest) |

---

## 8. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v2.0** | 2026-08-27 | Stampable full plan. Spec v0.8 + review chain folded. |
| **v1.7** | 2026-08-27 | Last delta. SUPERSEDED. |

**One-line law:**  
**W0 ticks; W2 places every clock in `[D 00:00 NY, D+1 00:00 NY)` and orders by that instant; on the one Sunday hour the envelope is opened and the rest of the index is not; W5 is not green until a loaded archive leaves the tap’s cadence alone.**
