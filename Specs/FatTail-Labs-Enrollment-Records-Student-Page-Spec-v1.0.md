# FatTail Labs — Enrollment Records & Student Page Spec v1.0

**Status:** Approved as built (2026-07-21)
**Parent spec:** `FatTail-Labs-Course-Hosting-Spec-v1.0.md` §6 (Enrollment model)
**Siblings:** Progress Tracking spec (progress rows feed everything here),
Enrollment & Access spec (access matrix unchanged — enrollment is bookkeeping,
not a gate)

---

## 1. Principle

Enrollment is the member's explicit relationship with a course — it powers enrolled
counts, completion records, the avatar dropdown summary, and the student page. It is
NOT an access gate (the access matrix from the Enrollment & Access spec remains the
sole authority on who can watch what).

## 2. Enrollment Semantics

- `enrollments` (migration 001): `(identity_id, course_id)` unique, `enrolled_at`,
  `completed_at`.
- Created two ways:
  1. **Explicitly** — the course page's enrollment card (`Enroll` button) for any
     authenticated user.
  2. **Automatically** — first progress event (watch report or mark-complete) on any
     lesson in the course. Watching IS enrolling; no orphan progress.
- **Course completion**: after every progress write, if all standard-module lessons
  are complete, `completed_at` is stamped on the enrollment (monotonic, stamped once).
- Enrolled counts on catalog cards/course pages are real counts of this table.

## 3. API

```
POST /api/courses/{slug}/enroll     any session; idempotent; 404 unpublished
GET  /api/me/enrollments            all my enrollments, newest first:
                                    {course{slug,title,level}, enrolled_at,
                                     completed_at, progress{total,done,percent},
                                     resume{lesson_slug,title}|null}
GET  /api/me/activity               merged feed, newest first, limit 50:
                                    enrolled · lesson_watched · lesson_completed ·
                                    course_completed — each with course/lesson refs
                                    and timestamp
```

Progress summary rules are shared with Continue Learning: percent over
standard-module lessons only; resume = latest-touched incomplete lesson, else first
incomplete in course order.

## 4. Avatar Dropdown (header)

When the menu opens (lazy fetch): a **My Learning** section with up to 3 in-progress
enrollments — title, mini progress bar, percent — each linking directly to its resume
lesson ("quickly go to finish"). Below: My Learning (→ `/me`), Dashboard, Sign out.
Completed courses don't occupy the 3 slots.

## 5. Student Page (`/me` — "My Learning")

The dropdown's destination; the member's complete record:

1. **Stats row** — courses enrolled, courses completed, lessons completed, total
   watch time.
2. **Enrollments** — every enrollment: title, status (In progress / Completed with
   date), progress bar, enrolled date, Resume/Review link.
3. **Quiz results** — section scaffolded now, renders "No quizzes yet — coming to
   courses soon" until the quiz system exists (future spec; this page is its home).
4. **Activity** — the merged feed (§3): enrolled/watched/completed events with
   course + lesson links and relative timestamps.

Signed-out visitors to `/me` get the sign-in prompt.

## 6. Invariants

1. Enrollment never grants access — the matrix is the only access authority.
2. No orphan progress: any progress row implies an enrollment row (auto-enroll).
3. `completed_at` (course and lesson) is monotonic — never cleared by later state.
4. Dropdown and student page derive from enrollments + progress only; no separate
   activity bookkeeping to drift.
