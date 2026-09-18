# Amendment AZ-VP-9-A19 — Axis Labeling Hierarchy

**Date:** 2026-09-18
**Authority:** Coach directive: both axes carry a scalability
algorithm ensuring the right thing is labeled on the gridlines —
e.g., the time axis shows the DATE on the gridline where the date
changes, and Hour:Minute between dates.
**Extends:** A15.3/A15.5, A16, A17. Nothing struck.

## The labeling law

1. **Time axis — hierarchical boundary labeling:** each gridline is
   labeled with the LARGEST calendar unit that changes at it —
   year at a year change, month at a month change, the DATE at a
   day change, HH:MM between dates — exactly the TV convention.
   Label density adapts to the visible span (A15.3); boundary
   labels may render emphasized (bold date vs plain times), theme
   value. **Collapse rule:** as the span widens and gridlines
   compress, the SMALLEST unit drops first — HH:MM labels
   disappear entirely at wide spans, leaving only dates; wider
   still, only months; then years. The reverse on zoom-in.
   Intermediate labels never crowd, truncate, or overlap — they
   yield.
2. **Price axis — instrument ladder:** labels land on clean
   multiples of the SERVED tick (Contract v1.2.1), stepping the
   instrument's natural ladder as zoom widens — futures: tick →
   1 → 2.5 → 5 → 10 → 25 → 50 → 100-pt majors; equities: cents →
   nickels/dimes → quarters → dollars → $5/$10 — never an awkward
   decimal, never a label off-grid (A16). **Collapse rule (same as
   the time axis):** as the visible price span widens and labels
   compress, the finest rung drops first — tick-level labels
   disappear leaving whole points, then only the wider majors
   (10s, 25s, 100s) survive; the reverse on zoom-in. Labels never
   crowd, truncate, or overlap — they yield up the ladder.
3. **Gridlines follow labels:** a gridline exists where a label
   exists (major ticks), per A4.3's subtlety law — no orphan lines,
   no unlabeled clutter.
4. **Engine-native first (A17):** the A5 engine's default
   formatters implement most of this; custom formatters are added
   ONLY where a default deviates from clauses 1–3, and each is
   enumerated in the options report citing this law.

## Standing

Citable law until folded into the SA spec's next authored version.
Surface work binds to A19 from this date.
