# FatTail Labs — Archive Availability and Calendar Honesty Spec v0.2

**Status:** **DRAFT** — not BUILD AUTHORITY. Fold of the accepted v0.1 design + **AV-13 200 ms budget**. Bench plan sits beside this file. No product code until Coach stamps plan + W0-G.
**Filename:** `DRAFT-FatTail-Labs-Archive-Availability-and-Calendar-Honesty-Spec-v0_2.md`
**Supersedes:** v0.1 DRAFT
**Type:** Product + technical spec — Time Machine calendar · StudioOne availability
**Parents:** Time Machine Spec **v0.7.4 BUILD AUTHORITY** (ATM-C1 · ATM-C3 · AT-TM-C4) · Time Machine One Source Spec **v0.4 BUILD AUTHORITY** (AT-TM-OS-6) · StudioOne Archive Read API Spec **v0.8** + A1 + A2_1
**Law-ID prefix:** **AV-1…**
**Routes (proposed):** StudioOne `GET /api/availability` · Labs `GET /api/me/options-lab/archive/availability`
**Does not replace:** coverage, index, fetch, marks, cadence, stats.

---

## Scope statement (DL-539)

**Active program:** Options Lab — Time Machine calendar honesty.

**Touches (when stamped):** Time Machine date control (`TmDateField`) on Analyzer, Heatmap, and Surface; a new StudioOne availability read; Labs pass-through of that read; help one-liner that grey means no path and is not clickable.

**Touches outside program:** **NONE.** MiniTwo until asked. Tap write. Coverage hours/gaps/hash. Admin corpus panel (already `/api/stats`).

**Does not:** AT-SOAR-45 · OS-1 late-tab (Monday, live, not faked) · §13a items 2–3 · HOLD Basic / TPO / 1× / Record · dash bounce · MiniTwo · a second coverage endpoint · trade counts, gaps, cadence per day · corpus totals on this call.

---

## 0. Coach intent (verbatim — do not drop)

Spoken, 2026-08-29, v0.1 round:

1. **The calendar has to tell the truth about what it can load.**
2. **Day greying is already in the spec as ATM-C1 and AT-TM-OS-6. The navigation half — previous month and previous year disabled when nothing is behind them — was in my verbal request and never got written down. That is a gap, not a new feature, and the spec records it as one.**
3. **Read the disk before proposing anything. If COUNTS and the nightly STATS cannot answer availability without touching reconstruct_book, say so.**
4. **AV-6 is the law that makes the rest work: no unknown state is ever visible to a member. The current defect is not that greying is wrong, it is that an unresolved day paints as selectable and can be clicked.**
5. **Not anything about content — trade counts, gaps, cadence per day.**
6. **Nothing else fires. AT-SOAR-45 and the OS-1 late-tab are still Monday, live, not faked.**

Spoken, 2026-08-29, v0.2 round:

7. **Design accepted. book_coverage always reconstructing is the root cause and naming it is worth more than the fix.**
8. **1.1 KB today and 50–80 KB in a year means the marker and the 304 are about correctness, not performance — the calendar asks every time and repaints only what moved. That is what I wanted.**
9. **Three calls I want kept and written into the spec as law, not left in the design note: folder existence is not a day (snaps > 0, else STATS count); today uses COUNTS, not last night's STATS, or today never appears until tomorrow; and a partial day stays loadable and dotted, not greyed.**
10. **Additions accepted: universe in, health in, corpus totals out.**
11. **One thing to close first. COUNTS is missing on 08-14 and 08-17, so those two fall back to STATS — and the nightly was only fixed today. Tell me what availability says for those two days if STATS is stale or absent. If a stale nightly can grey a day that is genuinely loadable, that is a hole and I want it named before a plan.**
12. **Then fold the design into the spec as v0.2 and give me the bench plan against it.**
13. **Monday still owns AT-SOAR-45 and OS-1, live.**
14. **One more law, and it is a hard requirement rather than an aspiration. The calendar opens, checks, and paints in well under a fraction of a second. Open to fully-resolved calendar — greyed days grey, disabled arrows disabled, nothing pending. Set the budget at 200 ms and gate on it. At 1.1 KB over the LAN, answered from COUNTS and STATS with no reconstruction, it should be a handful of milliseconds. If it is not, something is reconstructing and I want the gate to catch it rather than a member noticing. Measure it in a live browser walk, not a unit test, and report the actual number. A calendar that resolves in 190 ms passes and I still want to see the figure. The reason this is law: the calendar is slow today because nobody put a number on it, so a minute of unknown was allowed to exist. A budget with a gate behind it is what stops that recurring. Same budget applies to the while-focused poll: a 304 answer must not cost a visible pause.**
15. **Concrete rule on the failure path. One to two seconds, one retry, then fail loudly. If the check does not answer within the timeout, try once more. If that also fails, stop — do not keep retrying. Member sees: "Archive Not Available, Try Later." Plain, short, and it does not blame them or explain internals. No spinner past the second attempt. No half-painted calendar. No day clickable. Two things that matter behind that message. The member sees one thing; the log records which of the three it was — unreachable, not configured, or auth. They do not need the distinction; whoever debugs it does. And failing is not permanent. Reopening the calendar tries again from scratch. Try Later means later, and the member should not have to reload the app to get it. Total worst case before the member is told: about four seconds. That is the honest ceiling and it should be in the spec, not just the budget for the happy path.**

---

## 1. Why this document exists

ATM-C1 and AT-TM-OS-6 already require the calendar to highlight what is retrievable and grey the rest. That law is not what is on the glass.

As-built (`TmDateField.tsx`): a cell whose coverage flag is `undefined` paints selectable (`data-tm-covered="unknown"`). Month `‹` / `›` never disable. Coverage feeds those dots via `book_coverage`, which **always** calls `reconstruct_book`. Opening a month is why empty days stay unknown long enough to click. That is AV-6.

The navigation disable was spoken with the greying and never written. AV-3 records it.

---

## 2. Disk read (2026-08-29, StudioOne gold)

Store: `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`. Fourteen `day=` folders: 2026-08-14, then 08-17…08-29.

COUNTS is **missing** on 08-14 and 08-17. Present from 08-18. Per-day STATS.json exists on **all fourteen** days (written by the 02:00 job, first backfill then kickstart `last_run_at=2026-08-29T12:22:27-04:00`).

| Day | COUNTS | STATS `count` | Snap files on disk |
|-----|--------|---------------|--------------------|
| **08-14** | absent | SPY **129** | Flat `chain/snap-*.json` **129** (A2-2 SPY carve-out) |
| **08-17** | absent | eighteen names × **2** | Nested `chain/<SYM>/snap-*.json` **2** each |

Compact loadable map across today's corpus: **1,100 bytes**. Chain universe is the **eighteen** session-map names. SPCX is not among them (DL-623).

`book_coverage` always reconstructs. That is the calendar stall. Named so the fix is not the discovery.

---

## 2b. 08-14 and 08-17 if STATS is stale or absent

Asked before a plan. Answered from disk, not from hope.

**Genuinely loadable:** 08-14 SPY (129 snaps). 08-17 all eighteen (2 snaps each). Index/fetch of those files is the load. Folder existence is not the proof; the snap files are.

| Condition | What the two-step rule (COUNTS else STATS count) says | Grey a loadable day? |
|-----------|------------------------------------------------------|----------------------|
| **Per-day STATS.json present** (today's disk) | 08-14 `["SPY"]`. 08-17 eighteen names. | **No.** |
| **Store rollup STATS STALE** (`last_run_at` older than 26 h, job quiet again) | Availability reads **per-day** `STATS.json`, not the rollup clock. Those files stay. Same dots. | **No.** A stale nightly does **not** grey 08-14 or 08-17 while the per-day files remain. |
| **Per-day STATS.json absent or unreadable** (the nightly never wrote, or the sidecar was deleted) | Step 2 misses. Step 1 misses (no COUNTS). Two-step says **not loadable**. Snap files are still on disk. | **Yes. Hole.** |

The nightly was a plist that `launchctl print` could not find, then a hand backfill, then a bootstrap. A world where STATS was never written is the world those two days lived in. Two-step-only availability would have greyed gold.

**STATS count = 0 while files exist** is the same class as absent: false grey. Not the 08-14/08-17 case today (129 and 2), but the same hole.

**Not a hole:** today without COUNTS stays undotted until COUNTS exists (AV-10). That is the accepted today rule, not a false grey of a settled day.

**Close (AV-12):** when COUNTS is missing **and** per-day STATS is missing or unreadable, loadable is **filename count** of `snap-*.json` on the book path — nested `chain/<SYM>/`, or flat `chain/snap-*.json` as SPY (08-14 only). That is `snaps > 0` from names. It is **not** `reconstruct_book` (no `t`, no envelope, no cadence). It is **not** folder existence (an empty `day=` stays grey). `list_symbols_on_disk` already uses this glob.

Do **not** use store-level `STATS STALE` to empty `days`. That would create the false grey this section exists to prevent.

---

## 3. Law

| ID | Law |
|----|-----|
| **AV-1** | The calendar tells the truth about **what it can load**. A dotted day can be raised. A grey day cannot. There is no third paint a member can click. |
| **AV-2** | Day greying is **ATM-C1** and **AT-TM-OS-6**, restated. For the symbol in view: loadable → dotted (today included; not grey-because-live). Else grey + NO PATH. |
| **AV-3** | **Navigation gap, now written.** Previous month disabled when no loadable day for the symbol in view exists before that month. Previous year disabled when none exists before that year. Rolling January ‹ is a year change and obeys the same rule. Next month / year never pass today. Spoken with the greying. Not a new feature. |
| **AV-4** | **Never `reconstruct_book`.** Never envelope open. Never coverage-as-calendar. Marker inputs: COUNTS, else per-day STATS `count`, else AV-12 filename count. |
| **AV-5** | Availability answers **whether a day can be loaded**. Not what is in a day. Gaps, cadence, first_at, last_at, hash, rth_complete vs partial **do not travel on this call**. |
| **AV-6** | **No unknown state is ever visible to a member.** Unresolved days do not paint selectable. Before the document is in hand, every non-future cell is grey and disabled — the same paint as NO PATH. After 200 or 304, every in-range date is loadable or not. Omitted dates are not loadable. Unreachable / store missing / auth: named hole, same grey. |
| **AV-7** | Labs **re-serves** this like the other archive reads: session, Bearer to StudioOne, gzip, `must-revalidate`, ETag / 304. The browser never calls StudioOne. |
| **AV-8** | **304 is correctness, not performance.** The body is 1.1 KB today and 50–80 KB in a year. **The calendar asks every time** (open, month change — `must-revalidate`). **It repaints only what moved.** Matching ETag → 304, prior document kept, paint unchanged. New hash → 200, paint the dates/symbols that differ. A 304 is a resolved state, not AV-6 unknown. |
| **AV-9** | **Folder existence is not a day.** A `day=` directory without snaps is not loadable (weekend 08-29 has a folder; it is absent from `days`). Loadable is **`snaps > 0`** from COUNTS, **else** STATS `books[].count > 0`, **else** AV-12. |
| **AV-10** | **Today uses COUNTS, not last night's STATS.** A growing session that is not in COUNTS does **not** inherit yesterday's nightly. If COUNTS has not yet named snaps for today, today is **not dotted** — it does not wait for tomorrow's STATS to appear. (Tomorrow STATS may then mark it; that is a settled day.) |
| **AV-11** | **A partial day stays loadable and dotted, not greyed.** Hours, `rth_complete` vs `partial`, and gap lists are coverage. Availability does not grey a short session. 08-17 (two snaps) is dotted. |
| **AV-12** | **COUNTS-missing + STATS-absent is not NO PATH.** It is the 08-14 / 08-17 hole: two-step-only would grey a loadable book. Fallback is filename count of `snap-*.json` (AV-4). Store `STATS STALE` must not empty `days`. |
| **AV-13** | **200 ms, gated.** Open → fully-resolved calendar in **≤ 200 ms**: every in-month non-future cell is dotted or grey (never pending), previous/next arrows are enabled or disabled as AV-3 requires, nothing still `unknown`. Measured in a **live browser walk**, not a unit test. The number is reported even on a pass (190 ms passes; the figure is still the evidence). Over 200 ms **fails** — something is reconstructing. **The same 200 ms applies to a while-focused 304:** revalidate must not cost a visible pause or a flash of unknown. This budget exists because nobody put a number on the calendar, so a minute of unknown was allowed to exist. |
| **AV-14** | **Failure path: 2 s, one retry, then loud. Worst case ~4 s.** Happy path is AV-13. If the check does not **answer** within **2 seconds** (end-to-end from the tab, Labs included — this route must not inherit coverage's 8 s wait), **try once**. If that also fails, **stop**. Do not keep retrying. Do not spin past the second attempt. Do not half-paint. No day is clickable. The member sees one sentence, exact copy: **"Archive Not Available, Try Later."** It does not blame them and it does not explain internals. Behind it, the log records **one of three**: `unreachable` · `not_configured` · `auth`. The member does not see that distinction. **Failing is not permanent.** Closing and opening the calendar starts from scratch — Try Later means later; the member does not reload the app. The honest ceiling before they are told is **about four seconds**, and that ceiling is law, not a note beside the 200 ms budget. |

Universe and health travel on this call (accepted). Corpus totals do not.

---

## 4. Response shape

StudioOne `GET /api/availability`. No required query. Whole corpus, all tap chain symbols, plus universe and health.

```json
{
  "api_version": 1,
  "from": "2026-08-14",
  "to": "2026-08-29",
  "days": {
    "2026-08-14": ["SPY"],
    "2026-08-17": ["AAPL", "AMZN", "GLD", "GOOGL", "IWM", "META", "MSFT", "NVDA", "QQQ", "SLV", "SPX", "SPY", "TLT", "TSLA", "UNG", "USO", "XLF", "XSP"]
  },
  "universe": {
    "chain": ["AAPL", "AMZN", "GLD", "GOOGL", "IWM", "META", "MSFT", "NVDA", "QQQ", "SLV", "SPX", "SPY", "TLT", "TSLA", "UNG", "USO", "XLF", "XSP"],
    "marks": ["VIX", "VIX1D"],
    "source": "session-map"
  },
  "health": {
    "store_missing": false,
    "tap_running": true,
    "api_version": 1
  },
  "hash": "<etag material>",
  "hole": null
}
```

`days` lists **only loadable** dates. A folder with zero snaps is omitted. Absence = not loadable (AV-6, AV-9).

`from` / `to`: earliest loadable date through today (today included in the span even if not dotted). Navigation uses `from` for the symbol in view.

`hole`: `null` | `STORE MISSING`. Not `STATS STALE` as a reason to drop settled dots (AV-12). Unmounted → `STORE MISSING`, `days: {}`, calendar greys.

No `books[]`, `count`, `gaps`, `cadence_s`, `bytes_total`.

---

## 5. How the marker is computed

For each `day=` folder, for each chain symbol S in `universe.chain`:

| Priority | When | Loadable iff |
|----------|------|----------------|
| 1 | `COUNTS.json` present | `symbols[S].snaps > 0` |
| 2 | else per-day `STATS.json` readable | some `books[]` with `symbol=S` and `count > 0` |
| 3 | else COUNTS missing and STATS missing/unreadable (AV-12) | filename count of `snap-*.json` on that book's path `> 0` (flat files on `chain/` count as SPY) |
| 4 | else | no |

**Today:** step 1 only (AV-10). Do not use last night's STATS for a growing day. Do not use step 3 on today to invent a session the tap has not counted — if COUNTS is missing today, today is not dotted.

Emit S under `days[D]` iff loadable. Omit D if no symbol is loadable.

**Not a marker:** folder exists; CHECKLIST.CHAIN; coverage `status`; `live: true`; store STATS STALE.

Partial (`rth_complete` false, short span, 08-17 × 2) still emits if count > 0 (AV-11).

---

## 6. Where it is served, and the 304 path

| Hop | Path | Auth | Notes |
|-----|------|------|--------|
| StudioOne | `GET /api/availability` | Bearer, same as coverage | COUNTS / STATS JSON / filename count. **Not** in the reconstruct pool. Same class as health: must not wait behind a 36k-file book. |
| Labs | `GET /api/me/options-lab/archive/availability` | Session | Pass-through. Gzip. `must-revalidate`. ETag from `hash`. 401 named (`auth`). 501 if not configured (`not_configured`). Unreachable → named hole (`unreachable`), empty `days`. **Per-attempt timeout 2 s** so AV-14's retry fits in four. Do not use coverage's 8 s wait on this route. |
| Browser | Labs URL, credentials same-origin | Cookie | **Asks every time** the calendar opens or the month changes (AV-8). Symbol change does not re-fetch — local filter. |

**304:** `If-None-Match` matches `hash` → 304, empty body, same ETag. Client keeps the prior document and **does not repaint**. 200 with a new hash: apply the diff (dates/symbols that appeared or disappeared). That is the correctness 304 exists for, not a size win. While the calendar is open, a focused revalidate is the same walk: **AV-13 200 ms**, no flash of unknown, no disabled-then-enabled flicker on the arrows.

Do **not** mount on `/api/coverage`. Do **not** reuse leftover `/api/available`.

---

## 7. Answers

**All tap chain symbols in one body.** 1,100 bytes today. Switching ticker is local. Navigation `from` is for the symbol in view (08-14 is SPY-only; SPX previous-month still empty of 08-14).

**Before any marker:** grey, disabled, same as NO PATH. Date field may still show today (TMI-64). `‹` `›` disabled until `from` is known.

**Size:** 1.1 KB today; ~50–80 KB JSON for a year of session days. 304 is correctness (AV-8).

**Labs re-serves it.** AV-7.

---

## 8. Additions (accepted)

**Universe — in.** `universe.chain` is the eighteen session-map names. `universe.marks` is VIX / VIX1D. SPCX is not in `universe.chain`. A tap name with zero dates in `days` is still a tap name (stopped or not_today), not a stranger.

**Health — in.** `store_missing`, `tap_running`, `api_version`. One round trip on calendar open. Unmount + empty `days` greys; it does not serve last dotted month.

**Corpus totals — out.** Stay on nightly STATS and `/api/admin/options-lab/archive/stats`.

---

## 9. Member experience (when built)

- Dot = loadable for the symbol in view. Dim = no path. Dim is not clickable.
- `‹` disabled when the previous month (and, at January, the previous year) has no loadable day for this symbol. `›` disabled at the month that contains today.
- No `unknown` title. No third opacity.
- Same control on Analyzer, Heatmap, Surface.
- If AV-14 fires: the grid is not shown half-done. The one sentence is **"Archive Not Available, Try Later."** No spinner after the second attempt. Reopen retries.

Echo owns labels at BUILD. Copy: grey is no archive, not "loading."

---

## 10. Ideas inventory

| Idea | Disposition |
|------|-------------|
| Calendar greying (ATM-C1, OS-6) | **IN-SCOPE** |
| Prev month / prev year disable | **IN-SCOPE** · AV-3 |
| Folder existence is not a day | **IN-SCOPE** · **AV-9 law** |
| Today uses COUNTS only | **IN-SCOPE** · **AV-10 law** |
| Partial stays dotted | **IN-SCOPE** · **AV-11 law** |
| COUNTS-missing + STATS-absent hole | **IN-SCOPE** · **AV-12 named and closed** with filename count |
| 304 asks every time, repaint what moved | **IN-SCOPE** · **AV-8 law** |
| Open-to-resolved ≤ 200 ms, gated, live walk | **IN-SCOPE** · **AV-13 law** |
| Failure: 2 s, one retry, ~4 s ceiling, one member sentence | **IN-SCOPE** · **AV-14 law** |
| Universe + health on the call | **IN-SCOPE** |
| Corpus totals on the call | **OUT** |
| Content (gaps, cadence, trade counts) | **OUT** |
| Compact nightly AVAIL sidecar | **FLAGGED** — not required; COUNTS + AV-12 suffice |
| Bitset encoding | **DEFERRED** |
| ATM-C1 hours on the cell | **DEFERRED** — coverage, not loadability |
| Leftover `/api/available` | **Do not follow** |
| AT-SOAR-45, OS-1 | **Not this spec** — Monday |

---

## 11. Acceptance (when BUILD AUTHORITY)

| ID | Criterion |
|----|-----------|
| **AT-AV-1** | Calendar never shows `data-tm-covered="unknown"`. Grey is not clickable. |
| **AT-AV-2** | COUNTS `snaps > 0` → dotted. 08-14 SPY dotted, SPX grey. 08-29 all grey. Today dotted iff COUNTS count > 0, never grey-because-live, never from last night's STATS. |
| **AT-AV-3** | August 2026: previous month disabled. SPX: 08-14 grey. |
| **AT-AV-4** | Handler does not call `reconstruct_book`. |
| **AT-AV-5** | No `gaps`, `cadence_s`, `delta_*`, trade counts on the body. |
| **AT-AV-6** | Before first 200/304-held document, no enabled non-future cell. |
| **AT-AV-7** | Labs session route; StudioOne no-bearer 401; 304 on matching ETag. Calendar revalidates on open. |
| **AT-AV-8** | SPCX not in `universe.chain`. Tap names with zero dates still in `universe.chain`. |
| **AT-AV-9** | 08-14 / 08-17 dotted from STATS (or AV-12 if STATS stripped in a test). A `day=` folder with zero snap files is not in `days`. |
| **AT-AV-10** | Fixture: today with no COUNTS, STATS from yesterday claiming snaps → today **not** dotted. |
| **AT-AV-11** | 08-17 (two snaps, partial) dotted, not grey. |
| **AT-AV-12** | Fixture: COUNTS and STATS removed, snap files remain → still dotted via filename count. Store STATS STALE does not empty `days`. |
| **AT-AV-13** | **Live browser walk**, not a unit test. Clock starts when the member opens the calendar. Clock stops when every in-month non-future cell is `data-tm-covered=true\|false` (none `unknown`), and month arrows are in their final enabled/disabled state. Report **milliseconds**. **≤ 200 ms PASS** (still print the figure). **> 200 ms FAIL.** Repeat for a focused 304: no visible pause, same budget, same reported number. |
| **AT-AV-14** | Force a non-answer (StudioOne down, or 2 s timeout). First attempt dies at ≤ 2 s. Exactly **one** retry. Then the member sees **"Archive Not Available, Try Later."** — not a spinner, not a half-grid, no cell clickable. Log line names `unreachable` or `not_configured` or `auth`. Close and reopen: a new first attempt, no reload of the app. Worst case from open to that sentence **≤ 4 s**. A third request without reopen is a **fail**. |

HOLD from parent TM: Basic / TPO / 1× / Record.

Fail-closed: `reconstruct_book` on this path; unknown paint; clickable unresolved day; coverage-as-calendar; greying a partial; today dotted from last night's STATS; emptying `days` because the nightly is STALE; open-to-resolved **> 200 ms** or a 304 that flashes unknown; spinning or retrying past the second attempt; a half-painted grid after failure; blaming the member; making them reload the app to try later; faking AT-SOAR-45 or OS-1; MiniTwo; dash bounce; §13a items 2–3.

---

## 12. As-built (honesty — not this spec's law)

| As-built | Honesty |
|----------|---------|
| `TmDateField` `unknown` + clickable | AV-6 defect |
| Month `‹` `›` never disabled | AV-3 gap |
| `tmNeedMonth` → coverage `from`/`to` | Reconstruct; stall |
| `book_coverage` → `reconstruct_book` | Root cause, even when COUNTS exists |
| Leftover `/api/available` | Same reconstruct; do not reuse |
| Dash `Cache-Control: no-store` | Leftover. Labs availability is `must-revalidate` |
| COUNTS missing 08-14, 08-17 | STATS present today; AV-12 if they are not |
| Store `bytes_total` = marks tapes | Admin leftover; not this call |
| **AV-13 as-built clock 2026-08-29** | Open calendar (SPX Analyzer, this tree): chrome **7 ms**. Coverage `from=2026-08-01&to=2026-08-31` HTTP 200 twice (~9 s apart). At **120 s**, **29/29** in-month cells still `unknown`. Did not resolve. Evidence `agents/p-archive-availability/evidence/av-13-as-built-open.json`. This is why 200 ms is law. |

---

## 13. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.2 DRAFT** | 2026-08-29 | Design folded. AV-9/10/11 law. AV-12 hole named and closed (filename count). AV-8: ask every time, repaint what moved. **AV-13: 200 ms gated, live browser walk, same budget on focused 304.** **AV-14: 2 s, one retry, ~4 s ceiling; member copy "Archive Not Available, Try Later."; log unreachable / not_configured / auth; reopen retries.** Universe + health in; corpus totals out. Plan v1.0 sits beside. Not BUILD. |
| **v0.1 DRAFT** | 2026-08-29 | SUPERSEDED. Disk read; AV-6; navigation gap; additions evaluated. |

**Next:** Coach stamps this file and the bench plan, or returns. No product code before W0-0 + W0-G. Monday still owns AT-SOAR-45 and OS-1.
