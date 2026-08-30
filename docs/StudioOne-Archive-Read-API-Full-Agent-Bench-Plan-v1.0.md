# StudioOne Archive Read API — Full Agent Bench Plan v1.0

**SUPERSEDED** by [`docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.1.md`](./StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.1.md) (spec **v0.7**). This v1.0 draft was against spec v0.3 opens. Do not stamp it.

**Date:** 2026-08-27  
**Plan revision:** **v1.0** (superseded)  
**Canonical filename:** `docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/SOAR-W0.md`](../agents/go/SOAR-W0.md) — Delta reads **this file**, not chat (**DL-328**).  
**Board:** [`agents/p-studioone-archive-read/`](../agents/p-studioone-archive-read/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **SO-AR Spec v0.3** | [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_3.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_3.md) | **DRAFT** · **not BUILD AUTHORITY** until **W0-BA** |
| Supercedes | v0.2 · v0.1 (`…-Spec-v0_1.md`) | v0.1 boot-abort and folder-date reconstruction **retired** |
| **DL-596** | Archive Read DRAFT | Points at v0.1 — Lima retargets at W0-1 |
| **DL-597** | Live store = FatTail2TB | Confirm as store root (spec §9 fact 1) |
| **DL-539** | Three-OK for work outside program | StudioOne **dash bounce** is this grant |
| Arch **28** | Market bus | **No client Massive.** Browser never calls StudioOne |
| OT-EF / **DL-309** | Named holes · no invented prints | Applies to fetch **payloads** |
| Time Machine Day | Analyzer Time Machine Spec v0.1 | Calendar **consumer** — **not** this program |
| TMI | Instant Replay Spec v0.1.1 | Film is tab RAM — **not** this program |
| Config invariant 2 | Fail loud | **Present-and-malformed** aborts. **Absent** archive config is supported (§6.1) |

**Juliet does not invent WHAT.** Coach wrote SO-AR §0. This plan **sequences**. Spec §9 opens are **Coach ticks on `SOAR-W0.md`**, not silent defaults.

Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.  
Coach overrule = **DL with reasoning**, not a waived gate.  
Reviews: findings are **BLOCKING** (invariant / law / system) or **ADVISORY** (opinion).  
Coach Content Law: nothing in spec §0 is removed.

**No product code in W0.** W1+ fire **only** after W0-BA.  
**No StudioOne launchd bounce** until Coach records **three successive OKs** (spec scope · DL-539). Labs-repo code may exist; it is not the live interface until that bounce.

---

## 0. Evaluation of Spec v0.3

### 0.1 What v0.3 gets right (keep)

The operational half is the reason this version exists. It is law, not flavor:

- **Collection outranks reads** (§4.4). A starved tap loses a snapshot that cannot be recovered. Bounded workers, tap-write priority, per-request timeout, named `ARCHIVE BUSY`.
- **Bounded fetch + continuation** (§4.5). Level 6 of a dense day is tens of MB on the collector. Never a truncated body that reads as a complete level.
- **Window vs global overlap** (§4.6). Index set is deterministic; union of levels 0..N is still the day.
- **StudioOne is external** (§6.1). Labs **boots without** archive URL/token. Absent → `ARCHIVE NOT CONFIGURED`. Present-but-malformed still aborts. Closes v0.1 open 1. MiniTwo need not carry archive env to boot.
- **Three silences, three names:** not configured · not reachable · not authorized. Empty calendar must not mean “no days.”
- **Health without touching the archive** (§6.3). Unmounted external drive = `STORE MISSING`, not down, not empty.
- **Settled day is immutable** (§7.1). Labs caches by book hash so ten members are not ten collector passes.
- **Symbols first-class.** Coverage takes a set; index/fetch take one. No folder for a date+symbol = `NONE`, not an error.
- **New holes:** `ARCHIVE BUSY` · `VERSION MISMATCH` · `TAP RESTART` · `DATE MISMATCH` · `ARCHIVE NOT CONFIGURED` · `STORE MISSING` widened to unmounted.
- **Today is live.** Index/fetch refuse `TODAY_LIVE`. Coverage may mention today only as `live` / `growing`.
- **Index is filename+stat.** No envelope, no spot, no content_hash. No sidecar.
- **Browser never calls StudioOne.** Labs proxy re-serves.

v0.1 interface (three calls, dyadic ladder 0–6, book = symbol+expiration, NY session `day=`, gzip/ETag) is **unchanged in semantics** except date-from-filename and boot-absent.

### 0.2 Disk facts — confirmed 2026-08-27 on StudioOne

Spec §9: two facts **must be confirmed against the running implementation before stamp**. “If the implementation contradicts either, this spec is the bug.”

| Fact | Spec v0.3 claim | On disk (StudioOne, this session) | Verdict |
|------|-----------------|-----------------------------------|---------|
| **Store root** | External drive; not `~/Library/Caches` | `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` · **DL-597** · tap writes here | **CONFIRMED.** Juliet rec: stamp this path into §1. |
| **Filename format** | “Each snapshot file carries **its own date** in the name. No date is reconstructed from the folder.” | Nested: `snap-HHMMSSmmmZ.json` (e.g. `snap-051730882Z.json`). Friday 08-14 flat: `snap-HHMMSSZ.json`. **No calendar date in the name.** Folder `day=YYYY-MM-DD` is the NY session date. | **CONTRADICTION.** Spec says the spec is the bug if the tap disagrees. **Coach must tick §9.1 / disk-B on `SOAR-W0.md` before W0-BA.** |

v0.1’s folder+filename reconstruction existed because the tap writes **time-of-day UTC with no date**. Coach corrected the *intent* in v0.2/v0.3; the **running writer was not changed**. This program **does not write the gold disk** (spec Does-not). It cannot add dates to filenames.

**Juliet rec (opinion):** keep the tap as-is; restore reconstruction of `t` from **filename UTC clock + folder NY date** (v0.1 rule), and keep `DATE MISMATCH` for the case a *future* dated name disagrees with its folder. Do not silently “fix” the spec in code. Coach Accepts or Overrides on W0.

§4.1 table still says `first_at` / `last_at` from “**filename+folder date**” while §1 retired that paragraph. India W0-2 quotes both; Lima repairs the leftover table **only** after Coach ticks disk-B.

### 0.3 Prior art in the Labs repo (do not ship as the interface)

These files exist from a premature implementation. They are **characterization targets in W1**, not the live StudioOne API:

- `server/market_data/ssr_archive_read.py`
- `server/routes/ssr_archive.py`
- `server/tests/test_ssr_archive_*.py`
- Workspace dash handlers for `/api/coverage` · `/api/index` · `/api/fetch`

StudioOne’s running dash **does not** ship `ssr_archive_read.py`. The live interface is still the old process until three OKs + bounce.

Known drift vs v0.3 (W1 must re-quote, not this table as SoR): envelope opens on index; `store: "cache"`; Labs boot does not yet distinguish absent vs malformed; expiration not required on index/fetch; today not refused; no concurrency ceiling; no continuation marker; no API version/health as specified.

**First principles:** W2 builds on that tree where it matches the spec; it does not throw the files away to start over.

### 0.4 What this plan will not do

Silent-default any §9 open. MiniTwo deploy. Time Machine chrome. Instant Replay packets. Gold copy / Friday rewrite. Sidecar. Browser → `:5055`. Dash bounce before three OKs. Product code before W0-BA.

---

## 1. Mission

```text
W0     Review + Coach disk-fact + §9 ticks (India · Mike · Hotel · Echo · Tango)
         → Delta W0-G → Coach W0-BA (BUILD AUTHORITY)
W1     Characterize prior art vs v0.3 (no ship)
W2     Alpha — archive reader (coverage · index · fetch · holes · health · version)
         Labs-repo + tests against tmp_path / fixtures. No StudioOne bounce.
W3     Alpha — Labs proxy (absent vs malformed · named silences · gzip · cache §7.1)
W4     Mike — bearer on archive routes; no member cookie on StudioOne
W5     Foxtrot + Alpha — StudioOne dash routes  ← HARD GATE: three OKs
W6     Kilo — AT-SOAR evidence
W7     Lima — DL · AGENTS · spec leftover table · help pointer
W-G    Delta
```

**No product code in W0.**  
**No StudioOne process change in W1–W4.**  
W5 is the only packet allowed to bounce `ai.fattail.labs.ssr-snapshot-dash`, and only with **three successive OKs** Coach records.

### 1.1 Neighbor serialization

| Order | Board | Why |
|-------|--------|-----|
| **1** | Live tap on StudioOne | Collection outranks reads. Do not starve `ssr_live_capture`. |
| **2** | `p-options-lab-tmi` | Instant Replay is **tab film**, not this archive. Do not conflate. |
| **3** | Analyzer Time Machine Day | Calendar **consumes** coverage later. **Not this program.** Do not open chrome packets here. |

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-2 India** | v0.3 architecture-safe. Quote as-built: store root, filename glob, `COUNTS.json` expiration, `PROVENANCE` wings, Friday-flat 08-14, `CHECKLIST.json` finalize. Quote prior-art files+lines. **Disk-B contradiction labeled BLOCKING until Coach ticks.** Arch 28: no client Massive. BLOCKING vs ADVISORY labeled. | Mike · Hotel · Echo · Tango · W0-G |
| **W0-3 Mike** | Bearer on StudioOne archive routes only (HTML dash stays cookie-free LAN). Token ≥32. Labs sends Bearer when configured. Absent config ≠ 401. Three silences not collapsed. | W0-G · W4 |
| **W0-4 Hotel** | Fetch payload is OPF truth. No filled GAP. No invented print. `DATE MISMATCH` / `UNREADABLE` / `TAP RESTART` named. `not_today` is not a chain. | W0-G |
| **W0-5 Echo** | No member chrome in this program. Review **named-silence JSON/copy contract** so Time Machine can later paint four distinct states. Advisory unless it invents UI this program forbids. | W0-G |
| **W0-6 Tango** | Empty calendar must not read as “no days.” Four silences in member-facing words (process, not profit). | W0-G |
| **W0-G Delta** | Spec v0.3 + this plan v1.0 + board on disk. `SOAR-W0.md` has **disk-A, disk-B, and every §9.3–14 tick.** No product code in W0. | W0-BA |
| **W0-BA Coach** | BUILD AUTHORITY. Ticks are law. | W1 |
| **W1-G** | Characterization list filed. Drift vs v0.3 named. No StudioOne bounce. | W2 |
| **W2-G** | Coverage/index/fetch characterization tests. Filename parse per **Coach disk-B tick**. Index **does not** `open()` JSON. Today refused. Wrong book empty. Ladder disjoint. Continuation present when bound hits. | W3 |
| **W3-G** | Labs proxy: 501 `ARCHIVE NOT CONFIGURED` when env absent; boot abort only if present-and-malformed; coverage unreachable = empty+named, not stale; gzip; entitlement. | W4 |
| **W4-G** | Archive routes 401 `ARCHIVE AUTH` without/wrong bearer. Dash HTML `/` still works without bearer. | W5 (blocked on three OKs) |
| **W5-OK** | Coach **three successive OKs** recorded (DL-539). | W5 fire |
| **W5-G** | StudioOne dash serves versioned coverage/index/fetch/health. Store unmounted → health `STORE MISSING`. Tap still collecting (cadence evidence). LAN only. | W6 |
| **W6-G** | AT-SOAR-1…N evidence table. | W7 |
| **W-G Delta** | Ternary. Fail-closed on client Massive, sidecar, today-as-archive, invented print, unbounded fetch, dash bounce without three OKs, collapsing the three silences. | Coach ship · MiniTwo **when asked** |

---

## 3. Locked (not ODs)

| ID | Decision | Source |
|----|----------|--------|
| **FP1** | Three calls: coverage · index · dyadic fetch 0–6. | §0 · §4 |
| **FP2** | Index = filename + `stat`. No envelope. No spot / content_hash. | §1 · §4.2 |
| **FP3** | Book = `(symbol, expiration)` (+ wings as written). Path is symbol-only. Mismatch → `WRONG BOOK`, never another expiry’s files. | §2 |
| **FP4** | Today (NY) is live. Index/fetch → `TODAY_LIVE`. | §3 |
| **FP5** | Browser never calls StudioOne. Labs re-serves. | §0.7 · §6 · Arch 28 |
| **FP6** | Collection outranks reads. Bounded workers. `ARCHIVE BUSY` not an unbounded queue. | §4.4 |
| **FP7** | Fetch responses bounded; continuation names next index; level complete iff marker absent. | §4.5 |
| **FP8** | Settled day immutable. Labs caches by book hash. Growing day is not archive-routable. | §7.1 · §3 |
| **FP9** | Labs boots if archive env **absent**. Present-and-malformed aborts. | §6.1 |
| **FP10** | Three silences never collapsed: not configured · not reachable · not authorized. Unmounted is `STORE MISSING`. | §5 · §6.2 · §6.3 |
| **FP11** | No sidecar. No gold write. No Friday rewrite. No MiniTwo until asked. | Does-not · §8 |
| **FP12** | No StudioOne dash bounce until three OKs. | Scope · DL-539 · §0.16 |
| **FP13** | NY session `day=` folders. | §1 · §0.14 |
| **FP14** | Juliet does not invent WHAT. Coach Content Law. Delta ternary. | Doctrine |
| **FP15** | Store root (this session): `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` pending Coach disk-A tick. | DL-597 · §9 fact 1 |

**§9 — Coach must tick. Juliet recs are opinion. Spec forbids silent default.**

| # | Question | Juliet rec (opinion) |
|---|---------|----------------------|
| **disk-A** | Store root | **Stamp** `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` |
| **disk-B** | Filenames carry a date? | **Override the spec’s disk claim:** names are `snap-HHMMSSmmmZ.json` (Friday `snap-HHMMSSZ.json`). Reconstruct `t` from filename UTC clock + folder NY date. Keep `DATE MISMATCH` if a dated name ever appears and disagrees. Do **not** change the tap in this program. |
| **§9.3** | Level 0 stride 64 vs derive | **Keep 64 fixed** for v1 (law already written in §4.3). Derive-per-day is a later round. Thin days stay a thin first pass. |
| **§9.4** | Coverage ETag vs `Cache-Control: no-store` | **`no-store` on the member coverage response.** Labs **server** cache of *settled* coverage is §7.1, keyed by hash, not the browser. |
| **§9.5** | HTTP status per named hole | Index/fetch: **200** + `hole` for `NONE` / `NOT TODAY` / `WRONG BOOK` / `TODAY_LIVE` (empty `snaps`). **401** `ARCHIVE AUTH`. **501** `ARCHIVE NOT CONFIGURED`. **503** unreachable. **429** `ARCHIVE BUSY`. **409** `day_changed`. |
| **§9.6** | Wing window as fetch param | **Coverage-declared only** in v1. Disk has one wings per day folder. |
| **§9.7** | GAP multiplier | **Keep 2.5×** median cadence. |
| **§9.8** | Which symbols | **Whatever folders exist** that day. Coverage advertised set = intersection of request ∩ on-disk. Do not invent a universe. |
| **§9.9** | Pool / timeout / retry | **2 archive workers · 8s coverage · 30s index · 60s fetch chunk · `Retry-After: 2`.** Opinion; measure in W5. |
| **§9.10** | Fetch bound | **32 envelopes or 4 MiB, whichever first.** Continuation = next index. |
| **§9.11** | Labs cache where | **Process memory, hash-keyed, 256 MiB cap, LRU.** Not MiniTwo disk until asked. |
| **§9.12** | Retention | **Keep everything in v1.** API never deletes. Flag thinning as later. |
| **§9.13** | `marks/` | **Do not serve** in v1. Chain is the past-day SoR. |
| **§9.14** | TAP RESTART | **Named hole on the day; keep both files as distinct index rows; do not silent-dedup.** |

Coach ticks Accept / Override on `SOAR-W0.md`. A missing tick **blocks W0-BA**.

---

## 4. DAG

```text
W0-0 Coach plan stamp + disk-A/B + §9.3–14 ticks on SOAR-W0.md
  → W0-1 Lima hash (spec v0.3 sha1 · retarget DL-596)
  → W0-2 India (disk quotes · prior art · leftover §4.1 table)
       ├── W0-3 Mike
       ├── W0-4 Hotel
       ├── W0-5 Echo
       └── W0-6 Tango
  → W0-G Delta
  → W0-BA Coach BUILD AUTHORITY
       → W1 characterize prior art → W1-G
            → W2 Alpha reader → W2-G
                 → W3 Alpha Labs proxy → W3-G
                      → W4 Mike bearer → W4-G
                           → [three OKs] → W5 StudioOne dash bounce → W5-G
       → W6 Kilo
       → W7 Lima
  → W-G Delta
```

W6 may start after W2-G (reader tests exist) and must include W5 evidence if W5 has fired. If W5 has not fired, Kilo still gates Labs-side ATs; StudioOne-live rows are **HOLD**, not waived.

---

## 5. Packets

### 5.1 W0 — review (no code)

| Seed | Agent | Fire |
|------|-------|------|
| `W0-0-coach-plan-stamp.md` | Coach | First — ticks disk-A, disk-B, §9.3–14 on `SOAR-W0.md` |
| `W0-1-lima-hash.md` | Lima | After W0-0. Spec sha1. Retarget DL-596 → v0.3. Point AGENTS.md at this plan. |
| `W0-2-india-parents.md` | India | After W0-1 |
| `W0-3-mike.md` | Mike | After W0-2 |
| `W0-4-hotel.md` | Hotel | After W0-2 |
| `W0-5-echo.md` | Echo | After W0-2 |
| `W0-6-tango.md` | Tango | After W0-2 |
| `W0-G-delta.md` | Delta | After W0-2…6 |
| `W0-BA-coach-build-authority.md` | Coach | After W0-G |

### 5.2 W1 — characterize (no ship)

| Seed | Agent | Files | Done when |
|------|-------|-------|-----------|
| `W1-1-india-prior-art.md` | India | Read-only: `ssr_archive_read.py` · `routes/ssr_archive.py` · dash handlers · StudioOne dash **absence** of the module | Drift table vs v0.3. What to keep vs replace. **No edits.** |
| `W1-G` | Delta | Diff empty of product code | W1-G |

### 5.3 W2 — archive reader (Labs repo)

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W2-1-alpha-reader.md` | Alpha | `server/market_data/ssr_archive_read.py` (+ tests). Coverage, filename+stat index, dyadic fetch, holes, health (store mounted / tap process), API version. **Parse `t` per disk-B tick.** No sidecar. No envelope on index. | AT-SOAR-1…18 |
| `W2-G` | Delta | Tests do not `open()` JSON on the index path. Today refused. Ladder disjoint. Bound+continuation. | W2-G |

### 5.4 W3 — Labs proxy

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W3-1-alpha-proxy.md` | Alpha | `server/routes/ssr_archive.py` · `server/config.py` (malformed abort; **absent is OK**) · `server/main.py` if needed. Member routes §7. Gzip. Labs cache §7.1 per tick §9.11. | AT-SOAR-19…26 |
| `W3-G` | Delta | Unconfigured → 501 named. Unreachable coverage empty+named. No boot abort on absent env. | W3-G |

### 5.5 W4 — auth

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W4-1-mike-bearer.md` | Mike | StudioOne archive-route auth design + Labs always-send-Bearer-when-configured. Dash `/` and `/api/status` remain unauthenticated LAN (existing dash). | AT-SOAR-27…29 |
| `W4-G` | Delta | Wrong token ≠ empty coverage. | W4-G |

### 5.6 W5 — StudioOne dash (three OKs)

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W5-0-three-oks.md` | Coach | Record three successive OKs. No fire without them. | DL-539 |
| `W5-1-alpha-dash.md` | Alpha | Wire reader into StudioOne `ssr_snapshot_dash.py` (or equivalent). Copy module onto the host. **Do not** starve the tap. | AT-SOAR-30…34 |
| `W5-2-foxtrot.md` | Foxtrot | Bounce `ai.fattail.labs.ssr-snapshot-dash` only. Verify tap cadence after bounce. LAN bind. Token in StudioOne env. | AT-SOAR-35 |
| `W5-G` | Delta | curl coverage/index/fetch/health from Labs host, not from a browser. Cadence evidence. | W5-G |

### 5.7 W6 / W7 / W-G

| Seed | Agent |
|------|-------|
| `W6-1-kilo-ats.md` | Kilo — AT-SOAR-1…N evidence table |
| `W7-1-lima.md` | Lima — parent one-liners · AGENTS.md · Arch pointer · leftover §4.1 table if Coach ticked disk-B |
| `W-G-delta.md` | Delta |

---

## 6. Acceptance tests (AT-SOAR)

Kilo owns the table. Names here so packets cannot “forget.”

| ID | Claim |
|----|--------|
| **AT-SOAR-1** | Coverage lists hours (`first_at` / `last_at`) from names+stat, not envelope |
| **AT-SOAR-2** | 11:00 start is `partial`, not `rth_complete` |
| **AT-SOAR-3** | Folder-only day (08-17 shape) is `none` |
| **AT-SOAR-4** | Gap > 2.5× cadence → `GAP`; no interpolated minute |
| **AT-SOAR-5** | Hash = sha256 `filename\\tsize\\n`; adding a file changes hash |
| **AT-SOAR-6** | Index fields only `t`, `file`, `bytes`, `hole` — no `spot` / `content_hash` / rows |
| **AT-SOAR-7** | Index does not `open()` JSON (characterization / mock) |
| **AT-SOAR-8** | Today index/fetch → `TODAY_LIVE`, empty snaps |
| **AT-SOAR-9** | Wrong expiration → `WRONG BOOK`, empty snaps, never the other book’s files |
| **AT-SOAR-10** | Missing COUNTS → expiration `UNKNOWN`; index/fetch refused |
| **AT-SOAR-11** | `not_today` → `NOT TODAY` |
| **AT-SOAR-12** | Levels 0–6 disjoint; union = `{0..n-1}` |
| **AT-SOAR-13** | Interrupt at level 3 is uniform density |
| **AT-SOAR-14** | `day_hash` mismatch → 409, resume not restart |
| **AT-SOAR-15** | Oversize fetch returns prefix + continuation; never silent partial |
| **AT-SOAR-16** | Unparseable filename → `UNREADABLE`, skipped |
| **AT-SOAR-17** | Filename date ≠ folder NY date → `DATE MISMATCH` (when dated names exist) |
| **AT-SOAR-18** | Health does not walk the snap tree |
| **AT-SOAR-19** | Absent `LABS_SSR_ARCHIVE_URL` → Labs boots; archive routes 501 `ARCHIVE NOT CONFIGURED` |
| **AT-SOAR-20** | Malformed URL or short token → **boot abort** |
| **AT-SOAR-21** | StudioOne down → coverage `{unreachable:true, days:[]}` — not a cached day list |
| **AT-SOAR-22** | 401 `ARCHIVE AUTH` is not mapped to empty coverage |
| **AT-SOAR-23** | Unmounted store → `STORE MISSING` (health + coverage) |
| **AT-SOAR-24** | Browser is not given StudioOne URL or token |
| **AT-SOAR-25** | Coverage member response `Cache-Control: no-store` |
| **AT-SOAR-26** | Two Labs members, same settled book → second fetch served from Labs cache (hash match) |
| **AT-SOAR-27** | Dash HTML `/` works without Bearer |
| **AT-SOAR-28** | Archive routes require Bearer once W5 is live |
| **AT-SOAR-29** | Token < 32 chars rejected at config (when present) |
| **AT-SOAR-30** | Friday 08-14 flat `chain/snap-*.json` still readable as SPY |
| **AT-SOAR-31** | API version on every archive response; unknown version → `VERSION MISMATCH` |
| **AT-SOAR-32** | Exhausted worker pool → 429 `ARCHIVE BUSY` + retry hint |
| **AT-SOAR-33** | During a synthetic archive load, tap still writes (cadence probe) — W5 |
| **AT-SOAR-34** | NY `day=` is session date, not UTC date |
| **AT-SOAR-35** | After W5 bounce, `ssr_live_capture` still running |

---

## 7. Non-goals (NX)

| ID | Out |
|----|-----|
| **NX1** | MiniTwo until Coach asks |
| **NX2** | Client Massive · browser → StudioOne |
| **NX3** | Time Machine chrome · Instant Replay packets · Algo Alert |
| **NX4** | Sidecar index · packed day file |
| **NX5** | Gold copy / Friday 5-min rewrite / deleting cache |
| **NX6** | Serving `marks/` (unless Coach ticks §9.13 serve) |
| **NX7** | Changing the tap filename format (unless Coach overrides disk-B to *change the writer*) |
| **NX8** | Product code before W0-BA |
| **NX9** | Dash bounce before three OKs |
| **NX10** | Silent default of any §9 open |
| **NX11** | Aborting Labs boot because archive env is **absent** |
| **NX12** | Unbounded fetch or unbounded archive concurrency |
| **NX13** | MSC / thinkorswim source copy |
| **NX14** | Treating Instant Replay RAM film as this archive |

---

## 8. Risks Juliet is not allowed to swallow

1. **disk-B.** Shipping reconstruction while the spec still says “filenames carry a date,” or shipping a date-in-name parser against `snap-HHMMSSmmmZ.json`, both fail. Coach ticks first.  
2. **Starving the tap.** W5 load tests must show cadence, not “it should be fine.”  
3. **Empty calendar.** Mapping unreachable or unconfigured to `days: []` without the named hole.  
4. **Prior art.** Merging the premature reader without characterization is how envelope-opens leak back into the index.

---

## 9. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.0** | 2026-08-27 | Plan from SO-AR spec **v0.3**. Evaluation: store root confirmed FatTail2TB; **filenames on disk have no date** — Coach disk-B tick required. W0 review → W0-BA → Labs reader/proxy → three-OK dash bounce. |

**One-line law:**  
**W0 ticks the disk and the opens; W0-BA is BUILD; Labs learns to ask StudioOne for settled NY days without ever starving the writer or lying about silence; the dash does not bounce until three OKs.**
