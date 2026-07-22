# FatTail Labs — Live Sessions Spec v1.2

**Status:** Approved as built (2026-07-21)
**Extends:** v1.1 (recurrences, gating tiers, RRULE ICS — unchanged).
Replaces the upcoming **list** with a **month calendar** — a recurring schedule
makes a list grow linearly with occurrences; a calendar shows the rhythm at a
glance.

---

## 1. API: month window

`GET /api/live/sessions?month=YYYY-MM` returns **every session of that ET month**
(one-offs whose ET date falls in the month + all materialized occurrences —
including already-past ones, join-locked `ended`), sorted, as `{sessions, past}`.
Invalid month → 422. The **no-param shape is unchanged** (rolling 14-day
`{upcoming, past}`) — the dashboard's next-session card depends on it.

## 2. Calendar UI (/live)

- **Opens on the current month**; header shows "July 2026" with ‹ / Today / ›
  navigation. Month switch refetches and clears the selection.
- Monday-first grid (trading week reads left-to-right); today's date filled
  emerald; past days and their chips dimmed; sub-640px widths scroll horizontally
  inside the grid container.
- Each session is a **chip** (time + title) colored by kind: trading room indigo,
  workshop emerald, show rose.
- Clicking a chip selects it → a **detail card** below the calendar: kind badge,
  ↻ Weekly marker, date/time + live countdown, Add to Calendar (recurrence RRULE
  ICS for occurrences, single-event ICS for one-offs), the gated Join control,
  admin delete (one-offs only). Default selection on load: the next session that
  hasn't ended.
- Past sessions render "Session ended" in the detail card regardless of the
  server lock reason (an anonymous viewer shouldn't be told to sign in to a
  session that's over).

## 3. Unchanged

Replays section, admin one-off scheduler, admin recurrence manager, all gating
rules and ICS endpoints from v1.0/v1.1.
