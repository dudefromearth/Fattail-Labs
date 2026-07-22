# FatTail Labs — Live Sessions Spec v1.1

**Status:** Approved as built (2026-07-21)
**Extends:** v1.0 (one-off sessions, join gating, ICS, replays — unchanged).
Adds **recurring sessions** for the standing schedule, and widens gating for
public shows.

---

## 1. Recurring sessions (migration 007: `live_recurrences`)

`title · kind (trading_room | workshop | show) · days (mon…sun set) ·
start_time (America/New_York — DST-aware) · duration_minutes · join_url ·
min_role · active`

The API **materializes occurrences at read time** for the next 14 days and merges
them with one-off sessions — no cron, no generated rows, the schedule is simply
always there. Recurrences never appear in Replays (replays remain one-off links).

## 2. The standing schedule (seeded)

| Session | When (ET) | Who |
|---|---|---|
| **Live Trading Room** | Mon–Fri 11:00–12:15 | navigator+ (all members EXCEPT Activators; Observer-trial holders carry navigator access) |
| **Friday Pre-Market Briefing** | Fri 9:30–10:00 | activator+ (the one session Activators get) |
| **Sunday Retrospective** | Sun 21:00–22:00 | navigator+ |

Coach may add others (e.g. a public YouTube show Mon/Wed/Fri 15:00) through the
admin recurrence manager.

## 3. Gating widened

`min_role` now spans **public | observer | activator | navigator** (one-offs and
recurrences alike):
- `public` — join link visible to anyone in the window, signed-in or not
  (YouTube shows are marketing).
- `observer` — any signed-in account.
- `activator` / `navigator` — as v1.0. Window rule (T−15m → end+grace) unchanged.

## 4. Calendar & admin

- Recurrence ICS: `GET /api/live/recurrences/{id}/ics` — a true repeating event
  (`RRULE:FREQ=WEEKLY;BYDAY=…`, `TZID=America/New_York` so DST shifts correctly).
  Add once, holds forever.
- Admin recurrence manager on `/live`: list (title, days, time ET, audience,
  active) with delete; create form (title, kind, day checkboxes, ET time,
  duration, join URL, audience). One-off scheduling from v1.0 remains for
  specials.
- Occurrence cards show a ↻ Weekly marker; they are managed through the
  recurrence, not deleted individually.
