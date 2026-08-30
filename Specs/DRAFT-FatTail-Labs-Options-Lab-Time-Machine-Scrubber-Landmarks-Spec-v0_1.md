# FatTail Labs — Time Machine Scrubber Landmarks Spec v0.1

**Status:** **DRAFT** — not BUILD AUTHORITY. **A usability law directed to the scrubber window.** Folded onto parent Time Machine Spec **v0.7.4** §6.2 as **TMI-97 DRAFT**. No product code until Coach stamps a plan + W0-G.
**Filename:** `DRAFT-FatTail-Labs-Options-Lab-Time-Machine-Scrubber-Landmarks-Spec-v0_1.md`
**Type:** Product + technical spec — Time Machine mini day window (ATM-H1…H6 · the HUD that already has the line, the playhead, and the clock)
**Parents:** Time Machine Spec **v0.7.4 BUILD AUTHORITY** (§6.2 mini window · ATM-H2 “where in the day we are” · TMI-25 watermark · TMI-89 hold line) · Time Machine One Source Spec **v0.4 BUILD AUTHORITY** (TMI-89; one hold; clock stays)
**Law-ID prefix:** **TMI-97** (and AT-TM-SL-*). Existing ATM-* / TMI-* IDs are not renumbered.
**Routes:** `/app/options-lab/analyzer` · `/app/options-lab/heatmap` · `/app/options-lab/surface` — the same HUD (`AnalyzerDayReplayHud`) on all three hosts.

---

## Scope statement (DL-539)

**Active program:** Options Lab — Time Machine **scrubber window** (the mini day chart in the upper-right). This law is **usability of that window**: orientation in the session so a member can locate themselves in the day, not only in the tick array.

**Touches (when stamped):** `AnalyzerDayReplayHud` only — the mini chart, its time axis, the playhead, the HUD clock (the clock **stays**). Marks painted **in that window**.

**Not this program:** Calendar dots, greys, COUNTS, STATS, coverage HTTP, “is this day loadable.” That is availability (`AV-*`), a different surface and a different spec. Do not fold this law there. MiniTwo, dash bounce, HOLD Basic / TPO / 1× / Record, §13a items 2–3, AT-SOAR-45, OS-1.

**Does not:** replace the HUD clock with the timeline · fold the clock into the landmarks or the landmarks into the clock · P&L colour on landmarks · empty pre-market / extended regions that were never captured · browser-local midnight or 16:00 assumed as end of day · TM glow · calendar chrome.

---

## 0. Coach intent (verbatim — do not drop)

Spoken, 2026-08-29:

1. **One more requirement, on the mini chart window that shows the downloaded ticks.**
2. **It needs landmarks. Right now it is a line with a playhead and nothing to locate yourself against — you can see where you are in the data but not where you are in the day.**
3. **Show relative markers for start of day, midday, and end of day, plus a small area for pre-market and one for extended, distinguished from the regular session.**
4. **Four things that decide whether this is honest.**
5. **Boundaries come from OPF, never the browser clock. Same rule as the trading date. A member in another timezone sees the same session.**
6. **The regions reflect what the archive actually holds. If the tap started at 11:00, do not draw an empty pre-market region that reads as missing data — a region that was never captured is not the same as a region with a gap in it. The hold line already states the real first print; the window should agree with it.**
7. **Landmarks are orientation, not chrome. They must not compete with the tick line or the playhead for attention, and they must not be drawn in a P&L colour — same rule as the watermark.**
8. **A short session has different boundaries. An early close is not the same end of day, and the markers should come from that session's real bounds rather than an assumed 16:00.**
9. **Live browser walk on a dense day and on a partial day. I want to see both.**
10. **Fold it into the spec as its own law before the plan.**
11. **To be clear: the clock stays. The landmarks are position, the clock is precision, and scrubbing needs both. Do not replace the HUD clock with the timeline or fold one into the other.**
12. **This is not an availability law, this is a usability law directed to the scrubber window.**

---

## 1. Why this document exists

**This is not an availability law. This is a usability law directed to the scrubber window.**

ATM-H2 already says that window shows **where in the day we are**. As-built it does not. The member has a line and a playhead: they can see where they are in the **data**. They cannot see where they are in the **day**. Landmarks are the missing orientation.

`AnalyzerDayReplayHud` paints a spot line and a playhead. The x-axis is **sample index** (`i / (n-1)`), not wall time. The HUD clock (`formatReplayClock`) is precision and **stays**. There are no session marks.

TMI-89 already names the real first print on the hold line. The **window** must agree with that line, because the window is what the member scrubs. An empty pre-market drawn because a session clock says 04:00, when this hold started at 11:00, is the window lying about the day — a usability failure of the scrubber, not a calendar-dot failure.

Calendar load (dots, greys, COUNTS) is a different program. This file does not govern it.

---

## 2. As-built of this window (not this spec’s law yet)

| As-built | Honesty |
|----------|---------|
| `AnalyzerDayReplayHud` SVG path + white playhead line | Line + playhead. No session marks. |
| x = sample index, not `t_ms` | Equal spacing of ticks. Midday is not midday if the tap started at 11:00. |
| HUD clock at top-right of the window | **Stays.** Precision. Do not remove or replace. |
| Hold line `The archive holds from {clock} ET.` | TMI-89. Window left edge must agree. |
| Watermark `text-white/[0.09]`, not a P&L colour | TMI-25. Landmarks follow this, not sky/green/red. |
| `timeOrthoSession.ts` 09:30–16:00 and 04:00–20:00 hardcoded | Browser/session helper, **not** OPF. Must not become the landmark SoR. |
| Early close | Parent TM already: short sessions have fewer than 390, named not filled. End-of-day is that session's last-trade bound, not assumed 16:00. Index last trade 16:15 vs equity 16:00 already named. |

---

## 3. Law — TMI-97 SCRUBBER LANDMARKS (usability of this window)

**TMI-97.** Directed at the **scrubber window** (ATM-H1…H6). While a playhead is up, that window shows **orientation in the session** as well as the tick line and playhead — start of day, midday, end of day, and small pre-market / extended regions distinguished from regular hours. It is how ATM-H2’s “where in the day we are” becomes true.

This law does not govern whether a day is loadable. It governs what the window paints **after** a hold is up.

**The clock stays.** Landmarks are **position**. The HUD clock is **precision**. Scrubbing needs both. Do not replace the HUD clock with the timeline. Do not fold one into the other. Do not drop `formatReplayClock`.

### What is drawn

Relative markers, on a **time axis** (`t_ms`, America/New_York), not sample index:

| Mark | Meaning |
|------|---------|
| **Start of day** | OPF session open for that product and NY date |
| **Midday** | Midpoint of that session's regular hours (not the midpoint of the tick array) |
| **End of day** | OPF session last-trade / early close for that product and NY date — **not** an assumed 16:00 |
| **Pre-market area** | Small band, distinguished from regular session |
| **Extended area** | Small band, distinguished from regular session |

### Four honesty tests (all binding)

**SL-1 · OPF bounds, never the browser clock.** Same rule as the trading date (TMI-76 / OPF). A member in another timezone sees the **same** session. Local midnight, `Date#getHours`, and hardcoded 16:00 are fails.

**SL-2 · The window shows the session this hold actually contains.** If the tap started at 11:00, **do not** draw an empty pre-market that reads as missing data. A region that was **never captured** is not a region with a **gap**. The hold line already states the real first print; **this window must agree with it** (TMI-89). A landmark whose OPF instant is **before the first held print** or **after the last** is omitted, not drawn in empty space outside the scrubber domain. Pre-market / extended bands are drawn only when this hold contains at least one print in that OPF window.

**SL-3 · Orientation, not chrome.** Landmarks must not compete with the tick line or the playhead. They are not drawn in a P&L colour (same rule as the watermark: not green, not red, not the theoretical/expiration curve palette). Reduced contrast, non-interactive, behind the line and playhead.

**SL-4 · Short session.** An early close is not 16:00. End-of-day and midday come from **that session's real OPF bounds**. Do not pad. Do not invent ticks. Parent TM: extra index minutes append when they exist; a short session has fewer prints, named not filled.

### Axis

The **scrubber window’s** x-domain is this hold’s `[first_print, last_print]` in `t_ms`. Mapping sample index across the width is a fail under SL-2: it makes 11:00 look like the open, which is the usability failure ATM-H2 exists to prevent. Gaps **inside** the held span stay gaps (empty x, no interpolated ticks). Time **outside** this hold is not on the axis — it is not part of the window the member is scrubbing.

---

## 4. Proof days

| Day | Why |
|-----|-----|
| **2026-08-27 SPX** | Dense. Hold line from the real first print (overnight/GTH for SPX). Pre-market / extended may be present **if** the hold has prints there. Live walk required. |
| **2026-08-17** | Partial (two snaps). No empty pre-market. Landmarks that fall outside the two prints are omitted. Live walk required. |

A fixture that draws 04:00–20:00 on 08-17 fails SL-2. A fixture that puts end-of-day at 16:00 on an early-close date fails SL-4.

---

## 5. Acceptance (when BUILD)

| ID | Criterion |
|----|-----------|
| **AT-TM-SL-1** | HUD clock still shows `formatReplayClock` at the playhead. Landmarks do not replace it. |
| **AT-TM-SL-2** | x-axis is `t_ms`, not sample index. Midday mark sits at OPF midday, not at 50% of tick count. |
| **AT-TM-SL-3** | Window left edge = first held print. Hold line and window agree. |
| **AT-TM-SL-4** | No pre-market / extended band when the hold has no print in that OPF window. |
| **AT-TM-SL-5** | Landmarks are not a P&L colour; playhead and tick line remain the loud paint. |
| **AT-TM-SL-6** | **Live browser walk, dense day (08-27 SPX):** landmarks visible, clock still there, screenshot. |
| **AT-TM-SL-7** | **Live browser walk, partial day (08-17):** no empty pre-market, clock still there, screenshot. |
| **AT-TM-SL-8** | A member TZ other than America/New_York sees the same session bounds (OPF / NY), not local 16:00. |

Fail-closed: replacing the HUD clock; folding clock into the timeline; empty never-captured region drawn as a hole in **this window**; sample-index x-axis; P&L colour landmarks; assumed 16:00 on a short session; treating this as calendar/availability work; AT-SOAR-45; OS-1; MiniTwo.

---

## 6. Ideas inventory

| Idea | Disposition |
|------|-------------|
| Start / midday / end markers | **IN-SCOPE** |
| Pre-market + extended areas, distinguished | **IN-SCOPE** — only if held |
| OPF bounds, not browser clock | **IN-SCOPE** · SL-1 |
| Agree with hold line | **IN-SCOPE** · SL-2 · TMI-89 |
| Orientation not chrome; not P&L colour | **IN-SCOPE** · SL-3 · TMI-25 |
| Early close = real end of day | **IN-SCOPE** · SL-4 |
| Clock stays | **IN-SCOPE** |
| Time axis not sample index | **IN-SCOPE** — required for honesty |
| Calendar / AV-* (dots, greys, is-this-day-loadable) | **OUT** — different law, different surface |
| Numeric labels on every landmark | **DEFERRED** — Echo at BUILD; clock is precision |
| GTH overnight as a third band | **FLAGGED** — SPX collects GTH; Coach named pre-market and extended. GTH prints sit in the held span; do not invent a third named band unless Coach adds it. |

---

## 7. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1 DRAFT** | 2026-08-29 | Coach: **usability law directed to the scrubber window.** Landmarks. Four tests. Clock stays. Folded onto TM spec §6.2 as TMI-97 DRAFT. Not BUILD. |

**Next:** Coach stamp or return. Then a bench plan against **this** file (and the TMI-97 row in parent §6.2). Availability stays on `AV-W0` and is not this packet. Monday still owns AT-SOAR-45 and OS-1.
