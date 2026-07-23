# Frontend Design — Next.js (`web/`)

**Status:** As-built (retroactive, 2026-07-23)

---

## 1. Responsibilities

- **Public acquisition pages** — catalog, course detail, category hubs, hub home, SEO  
- **Member product** — player, progress, live, resources, pathway, dashboard  
- **Auth funnel** — login, signup, membership checkout UI  
- **In-place admin** — production page becomes editor for administrators  
- **Operator control plane** — `/admin/*` shell (no member header): board Kanban,
  media, AI workbench, agent keys, notification bell  

The browser never talks to MySQL. All data flows through the Labs API.

---

## 2. Rendering strategy

| Kind | Mechanism | Examples |
|---|---|---|
| **SSG / static** | `generateStaticParams` + build-time fetch | Course detail, catalog-adjacent public pages |
| **Dynamic / client** | Client components + cookie session | Lesson player, dashboard, admin edit chrome |
| **Force dynamic** | `dynamic = "force-dynamic"` | Some admin pages (media, AI) |
| **Revalidation** | `POST /api/revalidate` (Next route) after admin save | Publishes/edits regenerate static HTML |

**Production rule:** `npm run build` + `npm start` only. Dev server is local-only.

**Proxy:** `next.config.ts` rewrites `/api/:path*` → `NEXT_PUBLIC_LABS_API_URL/api/:path*`
so the session cookie is **same-origin** (no CORS dance for browser fetches).

Build-time server fetches still use `NEXT_PUBLIC_LABS_API_URL` directly (`lib/api.ts`).

---

## 3. App Router map

```text
web/app/
  page.tsx                         # Course hub (/)
  courses/page.tsx                 # Catalog
  courses/[slug]/page.tsx          # Course detail (tabs, enroll, admin edit)
  courses/[slug]/lessons/[lessonSlug]/page.tsx
  courses/category/[catSlug]/page.tsx
  live/  pathway/  resources/  dashboard/  me/
  login/  signup/  membership/
  guide/  about/
  admin/                    # control plane layout (no SiteHeader)
  admin/board/              # Kanban production board
  admin/media/  admin/ai/  admin/agents/
  admin/courses/[slug]/
  sitemap.ts  robots.ts
  api/revalidate/route.ts          # Next-only; not rewritten away
```

Member chrome is suppressed under `/admin` via `AppChrome` + `admin/layout.tsx`
(Admin Dual Surface Spec v1.0). In-place edit remains on production URLs.

---

## 4. Client architecture

### 4.1 Libraries (`web/lib/`)

| Module | Role |
|---|---|
| `api.ts` | Build-time `apiUrl` / `apiGet` (requires `NEXT_PUBLIC_LABS_API_URL`) |
| `client.ts` | Browser JSON verbs, media upload, revalidate helper |
| `types.ts` | Shared TypeScript domain shapes |
| `catalog.ts` / `hub.ts` | Fetch helpers for public data |
| `useIsAdmin.ts` | Cached `/api/auth/me` → administrator boolean |
| `progressEvents.ts` | `labs:progress` same-tab events for nav rails |
| `ui.ts` | Small UI helpers |

### 4.2 Component domains (`web/components/`)

| Area | Examples |
|---|---|
| Catalog / course | `CatalogGrid`, `CourseTabs`, `TrailerHero`, `EnrollCard` |
| Player | `LessonPlayer`, `LessonBody`, `LessonCourseNav`, `QuizPlayer` |
| Live | `LiveSessions`, `live/*` admin managers |
| Member | `MyLearning`, `ContinueLearning`, `Pathway`, `MembershipPlans` |
| Social | `ReviewsSection`, `DiscussionSection`, `StudentsSection` |
| Resources | `ResourceLibrary` |
| Hub | `hub/*`, `HubIntroVideo` |
| In-place admin | `edit/*` — EditContext, bars, editable fields, danger zone, media |
| Admin app | `admin/BoardKanban`, `AdminNotifications`, `AgentsPanel`, `AgentWorkbench` |
| Shell | `SiteHeader` (member), `AppChrome` (suppress header on `/admin`) |

### 4.3 In-place admin model

When `useIsAdmin()` is true on a surface that supports editing:

1. Edit FAB / bar appears  
2. Text/markdown/select fields become editable  
3. Saves hit `/api/admin/*` with credentials  
4. Structural ops (add module, reorder) may apply immediately with conflict rules  
5. Successful content changes trigger revalidation of public paths  

There is **no separate course builder app**. The production page is the editor
(In-Place Admin specs v1.0–v1.5).

---

## 5. SEO / AEO design

Owned with Sierra’s formula; implemented across:

- Unique titles / metadata per public page  
- Course JSON-LD (+ offers, trailers as VideoObject where specified)  
- `sitemap.ts`, `robots.ts`, public `llms.txt`  
- Free-preview lesson landings as crawlable teaching snippets (gated fields withheld)  
- Canonical host: `NEXT_PUBLIC_SITE_URL` / production `https://labs.fattail.ai`  

Specs: SEO v1.0–v1.3.

---

## 6. Auth UX

| Path | Behavior |
|---|---|
| `/login` | Native credentials + SSO buttons from `/api/auth/providers` |
| `/signup` | Registration + membership funnel steps |
| Header | Logged-out CTAs ↔ logged-in avatar menu |
| Session | HttpOnly `ft_session` via API Set-Cookie; browser uses `credentials: "same-origin"` |

Dev convenience: `/api/auth/dev-login` (API, env=dev only) sets administrator cookie.

---

## 7. Admin control plane UI

| Route | Component | Role |
|---|---|---|
| `/admin` | Overview cards | Cockpit home |
| `/admin/board` | `BoardKanban` | Drag cards across process columns; package checklist; approve/place |
| `/admin/ai` | `AgentWorkbench` | Live Grok/Claude tasks |
| `/admin/agents` | `AgentsPanel` | Mint/revoke `ftl_ag_` keys |
| `/admin/media` | `MediaLibrary` | Public uploads |
| Header **Alerts** | `AdminNotifications` | Inbox + optional browser `Notification` API |

Board deep-link: `/admin/board?item=<id>` (from email/alerts).  
**Re-apply placement** rebuilds draft course structure from the package.

Playwright AI: `web/e2e/agent-workbench.spec.ts` (`npm run test:e2e:ai`).

---

## 8. Styling

- Tailwind CSS v4  
- Geist fonts via `next/font`  
- Design tokens / polish owned by Echo in product work; no separate design-system package yet  

---

## 9. Build & env (frontend)

| Variable | Role |
|---|---|
| `NEXT_PUBLIC_LABS_API_URL` | API origin (required; rewrite + build fetch) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadataBase / SEO |

`prebuild` clears `.next/cache/fetch-cache` so SSG does not serve stale catalog.

---

## 10. Deliberate limitations (as-built)

| Limitation | Note |
|---|---|
| Content CMS remains in-place | Admin app is control plane, not a second course editor |
| Heavy course page client state | Cost of in-place admin on SSG shells |
| AI workbench may not always pass `content_item_id` in UI | API supports attach; wire card picker if needed |
| No Storybook / visual regression suite yet | Echo process + selective Playwright |
| Member UI not fully offline-capable | Online session required |

---

*API contracts: `02-backend-design.md`. Domain entities: `04-domain-data-model.md`.*
