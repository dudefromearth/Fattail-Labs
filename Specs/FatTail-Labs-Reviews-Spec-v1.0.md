# FatTail Labs — Ratings & Reviews Spec v1.0

**Status:** Approved as built (2026-07-21)
**Parent spec:** `FatTail-Labs-Course-Hosting-Spec-v1.0.md` §6 (Review model + rules)
**Benchmark parity:** AI Labs' "Course Review" block (aggregate + member reviews).

---

## 1. Rules (parent §6, now enforced)

- One review per identity per course (DB unique constraint).
- **Eligibility to write:** enrolled in the course AND ≥ 1 completed lesson in it.
  (Free-account members who completed a preview lesson qualify — reviewing requires
  having actually experienced content, not a membership tier.)
- Rating 1–5 required; body optional. Writing again updates your review (upsert).
- Aggregate (avg + count) is public at **≥ 3 visible reviews** (existing SQL rule);
  below that, "Not yet rated".
- Moderation: reviews are `visible` by default; admins can set `held` (hidden from
  public, author sees "held for review"). No deletion in v1.0.

## 2. API

```
GET  /api/courses/{slug}/reviews        public: visible reviews (author display name,
                                        rating, body, date), aggregate {avg, count};
                                        + viewer block when authed: {my_review,
                                        can_review, reason}
POST /api/courses/{slug}/reviews        auth + eligibility: {rating, body?} upsert
POST /api/admin/reviews/{id}/moderate   admin: {status: visible|held}
```

## 3. Freshness of the static page

Course pages bake the aggregate (hero rating + JSON-LD `aggregateRating`) at build.
After a review write, the client triggers regeneration via `/api/revalidate` — that
route's authorization loosens from admin-only to **any authenticated session, for
`/courses/*` paths only** (regeneration is idempotent and read-only; admins retain
all paths). The review list itself renders client-side (always fresh).

## 4. UI (course page, About tab — benchmark position)

"Course Review" block under the instructor card: aggregate score + stars, review list
(author, stars, body, date) with Show more, and for eligible viewers a write form
(star picker + optional text). Ineligible signed-in viewers see why ("Complete a
lesson to review"). Admins see a Hide/Show control per review.

## 5. Invariants

1. Eligibility and rating bounds are enforced server-side; the form is convenience.
2. A held review never renders publicly and never counts toward the aggregate.
3. The public JSON-LD aggregate always derives from visible reviews only.
