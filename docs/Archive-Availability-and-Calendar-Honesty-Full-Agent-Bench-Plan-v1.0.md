# Archive Availability and Calendar Honesty — Full Agent Bench Plan v1.0

**Date:** 2026-08-29  
**Plan revision:** **v1.0**  
**Canonical filename:** `docs/Archive-Availability-and-Calendar-Honesty-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**W0 artifact:** [`agents/go/AV-W0.md`](../agents/go/AV-W0.md)  
**Board:** [`agents/p-archive-availability/`](../agents/p-archive-availability/)  
**Governance:** `agents/bench/doctrine.md` · `AGENTS.md` · spec-create-review-workflow

**Law Delta reads:**

| Doc | Role |
|-----|------|
| Spec **v0.2 DRAFT** | [`Specs/DRAFT-FatTail-Labs-Archive-Availability-and-Calendar-Honesty-Spec-v0_2.md`](../Specs/DRAFT-FatTail-Labs-Archive-Availability-and-Calendar-Honesty-Spec-v0_2.md) — not BUILD until Coach stamps this plan + W0-G |
| Parent TM **v0.7.4** | ATM-C1 · ATM-C3 · AT-TM-C4 greying already law |
| Parent One Source **v0.4** | AT-TM-OS-6 |
| Parent SO-AR **v0.8 + A2_1** | COUNTS · STATS · health · Labs proxy. This GO does **not** rewrite coverage, index, or fetch |

Juliet does not invent WHAT. AV-6 (no unknown) and AV-12 (08-14/08-17 hole) are Coach.  
Delta: **PASS / FAIL / BLOCKED**, never waived.

**No product code until Coach stamps this plan on `AV-W0.md` and W0-G PASS.**

---

## 0. Mission

The calendar tells the truth about what it can load. Dots come from COUNTS, else STATS count, else filename count — never `reconstruct_book`. Unresolved days are not clickable. Previous month/year disable when nothing is behind them. 304 is correctness: ask every time, repaint only what moved. **Open to fully-resolved in ≤ 200 ms**, measured in a live browser walk and gated. A focused 304 has the same budget and must not pause the paint.

```text
W0     India · Echo · Hotel · Tango → W0-G
W1     StudioOne GET /api/availability (AV-4…12)
W2     Labs pass-through + 304
W3     Calendar chrome: AV-6 paint, AV-3 nav, local symbol filter
W4     Lima help + parent one-liners
W5     Kilo AT-AV-1…12
W-G    Delta
```

TMOS W-G stays closed. Coverage stays coverage. Admin corpus stays stats.

### Out of this GO (NX)

| ID | Out |
|----|-----|
| **NX-45** | AT-SOAR-45. Monday, live, not faked. |
| **NX-OS1** | OS-1 late-tab. Monday, live, not faked. |
| **NX-COV** | Rewriting coverage / index / fetch. Leftover `/api/available`. |
| **NX-RECON** | `reconstruct_book` on this path. |
| **NX-CONTENT** | Gaps, cadence, trade counts on the availability body. |
| **NX-CORPUS** | Days/bytes/growth on this call. |
| **NX-BOUNCE** | Dash bounce. Tap/feed restart. MiniTwo. |
| **NX-13A** | §13a items 2–3. |
| **NX-HOLD** | Basic / TPO / 1× / Record. |

---

## 1. Locked (FP)

| ID | Decision |
|----|----------|
| **FP1** | Calendar tells the truth about load (AV-1). |
| **FP2** | Greying is ATM-C1 / OS-6 (AV-2). |
| **FP3** | Prev month/year disable is the spoken gap, now law (AV-3). |
| **FP4** | Never reconstruct_book (AV-4). |
| **FP5** | Loadable, not content (AV-5). |
| **FP6** | No unknown paint (AV-6). |
| **FP7** | Labs re-serves (AV-7). |
| **FP8** | Ask every time; 304 repaint-what-moved (AV-8). Body ~1.1 KB today. |
| **FP9** | Folder existence is not a day. `snaps > 0`, else STATS count (AV-9). |
| **FP10** | Today uses COUNTS, not last night's STATS (AV-10). |
| **FP11** | Partial stays dotted (AV-11). |
| **FP12** | COUNTS-missing + STATS-absent is not NO PATH. Filename count of `snap-*.json` (AV-12). Store STATS STALE does not empty `days`. |
| **FP13** | All tap chain symbols, one body. Symbol-in-view is a local filter. |
| **FP14** | Universe in (eighteen + marks; SPCX out). Health in. Corpus totals out. |
| **FP15** | 08-14 SPY dotted, SPX grey. 08-17 eighteen dotted. 08-29 grey. |
| **FP16** | **200 ms, gated (AV-13).** Open → fully-resolved calendar in ≤ 200 ms. Live browser walk reports the number; 190 ms still prints 190. Over 200 fails. Focused 304: same budget, no visible pause. |
| **FP17** | **Failure path (AV-14).** 2 s timeout, **one** retry, then stop. Worst case **~4 s**. Member copy exact: `Archive Not Available, Try Later.` Log: `unreachable` \| `not_configured` \| `auth`. No spinner past the second attempt. No half-paint. No clickable day. Reopen retries from scratch; no app reload. Labs must not wait 8 s on this route. |

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-0** | Coach stamps **this plan v1.0** and spec v0.2 (BUILD or return) | W0-1 |
| **W0-2 India** | AV-4…12 vs coverage; no reconstruct; AV-12 close; Labs seam | W0-G |
| **W0-3 Echo** | No unknown paint; dim not clickable; ‹ › disable; AV-14 copy exact; no Instant Replay | W0-G |
| **W0-4 Hotel** | Grey is no archive, not a fake day; 08-14 is SPY-only truth | W0-G |
| **W0-5 Tango** | Unresolved is not a choice; login is not a bound (today COUNTS) | W0-G |
| **W0-G** | Token stamped; four reviews; **no product diff** | W1 |
| **W1-G** | StudioOne 200; 08-14/08-17 from STATS; no `reconstruct_book`; AV-10/11/12 tests | W2 |
| **W2-G** | Labs session route; 401 no-bearer on StudioOne; 304 on matching ETag | W3 |
| **W3-G** | Calendar: no `unknown`; ‹ disabled in Aug 2026; 08-14 SPX grey; today not grey-because-live. **Live walk reports open-to-resolved ms. > 200 ms FAIL.** AV-14: one retry then the exact sentence; reopen retries. | W4 |
| **W4-G** | Help: grey = no path, not clickable; partial is a day | W5 |
| **W5-G** | AT-AV-1…14. Live browser ms printed. AV-14 fail path walked. 45 and OS-1 not scored | W-G |
| **W-G** | Fail-closed list. No unknown. No reconstruct. | ship |

---

## 3. DAG

```text
W0-0 Coach stamps plan v1.0 + spec v0.2
  → W0-1 Lima sha1 + DL
  → W0-2 India ∥ W0-3 Echo ∥ W0-4 Hotel ∥ W0-5 Tango
  → W0-G
       → W1 StudioOne availability → W1-G
            → W2 Labs proxy + 304 → W2-G
                 → W3 calendar chrome → W3-G
                      → W4 Lima help → W4-G
                           → W5 Kilo ATs → W5-G
                                → W-G
```

No dash bounce. W1 may add `/api/availability` to the dash path set; that is a **new route**, not a reconstruct change. Kickstart of the dash is **Coach word** (same as A2 W5-GO). Until bounced, Labs may 502/404 the new path — W2-G does not fake a 200.

---

## 4. Packets

Seeds under `agents/p-archive-availability/seeds/` when W0-0 lands.

### W0 — review (no code)

| Seed | Agent | Done when |
|------|-------|-----------|
| `W0-0` | Coach | `AV-W0.md` stamp of plan v1.0 + spec v0.2 |
| `W0-1` | Lima | sha1; DL |
| `W0-2` | India | AV-9…12 vs SO-AR coverage; filename count ≠ reconstruct; module seam |
| `W0-3` | Echo | AV-6 paint; AV-3 nav; no third opacity |
| `W0-4` | Hotel | 08-14 SPY-only; grey is absence not a synthetic session |
| `W0-5` | Tango | Unresolved is not a choice |
| `W0-G` | Delta | Ternary. No product diff |

### W1 — StudioOne read

`ssr_archive_read.py` (new function, **not** `book_coverage`). COUNTS → STATS count → filename count. Tests: 08-14 SPY; 08-17 eighteen; 08-29 none; today without COUNTS not dotted from yesterday STATS; COUNTS+STATS stripped still dotted via filenames; no `reconstruct_book` in the call graph.

Dash: register `/api/availability`. **No bounce until Coach.**

### W2 — Labs proxy

`routes/ssr_archive.py` session GET. Bearer. Gzip. ETag 304. Universe + health on the body. Unreachable named, empty `days`.

### W3 — chrome

`TmDateField` + `tmNeedMonth` consume availability, not coverage `from`/`to`. Kill `unknown`. Disable ‹ ›. Local filter by view symbol. Analyzer / Heatmap / Surface share the host.

### W4 — Lima help

Grey = no path, not clickable. Partial is a day. No Instant Replay.

### W5 — Kilo

AT-AV-1…12. Do **not** score AT-SOAR-45 or OS-1.

### W-G — Delta

Fail-closed: reconstruct_book; unknown paint; clickable unresolved; today from last night's STATS; greying 08-17; emptying `days` on STATS STALE; open-to-resolved **> 200 ms** or a 304 that flashes unknown; retrying past once; spinner after the second attempt; half-painted grid; requiring an app reload to try later; faking 45 or OS-1; MiniTwo; dash bounce without word.

---

## 5. Acceptance (this GO)

Spec §11 AT-AV-1…**14**. That table is the gate list. **AT-AV-13 is a live browser number, not a unit test.** AT-AV-14 is the loud fail. C6 / TPO / 1× / Record remain HOLD (parent).

---

## 6. Relationship to other boards

| Board | Relationship |
|-------|----------------|
| `p-options-lab-tm-os` | **Closed** W-G. This GO repairs the calendar leftover named there. Does not reopen TMOS. |
| `p-studioone-archive-read` | **Closed** A2. Consume COUNTS/STATS/health. Do not rewrite marks. |
| Coverage | Unchanged. Hours and gaps stay there. |

---

## 7. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.0** | 2026-08-29 | Against spec v0.2 DRAFT. AV-12 hole closed in law. **AV-13 200 ms gated, live walk.** No product code until W0-0 + W0-G. |

**Next:** Coach W0-0 stamp or return. Monday still owns AT-SOAR-45 and OS-1.
