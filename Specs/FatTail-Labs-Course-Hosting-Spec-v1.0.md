# FatTail Labs — Course Hosting Platform Spec v1.0

**Product:** FatTail Labs (`labs.fattail.ai`)
**Benchmark:** AI Labs by First Movers (`labs.firstmovers.ai`), analyzed live 2026-07-20
**Status:** Draft for review
**Author:** Spec drafted from first-hand teardown of the benchmark product

---

## 1. Purpose

Give FatTail.ai a first-class course hosting platform — catalog, course player, progress,
certifications, live sessions, community — modeled directly on the AI Labs member experience,
adapted to convex/asymmetric options trading education and wired into the existing
FOTW/0-DTE/MarketSwarm ecosystem (WordPress SSO, WooCommerce billing, Vexy cognition).

This is a **membership education product**, not a one-off course checkout: one subscription
unlocks the entire library, live sessions, resources, and community.

---

## 2. Benchmark Teardown — What AI Labs Actually Is

Observed directly (public pages + signup flow + marketing site). Their stack: custom **Next.js**
app, **Stripe** subscriptions, Mixpanel + MS Clarity + GTM + FB Pixel analytics, Google/Facebook
OAuth + email/password auth. Everything below was verified on the live product.

### 2.1 Commercial model

- **$250/month or $2,500/year** (annual = "save $500", positioned as Most Popular). Cancel anytime.
- Two-step signup: **Step 1** create account (email/name/password or Google/Facebook) →
  **Step 2** Stripe subscription checkout + email verification.
- Signup page is a conversion page: testimonial wall, "What happens next" checklist,
  trust badges ("Secure checkout powered by Stripe", "3,000+ students", 4.9/5 rating).

### 2.2 The six member-facing systems

1. **Course library** — 65+ courses/tutorials, new courses published monthly, with certifications.
2. **Personalized learning pathway** — 2-minute intake assessment routes members to the courses,
   bots, and templates matching their starting point.
3. **Live implementation workshops** — two fixed weekly slots (Tue 7 PM ET, Wed 2 PM ET),
   build-along format; replays land back in the library as courses.
4. **24/7 community** — private member community, direct access to the team, per-course
   discussion threads.
5. **Resources/templates/bots library** — 100+ downloadable prompts, SOPs, worksheets,
   "revenue-generating bots"; attached both globally and per-lesson.
6. **AI avatar tutor ("Ask Julia")** — voice-trained AI tutor available anytime, answering in
   the founder's frameworks.

### 2.3 Information architecture (observed routes)

| Route | Access | Content |
|---|---|---|
| `/login` | Public | Email → password step; Google/Facebook OAuth |
| `/signup` | Public | 2-step enrollment funnel with social proof |
| `/courses` | **Public (SEO)** | Full catalog — course cards fully readable logged-out |
| `/courses/{slug}` | **Public (SEO)** | Full course detail page; content gated at lesson level |
| `/dashboard` | Members | Member home (auth-gated) |

Making the catalog and course detail pages public is deliberate: every course page is a
long-form sales page and an organic search asset. Only the lesson content itself is gated.

### 2.4 Course card (catalog)

Each card carries: **category tags** (multiple: Claude, Agents, AEO/SEO, YouTube, Business…),
**title**, **long-form description** (150–400 words: problem → what you'll build → "By the end
you will have:" bulleted outcomes → "This course is designed for…" audience line),
**instructor** (name + avatar; multiple instructors exist), **level badge**
(Beginner/Intermediate), **enrolled count** ("108 enrolled"), **NEW badge** for recent drops.

### 2.5 Course detail page (observed layout)

- **Breadcrumb**: All Courses → course title.
- **Hero card**: full-width cinematic banner image with centered **trailer play button**,
  title overlaid, and a **metadata strip**: Level ("Beginner Level / Recommended Experience"),
  Rating (5.0 ★), "9 Modules / 11 lessons", Categories.
- **Right rail — "My Progress" card**: progress bar, status text ("Not started yet"),
  **Enroll** CTA (enrollment is per-course even inside the all-access membership — this is
  what powers progress tracking, enrolled counts, and cohort/discussion membership).
- **Tab bar**: `About | Modules | Resources | Course Discussion | Students`
  - **About**: course overview (3 outcome paragraphs), instructor card with bio,
    **Course Review** block (aggregate score + individual member reviews with names/avatars).
  - **Modules**: accordion of module cards; each contains lesson rows with a type icon
    (video lesson / worksheet / external resource), lesson title, and a completion chip.
    Non-video sections observed: "Worksheets", "Clone SOP Resources", "Bonus Training"
    (live-call replays attached to the course).
  - **Resources**: attached files/links for the whole course.
  - **Course Discussion**: per-course threaded comments.
  - **Students**: roster of enrolled members (social proof + community).

### 2.6 Course structure model

`Course → Modules (ordered sections) → Lessons`. Lessons are typed: video, download/worksheet,
external link (GPT/bot), live-replay. Courses range from a single tutorial video (a "tutorial")
to 9-module flagships. Ratings/reviews are per-course. Certifications are awarded on completion.

---

## 3. FatTail Labs — Product Definition

### 3.1 Positioning

**"The complete training and execution operating system for convex options traders."**
Courses teach the FatTail doctrine (asymmetry, convexity, 0-DTE structures, fat-tail risk);
live sessions are **live trading room + build-along workshops**; the resource library holds
routine logs, journals, playbooks, and scan templates; the AI tutor is **Vexy** — already built,
governance-constrained, and trained on the doctrine.

Content pillars (categories): `0-DTE` · `Butterflies` · `Convexity` · `Fat-Tail Doctrine` ·
`Risk & Sizing` · `Journaling & Routine` · `MarketSwarm Platform` · `Options Foundations` ·
`Psychology` · `Live Replays`.

### 3.2 Membership & entitlement tiers

Map to the existing cumulative role ladder (same vocabulary as MSC auth):

| Role | Meaning in Labs | Access |
|---|---|---|
| `observer` | Free account | Public catalog, course detail pages, designated free-preview lessons |
| `activator` | Labs member (paid subscription) | All courses, resources, community, replays |
| `navigator` | Coaching/premium tier | Everything + live trading room seats, small-group sessions |
| `administrator` | Staff | Authoring, moderation, analytics |

Pricing (placeholder, business decision): **$149/mo or $1,490/yr** monthly/annual toggle,
annual positioned as default. Same 2-step funnel as the benchmark.

### 3.3 The six FatTail systems (feature parity map)

| AI Labs system | FatTail Labs equivalent |
|---|---|
| 65+ courses w/ certifications | Course library w/ FatTail Certifications (e.g. "0-DTE Butterfly Operator") |
| Personalized learning pathway | **Trader Assessment** — 2-min intake (experience, capital, time available, instruments) → recommended pathway |
| Live implementation workshops | **Live Trading Room** (market hours) + weekly build-along workshop; replays auto-published |
| 24/7 community | Member community + per-course discussion |
| 100+ templates & bots | **Trade Lab Resources** — routine logs, journal templates (FatTail Routine Log), playbooks, scanner configs, Claude skills for traders |
| "Ask Julia" avatar tutor | **Ask Vexy** — doctrine-constrained tutor; answers in FatTail frameworks, never gives capital directives |

---

## 4. Information Architecture

### 4.1 Public (SEO surface)

**`/courses` is the entry point** (benchmark parity: `labs.firstmovers.ai/courses` is the
public front door; marketing long-form lives on the WP site, which links in via
"Browse Courses"). The catalog must therefore carry the conversion load: full course cards
readable logged-out, plus a persistent join CTA.

| Route | Page |
|---|---|
| `/` | Redirect: logged-out → `/courses`; authenticated member → `/dashboard` |
| `/courses` | **Entry point.** Catalog — public, fully indexed |
| `/courses/{slug}` | Course detail — public, lesson content gated |
| `/signup` | 2-step enrollment funnel |
| `/login` | Email + password, SSO buttons |

Marketing/sales landing (testimonial wall, pricing, FAQ, promise) stays on **fattail.ai**
(WordPress), linking to `/courses` and `/signup` — mirroring how firstmovers.ai/labs
feeds labs.firstmovers.ai.

### 4.2 Member

| Route | Page |
|---|---|
| `/dashboard` | Member home: Continue Learning (resume cards), pathway progress, next live session, new drops, community activity |
| `/courses/{slug}/lessons/{lessonSlug}` | Lesson player |
| `/live` | Live session calendar + join links + replay archive |
| `/resources` | Global resource library (filterable by category/type) |
| `/community` | Community feed (v1.1 — see §10) |
| `/pathway` | Assessment + personalized course sequence |
| `/certificates` | Earned certificates (shareable public verify URL) |
| `/account` | Profile, subscription management, notifications |

### 4.3 Admin

`/admin` — course builder, media library, live session scheduler, member management,
moderation queue, analytics. Role-gated to `administrator`.

---

## 5. Page Specs

### 5.1 Catalog (`/courses`) — the entry point

- This page is both the member library and the logged-out storefront; it must stand alone
  as the first thing a visitor ever sees.
- Header: "Courses & Tutorials" + category filter chips + level filter + search.
- Card grid (1-col mobile, 2–3 col desktop). Card anatomy (benchmark parity):
  category tags, title, long-form description (collapsed to ~6 lines with expand),
  instructor avatar+name, level badge, enrolled count, NEW badge (< 30 days),
  star rating when ≥ 3 reviews.
- Sort: Newest · Most enrolled · Highest rated · A–Z.
- Logged-out: identical page + sticky "Join FatTail Labs" CTA bar.

### 5.2 Course detail (`/courses/{slug}`)

Benchmark-parity layout:

```
[breadcrumb: All Courses > {title}]
┌────────────────────────────────────────────┐  ┌───────────────┐
│ HERO banner (art + trailer ▶)              │  │ My Progress   │
│ {Title}                                    │  │ ▓▓▓░░░░ 32%   │
│ [Level] [★ 4.8] [6 Modules · 24 Lessons]   │  │ 8/24 lessons  │
│ [Categories]                               │  │ [Continue →]  │
└────────────────────────────────────────────┘  │  or [Enroll]  │
[About | Modules | Resources | Discussion | Students]  └────────┘
```

- **About**: overview (outcome-driven copy), "You walk out with:" bullets, instructor card,
  reviews block (aggregate + list, "Show more" pagination).
- **Modules**: module accordion; lesson rows = type icon + title + duration + completion chip.
  Locked rows (logged-out / observer) show a lock and route to `/signup`.
- **Resources**: course-level attachments (files via signed URLs, external links).
- **Discussion**: per-course threads (§10).
- **Students**: enrolled member grid (name, avatar, join date). Member-visible only;
  logged-out shows count + blurred grid.
- **Right rail**: not-enrolled → `Enroll` (member) / `Join to Enroll` (observer);
  enrolled → progress ring, "Continue where you left off" deep link, certificate state.

### 5.3 Lesson player (`/courses/{slug}/lessons/{lessonSlug}`)

- **Left sidebar** (collapsible): module/lesson tree with completion ticks, current highlighted.
- **Main**: video player (resume position, playback speed, captions), lesson title,
  rich-text lesson body below the player, **attachments block** (worksheets, files, links),
  prev/next lesson controls, **Mark complete** (auto-fires at ≥ 90% watch, manual override).
- **Right/below**: lesson discussion thread (scoped comments).
- **Ask Vexy** dock: floating summon; context = current course + lesson (§11).
- Keyboard: space play/pause, ←/→ seek, `]` next lesson.

### 5.4 Dashboard (`/dashboard`)

Row 1 — **Continue Learning**: resume cards (course art, progress bar, "Resume Lesson 3.2").
Row 2 — **Next Live Session**: countdown card + Add to Calendar + Join (navigator gate shown inline).
Row 3 — **New This Month**: latest course/resource drops.
Row 4 — **Your Pathway**: current pathway step + completion %.
Row 5 — Community highlights (v1.1).

### 5.5 Signup funnel (`/signup`)

Step 1: account creation (email/name/password + Google/Apple OAuth) beside a testimonial wall
and "What happens next" checklist. Step 2: plan picker (monthly/annual) → checkout.
Post-purchase: email verify → assessment prompt ("2 minutes to personalize your pathway") →
dashboard. Instrument every step (§13).

---

### 5.6 SEO / AEO requirements (public pages)

Verified from the benchmark's live markup (2026-07-20) — they implement the AEO doctrine they
sell, and it shapes the public surface:

**What the benchmark does (adopt all of it):**

- **Server-rendered public pages.** Catalog and course detail are fully SSR'd Next.js —
  complete course copy, module lists, and reviews are in the initial HTML. Crawlers and
  AI answer engines never see an empty JS shell.
- **`Course` JSON-LD on every course detail page**: name, description, url, image,
  `provider` (Organization), `instructor` (Person), `hasCourseInstance` (courseMode: Online).
- **Marketing-site schema graph** (WP side): `Organization`, `WebSite`, `WebPage`,
  `BreadcrumbList`, `Service`, plus a **`FAQPage`** block on the sales page whose questions
  are phrased exactly as prospects ask AI engines ("What is the First Movers AI Labs?",
  "How can AI automation help my small business?").
- **Long-form, answer-shaped course descriptions** — problem → outcomes → audience.
  This is the 40–60-word-lead-answer AEO format; every course card doubles as extractable
  answer content.
- Per-page canonical URLs, full OG tag sets, ~92% image alt coverage.

**Benchmark gaps — FatTail must do better:**

| Their miss | FatTail requirement |
|---|---|
| Course page `<title>` is the generic "AI Labs by First Movers" on every course | Unique `<title>`: "{Course Title} — FatTail Labs" |
| Ratings/reviews exist but no `AggregateRating`/`Review` schema | Emit `aggregateRating` + top `review` nodes in Course JSON-LD once ≥ 3 reviews |
| No `Offer` in Course schema | Include `offers` (membership price, availability) |
| No `BreadcrumbList` on the app side | Emit on catalog + detail |
| No lazy-loading of images | `loading=lazy` below the fold |

**Architectural consequence:** the Labs UI cannot be a pure client-rendered SPA for public
routes. Catalog and `/courses/{slug}` must be **prerendered** (SSG at publish time —
regenerate the static page whenever a course is published/updated) or SSR'd. Member routes
(dashboard, player) stay client-rendered behind auth. This is compatible with the static-build
deployment doctrine: publish-time prerender produces static HTML per course slug.

**AEO content rules for course copy** (their own AEO course methodology, applied to us):
lead every course description with a 40–60 word direct answer to "what will this course do
for me"; use question-based H2s on the marketing page mirrored in `FAQPage` schema; maintain
comparison/definition blocks ("0-DTE vs weekly options", "What is a fat-tail trade") as
catalog-adjacent content pages — these are the formats AI engines extract and cite.

## 6. Domain Model

```
Course        (id, slug, title, subtitle, description_md, hero_image, trailer_video_id,
               level: beginner|intermediate|advanced, status: draft|published|archived,
               certification_enabled, created_at, published_at)
CourseCategory(course_id, category_id)          -- many-to-many
Instructor    (id, name, bio_md, avatar, links) -- courses have 1..n instructors
Module        (id, course_id, title, sort_order, kind: standard|worksheets|resources|bonus)
Lesson        (id, module_id, slug, title, sort_order, kind: video|text|download|external|replay,
               video_id, duration_seconds, body_md, external_url, free_preview: bool)
Attachment    (id, owner_type: course|lesson, owner_id, title, kind: file|link, url/object_key)
Enrollment    (id, identity_id, course_id, enrolled_at, completed_at, certificate_id NULL)
LessonProgress(id, identity_id, lesson_id, watch_seconds, completed_at NULL, last_position)
Review        (id, identity_id, course_id, rating 1..5, body, created_at, status: visible|held)
Thread        (id, scope_type: course|lesson, scope_id, identity_id, title, body_md, created_at)
Comment       (id, thread_id, identity_id, body_md, created_at, status)
Certificate   (id, identity_id, course_id, issued_at, verify_slug)
LiveSession   (id, title, kind: trading_room|workshop, starts_at, join_url,
               replay_course_id NULL, min_role: activator|navigator)
Pathway       (id, identity_id, assessment_json, course_sequence_json, updated_at)
```

Rules:

- **Enrollment is explicit** even with all-access membership (benchmark behavior): powers
  progress, enrolled counts, Students tab, and completion certificates.
- Course completion = all lessons in `standard` modules complete (worksheet/bonus modules
  excluded from the denominator).
- Reviews only from enrolled members with ≥ 1 completed lesson; aggregate shown at ≥ 3 reviews.
- `enrolled count` displayed on cards is the Enrollment count (social proof).

---

## 7. Architecture & Integration

### 7.1 Recommended shape

**DECIDED (2026-07-21): `labs.fattail.ai` is a platform, and MiniTwo (M2 Mac Mini) is its
sole production host.** Labs hosts a family of member-facing apps under one shell and one
login — **Courses is the first app**; Live, Resources, Pathway, and Community (§4.2) are its
siblings, mirroring how the benchmark composes its member surface. Labs is also the first
native fattail.ai property: the FatTail App remains on flyonthewall.io (DudeOne/DudeTwo)
until its own migration, and Labs establishes the fattail.ai zone (origin cert, Cloudflare
config, MiniThree vhost pattern) that migration will inherit.

Environments: dev = StudioTwo (localhost) → staging = DudeTwo (`labs-stage.fattail.ai`) →
production = **MiniTwo** (`labs.fattail.ai`). MiniThree nginx routes both hostnames;
Cloudflare proxied A records → the shared public IP. Build proceeds entirely on the internal
network; DNS/cert/vhost wiring is a launch-day step (~15 min). Session cookie domain is
`.fattail.ai` from day one so the future app migration shares SSO sessions.

**DECIDED (2026-07-21): Labs is a standalone repo (`fattail-labs`), fully independent of
MarketSwarm-Canonical.** No shared code with MSC — anything Labs needs from MarketSwarm is
consumed via API across the product boundary (Vexy gateway on 3003; MSC App API later for
deep-link context if needed). Rationale: MSC's shared machinery (SetupBase/truth, Node
Admin, fleet tooling) exists to coordinate an interdependent service fleet; Labs is one
service + one DB + one UI on its own host and stays simplest as a conventional,
self-contained web app. Separation also frees the stack choice (SSR/SSG framework for the
public SEO pages) from MSC's UI doctrine.

- **Repo:** `fattail-labs` on GitHub. MiniTwo deploys via `git pull` (SSH key on MiniTwo).
- **Backend:** single Python (FastAPI) service in the repo; own lightweight config
  (env/config file — no Redis truth), own logging, own minimal migration runner
  (`migrations/NNN_*.sql`, same filename-ordered convention). Reimplements the small SSO
  pieces it needs (HS256 dual-issuer JWT verify, role derivation) — ~100 lines, not a
  framework.
- **DB:** local MySQL on MiniTwo, `labs` database, owned by the repo's migrations.
- **Frontend:** Next.js (or equivalent SSG-capable framework) — public catalog/course pages
  statically generated at publish time (Course JSON-LD, unique titles per §5.6); member
  routes client-rendered behind auth. Production runs the built output only — no dev server
  in any environment (doctrine preserved).
- **Process management:** launchd on MiniTwo (native macOS supervisor) — not MSC Node Admin.
- **Routing:** MiniThree nginx adds `labs.fattail.ai` (→ MiniTwo) and `labs-stage.fattail.ai`
  (→ DudeTwo) vhosts. The MSC three-gateway topology is untouched.

### 7.2 Auth — dual WordPress SSO (DECIDED 2026-07-21)

**Labs uses the same dual-SSO architecture as the flyonthewall.io / stage.flyonthewall.io
apps, with issuers `fattail` (fattail.ai WP) + `0-dte` (0-dte.com WP).** WordPress +
WooCommerce is the single entry point that controls access: members sign in through their
WP site, and their subscription/membership state there determines their Labs role.

Mechanics identical to MSC auth: HS256 JWT with issuer-specific secrets, `(issuer,
wp_user_id)` compound identity key, universal `identity_id`, roles derived per-request from
the session JWT (no DB hit), role normalization (comma-string → list) as in
`auth_routes.py`/`middleware.py`. Session cookie: HttpOnly, SameSite=lax, domain
`.fattail.ai`. Same `identity_id` space as the trading app — a member is one identity across
FatTail App and Labs.

**Entitlement mapping is Labs-specific config** (not a copy of MSC's role rules): WooCommerce
subscription/membership plan slugs per issuer → Labs role (`observer`/`activator`/
`navigator`), e.g. fattail.ai Labs subscription → `activator`; 0-dte.com coaching membership
→ `navigator`. Admin bypass on either issuer, as in MSC. The MSC-specific "0-dte all
non-admin → navigator" coaching bypass does NOT automatically apply to Labs — the Labs
mapping table decides, and it lives in config per the config-driven doctrine.

WP-side work: fattail.ai WP gets the SSO endpoint (port of the existing `/fotw-sso`
mechanism) issuing `fattail`-issuer JWTs; 0-dte.com's existing SSO endpoint adds
`labs.fattail.ai` callbacks to its redirect allowlist. Google/Apple social login (benchmark
parity) lands as WP accounts so commerce and identity stay in one system.

Entitlement lifecycle: WooCommerce webhooks (`subscription_activated/cancelled/expired`) →
academy service → role change on next JWT refresh; 7-day grace on failed payment, then
downgrade to `observer` with progress/enrollments retained (§7.3).

### 7.3 Billing — WooCommerce Subscriptions (not Stripe-direct)

The benchmark runs Stripe directly; FatTail already operates WooCommerce on this server for
FOTW/0-DTE. Recommendation: **WooCommerce Subscriptions on fattail.ai WP** (Stripe as the WC
payment gateway) so commerce, refunds, dunning, and membership state live in the existing
stack. Entitlement sync: WC webhook (`subscription_activated/cancelled/expired`) → academy
service updates role mapping for the identity → next JWT refresh carries the role.
Grace period on failed payment: 7 days (configurable), then downgrade to `observer`
(progress and enrollments are retained — win-back asset).

### 7.4 Video pipeline

Decision table:

| Option | Pros | Cons |
|---|---|---|
| **Bunny Stream** (recommend) | Cheap, signed URLs, HLS, EU/US PoPs, per-video tokens | Player is basic (use Plyr/Vidstack over HLS) |
| Mux | Best DX, analytics | Cost scales fast with watch-time |
| YouTube unlisted | Free | Leakable, ads/recs, no real gating — rejected |

Signed playback tokens minted by the academy service per lesson request (member check server-side).
Trailer videos are public (unsigned).

### 7.5 Vexy integration ("Ask Vexy")

The academy service calls the existing Vexy gateway (3003) with an **academy context packet**:
`{identity, course, lesson, doctrine_refs}`. Governance rules apply unchanged — no capital
directives, doctrine-constrained. This is the direct analog of "Ask Julia" and a genuine
differentiator: the benchmark's tutor is a marketing feature; Vexy is already
governance-integrated.

---

## 8. API Surface (academy service)

```
# Public
GET  /api/academy/courses?category=&level=&sort=&q=
GET  /api/academy/courses/{slug}                      # detail incl. modules/lessons (lock flags)
GET  /api/academy/courses/{slug}/reviews?page=
GET  /api/academy/certificates/verify/{verify_slug}   # public certificate verification

# Member
POST /api/academy/courses/{slug}/enroll
GET  /api/academy/me/dashboard                        # resume cards, pathway, next session
GET  /api/academy/lessons/{id}/play                   # signed playback URL
PUT  /api/academy/lessons/{id}/progress               # {position, watch_seconds}
POST /api/academy/lessons/{id}/complete
POST /api/academy/courses/{slug}/reviews
GET/POST /api/academy/threads?scope=course:{id}|lesson:{id}
GET/POST /api/academy/threads/{id}/comments
GET  /api/academy/live/sessions
GET  /api/academy/resources?category=&kind=
GET/PUT /api/academy/me/pathway                       # assessment answers → sequence

# Admin (role: administrator)
CRUD /api/academy/admin/courses|modules|lessons|attachments|sessions|categories
GET  /api/academy/admin/analytics/*
POST /api/academy/admin/reviews/{id}/moderate
```

All member/admin routes behind the standard auth middleware; internal identity bypass
(`X-Internal-Identity` from localhost) works as elsewhere for E2E scripts.

---

## 9. Progress, Completion, Certification

- Watch progress persisted every 15s of playback (`last_position`, `watch_seconds`).
- Lesson complete: ≥ 90% watched (video) or explicit mark (text/download/external).
- Course complete → certificate issued automatically: branded PDF/PNG + public verify URL
  (`/certificates/verify/{slug}`) for LinkedIn sharing. Certificate names the certification
  track (e.g. "FatTail Certified: 0-DTE Butterfly Operator").
- Dashboard "Continue Learning" resumes at `(course, first incomplete lesson, last_position)`.

## 10. Community & Discussion

- **v1.0:** per-course + per-lesson threads (Thread/Comment model), admin moderation queue,
  report button, instructor-badge on staff replies. This covers the benchmark's
  "Course Discussion" tab.
- **v1.1:** global community feed (`/community`) with channels (Wins, Trade Review, Questions,
  Off-Topic). Decision point: build on the Thread model vs. embed an existing community
  (Discord/Circle). Recommend building on the Thread model — the benchmark's moat is that
  community, courses, and live sessions share one login and one surface.

## 11. Live Sessions

- Fixed weekly cadence (benchmark pattern): e.g. **Live Trading Room** on market days
  (navigator) + **Weekly Workshop** (activator).
- `/live`: upcoming sessions with countdown, Add-to-Calendar (ICS), role-gated Join
  (Zoom/StreamYard URL revealed at T-15m).
- Replays: recording uploaded → auto-created as lessons in a rolling "Replays — {Month}"
  course, categorized `Live Replays` (exactly how the benchmark folds "Bonus Training /
  Live Training Part 1–2" into courses).

## 12. Admin Authoring (v1.0 scope)

- Course builder: metadata, hero/trailer upload, category/instructor assignment,
  module + lesson CRUD with drag-reorder, per-lesson video upload (direct-to-Bunny),
  attachments, free-preview flag, draft → publish workflow.
- Enrollment/member lookup by identity, progress view, certificate re-issue.
- Review + comment moderation queues.
- Analytics: enrollments, completion funnel per course, watch-through per lesson,
  DAU/WAU, churn cohort by signup month.

## 13. Analytics & Instrumentation

Benchmark instruments heavily (Mixpanel, Clarity, GTM, FB Pixel). FatTail v1.0:

- Product analytics (Mixpanel or PostHog): `signup_step_1/2`, `subscription_started`,
  `enrolled`, `lesson_started/completed`, `course_completed`, `review_submitted`,
  `live_join`, `resource_downloaded`, `vexy_asked`.
- Marketing pixels via GTM on public pages only (catalog/detail/signup) — never inside the
  member app.
- North-star: **weekly active learners** and **course completion rate** (benchmark showcases
  completion-driven testimonials for a reason — completions produce the social proof that
  fuels the public course pages).

## 14. Build Phases

| Phase | Scope | Outcome |
|---|---|---|
| **P1 — Core spine** | Auth (fattail issuer), WC entitlement sync, course/module/lesson model + migrations, catalog + course detail (public), lesson player, progress, enroll | Sellable product: watchable gated courses |
| **P2 — Parity** | Reviews, Students tab, course discussion, resources library, dashboard, certificates | Full benchmark feature parity |
| **P3 — Differentiators** | Live sessions + replay pipeline, pathway assessment, Ask Vexy dock | Beyond-benchmark: live trading room + governed AI tutor |
| **P4 — Growth** | Community feed, admin analytics, email lifecycle (drip on stalled progress), annual-plan win-back | Retention engine |

## 15. Open Decisions

1. **Price point** ($149/mo placeholder) and whether navigator (trading room) is a separate
   SKU or an upgrade add-on.
2. Domain: `labs.fattail.ai` vs `fattail.ai/labs` (spec assumes subdomain; cleaner routing,
   separate static build).
3. Community v1.1: native (Thread model) vs embedded third-party — spec recommends native.
4. Video CDN: Bunny (recommended) vs Mux — confirm expected monthly watch-hours first.
5. Whether MarketSwarm platform courses ("MarketSwarm Platform" category) should deep-link
   into the live app (e.g. open Risk Graph with a seeded example) — strong candidate for P3.

---

*Benchmark evidence: labs.firstmovers.ai `/login`, `/signup`, `/courses`, `/courses/clone-to-scale` (public pages, captured 2026-07-20); firstmovers.ai/labs marketing page. Their stack: Next.js, Stripe, Mixpanel/Clarity/GTM/FB Pixel, Google+Facebook OAuth.*
