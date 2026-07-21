# FatTail Labs — Students Tab Spec v1.0

**Status:** Approved as built (2026-07-21)
**Parent spec:** §5.2 (Students tab: roster, social proof; member-visible, logged-out
sees count only)

---

## 1. Rules

- Roster = enrollments of the course, newest first.
- **Visible to any signed-in account** (community includes free members); logged-out
  visitors see only the enrolled count + a sign-in prompt.
- Per student: display name (never email — emails never leave the server), initials
  avatar, enrolled date, **Completed** badge when the enrollment is completed,
  **Admin** badge for staff.

## 2. API

```
GET /api/courses/{slug}/students
  logged-out: {count, students: null}
  signed-in:  {count, students: [{name, is_admin, enrolled_at, completed}]} (limit 200)
```

## 3. UI

Students tab (now enabled): grid of student cards (initials avatar, name, joined
date, badges). Logged-out: count + sign-in prompt. Client-fetched (member-state
dependent; not part of the static build).
