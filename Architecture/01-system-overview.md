# System Overview — FatTail Labs

**Status:** As-built (retroactive, 2026-07-23)  
**Product:** FatTail Labs — membership education platform at `labs.fattail.ai`  
**Thesis:** “Stop the bleeding” — capital preservation first; process outcomes only;
capacity over dependency.

---

## 1. Purpose

FatTail Labs replaces LearnDash with a first-party course platform for FatTail.ai:

- Public catalog and course pages as **acquisition + SEO/AEO** surfaces  
- Gated lessons, progress, enrollment inside a **membership** model  
- Live sessions, resources, pathway, quizzes, discussion, reviews  
- In-place admin so operators edit the production UI  
- Standalone from MarketSwarm-Canonical (HTTP API only if integration is needed)

---

## 2. Layered architecture

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Operators (administrators) + P2 agents (via admin AI / future backlog)  │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
     ┌──────────────────────────┼──────────────────────────┐
     ▼                          ▼                          ▼
┌─────────────┐         ┌──────────────┐          ┌─────────────────┐
│  Next.js    │  rewrite│  FastAPI     │          │  MySQL `labs`   │
│  web/       │ ───────►│  server/     │◄────────►│  migrations/    │
│  :3000      │  /api/* │  :4000       │          │                 │
└─────────────┘         └──────┬───────┘          └─────────────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
        WordPress SSO    Stripe (opt.)    xAI / Anthropic
        (pluggable)      billing          (agent models, opt.)
               │
               ▼
        YouTube embeds (lesson video delivery)
```

| Layer | Path | Responsibility |
|---|---|---|
| **Frontend** | `web/` | Member UX, public SSG pages, in-place admin UI, SEO surfaces |
| **API** | `server/` | Auth, domain API, admin mutations, billing webhooks, agent model gateway |
| **Data** | MySQL `labs` + `migrations/` | System of record for identities, content, progress, live, hub |
| **Media files** | `server/uploads/` | Public banners + private resource blobs (not DB BLOBs) |
| **Edge** | MiniThree nginx + Cloudflare | TLS, host routing, proxy to MiniTwo |

---

## 3. Environments

| Env | Host | Notes |
|---|---|---|
| **dev** | localhost | `uvicorn` + `next dev` allowed; `/api/auth/dev-login` |
| **staging** | DudeTwo · `labs-stage.fattail.ai` | Built Next only |
| **production** | MiniTwo · `labs.fattail.ai` | Sole Labs host; launchd; built Next only |

Deploy details: `infra/deploy.md`.

---

## 4. Product surfaces (member-facing)

| Surface | Route (web) | Access |
|---|---|---|
| Course hub | `/` | Public (CMS via hub API) |
| Catalog | `/courses` | Public |
| Category hub | `/courses/category/[slug]` | Public |
| Course detail | `/courses/[slug]` | Public structure; lessons gated |
| Lesson player | `/courses/[slug]/lessons/[lessonSlug]` | Auth + entitlement / free preview |
| Live | `/live` | Public listing; join gated by category |
| Resources | `/resources` | Session-aware |
| Pathway | `/pathway` | Member |
| Dashboard / me | `/dashboard`, `/me` | Member |
| Membership / signup | `/membership`, `/signup`, `/login` | Public funnel |
| Guide / about | `/guide`, `/about` | Public docs |

Admin: in-place edit on production pages; hubs at `/admin`, `/admin/media`, `/admin/ai`.

---

## 5. Program phases (how docs map)

| Program | Charter | Role |
|---|---|---|
| **P1** | `agents/p1-foundation/CHARTER.md` | Platform spine (closed / load-bearing) |
| **P2** | `agents/p2-foundation/CHARTER.md` | Agentic ops + content studio |

P2 **does not replace** P1. Factory path: board cards → packages → draft placement via
admin/API → human in-place polish/publish. Capabilities: `docs/P2-Capabilities-for-P1.md`.
Operator how-to: `docs/ADMIN-GUIDE.md`.

---

## 6. Non-negotiable boundaries

1. **No MSC code** — MarketSwarm is API-only if used at all.  
2. **Config fail-loud** — missing structural env aborts API boot.  
3. **No dev server in staging/production** — Next serves `next build` output.  
4. **Draft → publish** — unpublished courses are invisible publicly.  
5. **Server-side authorization** — role checks never trusted from the client alone.  
6. **Process outcomes only** — no profit-claim product copy.  
7. **Documentation parity** — features ship with specs + decision log entries.

---

## 7. Technology choices (locked)

| Concern | Choice | Rationale (as-built) |
|---|---|---|
| API | Python FastAPI | Fast iteration, clear typing, simple deploy |
| DB | MySQL utf8mb4 | Ops familiarity; filename-ordered SQL migrations |
| Web | Next.js App Router | SSG public pages + client member routes |
| Sessions | HS256 JWT cookie `ft_session` | Shared `.fattail.ai` domain in prod |
| Lesson video | YouTube nocookie embeds | Launch speed; CDN upgrade path recorded |
| Agent LLMs | xAI Grok primary, Claude secondary | `server/ai/` interface |

---

## 8. Trust boundaries

| Trust zone | What is trusted |
|---|---|
| Browser | Nothing for authz; cookies only carry session token |
| Next.js server (build) | `NEXT_PUBLIC_*` for public URLs; build-time fetches to API |
| Next.js browser | Calls `/api/*` same-origin (rewritten to FastAPI) with cookies |
| FastAPI | Verifies JWT, loads identity/role from DB as needed |
| Stripe / WP webhooks | Signature verification before entitlement mutation |
| LLM providers | Server-side keys only; admin AI routes only |

---

*See 02–06 for layer design; 07 for the audit that produced this retroactive set.*
