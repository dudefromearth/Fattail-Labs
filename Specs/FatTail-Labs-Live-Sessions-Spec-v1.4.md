# FatTail Labs — Live Sessions Spec v1.4

**Status:** Approved as built (2026-07-21)
**Extends:** v1.3 (content categories). Adds the **Recurring Event Viewer**:
scope-aware editing of recurring occurrences, iCalendar-style.

---

## 1. The two event types

- **Single** — a row in `live_sessions`. Edited/deleted directly.
- **Recurring** — a series in `live_recurrences`, materialized into occurrences.
  Editing an occurrence requires choosing **scope**:
  1. **This event only** — writes an *override* row
  2. **This event and all future events** — *splits* the series
  3. **All events in this sequence** — edits the series row

## 2. Model (migration 009)

- `live_recurrences` gains `start_date` / `until_date` (nullable DATE bounds, ET;
  a split sets `until_date` on the old series and `start_date` on the new one).
- `live_recurrence_overrides`: `(recurrence_id FK-cascade, occurrence_date ET,
  UNIQUE together)` + `cancelled` + nullable field columns (`title, kind,
  start_time, duration_minutes, join_url, category`). NULL = inherit from the
  series; `cancelled=1` = occurrence removed.
- The materializer applies bounds, drops cancelled dates, merges override fields
  (effective time/duration recompute `starts_at`/`ends_at`), and marks affected
  occurrences `modified: true`.

## 3. Scope semantics

| Scope | Edit | Delete |
|---|---|---|
| This event only | upsert override (provided fields only) | override with `cancelled=1` |
| This and future | old series `until_date = day−1`; clone series with edits + `start_date = day`; overrides ≥ day move to the new series | old series `until_date = day−1`; overrides ≥ day deleted |
| All events | partial update of the series row | delete series (overrides cascade) |

## 4. API

- `GET  /api/admin/live-sessions/{id}` — single-event prefill (admin sees join_url).
- `GET  /api/admin/live-recurrences/{rid}/occurrences/{YYYY-MM-DD}` — effective
  occurrence fields for prefill. 404 unless the date is a real occurrence of the
  series (weekday match + bounds).
- `PUT  /api/admin/live-recurrences/{rid}/occurrences/{date}` — body
  `{scope: one|future|all, ...partial fields}`; fields validated per v1.3 rules.
- `DELETE /api/admin/live-recurrences/{rid}/occurrences/{date}?scope=…`.
- Occurrence payloads gain `occurrence_date` and `modified`.

## 5. Recurring Event Viewer (UI)

Selecting a calendar chip opens the detail card; admins get **Edit**, expanding
an inline editor prefilled with effective values: title, kind, ET time, duration,
join URL, category — and for recurring events the scope radio (the three choices
above, "this event only" default). Save and Delete both honor the chosen scope;
single events show the same editor minus the scope radio (direct PUT/DELETE).

## 6. Known limits (logged, accepted)

- The series ICS (RRULE) does not reflect per-occurrence overrides or bounds —
  calendar subscribers see the base pattern.
- A `join_url` override cannot *clear* the series URL for one occurrence (NULL
  means inherit).
