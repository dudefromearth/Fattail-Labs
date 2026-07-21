# Seed F3 — Alpha: Public Read API + Seed Data

**Project:** p1-foundation · **Agent:** Alpha · **Gate:** feeds Gate 1
**Depends on:** F1 PASS (live dev DB)
**Repo:** `/Users/ernie/Fattail-Labs` · **Read first:** `agents/bench/alpha.md`, spec §6
(domain model), §8 (API surface), §2.4–2.5 (what course cards/pages need)

## Objective

Implement the public read endpoints that power the catalog and course detail pages, plus
a deterministic seed script so the frontend has real data to render.

## Task sequence

1. `server/routes/courses.py` (router mounted in `main.py`):
   - `GET /api/courses` — published courses only: slug, title, subtitle, level,
     hero_image_url, categories, instructors (name+avatar), enrolled_count,
     lesson_count, published_at. Filters: `?category=&level=&q=`; sorts:
     `?sort=newest|enrolled|title`.
   - `GET /api/courses/{slug}` — full detail: description_md, trailer, modules (ordered,
     with kind) → lessons (ordered: slug, title, kind, duration_seconds, free_preview —
     NO video_id or body_md in the public payload), attachments (course-level, titles
     only for non-preview), aggregate rating (null until ≥3 visible reviews), enrolled
     count.
   - 404 on unknown/unpublished slug — draft courses must be invisible.
2. `server/seed_dev.py` — idempotent dev seed: 3 categories, 2 instructors (Ernie +
   one placeholder), 3 courses (1 flagship "First, Stop the Bleeding" with 3 modules /
   6 lessons incl. one free_preview; 1 second published course; 1 draft course to prove
   invisibility), realistic copy per Sierra's formula (§2.4) — process outcomes, no
   profit claims.
3. Verify live: run seed twice (idempotent), curl both endpoints, confirm the draft
   course is absent everywhere, confirm no gated fields (video_id, body_md) leak in
   public payloads.

## Out of scope

Auth/member routes · reviews write path · admin CRUD · `web/` changes · schema changes
(if the spec's model is insufficient, STOP and report BLOCKED to India).

## Completion criteria (all with captured output)

- [ ] curl of `/api/courses` (plus one filter + one sort) included
- [ ] curl of flagship detail: modules/lessons ordered, free_preview flagged
- [ ] Draft course: absent from list, detail returns 404
- [ ] Public payloads contain no video_id/body_md — shown by inspection of output
- [ ] Seed script run twice, identical row counts (SELECT COUNT evidence)

## Report

PASS / FAIL / BLOCKED + evidence. Document the response shapes in the report — Charlie
builds F4 against them.
