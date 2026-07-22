# FatTail Labs — Admin Guide

The operator's manual: every admin workflow in one place. Each section cites
its spec (in `Specs/`) — the spec is authoritative; this is the how-to.
Everything here requires the **administrator** role.

---

## 1. The editing model

There are no separate admin forms for content — **the production page is the
editor**. When you're signed in as an administrator:

- Course pages show an **Edit** button (bottom-right). Edit mode turns text
  blocks into editors on click — title, subtitle, description, lesson fields.
  Save/Discard in the edit bar; structural changes (add module/lesson,
  reorder, delete) apply immediately and refuse to run while you have unsaved
  text edits. *(In-Place Admin specs v1.0–v1.5)*
- Saving a published course **regenerates its static page** — the public site
  updates within seconds.

## 2. Course lifecycle

- **Create:** the "+ New Course" card at the end of the catalog. Courses are
  born as drafts at `/admin/courses/{slug}` — fully editable in place before
  they exist publicly.
- **Publish:** set status → published in the edit bar. The page, catalog,
  sitemap, and category hubs pick it up automatically.
- **Unpublish / delete:** the Danger Zone at the bottom of the course page in
  edit mode. Unpublish returns it to draft (public URL 404s; content kept).
  Delete requires typing the course title and removes everything — modules,
  lessons, progress, reviews, attachments including private files.
- Drafts are invisible publicly, but if you open a draft's public URL as
  admin, the 404 page routes you to its editor.

## 3. Lessons & video

- Videos are YouTube: paste any YouTube URL or bare ID into a lesson's video
  field — it normalizes to the ID and plays through the privacy embed
  (youtube-nocookie). *(Lesson Video spec)*
- Watch progress reports automatically; ~90% marks complete.
- **Lesson notes** (below the video): click to edit, Markdown with live
  preview. Embed images by the 🖼 toolbar button, **paste**, or
  **drag-drop** — they upload to the media store and insert at the cursor.
- ⚠️ **Notes on free-preview lessons are public** — they render on the
  anonymous landing page and drive its search description. Write them as
  landing copy. *(SEO spec v1.1)*

## 4. Card, banner, media

- **✎ Card** on any catalog card (admin only): pick a banner color from the
  palette, or set the banner image. One image serves both surfaces — sharp on
  the card, blurred + shaded behind the course page header. *(Card Editor
  v1.1)*
- Banners also upload from the course page (Hero image chip in edit mode).
- **`/admin/media`** — the media library: every public upload, copy URL,
  delete. Deleting a file still used as a banner or attachment is refused and
  tells you what uses it.

## 5. Quizzes

Set a lesson's kind to **quiz**, then build questions on the lesson page
(admin sees the builder below the player area): multiple choice, true/false,
short answer (case-insensitive grading), each with an optional explanation.
Correct answers never reach the browser — grading is server-side.

## 6. Resources

Course attachments ARE the resource library. Manage them in two places:

- **Course page → Resources tab** (edit mode): add/rename/delete, toggle
  Free vs Members.
- **`/resources`** (admin controls appear on the page): create with course
  selector, title, URL or private-file upload, Free checkbox, emoji, and
  description; edit any item in place (emoji picker, title, description).

Free = any signed-in account. Members = active membership or alumni. Private
files are streamed through a role-checked download — never a public URL.

## 7. Live schedule

On `/live` as admin: *(Live Sessions specs v1.1–v1.5)*

- **Recurring schedule manager:** create a series — title, kind, weekdays,
  start time (**Eastern**), duration, join URL, **audience category**
  (Public / All members / Coaching), and an optional end (never / on date /
  after N days).
- **One-off scheduler** for specials.
- **Edit any occurrence:** click its calendar chip → Edit. Choose scope:
  *this event only* (creates an exception, marked "edited"), *this and all
  future events* (splits the series), or *all events in this sequence*.
  Delete honors the same scopes.
- Categories are the access contract: Public = no sign-in (the 0DTE show),
  Members = Observer/Activator/Navigator, Coaching = Observer & Navigator.
- Join URLs only ever reach members who pass the gate, inside the
  T−15min window.

## 8. Categories & hub copy

Category intro copy (shown on `/courses/category/{slug}`) lives in the
database (`categories.description_md`), seeded from `server/seed_dev.py`.
No UI editor yet — edit via seed + rerun, or SQL. Empty categories don't get
hub pages.

### Course hub page (`/`)

The front door is CMS-backed (migration `015_hub_content.sql`). As an
administrator, open `/` and use **✎ Edit** (same pattern as course pages):

- **Title**, **lead description** (markdown), **intro video** (YouTube ID/URL
  + overlay title)
- **FAQ block:** title, description, ordered items — each item is a
  **question** (plain text) + **answer** (markdown with image upload via
  🖼 / paste / drag-drop). Accordion UI for members (one open at a time;
  collapsed by default). Add / reorder / delete items in edit mode.
- **Save & Publish** writes `site_pages` + `site_faq_items` and revalidates
  `/`. Category course grids on the hub remain catalog data, not this CMS.

## 9. Membership operations

- **Plans and entitlements are data**, not code: `plans`,
  `provider_plan_map`, and `memberships` tables. *(Identity & Access spec)*
- Stripe: prices link via `server/link_stripe_price.py`; the webhook is the
  source of truth for membership state. Keys go in `.env`
  (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `LABS_WEB_ORIGIN`).
- WordPress SSO (fattail.ai / 0-dte.com) maps roles through
  `provider_plan_map` — control access from WooCommerce without touching
  Labs.
- **The alumni rule is automatic**: ≥28 days of paid tenure at churn grants a
  1-year course-access membership, on both the Stripe and WordPress paths.
- Create a user by hand: `server/create_user.py`.
- **Bootstrap administrators** (migration `014_bootstrap_admins.sql`):
  `ernie@fattail.ai`, `conor@fattail.ai`, `coach@fattail.ai` — each has
  `role_override = administrator`. Grant a native password with
  `create_user.py <email> --admin`, or they sign in via WordPress SSO
  (WP `administrator` role also stamps `role_override` on first SSO if unset).

## 10. Rhythm & rules

```bash
# after any server change
cd server && .venv/bin/python -m pytest tests -q     # must be green
.venv/bin/python migrate.py                           # apply migrations

# after any web change
cd web && npm run build                               # then restart npm start
```

- Every feature ships with its spec, decision-log entry, and tests — nothing
  hidden. `Architecture/00-decision-log.md` is the project's memory.
- Deploy playbook: `infra/deploy.md` (MiniTwo provisioning, launchd, the
  canonical-host 301 at launch).
