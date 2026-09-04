# Archive Lab — Full Agent Bench Plan

**Date:** 2026-09-04  
**Canonical filename:** `docs/ARCHIVE_LAB_PLAN.md`  
**Status:** PLAN ONLY. Coach reads this before any packet fires.  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship / cutover / live switch)  
**Parent collector plan:** [`docs/Collector-Capture-Range-Full-Agent-Bench-Plan-v1.0.md`](./Collector-Capture-Range-Full-Agent-Bench-Plan-v1.0.md) (`9ac7d3b`) — **this file widens it; it does not silently replace Coach’s four-part collector prompt.**  
**Report of collector numbers:** `Specs/COLLECTOR_RANGE.md` (written in WS1, not now)  
**Host:** StudioOne · gold store `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`  
**Existing dash (extend, do not fork):** `server/market_data/ssr_snapshot_dash.py` · launchd `ai.fattail.labs.ssr-snapshot-dash` · **`:5055`** LAN (`studioone.local:5055`)

Juliet sequences. Juliet does not execute packets. Direct agent-to-agent traffic is prohibited; handoffs go through Coach or Juliet. Delta gates: **PASS / FAIL / BLOCKED**, never waived.

---

## 0. Principle (Coach, verbatim law)

Every study is a **registered job**: a script, its inputs, the figures it produces, and a caption stating the computed answer. Jobs run **nightly after the collector closes**. The dashboard is the **viewer for that registry plus a chain explorer**. Nothing on the dashboard is hand-made; if it’s on screen, a job produced it and will produce it again tomorrow.

| Law | Meaning |
|-----|---------|
| Registry, not pages | A figure without a job + caption + sample size + regime is not on the dash |
| Nightly | Runner after GTH close; dated out dir + `latest` pointer |
| Isolate failure | One job FAIL does not block the others |
| No live raw scans | Browser never walks the 2-second store. Jobs precompute; dash reads artifacts |
| Sixteen days is a **construction set** | Every number carries n and regime. Do not dress Aug 18–Sep 3 as a sample |
| Nothing live / deleted / migrated | Plan entry **and** Coach go |

---

## 1. Capability map — who actually owns what

Coach asked for collector, quant, analysis, ops, frontend, backend, QA, wiki. The seated bench is **not** that vocabulary. Assignments below use **charter domains**. Where a requested owner does not exist, the gap is named. Idle people are not a substitute.

| Requested owner | Seated callsign that fits | Gap |
|-----------------|---------------------------|-----|
| Collector / data | **Alpha** (tap, feed, Redis, `ssr_live_capture`) + **Foxtrot** (StudioOne launchd, disk) | None for WS1 code+ops |
| Quant / analysis | **No seated Quant.** Hotel’s charter is *review of trading claims*, not implementing σ_T. Bravo is content research, not IV math. | **Quant is missing.** WS2 **implementation** is Alpha (shared Python module in `server/market_data/`). **Hotel** blocks a false T convention or ATM pick. **India** blocks a second σ_T. Analysis *jobs* (WS3 scripts) are also Alpha until a Quant is seated. |
| Frontend (Labs Next.js) | **Charlie** | **Wrong stack for this dash.** Chain Snapshot is Python `ThreadingHTTPServer` on StudioOne `:5055`, not Next.js. Coach: extend it, don’t fork. Charlie does **not** own WS4. |
| Frontend (this dash) | **Alpha** implements HTML/API on `:5055`. **Echo** reviews HIG + Fat Tail tokens. | Charlie idle on WS4 unless Coach authorises a Labs-app fork (out of scope). |
| Backend / API | **Alpha** (`ssr_snapshot_dash` + artifact routes) | None |
| QA / verify | **Delta** (sign-off) + **Kilo** (independent re-derivation, job contracts) | None |
| Wiki | **Lima** (docs, DL, interface contracts). Member IKI wiki is **parked** (AGENTS.md). **Gemba** authors IKI wiki only if Coach unparks. | **IKI is parked.** WS6 ships as `docs/archive-lab/` (+ DL). IKI pages are a later Coach switch, not this week. |
| Ops | **Foxtrot** | None |
| Security | **Mike** reviews LAN bind, artifact routes vs existing ARCHIVE AUTH | Not an owner of features |
| Trading-claim review | **Hotel** on every job caption that a member (or Coach) could take as market law | Not an implementer |
| Orchestration | **Juliet** | Does not write collector or dash code |
| Spec integrity | **India** | `COLLECTOR_RANGE.md`, job manifest schema, “one σ_T” invariant |

**Not used this week (and not assigned “because free”):** Sierra, Quebec, November, Romeo, Papa, Tango (operator dash, not member UX), Victor / Whiskey / Yankee (no lineage packet), Golf (not seated).

**Idle → extra WS3 jobs** (floor, not ceiling): see §6. Hotel still reviews those captions.

---

## 2. Workstreams

### WS1 — Collector range (in flight)

**Law:** parent plan v1.0 + Coach’s four-part prompt.  
**Owner:** **Alpha** (band module, tap flag, feed window, replay harness, `compare_capture.py`).  
**Ops:** **Foxtrot** (v2 store, launchd, disk headroom, dual-daemon cadence).  
**Review:** **India** (schema / flag-off ≡ old). **Hotel** (retention “still valuable at 15:55” is a trading claim). **Kilo** (tests). **Delta** (P1/P2/P3 gates).  
**Blocked by:** **WS2** for *k* and *b* (σ_T must be the shared function). P1 measurement of *today’s wings rule*, waste, and `not_listed` misses is **not** blocked — that is still listed-count, not σ.

| Packet | Agent | Out |
|--------|-------|-----|
| P1 audit (wings, waste, misses, storage; **not** the IV verdict) | Alpha | `Specs/COLLECTOR_RANGE.md` §1 |
| P1.4 / WS2 IV | Alpha + Hotel + India | see WS2 |
| P2 k, b, flag OFF, replay | Alpha | §2 + `ssr_band.py` + tests |
| P3 parallel day | Foxtrot stage + Alpha compare | `live_capture_v2` · 16:30 compare |
| P4 cutover | Foxtrot config swap | **Coach go only** |

Do not switch live. FAIL parallel day → another full day, never same-day fix-and-cut.

---

### WS2 — IV and σ_T integrity  **CRITICAL PATH**

**Owner (implement):** **Alpha**  
**Owner (convention):** **Hotel** (ATM pick, T-to-close, what “4.7%” means)  
**Owner (single import):** **India**  
**Tests:** **Kilo**  
**Gate:** **Delta**

One function, one module, imported by the collector band, every study job, and the dash explorer.

**Propose path:** `server/market_data/sigma_t.py`

```text
atm_iv(chain) -> float | named hole
sigma_t(spot, atm_iv, ts, session_close=16:00 ET) -> σ_T
T_remaining_years(ts) -> hours_to_close / (252 * 6.5)
```

Reproduce and **name**:

- Aug 25 SPX 0DTE ATM IV **4.68%** vs XSP **9.63%** same open
- ~6% at 15:00 on several days

IV column today is Massive `implied_volatility` via `chain_ladder._normalize_contract`. WS2 decides: use that field, or recompute, and with which T. Late-day ATM strike pick is in scope.

**Gate WS2:** a fixture day yields the same σ_T from collector code and from `width_maturity_job` after the import switch. Caption numbers in Width Maturity that used a private `HPY` move onto this module. **FAIL** if two T conventions remain.

**Blocks:** WS1 P2 (k, b), all WS3 jobs, WS4b pricing.

---

### WS3 — Study registry + nightly runner

**Jobs (scripts, captions, figures):** **Alpha** (until a Quant is seated)  
**Runner / launchd:** **Foxtrot**  
**Manifest schema:** **India**  
**Job contracts / budgets:** **Kilo**  
**Caption honesty:** **Hotel**  
**Gate:** **Delta** (first nightly)

**Layout (propose; India stamps):**

```text
Specs/archive-lab/jobs/
  MANIFEST.yaml          # or json — India picks one
  width_maturity/
  late_entry_maturity/
  friction_surface/
  per_leg_residuals/
  band_health/
Outputs (not git):
  /Volumes/FatTail2TB/fattail-market-data/ssr/archive_lab/runs/YYYY-MM-DD/
  .../latest -> that dir
```

Each job declares: script, params, output figures, caption template (must include **n** and **regime**), runtime budget, archive inputs.

**Runner:** launchd, after GTH close (name the clock in P2 — Foxtrot; default **20:30 ET** weeknights, **skip** Fri 20:00–Sun 20:15 sleep window unless Coach wants weekend backfill). Writes dated dir + `latest`. Logs pass/fail + runtime. **Never blocks** on one failed job.

**First registered jobs (floor):**

| Job | What | Depends |
|-----|------|---------|
| `width_maturity` | Existing job + renderer. Add **≥4-tick debit** gate and **reached / cheapest** split | WS2 |
| `late_entry_maturity` | Same job `--entry 14:00 / 14:30 / 15:00` | WS2, width_maturity script |
| `friction_surface` | spread%, depth, last-trade age by strike distance and clock, **14:00–16:00**, by symbol | WS2 (distance in σ) |
| `per_leg_residuals` | surface fit in (log-moneyness, √T) per snapshot; residual per strike; persistence 1/5/15 min | WS2 |
| `band_health` | band edges in σ, drift, waste, recenter events, misses — per day | WS1 P2 schema (can run on **v1** with “wings-as-band” until v2) |

**Idle-agent extras (ceiling; only after the floor is registered):**

| Job | Who drafts the premise | Who codes |
|-----|------------------------|-----------|
| `iv_sanity_watch` — ATM IV vs XSP/10, vs VIX1D if stored; flag Aug-25-class breaks | Hotel (premise) | Alpha |
| `spot_left_band` — days spot came within 0.5σ of an edge (P1 flag, ongoing) | Alpha | Alpha |
| `construction_set_label` — stamp n=13 complete days / regime on every caption | Lima (copy) | runner |

Bravo / Sierra / studio agents are **not** drafted into extra jobs.

**Gate WS3:** MANIFEST valid; runner dry-run on one archived day; `width_maturity` + `late_entry_maturity` produce dated artifacts + captions. First two jobs **nightly by Wed Sep 9**.

---

### WS4 — Archive Lab dashboard (extend `:5055`)

**Implement:** **Alpha** (`ssr_snapshot_dash.py` — that **is** the stack)  
**Visual / tokens:** **Echo** (review before Delta). Brand: BG `#0F0F12`, panel `#1C1C22`, orange `#FF8C1A`, teal `#4FD1C5`, green `#57C785`, red `#E63946`, text `#F5F5F5`.  
**Auth / bind:** **Mike** (LAN only; do not weaken ARCHIVE AUTH on `/api/*`; studies HTML stays operator-local as today).  
**Not Charlie** unless Coach GO to fork into Labs Next — **out of scope**.

Two faces:

**WS4a Studies (this week, Fri Sep 11)**  
One page per registered job: latest figures + captions; date picker over prior nights; diff (this night vs last night, this night vs **construction-set median**); regime label (ATM IV, VIX if stored) on every page. Sample size on every number.

**WS4b Chain explorer (week of Sep 15)**  
Pick symbol, day, expiration, clock (slider at **2 s**). Shows captured chain, per-strike IV + surface fit + residuals, that day’s band edges, and prices a structure (fly, BWB, vertical, calendar) at any strike set, stepped through the day (value at center, value at spot, greeks). Width Maturity **on demand for one position**.

**Load law:** a day in **under 3 s** from **precomputed per-day artifacts**, not raw 2-second scans. Explorer artifacts are a WS3 job (`chain_day_pack` or equivalent) — register it before WS4b, not as a hidden dash fetch.

**Gate WS4a:** Echo review; one job page loads `latest` + one historical date; no raw glob of `snap-*.json` on the request path (Kilo proves with a fixture).  
**Gate WS4b:** separate, following week.

---

### WS5 — Verification

**Owner:** **Delta** (sign-off)  
**Hands:** **Kilo** (re-derive ≥1 number from every job caption independently; run `compare_capture.py` on parallel day)  
Delta does **not** modify work under review.

Per run: `VERIFY.md` in that night’s dated dir. PASS/FAIL/BLOCKED per job. A caption number that does not re-derive is FAIL for that job, not a warning.

Attached from the **first nightly run** (Wed Sep 9).

---

### WS6 — Documentation

**Owner:** **Lima** (pages + DL same day)  
**IKI:** **parked.** Do not assign Gemba to unpark. If Coach later wants IKI pages, that is a new GO.

Per job, a page under `docs/archive-lab/jobs/<name>.md`: premise, measurement, what a positive result looks like, latest result, **regime it was found in**, link to the run that produced a rule change.

India: `COLLECTOR_RANGE.md` and MANIFEST stay validatable without reading code.

In step with WS3: a job is not “registered” until its wiki page exists.

---

### WS7 — Ops

**Owner:** **Foxtrot**

- launchd: v1 tap (unchanged), v2 tap (P3, separate root), runner, dash (`ssr-snapshot-dash` bounce only on Coach word — parent SO-AR law still applies to *that* plist; Archive Lab routes can ship in-process **after** Echo/Delta, still a dash bounce).
- Disk: archive + nightly artifacts at **90 days**, vs free space on FatTail2TB. Three weeks already on the volume.
- Alert: collector fail, runner fail, job fail. Use the **existing** Labs admin notification / Discord path if one is already wired for StudioOne; if not, **name the gap** rather than inventing a new bot. Foxtrot reports which in P2.
- Backup of the archive volume: state as-built, then the 90-day projection. Do not claim a backup that is not running.

---

## 3. Dependencies

```text
WS2 σ_T  ─────────────────────────────────────────────┐
    │                                                 │
    ├─► WS1 P2 (k,b,sim) ─► P3 parallel ─► P4 (Coach) │
    │                                                 │
    ├─► WS3 jobs ─► runner nightly ─► WS4a studies    │
    │         │                         │             │
    │         ├─► WS5 VERIFY.md         │             │
    │         └─► WS6 job pages         │             │
    │                                   └─► WS4b (needs chain_day_pack job)
    └─► WS7 launchd + disk + alert (can start in parallel with WS2)
```

**Critical path:** WS2 (Mon) → WS1 P2 sim (Mon night) → Foxtrot stage → **P3 Tue Sep 8** → Coach → P4 Wed Sep 9.

If WS2 is not **Delta PASS by Mon 14:00 ET**, slip P3. Do not invent k on a broken σ_T to save the calendar.

---

## 4. Day-by-day — week of Sep 8

Times ET. Market closed Labor Day Mon. First session Tue.

### Sat Sep 6 (and remaining Sun if needed) — already in the collector plan

| Agent | Work | Idle? |
|-------|------|-------|
| **Alpha** | WS1 P1 audit: wings code quotes, waste, storage, `placements.csv` misses. **Not** k. | No |
| **India** | Review P1 tables as they land in `COLLECTOR_RANGE.md` | Light |
| **Kilo** | Fixture list for WS2 (Aug 25 SPX vs XSP, a 15:00 ~6% day) | No |
| **Foxtrot** | Disk free space; dual-daemon rate-limit memo (tap is a Redis *reader* — preferred: v2 does not double Massive) | No |
| **Juliet** | Keep packets on this plan; no code | — |
| Charlie, Echo, Lima, Hotel, Delta, Mike, Gemba, studio | **Idle** | Do **not** start dash or wiki yet (no artifacts) |

### Mon Sep 7 — Labor Day (market closed) — **WS2 day**

| Agent | Work |
|-------|------|
| **Alpha** | **WS2** `sigma_t.py`. Wire Width Maturity job to it. Prove Aug 25 / 15:00 prints. |
| **Hotel** | Convention: ATM pick, T, whether 4.7% is a feed hole or a pick hole. Block a lie. |
| **India** | One-import invariant. Manifest schema draft. |
| **Kilo** | Characterization tests for `sigma_t`. |
| **Delta** | **WS2 gate** (target 14:00). |
| **Alpha** (afternoon, if PASS) | WS1 P2: k from P1+WS2, b, replay table, flag OFF. |
| **Foxtrot** | launchd plists for v2 (**disabled**), runner skeleton, 90-day disk projection. |
| **Lima** | Start `docs/archive-lab/` index; DL stub for WS2 convention (file the day it is decided). |
| **Echo** | Token pass for `:5055` studies chrome (drawings, not code). |
| **Mike** | One-pager: what WS4 may expose on LAN. |
| **Charlie** | **Idle** (wrong stack). |
| **Gemba / IKI** | **Idle** (parked). |

If WS2 FAIL at 14:00: Alpha stays on IV. **P3 slips.** Juliet tells Coach the same afternoon.

### Tue Sep 8 — first session — **parallel day (if WS2+P2 closed)**

| Agent | Work |
|-------|------|
| **Foxtrot** | Both daemons up before 9:30. Disk watch. Cadence. |
| **Alpha** | Hands off live processes. `compare_capture.py` at **16:30**. WS3: register `width_maturity` + `late_entry_maturity` against WS2 (no nightly yet). |
| **Kilo** | Sit on compare criteria 1–6 with Foxtrot. |
| **Delta** | P3 **intraday** gate after 16:30. Criterion 5 (GTH + next premarket) stays **open until Wed**. |
| **Hotel** | Review replay captions / k justification in `COLLECTOR_RANGE.md` §2. |
| **Lima** | Job pages for the two registered jobs. |
| **Echo** | Studies-page layout against Alpha’s artifact schema. |
| **Charlie, Gemba** | Idle. |

P3 FAIL → **no cutover Wednesday.** Another parallel day. Never same-day fix-and-cut.

### Wed Sep 9

| Agent | Work |
|-------|------|
| **Foxtrot / Delta** | Premarket criterion 5. If P3 PASS **and Coach go**: P4 config swap. If not: idle on cutover. |
| **Alpha** | WS3 runner live: first two jobs nightly. Start `friction_surface` + `band_health` (v1 wings-as-band until v2). |
| **Kilo / Delta** | **WS5** first `VERIFY.md`. |
| **Lima** | WS6 pages in step. Cutover date + schema version into `COLLECTOR_RANGE.md` **only if P4 happened**. |
| **Echo + Alpha** | WS4a implementation starts (artifact viewer). |
| **Charlie** | Idle. |

### Thu Sep 10

| Agent | Work |
|-------|------|
| **Alpha** | `per_leg_residuals`; extras if floor is green (`iv_sanity_watch`). |
| **Foxtrot** | Alert path proof (one intentional job FAIL in staging dir, not on gold). |
| **Charlie** | Still idle. If Coach wants a Labs deep-link to `:5055`, Charlie may add a **link only** — no fork. |
| **Echo** | Review WS4a in browser (LAN). |
| **Mike** | Recheck new routes. |
| **Delta** | Nightly VERIFY. |

### Fri Sep 11 — **WS4a due**

| Agent | Work |
|-------|------|
| **Alpha + Echo** | Studies view on `:5055`: whatever WS3 has produced; date picker; regime label; construction-set median diff. |
| **Delta** | WS4a gate (no raw snap walk). |
| **Lima** | Dash operator note in `docs/archive-lab/`. |
| **Foxtrot** | Dash bounce **only if Coach says** (same plist as snapshot dash). |

### Week of Sep 15 — **WS4b**

| Agent | Work |
|-------|------|
| **Alpha** | Register `chain_day_pack` job (precomputed explorer payload). Then slider + structure pricer. |
| **Echo** | Explorer HIG. |
| **Hotel** | Block a pricer that invents strikes or silent package marks (OT-EF). |
| **Kilo** | <3 s load from artifacts; 2 s slider does not hit gold json. |
| **Delta** | WS4b gate. |

---

## 5. Critical path vs idle

```text
Mon 14:00  WS2 PASS ──── P2 sim Mon night ──── Tue 9:30 P3 ──── Tue 16:30 compare
                                                      │
                                                      └─ FAIL → slip P4; extra parallel day
Wed        first nightly (WM + late_entry) + VERIFY.md
Fri        WS4a
next week  WS4b
```

| Day | Busy | Idle (do not invent work outside Archive Lab) |
|-----|------|-----------------------------------------------|
| Sat–Sun | Alpha, Foxtrot, Kilo, India | Charlie, Echo, Lima, Hotel, Mike, Gemba, studio |
| Mon | Alpha, Hotel, India, Kilo, Delta, Foxtrot, Lima, Echo, Mike | **Charlie**, Gemba, Sierra, studio |
| Tue | Alpha, Foxtrot, Kilo, Delta, Hotel, Lima, Echo | Charlie, Gemba |
| Wed–Fri | Alpha, Foxtrot, Echo, Delta, Kilo, Lima | Charlie (unless link-only), Gemba |

Put idle **analysis** capacity on **WS3 floor then extras**, not on Charlie’s Next.js tree.

---

## 6. Files (expected)

| Path | WS | Agent |
|------|----|-------|
| `docs/ARCHIVE_LAB_PLAN.md` | this | Juliet (this document) |
| `docs/Collector-Capture-Range-Full-Agent-Bench-Plan-v1.0.md` | WS1 parent | landed |
| `Specs/COLLECTOR_RANGE.md` | WS1 | Alpha + Lima |
| `server/market_data/sigma_t.py` | WS2 | Alpha |
| `server/market_data/ssr_band.py` | WS1 P2 | Alpha |
| `server/market_data/ssr_live_capture.py` | WS1 flag OFF | Alpha |
| `server/market_data/chain_ladder.py` / `chain_feed.py` | fetch window if needed | Alpha |
| `Specs/compare_capture.py` | WS1 P3 / WS5 | Alpha; Kilo runs |
| `Specs/archive-lab/jobs/MANIFEST.*` | WS3 | India schema; Alpha jobs |
| `server/market_data/ssr_snapshot_dash.py` | WS4 | Alpha; Echo review |
| `docs/archive-lab/jobs/*.md` | WS6 | Lima |
| `infra/launchd/*archive-lab*` / v2 tap plist | WS7 | Foxtrot |
| `Architecture/00-decision-log.md` | WS2 convention, P4 date | Lima, same day |
| Gold `live_capture` | — | **read-only** until P4 |
| `…/ssr/live_capture_v2` | WS1 P3 | Foxtrot |
| `…/ssr/archive_lab/runs/` | WS3 outputs | Foxtrot disk |

---

## 7. Rules (restated)

1. Every dashboard number: **value, n, regime**. Construction set, not a sample.
2. No study and no explorer page reads raw 2-second snaps on demand.
3. Nothing switched live, deleted, or migrated without a plan entry **and** Coach go.
4. Juliet does not execute. Delta does not patch. Hotel does not write the σ_T module. Charlie does not fork `:5055` into Next.js.
5. IKI Lab stays parked. WS6 is `docs/archive-lab/`.
6. High-vol (VIX 25) remains **projected**.
7. Sep 4 is a partial day — not a full-session row.

---

## 8. Stop

This file is the plan. **No packets fire until Coach has read it and said go.** The collector parent plan’s “no collector edits in the plan commit” still holds for this document: landing `docs/ARCHIVE_LAB_PLAN.md` is not WS1/WS2/WS4 work.
