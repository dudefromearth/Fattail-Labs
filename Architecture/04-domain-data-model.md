# Domain Data Model — MySQL `labs`

**Status:** As-built (retroactive, 2026-07-23)  
**Source of truth for shape:** `migrations/NNN_*.sql` + feature specs  
**Runner:** `server/migrate.py` (filename order, applied-file tracking)

---

## 1. Migration map

| Migration | Theme |
|---|---|
| `001_initial` | Core LMS domain: courses, modules, lessons, enrollments, progress, reviews, threads, live, pathways, certificates |
| `002_lesson_video_provider` | YouTube provider columns + params JSON |
| `003_identity_access` | Labs-native identity; links, credentials, plans, memberships, provider_plan_map |
| `004_quizzes` | quiz_questions, quiz_attempts |
| `005_plan_display` | plans.display_json for pricing UI |
| `006_attachment_visibility` | attachments.free_preview |
| `007_live_recurrences` | Recurring live series |
| `008_live_content_categories` | Audience **category** replaces min_role on live |
| `009_live_recurrence_overrides` | Per-date overrides + series bounds |
| `010_course_card_editor` | Card color (later simplified) |
| `011_unified_banner` | Single hero banner model for cards |
| `012_resource_description_emoji` | Attachment description + emoji |
| `013_category_descriptions` | Category hub copy |
| `014_bootstrap_admins` | Seed administrator identities (ops) |
| `015_hub_content` | site_pages + site_faq_items (hub CMS) |

**Rule:** never edit applied migrations; always append.

---

## 2. Bounded contexts

```text
Identity & Access          Content Library           Learning Activity
identities                 courses / modules         enrollments
credentials                lessons / attachments     lesson_progress
identity_links             categories / instructors  quiz_*
plans / memberships        site_pages / faq          certificates
provider_plan_map

Live                       Social                    Media (filesystem)
live_sessions              reviews                   uploads/
live_recurrences           threads / comments        uploads/private/
live_recurrence_overrides  students (derived)
```

---

## 3. Core entities (logical)

### 3.1 Identity & access

| Table | Purpose |
|---|---|
| `identities` | One person; unique email; optional `role_override` |
| `credentials` | scrypt password hash (native login) |
| `identity_links` | External ids: WP users, Stripe customer, … |
| `plans` | Product plans; `grants_role` |
| `memberships` | Active/grace/cancelled/expired entitlements by source |
| `provider_plan_map` | External entitlement key → plan (data, not env) |

**Role derivation (app):** `role_override` else best active plan’s role else `observer`.
Ladder: observer → alumni → activator → navigator → administrator.

### 3.2 Content

| Table | Purpose |
|---|---|
| `courses` | slug, title, markdown description, status draft\|published\|archived, trailer, hero, level, card_color |
| `modules` | Ordered sections; kind standard\|worksheets\|resources\|bonus |
| `lessons` | slug per module; kind video\|text\|…; video_id + video_params; free_preview; body_md |
| `categories` / `course_categories` | Taxonomy + hub copy (`description_md`) |
| `instructors` / `course_instructors` | Presenter bios |
| `attachments` | Course/lesson files/links; free_preview; description_md; emoji |

### 3.3 Learning activity

| Table | Purpose |
|---|---|
| `enrollments` | Explicit per-course enrollment (even under all-access) |
| `lesson_progress` | watch_seconds, last_position, completed_at |
| `quiz_questions` / `quiz_attempts` | Graded checks; answers never public |
| `certificates` | Completion artifacts (schema present) |

### 3.4 Live

| Table | Purpose |
|---|---|
| `live_sessions` | One-off or materializations; **category** audience |
| `live_recurrences` | RRULE-like series definition |
| `live_recurrence_overrides` | Cancel/modify single dates |

### 3.5 Social & pathway

| Table | Purpose |
|---|---|
| `reviews` | 1–5 + body; visible\|held |
| `threads` / `comments` | Course discussion |
| `pathways` | Member pathway state / recommendations |

### 3.6 Hub CMS

| Table | Purpose |
|---|---|
| `site_pages` | Hub title, lead, intro video, FAQ chrome |
| `site_faq_items` | Ordered FAQ accordion |

---

## 4. Important relationships

```text
courses 1──* modules 1──* lessons
courses *──* categories
courses *──* instructors
courses 1──* enrollments *──1 identities
lessons 1──* lesson_progress *──1 identities
identities 1──* memberships *──1 plans
identities 1──* identity_links
attachments → owner_type/owner_id (course|lesson)  [app-enforced, not FK]
```

---

## 5. Status & visibility rules (product)

| Object | Public visibility |
|---|---|
| Course `draft` / `archived` | Hidden from public list/detail (admin may open editor) |
| Course `published` | Catalog + SSG page |
| Lesson without entitlement | Titles may show; video/body gated; free_preview exceptions |
| Review `held` | Not public, not in aggregates |
| Live by category | Join/detail exposure depends on audience contract |

---

## 6. What is *not* in MySQL

| Concern | Storage |
|---|---|
| Banner/image binaries | `server/uploads/` |
| Private resource files | `server/uploads/private/` |
| Session state | Signed JWT cookie (not server session table) |
| LLM transcripts | Not persisted (v1 AI interface) |
| P2 backlog / production board | Not yet mechanized in DB (charter only) |

---

## 7. Evolution guidance

1. Spec first → migration number → API → web → tests → decision log.  
2. Prefer additive columns with backfill in the same migration.  
3. Dropping columns only with explicit Coach/India approval and a versioned spec.  
4. Keep domain language in APIs (**category**, **plan**, **enrollment**) — not provider jargon.

---

*Authz semantics: `05-security-and-access.md`.*
