# FatTail Labs — Admin Dual Surface Spec v1.0

**Status:** Approved as built (Phase A foundation, 2026-07-23)  
**Context:** Solidify in-place editing **and** provide a dedicated admin app shell that
does not share member chrome or interfere with the learner UX.  
**Decision log:** 2026-07-23 "Phase A: agent principals + dual admin surface"

---

## 1. Purpose

Operators need two complementary surfaces:

| Surface | Job |
|---|---|
| **In-place admin** | Edit content **on the production page** learners see (course, hub, live, resources…) |
| **Admin app** | Operator cockpit: navigation, media, agents, AI workbench, future backlog/board — **without** member header CTAs or learner IA |

Neither replaces the other. In-place remains the content editor of record for page-shaped
content. The admin app is the **control plane**.

---

## 2. In-place admin (solidified)

### 2.1 Rules

1. **Production URL is the editor** when the viewer is an administrator (existing pattern).  
2. **Field allowlists** live server-side; unknown fields → 422.  
3. **Structural ops** (add/reorder/delete modules) refuse while unsaved text edits exist
   (existing In-Place Admin behavior).  
4. **Revalidate** public paths after publish-affecting saves.  
5. **No parallel “shadow” course model** — same rows members read.  
6. **Draft courses** open at admin draft routes / editor, not public 404 as the only path.

### 2.2 Standard chrome (client)

Shared conventions (implement incrementally):

| Convention | Meaning |
|---|---|
| `useIsAdmin()` | Single cached `/api/auth/me` check |
| Edit FAB / bar | Enter/exit edit mode |
| `data-testid` / `data-admin-edit` | Stable hooks for tests |
| Markdown + sanitize | Same renderer public and edit preview |

Surfaces already on this path: course detail, hub, live admin pieces, resources, etc.
New page-shaped content **must** use the same edit primitives under `web/components/edit/`.

---

## 3. Dedicated admin app

### 3.1 Routing

All under `/admin/*`:

| Path | Role |
|---|---|
| `/admin` | Cockpit home / links |
| `/admin/media` | Media library |
| `/admin/ai` | Agent workbench (live models) |
| `/admin/agents` | Agent principals & API keys (Phase A) |
| `/admin/courses/[slug]` | Optional deep link to draft editor shell (existing) |
| Future | `/admin/backlog`, `/admin/board`, `/admin/cast` (P2) |

### 3.2 Layout isolation

1. **Member `SiteHeader` is not shown** on `/admin/*`.  
2. Admin shell provides: product mark, nav, admin identity readout, link “View site”.  
3. Admin pages are `noindex`.  
4. Admin shell does **not** load membership upsell, pathway marketing, or learner dashboard widgets.  
5. Auth: same `ft_session` cookie; non-administrators see deny state (no silent redirect loops into signup funnels preferred — clear “admin only”).

### 3.3 Visual language

- Dense operator UI (tables, forms, monospace for keys/IDs).  
- Reuse Tailwind tokens; do not invent a second brand.  
- Echo may later token-align; v1.0 prioritizes non-interference over polish.

---

## 4. Interaction between surfaces

```text
Admin app                          In-place (production URL)
─────────                          ────────────────────────
Mint agent key ──► AI workbench
Media upload   ──► copy URL ──► paste into course card editor
Open course    ──► link out to /courses/{slug} (in-place edit)
Future board   ──► Approve ──► placement on drafts (still P1 APIs)
```

**Rule:** Content truth remains P1 APIs + DB. Admin app never gets a second database.

---

## 5. Non-goals

- Separate deployable “admin SPA” microfrontend (same Next app is fine)  
- Removing in-place editing  
- WordPress admin for Labs content  

---

## 6. Verification

- Browser: `/admin` shows admin nav, no Join/Sign up header  
- `/courses` still shows member SiteHeader  
- Administrator can open Agents + AI from admin shell  
- Non-admin denied on admin APIs (existing)  

---

## 7. Implementation map (Phase A)

| Path | Role |
|---|---|
| `web/components/AppChrome.tsx` | Suppress member header on `/admin` |
| `web/app/admin/layout.tsx` | Admin shell + nav |
| `web/app/admin/page.tsx` | Cockpit home |
| `web/app/admin/agents/page.tsx` | Principals UI |
| Spec + decision log | This document |
