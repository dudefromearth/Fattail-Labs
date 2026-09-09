# GSC2.5-0 — Charlie · segments module + sessionView fields

**Project:** p-sessions  
**Callsign:** Charlie  
**Depends:** Coach stamp of addendum §12 (DL-686) · GSC2-G PASS  
**Feeds:** GSC2.5-1 · GSC2.5-G  
**Invariants:** L9 purity · L11 SoR · closed `timeAxis.ts` / `exchanges.ts` · no React / `next/*`

**Do not fire before the addendum is stamped.** Defaults in §12.7 if Coach was silent.

## Files in scope

| File | Touch |
|------|--------|
| `web/lib/sessions/segments.ts` | **Create.** Wall-clock definitions. Truncation. No React. |
| `web/lib/sessions/sessionView.ts` | **Extend** with `segments` and `currentSegment` only. Consume `segments.ts`. Do not re-derive holidays here beyond existing `statusFor`. |
| `web/lib/sessions/segments.test.ts` | Create if Kilo does not own the file in GSC2.5-1 — otherwise Kilo writes tests. Prefer Kilo in 2.5-1. |

## Out of scope

UI. Ribbon. `StatusBanner`. `page.tsx`. `timeAxis.ts`. `exchanges.ts`. `marketCalendar/**`. GSC4. OD-S4. Nav rename (OD-S8).

## Task

1. `segments.ts`: Morning 09:30–12:30, Afternoon 12:30–14:30, Closing 14:30–16:00 ET minutes. Export types `{ label, startEtMin, endEtMin, truncated }`.
2. Given `DayStatus` + selected ISO date + “is today” + now-ET minutes (injected, not `Date.now` inside a mapper if that blocks tests — escalate rather than hide a clock in the view).
3. Early close 13:00: Morning whole; Afternoon end 13:00 and `truncated: true`; Closing omitted.
4. Closed / weekend: `[]`. `currentSegment` always `null` unless today **and** US cash open **and** now inside a rendered segment.
5. Labels from the module, never `"5:00 PM"` / `"1:00 PM"` literals in new code. Axis ends are minutes; display labels stay `sessionView` / `formatEtClock`.

## Completion

Two library files (+ tests if in this seed). `npx tsx` green. No `react` / `next` imports.
