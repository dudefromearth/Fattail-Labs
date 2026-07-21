# FatTail Labs — Live Sessions Spec v1.0

**Status:** Approved as built (2026-07-21)
**Parent spec:** §11 (live sessions, role-gated join, replays fold into the library)

---

## 1. Model (migration-001 `live_sessions`, now in service)

`title · kind (trading_room | workshop) · starts_at (stored UTC, rendered local) ·
join_url · min_role (activator | navigator) · replay_course_id`

## 2. Rules

- **Schedule is public** (marketing surface): anyone sees upcoming sessions — titles,
  kinds, times. The **join URL is never in a payload** unless the caller clears both
  gates:
  1. role ≥ `min_role` (trading room = navigator, workshops = activator by default)
  2. inside the join window: **T−15 min before start until +4 h after**
  Locked callers get a machine-readable reason (`sign_in` / `role` / `too_early`) so
  the UI renders the right prompt (sign-in, upgrade, or countdown).
- **Add to Calendar**: `GET /api/live/sessions/{id}/ics` — public ICS with title/time
  and a pointer to `/live`; never the join URL.
- **Replays**: a past session links to its replay course (`replay_course_id`).
  Workflow (honest v1.0): admin uploads the recording to YouTube, creates the lesson
  in the replays course, links the session — the "auto" is that the session page then
  routes members to it; a hands-free pipeline is future scope.

## 3. API

```
GET  /api/live/sessions                    {upcoming[], past[]} session-aware join fields
GET  /api/live/sessions/{id}/ics           public calendar file
Admin CRUD: POST /api/admin/live-sessions · PUT/DELETE /api/admin/live-sessions/{id}
```

## 4. UI

`/live` (header nav gains Live): Upcoming cards — kind badge, local date/time,
countdown, Add to Calendar, and Join (or its lock state: sign-in prompt / "Members" /
"Coaching members" upgrade / "Join opens 15 minutes before start"). Replays section —
past sessions linking to their replay course. Admins get an in-page session manager
(create/edit/delete, replay linking).

## 5. Invariants

1. `join_url` never leaves the server to an unentitled or out-of-window caller.
2. The schedule derives solely from `live_sessions` — no duplicate calendar store.
