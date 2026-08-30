# StudioOne Archive Read API — Full Agent Bench Plan v1.1

**SUPERSEDED** by [`docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.2.md`](./StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.2.md) (spec **v0.8**). Do not stamp this revision.

**Date:** 2026-08-27  
**Plan revision:** **v1.1** (superseded)  
**Canonical filename:** `docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.1.md`  
**Supersedes:** plan v1.0 (written against spec v0.3 opens — do not stamp)  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/SOAR-W0.md`](../agents/go/SOAR-W0.md) — Delta reads **this file**, not chat (**DL-328**).  
**Board:** [`agents/p-studioone-archive-read/`](../agents/p-studioone-archive-read/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **SO-AR Spec v0.7** | [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_7.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_7.md) | **DRAFT · buildable** · **not BUILD AUTHORITY** until **W0-BA** |
| Supercedes | v0.6 … v0.1 | Three-OK on StudioOne **removed** (Coach designated the host). Stats **on StudioOne**. 0DTE-only. |
| **DL-596** | Archive Read DRAFT | Points at v0.1 — Lima retargets to v0.7 at W0-1 |
| **DL-597** | Live store = FatTail2TB | Confirm as store root (spec §9 fact 1) |
| **DL-400** | Capture 3–5 s fail-loud | Settled by **§4.7 measurement**, not recollection |
| Arch **28** | Market bus | **No client Massive.** Browser never calls StudioOne |
| OT-EF / **DL-309** | Named holes · no invented prints | Fetch **payloads** |
| Time Machine Day | Analyzer TM Spec v0.1 | Calendar **consumer** — **not** this program. §9a copy constraint originates here |
| TMI | Instant Replay | Tab RAM film — **not** this program |
| Config invariant 2 | Fail loud | **Present-and-malformed** aborts. **Absent** archive config is supported (§6.1) |

**Juliet does not invent WHAT.** Coach wrote SO-AR §0. This plan **sequences**. Advisor-set numbers are law unless Coach overrules in one line. Four §9 positions and two disk facts are **Coach ticks on `SOAR-W0.md`**.

Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.  
Coach overrule = **DL with reasoning**, not a waived gate.  
Reviews: **BLOCKING** vs **ADVISORY**.  
Coach Content Law: nothing in spec §0 is removed. Later sections that **correct** §0 (boot-absent, three-OK, 0DTE) sit **beside** it; they do not erase the interview order.

**No product code in W0.** W1+ fire **only** after W0-BA.  
**StudioOne is in-program.** Dash bounce when the work is ready, **on Coach's word** (W5-GO) — not a three-OK count. DL-539 still forbids drift into trees Coach did **not** name (Time Machine chrome, admin mount, MiniTwo).

---

## 0. Evaluation of Spec v0.7

### 0.1 Why this version is the build plan's parent

v0.7 is the first SO-AR that is **buildable** and **owns StudioOne writes Coach designated**:

- Mechanical values are set **[advisor-set]** (§4.3–4.5, §6.3, §7.1–7.2). Overrule any in one line.
- **0DTE only**, deliberate. Date determines expiration. `expiration` is an **optional assertion**, not a required selector (§2, v0.5).
- **Capture band** is an OPF property (~2.5σ, **ratchets, never drops strikes**). This API does not change OPF.
- **Same rack / same LAN.** No copy step. Member connection is the download ceiling.
- **StudioOne is the permanent corpus** and will take further functions. Concurrency ceiling is **per machine** (pool **4**, queue **8**).
- **Every member gets replay.** Session only. No tool entitlement, no tier, no depth limit.
- **Stats are a property of the collection** — nightly pass **on StudioOne**, summary beside the day. Labs caches. Admin panel **content** specified; **surface** is the admin spec's tree.
- **Three-OK removed** for this program. Coach designated StudioOne. The v0.1–v0.6 count was the advisor's constraint.

The three-call interface (coverage · index · dyadic fetch), collection-outranks-reads, bounded continuation, Labs external boot, named silences, and settled-day immutability remain law.

### 0.2 Disk facts — confirmed 2026-08-27 on StudioOne

Spec §9: confirm against the running implementation **before stamp**. “If the implementation contradicts either, this spec is the bug.”

| Fact | Spec v0.7 claim | On disk | Verdict |
|------|-----------------|---------|---------|
| **Store root** | External drive, not `~/Library/Caches` | `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` · **DL-597** · tap writes here | **CONFIRMED.** Tick **disk-A**. |
| **Filename format** | “Each snapshot file carries **its own date** in the name.” | Nested: `snap-HHMMSSmmmZ.json` (e.g. `snap-051730882Z.json`). Friday 08-14 flat: `snap-HHMMSSZ.json`. **No calendar date in the name.** Folder `day=YYYY-MM-DD` is the NY session date. | **CONTRADICTION.** Tick **disk-B**. This program **does not change the tap**. |

**Juliet rec (opinion) for disk-B:** keep the tap; reconstruct `t` from **filename UTC clock + folder NY date**; keep `DATE MISMATCH` if a *future* dated name disagrees with its folder. Do not silently “fix” the spec in code.

§4.1 table still says `first_at` / `last_at` from “filename+folder date” while §1 retired reconstruction. India quotes both; Lima edits the leftover table **only** after disk-B.

### 0.3 Spec leftovers India must quote (not silent-fix)

| Leftover | Where | Later law |
|----------|--------|-----------|
| §0.11 “missing archive URL aborts boot” | Coach interview order | **§6.1** absent is supported; malformed aborts |
| §0.16 three OKs / dash old process | Interview order | **Scope statement v0.7** — Coach designated StudioOne; bounce on Coach's word |
| §4.2 / §4.3 “`expiration` (required)” | Query lines | **§2** optional assertion (0DTE ruling). **Juliet rec: implement §2.** Tick **spec-C**. |
| §4.4 “pool of 2 is the only lever” | Priority row | Pool is **4** (v0.5). Editorial. |
| §9 “item 4” for the symbol set | §2 | Same as §9 position 4 |

Coach Content Law: do not delete §0. Later sections sit beside it.

### 0.4 0DTE on disk (this session)

`front_expiration` = session day **only if listed**. 2026-08-25 COUNTS: SPX/XSP/SPY/QQQ/IWM/GLD/XLF captured with `expiration=2026-08-25`; equities `not_today` with zero snaps. Matches §1 **0DTE archive**.

### 0.5 Prior art (characterize, do not ship)

Labs repo already has `ssr_archive_read.py`, `routes/ssr_archive.py`, tests, and workspace dash handlers. StudioOne's **running** dash does **not** include the module. W1 files a drift table. W2 builds on the tree where it matches v0.7.

### 0.6 Neighbor that is **not** this board

§7.4 admin corpus panel: **content** is law here; **mount/styling** is a one-line admin-spec amendment and **its own seed on the admin board**. This plan does not authorize `web/` admin edits.

§9a Time Machine copy (“this is a 0DTE session”) and Strategy Lab gold-plane boundary: **originate here**, land on those specs at Lima W8 — not chrome in this program.

---

## 1. Mission

```text
W0     Review + Coach ticks (disk-A/B · spec-C · four §9 positions)
         India · Mike · Hotel · Echo · Tango → Delta W0-G → Coach W0-BA
W1     Characterize prior art vs v0.7 (no ship)
W2     Alpha — reader: coverage · index · fetch · cadence · health · version
         derived stride · bounds+continuation · holes · 0DTE optional expiration
W3     Alpha — Labs proxy + disk cache (20 GB whole-day LRU)
W4     Mike — Bearer on archive routes; HTML dash stays open
W5     Alpha + Foxtrot — StudioOne dash bounce  ← Coach W5-GO (not three-OK)
W6     Alpha + Foxtrot — nightly stats launchd 02:00 ET on StudioOne
W7     Kilo AT-SOAR
W8     Lima (DL · AGENTS · leftover table · §9a pointers · admin-spec one-liner)
W-G    Delta
```

Admin panel **implementation** is **out**. Lima files the one-line admin-spec amendment; a later admin seed mounts §7.4.

### 1.1 Neighbor serialization

| Order | Board | Why |
|-------|--------|-----|
| **1** | Live tap | Collection outranks reads. Stats pass takes a §4.4 worker. |
| **2** | `p-options-lab-tmi` | Instant Replay is tab film. Do not conflate. |
| **3** | Analyzer Time Machine | Consumes coverage later. §9a copy is theirs. |
| **4** | Admin surface | §7.4 content here; mount there. |

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-2 India** | v0.7 architecture-safe. Quote store root, filename glob, Friday-flat, `COUNTS.expiration`, `not_today`, `PROVENANCE.wings`, `CHECKLIST`. Quote prior-art path+lines. **disk-B and spec-C labeled BLOCKING until ticked.** No client Massive. | Mike · Hotel · Echo · Tango · W0-G |
| **W0-3 Mike** | Bearer on archive routes only. HTML `/` and `/api/status` stay LAN-open. Absent Labs config ≠ 401. Three silences not collapsed. Session-only replay (no tool gate). | W0-G · W4 |
| **W0-4 Hotel** | Payload is OPF truth. No filled GAP. 0DTE hole is named, not a 7DTE fill. TAP RESTART keeps both. Band ratchet is OPF, not this API inventing strikes. | W0-G |
| **W0-5 Echo** | No TM chrome. Review **named-silence JSON** so TM can paint four states. §7.4 alarm-empty-is-normal (advisory on copy). | W0-G |
| **W0-6 Tango** | Empty calendar ≠ “no days.” Everyone-gets-replay is honest, not a premium tease. 0DTE limit is named, not discovered leg-by-leg (pointer to TM spec). | W0-G |
| **W0-G Delta** | Spec v0.7 + plan v1.1 + board. `SOAR-W0.md` has disk-A/B, spec-C, §9.1–4. No product code. | W0-BA |
| **W0-BA Coach** | BUILD AUTHORITY | W1 |
| **W1-G** | Drift table. No bounce. | W2 |
| **W2-G** | Index no `open()`. Today 409 `TODAY_LIVE`. Optional expiration. Derived `S`/`k` in index+coverage. Continuation `next_index`. Cadence filename-only. | W3 |
| **W3-G** | 501 if unconfigured. Boot abort only if present-malformed. Coverage revalidate. Disk cache whole-day LRU. Admin stats/cadence **administrator only**. Member archive **session only**. | W4 |
| **W4-G** | 401 AUTH ≠ empty coverage. `/` works without Bearer. | W5 |
| **W5-GO Coach** | Word to bounce the dash. | W5 fire |
| **W5-G** | StudioOne serves versioned routes. Health reports mount+tap. Tap still collecting. | W6 |
| **W6-G** | Nightly pass launchd; first backfill answers DL-400; fail loud; takes a §4.4 worker. | W7 |
| **W7-G** | AT-SOAR evidence. StudioOne-live rows HOLD until W5-G. | W8 |
| **W-G Delta** | Fail-closed: client Massive, sidecar, today-as-archive, invented print, unbounded fetch, collapsing silences, tool-gate on replay, three-OK invented again, admin-tree edits. | Coach ship · MiniTwo **when asked** |

---

## 3. Locked (not ODs)

| ID | Decision | Source |
|----|----------|--------|
| **FP1** | Coverage · index · fetch · cadence · stats · health | §4 · §6.3 · §7.2–7.3 |
| **FP2** | Index = filename + `stat`. No envelope, no spot/hash, no sidecar | §1 · §4.2 |
| **FP3** | 0DTE only. Date determines expiration. `expiration` optional assertion → else `WRONG BOOK` **404** | §1 · §2 · §9 HTTP table |
| **FP4** | Today → `TODAY_LIVE` **409**. Archive-eligible = `CHECKLIST.json` and not `today_ny()` | §3 |
| **FP5** | Browser never calls StudioOne | §0.7 · §6 |
| **FP6** | Collection outranks reads. Pool **4**, queue **8**, per **machine**. `Retry-After: 2`. Timeout **30 s**. Nice below tap. | §4.4 |
| **FP7** | Fetch bound **8 MB or 512 envelopes**. `next_index` / `from_index` | §4.5 |
| **FP8** | Stride derived: largest `S=2^k` with `n/S >= 64`, floor 1. Return `S` and `k` | §4.3 |
| **FP9** | Labs boots if archive env absent. Malformed aborts. | §6.1 |
| **FP10** | Silences: 501 not configured · 503 unreachable / store missing · 401 auth. Never collapsed. | §5 · §6.2 |
| **FP11** | Coverage `ETag` + `Cache-Control: max-age=0, must-revalidate` | §9 resolved |
| **FP12** | Member replay: **session only**. Admin stats/cadence: **administrator** | §7 · §7.3 |
| **FP13** | Labs disk cache **20 GB**, whole-day LRU, hash in key | §7.1 |
| **FP14** | GAP: 2.5× cadence **and** 15 s floor | §4.1 |
| **FP15** | API version `1` as `api_version`. Health every 60 s. | §6.3 |
| **FP16** | Stats pass 02:00 ET on StudioOne; measure once; files win vs `STATS DISAGREE` | §7.2 |
| **FP17** | Wings coverage-declared only | §9 resolved |
| **FP18** | No sidecar, no MiniTwo until asked, no TM chrome, no `marks/` serve | §8 |
| **FP19** | Juliet does not invent WHAT | Doctrine |

**Coach ticks — required for W0-BA.** Juliet recs are **opinion**.

| # | Question | Juliet rec |
|---|---------|------------|
| **disk-A** | Store root | Stamp `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` |
| **disk-B** | Dated filenames? | **No on disk.** Reconstruct `t` from UTC clock + folder NY date. Keep `DATE MISMATCH`. Do not change the tap. |
| **spec-C** | §4.2/4.3 “expiration required” vs §2 optional | **Implement §2.** Query line is leftover. |
| **§9.1** | Retention | **Accept spec position:** keep everything; revisit at 100 GB. Log it. |
| **§9.2** | `marks/` | **Accept:** leave unserved |
| **§9.3** | TAP RESTART | **Accept:** keep both indices; flag the day |
| **§9.4** | Symbol set | **Accept:** honest per symbol-date; grey missing folders |

---

## 4. DAG

```text
W0-0 Coach ticks on SOAR-W0.md
  → W0-1 Lima (sha1 · DL-596 → v0.7 · AGENTS.md)
  → W0-2 India
       ├── W0-3 Mike
       ├── W0-4 Hotel
       ├── W0-5 Echo
       └── W0-6 Tango
  → W0-G Delta
  → W0-BA Coach BUILD AUTHORITY
       → W1 characterize → W1-G
            → W2 reader → W2-G
                 → W3 proxy+cache → W3-G
                      → W4 bearer → W4-G
                           → W5-GO Coach → W5 dash bounce → W5-G
                                → W6 nightly stats → W6-G
       → W7 Kilo (Labs ATs after W2-G; live ATs after W5-G)
       → W8 Lima
  → W-G Delta
```

---

## 5. Packets

### 5.1 W0 — review (no code)

| Seed | Agent |
|------|-------|
| `W0-0-coach-plan-stamp.md` | Coach |
| `W0-1-lima-hash.md` | Lima |
| `W0-2-india-parents.md` | India |
| `W0-3-mike.md` | Mike |
| `W0-4-hotel.md` | Hotel |
| `W0-5-echo.md` | Echo |
| `W0-6-tango.md` | Tango |
| `W0-G-delta.md` | Delta |
| `W0-BA-coach-build-authority.md` | Coach |

### 5.2 W1 — characterize

| Seed | Agent | Done when |
|------|-------|-----------|
| `W1-1-india-prior-art.md` | India | Drift table vs v0.7. Keep vs replace. **No edits.** StudioOne dash **lacks** `ssr_archive_read.py` today. |
| `W1-G` | Delta | Product diff empty |

### 5.3 W2 — reader

| Seed | Agent | Files |
|------|-------|-------|
| `W2-1-alpha-reader.md` | Alpha | `server/market_data/ssr_archive_read.py` + tests. Coverage, index, fetch, cadence, health. Parse `t` **per disk-B**. Derived `S`/`k`. Bounds. Holes+HTTP mapping as data (status applied at HTTP layer). |
| `W2-G` | Delta | AT-SOAR-1…18, 30–32, 34 |

### 5.4 W3 — Labs proxy + cache

| Seed | Agent | Files |
|------|-------|-------|
| `W3-1-alpha-proxy.md` | Alpha | `routes/ssr_archive.py` · config (absent OK, malformed abort) · disk cache root env **present-and-valid or unused**. Member `/api/me/options-lab/archive/*`. Admin `/api/admin/options-lab/archive/stats|cadence`. |
| `W3-G` | Delta | AT-SOAR-19…26 |

### 5.5 W4 — auth

| Seed | Agent |
|------|-------|
| `W4-1-mike-bearer.md` | Mike |
| `W4-G` | Delta |

### 5.6 W5 — StudioOne dash

| Seed | Agent |
|------|-------|
| `W5-0-coach-go.md` | Coach — word to bounce |
| `W5-1-alpha-dash.md` | Alpha — wire reader into StudioOne dash; cadence/stats/health routes; nice below tap |
| `W5-2-foxtrot.md` | Foxtrot — bounce `ai.fattail.labs.ssr-snapshot-dash`; token env; verify tap |
| `W5-G` | Delta |

### 5.7 W6 — nightly stats

| Seed | Agent |
|------|-------|
| `W6-1-alpha-stats.md` | Alpha — pass: filenames+stat, write beside day, roll-up, fail loud, pool worker |
| `W6-2-foxtrot.md` | Foxtrot — launchd 02:00 ET |
| `W6-G` | Delta — backfill started; `last_run_*` present; no envelope opens |

### 5.8 W7 / W8 / W-G

| Seed | Agent |
|------|-------|
| `W7-1-kilo-ats.md` | Kilo |
| `W8-1-lima.md` | Lima — DL, AGENTS, leftover table if disk-B/spec-C ticked, §9a pointers into TM + Strategy Lab specs, **one-line admin-spec amendment** for §7.4 (no admin code) |
| `W-G-delta.md` | Delta |

---

## 6. Acceptance tests (AT-SOAR)

| ID | Claim |
|----|--------|
| **AT-SOAR-1** | Coverage hours from names+stat, not envelope |
| **AT-SOAR-2** | 11:00 start is `partial` |
| **AT-SOAR-3** | Folder-only day is `none` |
| **AT-SOAR-4** | GAP when delta > max(2.5× cadence, 15 s) |
| **AT-SOAR-5** | Hash sha256 `filename\\tsize\\n` |
| **AT-SOAR-6** | Index fields only `t`, `file`, `bytes`, `hole` |
| **AT-SOAR-7** | Index does not `open()` JSON |
| **AT-SOAR-8** | Today index/fetch → hole `TODAY_LIVE`, HTTP **409** |
| **AT-SOAR-9** | Optional expiration omitted → that day's 0DTE book. Wrong assertion → **404** `WRONG BOOK` |
| **AT-SOAR-10** | Missing COUNTS → `UNKNOWN`; index/fetch refused |
| **AT-SOAR-11** | `not_today` → **200** `NOT TODAY` |
| **AT-SOAR-12** | Derived `S`/`k`; levels `0..k` disjoint; union = `{0..n-1}` |
| **AT-SOAR-13** | Thin day (`n≈500`) still has ≥64 level-0 snaps when `n≥64` |
| **AT-SOAR-14** | `day_hash` mismatch → **409** |
| **AT-SOAR-15** | Oversize fetch → prefix + `next_index`; complete iff absent |
| **AT-SOAR-16** | Unparseable filename → `UNREADABLE` skipped |
| **AT-SOAR-17** | Dated name ≠ folder NY date → `DATE MISMATCH` (when such a name exists) |
| **AT-SOAR-18** | Health does not walk the snap tree; reports mount, tap, `api_version`, root |
| **AT-SOAR-19** | Absent archive env → Labs boots; archive routes **501** |
| **AT-SOAR-20** | Malformed URL or short token → **boot abort** |
| **AT-SOAR-21** | StudioOne down → coverage `{unreachable:true, days:[]}` |
| **AT-SOAR-22** | **401** AUTH not mapped to empty coverage |
| **AT-SOAR-23** | Unmounted store → **503** `STORE MISSING` |
| **AT-SOAR-24** | Browser is not given StudioOne URL or token |
| **AT-SOAR-25** | Coverage `Cache-Control: max-age=0, must-revalidate` + ETag |
| **AT-SOAR-26** | Second member, same settled book → Labs disk cache hit |
| **AT-SOAR-27** | Dash HTML `/` works without Bearer |
| **AT-SOAR-28** | Archive routes require Bearer after W5 |
| **AT-SOAR-29** | Member archive: session only (observer can call). Admin stats: administrator only |
| **AT-SOAR-30** | Friday 08-14 flat chain readable as SPY |
| **AT-SOAR-31** | `api_version: 1`; unknown → **502** `VERSION MISMATCH` |
| **AT-SOAR-32** | Pool exhausted → **429** `ARCHIVE BUSY` + `Retry-After: 2` |
| **AT-SOAR-33** | Cadence endpoint: filename-only; `within_dl400` present |
| **AT-SOAR-34** | NY `day=` is session date |
| **AT-SOAR-35** | After W5 bounce, tap still running |
| **AT-SOAR-36** | Stats pass writes beside the day; second night does not recompute settled days |
| **AT-SOAR-37** | Failed stats run records reason; no partial summary |
| **AT-SOAR-38** | `STATS STALE` if roll-up older than schedule |
| **AT-SOAR-39** | `STATS DISAGREE` → files win, summary recomputed (admin path) |
| **AT-SOAR-40** | Duplicate filename clocks → day flagged `TAP RESTART`; both rows kept |

---

## 7. Non-goals (NX)

| ID | Out |
|----|-----|
| **NX1** | MiniTwo until Coach asks |
| **NX2** | Browser → StudioOne · client Massive |
| **NX3** | Time Machine chrome · Instant Replay packets · Algo |
| **NX4** | Sidecar · packed day · Friday rewrite · gold copy |
| **NX5** | Serving `marks/` unless Coach overrides §9.2 |
| **NX6** | Changing tap filename format unless Coach overrides disk-B **to change the writer** |
| **NX7** | Capturing >0DTE or widening the OPF band |
| **NX8** | Recording/enforcing cadence at capture time |
| **NX9** | Building/styling the admin panel (content only) |
| **NX10** | Alert routing · offsite backup |
| **NX11** | Product code before W0-BA |
| **NX12** | Re-imposing three-OK on designated StudioOne work |
| **NX13** | Abort Labs boot because archive env is **absent** |
| **NX14** | Tool-entitlement gate on member replay |
| **NX15** | Unbounded fetch or per-feature extra worker pool |

---

## 8. Risks Juliet is not allowed to swallow

1. **disk-B.** Parser vs `snap-HHMMSSmmmZ.json` without a Coach tick fails closed.  
2. **spec-C.** Implementing required `expiration` after the 0DTE ruling fights §2.  
3. **Starving the tap** — including the nightly stats pass.  
4. **Empty calendar** from collapsed silences.  
5. **Admin tree edits** under this board.  
6. **Prior-art envelope opens** leaking back into the index.

---

## 9. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.1** | 2026-08-27 | Plan from SO-AR **v0.7**. Three-OK off (Coach designated StudioOne). Stats on StudioOne. 0DTE. Derived stride. Advisor-set numbers locked. Four §9 positions + disk-A/B + spec-C as W0 ticks. |
| **v1.0** | 2026-08-27 | Against spec v0.3 opens. **SUPERSEDED.** |

**One-line law:**  
**W0 ticks the disk, the leftover query line, and four corpus positions; W0-BA is BUILD; Labs asks StudioOne for settled 0DTE NY days without starving the writer; the dash bounces on Coach's word; every night StudioOne measures what it wrote.**
