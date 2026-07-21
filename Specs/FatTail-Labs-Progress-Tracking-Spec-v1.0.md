# FatTail Labs — Progress Tracking Spec v1.0

**Status:** Approved as built (2026-07-21)
**Parent spec:** `FatTail-Labs-Course-Hosting-Spec-v1.0.md` §9 (implements its progress
half; certificates remain future work with their own spec)
**Siblings:** Enrollment & Access spec (access matrix governs who can report progress),
YouTube spec (player contract — extended here with the JS API bridge)

---

## 1. Principle

Progress belongs to the identity and accrues automatically while watching. Completion is
earned (≥ 90% watched) or explicitly claimed (Mark complete). The dashboard's Continue
Learning is derived purely from progress rows — no separate bookkeeping to drift.

## 2. Data

`lesson_progress` (migration 001): `(identity_id, lesson_id)` unique →
`watch_seconds` (cumulative), `last_position` (resume point), `completed_at`.

## 3. API

All endpoints require a session; lesson access follows the Enrollment & Access matrix
(you can only report/read progress on lessons you may watch).

```
POST /api/progress            {course_slug, lesson_slug, position, watched_delta}
  - clamps: position ∈ [0, duration+60]; watched_delta ∈ [0, 60] (anti-gaming)
  - upsert: last_position = position; watch_seconds += watched_delta
  - auto-complete: video lessons with duration > 0 complete when
    watch_seconds ≥ 0.9 × duration (completed_at stamped once, never cleared)
  - returns {completed, watch_seconds}

POST /api/progress/complete   {course_slug, lesson_slug}
  - explicit mark-complete for any lesson kind (downloads, text); idempotent

GET /api/me/progress?course={slug}
  - {lessons: {lesson_slug: {completed, last_position, watch_seconds}}}
  - powers completion ticks on the course page Modules tab

GET /api/me/continue
  - in-progress courses ordered by last activity, limit 6:
    {course{slug,title,level,lesson_count,completed_count,percent}, 
     resume{lesson_slug,title,module_title,last_position}}
  - percent denominator = lessons in `standard` modules only (parent §6 rule);
    resume = latest-touched incomplete lesson, else first incomplete in course order
  - courses with every standard lesson complete are excluded (they are done, not
    "in progress"; they return with certificates work)
```

The lesson detail endpoint additionally returns the caller's `progress
{last_position, completed}` when authenticated — one round trip for the player.

## 4. Player Reporting Contract (YouTube JS API bridge)

- Server embed URLs now always include `enablejsapi=1` (video spec base params).
- The player page wraps the served iframe with the official YouTube IFrame API:
  - on ready: seek to `last_position` when it is > 10s and < 95% of duration
  - while playing: sample position every 5s; report every 15s of accumulated watch
  - report immediately on pause and on ended (ended reports position = duration)
  - final report on page leave (keepalive fetch)
- Completion flips the UI chip live when the API returns `completed: true`;
  a Mark-complete button covers manual override and non-video kinds.
- Prev/next lesson navigation derives from the course's ordered module/lesson list.

## 5. Course Page & Dashboard

- Modules tab shows a ✓ on completed lessons for the signed-in member (client fetch of
  `/api/me/progress`; the static page itself stays user-agnostic).
- `/dashboard` renders Continue Learning from `/api/me/continue`: per-course card with
  progress bar (completed/standard-total), "Resume: {lesson}" deep link. Signed-out →
  sign-in prompt.

## 6. Invariants

1. Progress writes require the same access as watching — the matrix has one authority.
2. `watched_delta` is clamped server-side; client reports are advisory, never trusted
   raw.
3. `completed_at` is monotonic: once stamped, never cleared by watching less.
4. Continue Learning derives from `lesson_progress` alone — no denormalized state.
