# FatTail Labs — Cast Registry & HeyGen Production Spec v1.1

**Status:** Approved as built (Phase G complete: G1–G5, 2026-07-23)  
**Parents:** Cast-HeyGen Spec v1.0, Production Package Spec v1.0, Content Board Spec v1.0  
**Decision log:** 2026-07-23 "Phase G complete G2b–G5"

---

## 1. Purpose

Extends v1.0 (cast registry + single HeyGen kick) with:

| Slice | Capability |
|---|---|
| **G2b** | Multi-lesson / multi-beat **batch** renders into one `video_package` |
| **G3** | **Job budgets** (daily / monthly live submit caps) + ledger |
| **G4** | **Quebec tick** — light auto-advance on the board (never publish) |
| **G5** | **Refresh** HeyGen session status; **YouTube map** onto package for placement |

---

## 2. Unchanged from v1.0

- Cast files under `docs/studio/cast/AVATAR-*.md`
- `content_items.cast_id`
- Admin `/admin/cast`
- Produce preconditions: cast + script + video product line
- Human gate for publish / YouTube upload

---

## 3. G2b — Batch render targets

`plan_render_targets(item_id)` chooses targets in order:

1. `lesson_plan` JSON → video/replay lessons under `modules[].lessons[]`  
2. `placement_proposal` JSON → same shape  
3. Script `## Lesson` / `## Beat` / `## Scene` sections (≥2)  
4. Fallback: single `lesson-1` from `## Voiceover` or full script  

Text/download/quiz/external lessons are skipped.

Body field `max_renders` caps count; env `LABS_HEYGEN_MAX_BATCH` (default **3**) is the
default batch size (HeyGen congestion safety).

Each target becomes one entry in `renders[]` with its own `session_id` / status.

---

## 4. G3 — Budgets

Migration `021_heygen_budget_ledger.sql` → table `heygen_job_ledger`.

| Env | Default | Meaning |
|---|---|---|
| `LABS_HEYGEN_DAILY_JOB_LIMIT` | 10 | Live jobs/day |
| `LABS_HEYGEN_MONTHLY_JOB_LIMIT` | 100 | Live jobs/calendar month |
| `LABS_HEYGEN_MAX_BATCH` | 3 | Default max renders per produce |

- Dry-run jobs are ledgered with `dry_run=1` and **do not** consume budget.  
- Live submit fails loud when remaining capacity &lt; requested render count.  
- `GET /api/admin/board/heygen/budget` returns used/remaining snapshot.

---

## 5. G4 — Quebec tick

`POST /api/admin/board/quebec/tick`

| Actor | Rule |
|---|---|
| Human admin | Always (use `force: true` when auto env off) |
| Agent `board:operate` | Only if `LABS_QUEBEC_AUTO=1` |

**Advances (never invents backlog, never publishes/rejects):**

1. `queued` → `scheduled`  
2. `scheduled` → `in_production` / `research`  
3. `in_production` sub_stage from artifacts (research→design→script→produce→package)  
4. When package checklist complete → `awaiting_approval` (freezes package)

Open **block** flags skip advance to awaiting. Board UI: **Quebec tick** button.

---

## 6. G5 — Refresh & YouTube map

| Method | Path | Behavior |
|---|---|---|
| POST | `/items/{id}/refresh-heygen` | Poll each render `session_id`; rewrite latest `video_package` |
| POST | `/items/{id}/youtube-map` | Body `{ "videos": { slug: ytId }, "trailer_video_id"? }` |

Dry-run sessions are not polled live. Completed status + HeyGen `video_id` /
`video_url` stored on renders when CLI returns them.

YouTube map fills `videos{}` for Phase D placement merge — does not call YouTube API.

---

## 7. API surface (full G)

| Method | Path |
|---|---|
| GET | `/api/admin/cast` |
| GET | `/api/admin/cast/{cast_id}` |
| POST | `/api/admin/board/items/{id}/produce-heygen` |
| POST | `/api/admin/board/items/{id}/refresh-heygen` |
| POST | `/api/admin/board/items/{id}/youtube-map` |
| GET | `/api/admin/board/heygen/budget` |
| POST | `/api/admin/board/quebec/tick` |

---

## 8. Admin UI

- Budget chip on board header  
- **Quebec tick**  
- Produce dry-run / live; **Refresh HeyGen status**  
- Video package panel: renders + session links + YouTube map textarea  

---

## 9. Verification

`server/tests/test_cast_heygen.py` + `server/tests/test_phase_g_rest.py`

- Batch dry-run → 2 video lessons (skips text)  
- Budget endpoint + daily limit 0 blocks live  
- Refresh dry-run package  
- YouTube map  
- Quebec advances queued; submits complete packages to awaiting_approval  

---

## 10. Out of scope (post-G)

- Automatic YouTube upload  
- Continuous background poller (operator refresh is enough for v1.1)  
- Multi-worker Quebec daemon  
- Dollar-cost pricing model (jobs are the unit)  
