# FatTail Labs — Admin Guide

Operator how-to for the membership course platform. **Specs** under `Specs/` are
authoritative for behavior; this guide is the day-to-day runbook.

Everything here requires the **administrator** role (session cookie), unless noted
for **agent API keys**.

---

## 0. Two admin surfaces

| Surface | Where | Job |
|---|---|---|
| **In-place editing** | Production URLs (`/courses/…`, `/`, `/live`, `/resources`, …) | Edit the page members see |
| **Admin app (control plane)** | `/admin/*` | Board, agents, AI, media, notifications — **no member header** |

Specs: *Admin Dual Surface v1.0*, *In-Place Admin v1.0–v1.5*.

### Sign in

- **Production / staging:** native login or WordPress SSO with an admin-capable account.  
- **Bootstrap admins** (migration 014): `ernie@fattail.ai`, `conor@fattail.ai`, `coach@fattail.ai` — set a password with `server/create_user.py <email> --admin` if needed.  
- **Dev only:** `/api/auth/dev-login` mints an administrator session (`identity_id=0`). That session **cannot** receive the notification inbox (no identity row); use a real admin email for alerts.

### Admin app map

| Path | Purpose |
|---|---|
| `/admin` | Cockpit overview |
| `/admin/board` | **Kanban** production board (work-product cards) |
| `/admin/media` | Public media library |
| `/admin/ai` | AI agent workbench (Grok primary) |
| `/admin/agents` | Agent principals & API keys |
| **Alerts** (header) | In-app notifications + optional browser notifications |

---

## 1. In-place editing (content on production pages)

There are no separate “course builder” forms for page content — **the production page is
the editor** when you are signed in as administrator.

- Course pages: **Edit** (bottom-right). Click text blocks to edit; Save/Discard in the
  edit bar. Structural changes (add module/lesson, reorder, delete) apply immediately and
  refuse to run while you have unsaved text edits.  
- Saving a **published** course regenerates its static page (public site updates quickly).  
- Specs: In-Place Admin v1.0–v1.5.

### 1.1 Course lifecycle

- **Create:** “+ New Course” on the catalog, or board **Approve** may create a **draft**
  course (Phase D placement). Drafts are not public.  
- **Publish / unpublish / delete:** edit bar + Danger Zone on the course page (confirm
  title to delete).  
- Draft public URL as admin routes you toward the editor.

### 1.2 Lessons & video

- YouTube: paste URL or bare ID → server stores ID, embeds via youtube-nocookie.  
- Progress auto-reports; ~90% marks complete.  
- Course nav rail on lesson pages; lesson notes are Markdown (🖼 / paste / drag-drop
  images).  
- **Free-preview notes are public** — write them as landing copy.  

### 1.3 Card, banner, media

- Catalog **✎ Card**: banner color / image.  
- **`/admin/media`**: list, copy URL, delete (blocked if still referenced).

### 1.4 Quizzes, resources, live, hub

- **Quizzes:** set lesson kind to quiz; build questions on the lesson page.  
- **Resources:** course Resources tab and/or `/resources` admin controls.  
- **Live (`/live`):** recurring series, one-offs, occurrence edits, audience
  **categories** (Public / Members / Coaching).  
- **Hub (`/`):** Edit title, lead, intro video, FAQ accordion (CMS tables).  
- Category intro copy is still largely seed/SQL (no full CRUD UI yet).

---

## 2. Production board (Kanban) — `/admin/board`

Spec: *Content Board v1.0*, *Production Package v1.0*.

Each **card** is a work product (course module, short, etc.). Columns:

| Column | Meaning | Who typically moves here |
|---|---|---|
| Draft | Holding | Admin creates |
| Queued | Released to production | Admin |
| Scheduled | Claimed | Admin or agent `board:operate` |
| In production | Active (sub-stage badge) | Admin or agent |
| Awaiting approval | Package complete — **your gate** | Admin or agent |
| Revision | Returned with instructions | Admin |
| Published | Process approved (board) | **Admin only** |
| Rejected | Stopped | **Admin only** |

### 2.1 Day-to-day

1. **+ New card** — title + intent (starts in Draft).  
2. Edit **Content Vision** (strip at top) — binding direction for the factory.  
3. **Drag** cards across columns, or use the drawer actions.  
4. Open a card for intent, package checklist, flags, artifacts, history.  
5. When status is **Awaiting approval**, **Approve** or **Reject** / **Request revision**.

Illegal moves show an error; the board refreshes.

### 2.2 Package checklist (Phase C)

A card **cannot** enter *Awaiting approval* until required stages have artifacts:

| Product line | Required stages (summary) |
|---|---|
| **course** | research_pack, lesson_plan, script, video_package, placement_proposal, vision_alignment |
| **youtube_long** | research_pack, script, video_package, placement_proposal, vision_alignment |
| **coaching_short / thematic_short** | research_pack, script, video_package, vision_alignment |
| **other** | research_pack, vision_alignment |

Also: no open **block** guardian flags.

The drawer **Package** section shows ✓ / ○ per stage and any frozen snapshot.

Artifacts attach via:

- Manual API / future UI, or  
- **AI workbench** with `content_item_id` set to the card id (see §4).

### 2.3 Approve → Labs draft (Phase D)

When you **Approve → Published** on the board:

1. The approval package is marked approved.  
2. Labs **places or re-places** a **draft course** from the package:
   - Multi-module / multi-lesson graph from `placement_proposal` JSON (or
     `lesson_plan` JSON, or single-lesson fallback).  
   - YouTube **video_id**s from each lesson and/or `video_package` map.  
   - Course **trailer** id when provided.  
   - Course **resource links** (attachments).  
3. The card stores `placed_course_slug` — open `/courses/{slug}` and polish
   in-place, then **publish the course** when ready for members.

**Re-apply placement** on the card drawer rebuilds the **draft** structure (same
slug). Refuses to overwrite a course that is already published.

Board “Published” = process approved. Course “published” is a separate in-place step.

Manual place: `POST /api/admin/board/items/{id}/place` with `{ "replace": true }`.

### 2.4 Agents on the board

Mint a key for **quebec** (or another principal) with scope **`board:operate`**
(`/admin/agents`). That agent may move pipeline columns (scheduled → in production →
awaiting approval) but **cannot** create cards, publish, or reject.

---

## 3. Agent keys — `/admin/agents`

Spec: *Agent Identity v1.0*.

Agents authenticate **as themselves**, not with your browser cookie.

1. Open **Agent keys**.  
2. **Mint key** for a callsign (e.g. bravo, quebec).  
3. **Copy the secret once** (`ftl_ag_<prefix>_<secret>`).  
4. Use header: `Authorization: Bearer ftl_ag_…`  
5. **Revoke** when compromised or rotated.

| Scope | Allows |
|---|---|
| `ai:run` | Run agent tasks / fixtures |
| `ai:status` | AI status + agent catalog |
| `board:operate` | Move pipeline board columns; artifacts/flags |
| `admin:content` | Reserved (future content mutations) |

Humans only: mint/revoke keys, billing, membership overrides.

---

## 4. AI workbench — `/admin/ai`

Spec: *Agent Model Interface v1.0*.

- Shows whether **Grok** (primary) and **Claude** (secondary) keys are configured on
  the API (`XAI_API_KEY`, `ANTHROPIC_API_KEY`).  
- Pick agent + task, load fixture inputs, **Run task (live model)**.  
- To attach output to a board card, call the API with `"content_item_id": <id>`
  (workbench UI may pass this in later iterations; API supports it now).

Without `XAI_API_KEY`, live run stays disabled; fixtures still load.

---

## 5. Notifications (email + local)

Spec: *Admin Notifications v1.0*.

When something needs an admin:

| Event | Example |
|---|---|
| Card → awaiting approval | “Approval needed: …” |
| Card → revision requested | “Revision requested: …” |
| Block guardian flag opened | “Guardian flag (hotel): …” |

### Channels

1. **In-app** — **Alerts** in the admin header (polls ~30s).  
2. **Browser** — click “Enable browser notifications” once.  
3. **Email** — Hostinger SMTP when configured (see below).

Deep links open `/admin/board?item=<id>`.

Recipients: identities with `role_override = administrator`. The human who caused the
event is not re-notified; agent actions notify all admins.

### SMTP (FatTail / Hostinger)

```bash
LABS_SMTP_HOST=smtp.hostinger.com
LABS_SMTP_PORT=465
LABS_SMTP_MODE=ssl
LABS_SMTP_FROM=labs@fattail.ai
LABS_SMTP_USER=labs@fattail.ai
LABS_SMTP_PASSWORD=...          # mailbox password; never commit
LABS_WEB_ORIGIN=https://labs.fattail.ai
```

Alternate: port `587`, mode `starttls`. Restart the API after changing env.  
If SMTP is unset, in-app/browser still work (`email_status=skipped`).

---

## 6. Membership operations

- Plans/entitlements are **data**: `plans`, `provider_plan_map`, `memberships`.  
- Stripe keys in `.env`; webhook is source of truth for native billing.  
- WordPress SSO maps through `provider_plan_map`.  
- Alumni: ≥28 days paid tenure at churn → automatic course-access year.  
- `server/create_user.py` for manual users / passwords.

---

## 7. Rhythm & rules

```bash
# after any server change
cd server && .venv/bin/python -m pytest tests -q     # must be green
.venv/bin/python migrate.py                           # apply migrations

# after any web change
cd web && npm run build                               # then restart npm start
```

- Features ship with **spec + decision log + tests**.  
- Architecture: `Architecture/README.md`.  
- Deploy: `infra/deploy.md` (MiniTwo, launchd, canonical host).  
- Process outcomes only in member-facing copy — never profit claims.

---

## 8. Spec index (admin-relevant)

| Topic | Spec |
|---|---|
| In-place edit | FatTail-Labs-InPlace-Admin-Spec-v1.x |
| Dual surface | FatTail-Labs-Admin-Dual-Surface-Spec-v1.0 |
| Board / Kanban | FatTail-Labs-Content-Board-Spec-v1.0 |
| Packages / placement | FatTail-Labs-Production-Package-Spec-v1.0 |
| Agent identity | FatTail-Labs-Agent-Identity-Spec-v1.0 |
| AI models | FatTail-Labs-Agent-Model-Interface-Spec-v1.0 |
| Notifications | FatTail-Labs-Admin-Notifications-Spec-v1.0 |
| Identity / billing | Identity-Access, Native-Billing-Stripe |
| Live | Live-Sessions-Spec-v1.x |
| Lesson video | Lesson-Video-YouTube-Spec-v1.0 |

---

*When in doubt: board tracks the **factory**; in-place tracks the **product page**;
Approve on the board freezes the package and may seed a draft course — you still polish
and publish the course for members on the production URL.*
