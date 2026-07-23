# FatTail Labs — Content Backlog & Production Board Spec v1.0

**Status:** Approved as built (Phase B, 2026-07-23)  
**Parent:** `agents/p2-foundation/CHARTER.md` (pillar 2 — backlog + Production Board)  
**UI:** Kanban board at `/admin/board`  
**Decision log:** 2026-07-23 "Phase B: content board Kanban"

---

## 1. Purpose

Give administrators a **Content Vision**, a **Backlog**, and a **Kanban Production Board**
where each **work product is a card** that moves through process columns. The board is the
single source of truth for production status (Quebec / operators keep it honest).

---

## 2. Kanban columns (status)

| Column key | Status | Card meaning |
|---|---|---|
| Draft | `draft` | Holding — not released to production |
| Queued | `queued` | Admin released; eligible to claim |
| Scheduled | `scheduled` | Claimed; seed / hand-off prepared |
| In production | `in_production` | Active pipeline (sub-stage on card) |
| Awaiting approval | `awaiting_approval` | Package complete; human gate |
| Revision | `revision_requested` | Admin returned with instructions |
| Published | `published` | Approved / live (process complete) |
| Rejected | `rejected` | Stopped; reason required |

Drag-and-drop (or explicit move) changes status subject to **transition authority**.

### 2.1 Sub-stages (`in_production` only)

| sub_stage | Meaning |
|---|---|
| `research` | Bravo |
| `design` | November |
| `script` | Romeo |
| `produce` | Papa |
| `package` | Quebec assembling approval package |
| `guardian` | Hotel / lineage / Tango review |

---

## 3. Data model

### 3.1 `content_vision`

Single row (id=1): `body_md`, `updated_at`, `updated_by_identity_id`.

### 3.2 `content_items` (cards)

| Column | Notes |
|---|---|
| id | PK |
| title | Card title |
| intent_md | What and why |
| acceptance_md | Acceptance criteria |
| inputs_md | Sources, transcripts, links |
| product_line | `course` \| `youtube_long` \| `coaching_short` \| `thematic_short` \| `other` |
| status | See §2 |
| sub_stage | Nullable; required semantics when in_production |
| priority | INT, higher = sooner (default 0) |
| sort_order | INT within column |
| vision_aligned | TINYINT note flag |
| claimed_callsign | Nullable agent callsign |
| last_actor_kind / last_actor_id / last_actor_label | Denormalized last transition actor |
| created_by_identity_id | Admin who created |
| reject_reason | When rejected / revision notes |
| created_at / updated_at | |

### 3.3 `content_transitions`

Append-only: item_id, from_status, to_status, sub_stage, actor_*, reason, created_at.

### 3.4 `content_artifacts`

item_id, stage (e.g. research_pack), title, body_md / url, created_by actor_*, created_at.

### 3.5 `content_flags`

item_id, guardian (hotel\|tango\|victor\|whiskey\|yankee\|other), severity, message,
status open\|cleared, created/cleared actor + timestamps.

**Rule:** card cannot move **forward** to `awaiting_approval` or `published` while any
flag is `open` (unless admin force with reason — v1.0: **block**, no force).

---

## 4. Transition authority

| To status | Who |
|---|---|
| `draft`, `queued` | Human administrator |
| `scheduled`, `in_production`, `awaiting_approval` | Human admin **or** agent with scope `board:operate` |
| `published`, `rejected`, `revision_requested` | Human administrator only |
| sub_stage change (same status) | board:operate or human admin |

Allowed edges (others → 422):

```text
draft → queued | rejected
queued → scheduled | draft | rejected
scheduled → in_production | queued | rejected
in_production → awaiting_approval | revision_requested | rejected | scheduled
awaiting_approval → published | rejected | revision_requested
revision_requested → in_production | rejected | queued
published → (terminal for v1; reopen = new item)
rejected → draft (reopen)
```

---

## 5. HTTP API

Prefix `/api/admin/board` — human admin cookie **or** agent with `board:operate`
(except create vision update / create item / human-only transitions).

| Method | Path | Auth |
|---|---|---|
| GET | `/vision` | admin or board:operate |
| PUT | `/vision` | human admin |
| GET | `/` | board snapshot `{columns: {status: [cards]}, vision}` |
| GET | `/items/{id}` | detail + transitions + artifacts + flags |
| POST | `/items` | human admin — create draft card |
| PATCH | `/items/{id}` | human admin — fields (not status) |
| POST | `/items/{id}/transition` | per §4 — body `{to_status, sub_stage?, reason?}` |
| POST | `/items/{id}/artifacts` | board:operate or admin |
| POST | `/items/{id}/flags` | board:operate or admin |
| POST | `/flags/{id}/clear` | board:operate or admin |

Every transition and flag change writes `content_transitions` and `actor_events`.

---

## 6. Admin UI — Kanban

**Route:** `/admin/board` (admin shell, no member header).

1. **Vision strip** — editable markdown (admin); shown collapsed by default.  
2. **Kanban** — horizontal columns; each card is a work product.  
3. **Card** — title, product_line badge, priority, sub_stage, flag count, claimed_callsign.  
4. **Drag** card to another column → `POST …/transition`. Illegal drop shows error, card snaps back.  
5. **Click card** → drawer/detail: intent, acceptance, inputs, artifacts, flags, history, Approve/Reject when `awaiting_approval`.  
6. **New card** — form creates `draft`.  
7. **Queue** action on draft → `queued`.

---

## 7. Non-goals (v1.0)

- Automatic Quebec claiming loop (API supports it; no scheduler daemon)  
- Applying packages to Labs courses (Phase D)  
- Real-time multiplayer websockets (poll/refresh OK)  
- Mobile-first polish  

---

## 8. Verification

- Characterization: create card, legal/illegal transitions, open flag blocks awaiting_approval, artifacts attach  
- Manual: Kanban drag draft→queued→… in admin UI  

---

## 9. Implementation map

| Path | Role |
|---|---|
| `migrations/017_content_board.sql` | Schema + default vision |
| `server/board.py` | Domain logic |
| `server/routes/board_admin.py` | HTTP |
| `web/app/admin/board/page.tsx` | Kanban page |
| `web/components/admin/BoardKanban.tsx` | UI |
| `server/tests/test_content_board.py` | Tests |
