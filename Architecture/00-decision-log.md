# FatTail Labs — Architecture Decision Log

Append-only. Each entry: date, decision, rationale. Reversals get a new entry, never an edit.

---

## 2026-07-20 — Product model benchmarked on AI Labs by First Movers

Live teardown of labs.firstmovers.ai (custom Next.js + Stripe, no LMS platform). Adopted:
public `/courses` catalog as entry point, public course detail pages with gated lessons,
explicit per-course enrollment inside all-access membership, module/lesson accordion,
reviews, per-course discussion, live sessions folded back into the library as replays.
Full teardown in `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md` §2.

## 2026-07-20 — Positioning: "stop the bleeding"

Capital preservation is the first step to trading success and for many the only one.
Funnel strategy: sell the dream, sequence the discipline — pathway routes everyone through
the stop-the-bleeding flagship first. Marketing uses process outcomes, never profit claims.

## 2026-07-21 — Standalone repo; no shared code with MarketSwarm-Canonical

Only reason to share the repo would be reusing MSC code, which is not a requirement.
Anything needed from MarketSwarm is consumed via API (Vexy gateway :3003; MSC App API
later). Kills drift risk, frees the stack choice.

## 2026-07-21 — Stack: FastAPI + MySQL + Next.js

FastAPI backend (`server/`), own MySQL `labs` database, own filename-ordered migration
runner. Next.js frontend (`web/`): public pages statically generated at publish time
(Course JSON-LD, unique titles — spec §5.6); member routes client-rendered behind auth.
No dev servers outside dev.

## 2026-07-21 — Hosting: MiniTwo is the sole Labs production host

labs.fattail.ai → MiniTwo (M2 Mac Mini), supervised by launchd (not MSC Node Admin).
Staging labs-stage.fattail.ai → DudeTwo. MiniThree nginx routes both; Cloudflare proxied
A records → shared public IP. Rationale: blast-radius separation from the trading app
(DudeOne), whose peak-reliability hours coincide with Labs traffic peaks. Build proceeds
fully on the internal network; DNS/cert/vhost is a launch-day step.

## 2026-07-21 — Labs is the first native fattail.ai property

flyonthewall.ai was retired (trademark); the FatTail App remains on flyonthewall.io until
its own migration. Labs establishes the fattail.ai zone (origin cert, Cloudflare config,
vhost pattern) that the app migration will inherit. Session cookie domain `.fattail.ai`
from day one so future app migration shares SSO sessions.

## 2026-07-21 — Auth: dual WordPress SSO; WooCommerce is the access-control entry point

Issuers `fattail` (fattail.ai WP) + `0-dte` (0-dte.com WP), same architecture as the
FatTail App's SSO. `(issuer, wp_user_id)` compound identity, universal identity_id,
cumulative roles observer < activator < navigator < administrator. Entitlement mapping
(WooCommerce plan slug → role, per issuer) is config — MSC's blanket 0-dte coaching bypass
does NOT auto-apply. Selling/cancelling/refunds happen only in WordPress; webhooks sync.

## 2026-07-21 — Admin is custom and in-app

`/admin` (role: administrator) owns all course authoring. WordPress has no role in course
content. LearnDash is fully replaced: WP keeps commerce + identity only.

## 2026-07-21 — Repo layout mirrors MarketSwarm-Canonical

`Specs/` (versioned, immutable once approved), `Architecture/` (durable docs + this log),
`infra/` (deploy playbooks). Same muscle memory across both repos.

## 2026-07-21 — Lesson video: YouTube embeds with per-lesson player parameters

Lessons carry `video_provider` + `video_id` + `video_params` (JSON). The API validates
params against an allowlist (autoplay, controls, start, end, mute, loop, rel,
cc_load_policy, fs, hl, playsinline) and builds the embed URL server-side
(youtube-nocookie.com, rel=0 + playsinline baseline); the client never assembles player
URLs. Free-preview lessons are publicly playable; gated lessons 401 until the member
path. **Accepted tradeoff:** spec §7.4 rejected YouTube for gated content (unlisted links
are leakable); Coach chose YouTube for launch speed — signed-CDN migration (Bunny/Mux)
remains the recorded path if/when leakage matters. Placeholder video: Big Buck Bunny
(Blender Foundation official upload).

## 2026-07-21 — Admin is edit-in-place on the production interface

No separate admin panel: administrators see a floating ✎ Edit button on the production
course page; activating it opens the editor over the same page (course fields + per-lesson
title/YouTube video/start/end/free-preview). Saves hit `/api/admin/*` (role-gated
server-side), then `/api/revalidate` regenerates the static page in place — publish IS
the prerender. Course pages use `dynamicParams=true` so revalidation can regenerate
(dynamicParams=false 404s after cache purge — NoFallbackError). Browser API calls ride a
same-origin Next rewrite proxy (`/api/*` → Labs API) so the session cookie flows without
CORS. Dev-only `/api/auth/dev-login` (404 outside LABS_ENV=dev) issues an administrator
session until WordPress SSO lands; staging/production sessions come only from SSO.

## 2026-07-21 — Catalog covers every category; real channel videos as examples

One published course per category (9 categories: 0-DTE, Butterflies, Convexity, Fat-Tail
Doctrine, Risk & Sizing, Journaling & Routine, MarketSwarm Platform, Options Foundations,
Psychology) + the flagship + the draft-invisibility fixture. All video lessons use real
uploads from youtube.com/@0DTE with accurate durations; first lesson of every course is
a free preview. Live Replays category deferred until the replay pipeline exists.

## 2026-07-21 — Builds always clear the Next fetch cache (stale-prerender defect)

Defect: Next.js persists fetch responses across builds (`.next/cache/fetch-cache`); a
rebuild after reseeding baked the OLD catalog (2 courses instead of 10) into the static
pages. Fix: `prebuild` script removes `fetch-cache` before every `next build`, so
prerender always reflects current database state. Runtime admin edits are unaffected
(revalidatePath purges correctly); this only bit build-time data freshness.

## 2026-07-21 — Identity & access: Labs-native model, providers pluggable

Coach directive: Labs owns its own identity/roles/subscriptions/memberships model and
must work standalone; WordPress + WooCommerce demoted from foundation to pluggable
provider. Spec: FatTail-Labs-Identity-Access-Spec-v1.0 (supersedes parent §7.2–7.3's
WP-first model; the dual-issuer JWT mechanics survive inside the WordPress provider).
Core: Identity (email = universal key) / IdentityLink / Credential (stdlib scrypt) /
Plan / Membership / ProviderPlanMap (migration 003). One role algorithm for all paths:
role_override else best active-membership plan else observer. Native login + operator
CLI; SSO callback + HMAC membership webhooks per provider; login page renders SSO
buttons only for configured providers. LABS_ENTITLEMENTS env removed — entitlement
mapping is now data. Verified: native admin/member/observer logins, wrong-password 401,
simulated WP SSO grant → activator, forged-webhook 401, signed cancellation → observer
on next login, same identity across provider logins.

## 2026-07-21 — Global site header: Join CTA / membership avatar on every page

Sticky header mounted in the root layout (all pages): brand → /courses, Courses nav.
Right side is auth-state-driven via /api/auth/me after hydration (static pages ship the
neutral shell): logged out → "Sign In" + "Join FatTail Labs" CTA; logged in → initials
avatar (emerald = activator+, gray = observer) opening a menu with name, role label
(Free account / Member / Coaching member / Admin), Dashboard, Become-a-member upsell
for observers, Sign out. Belongs in parent spec v1.1's shell section when that version
is cut.

## 2026-07-21 — Header amendment: logged-out avatar slot IS the sign-in button

Refines the header entry above: no "Sign In" text link — the avatar position renders a
gray person-silhouette circle linking to /login when logged out, keeping the avatar slot
constant across auth states (silhouette → your initials on sign-in).

## 2026-07-21 — Header final form: Log In + Sign Up buttons ⇄ avatar

Supersedes the two header entries above. Logged out: "Log In" (outline) + "Sign Up"
(emerald) buttons. Logged in: both replaced by the initials avatar (emerald activator+,
gray observer) whose dropdown holds user info (name, role label) and actions (Dashboard,
Become-a-member for observers, Sign out).

## 2026-07-21 — Signup is live; previews require an account; members get playback

Spec: FatTail-Labs-Enrollment-Access-Spec-v1.0 (supersedes YouTube spec §5 public
previews). Self-serve registration (POST /api/auth/register: free observer account,
session issued, 409 on existing email — no password attach to SSO identities). Lesson
access matrix: anonymous → 401 everywhere (the preview is the reward for signing up);
observer → previews 200, gated 403; activator+ → member playback of gated lessons
(activated now that roles are real). Player renders distinct prompts: 401 → "Create a
free account to watch"; 403 → "Become a Member". All lesson rows link to the player —
the lesson endpoint is the sole access authority. Accepted debt: no email verification
yet (must land before production launch).

## 2026-07-21 — Catalog cards adopt the Udemy model (banner card + hover info panel)

Coach directive with Udemy reference. Compact card: banner (hero image when set;
otherwise deterministic per-category gradient art with category label + title), title,
instructor, rating stars + review count (or NEW / "Not yet rated"), meta line
(total duration · level · lesson count). Hover (desktop only, lg+) raises an expansive
panel beside the card — title, NEW/Certification badges, "Updated <Month Year>", meta,
subtitle, up to 3 ✓ outcome bullets parsed from the description's outcome list, View
Course CTA; panel flips to the left for last-column cards. API list payload gained
total_duration_seconds + review_count. Touch devices tap straight through to the course
page. Belongs in parent spec v1.1 §5.1 when cut.

## 2026-07-21 — Progress tracking shipped (watch position, auto-complete, dashboard)

Spec: FatTail-Labs-Progress-Tracking-Spec-v1.0 (implements parent §9's progress half;
certificates deferred to their own spec). Endpoints: POST /api/progress (delta clamped
≤60s, auto-complete at ≥90% cumulative watch for videos), POST /api/progress/complete
(manual/non-video), GET /api/me/progress?course=, GET /api/me/continue (percent over
standard-module lessons only; resume = latest-touched incomplete). Player wraps the
served iframe with the YouTube IFrame API (enablejsapi now in base embed params):
resume-seek >10s, 5s sampling, 15s reporting + pause/end/leave flushes; Mark-complete
button; prev/next lesson nav. Course Modules tab shows ✓ ticks; dashboard Continue
Learning renders progress bars + resume deep links. Verified live end-to-end incl. real
playback auto-reporting (28s position captured with no manual action), access matrix on
progress writes (anon 401, observer-on-gated 403), clamping, and worksheets excluded
from completion denominators.

## 2026-07-21 — Enrollment records + student page + dropdown consolidation

Spec: FatTail-Labs-Enrollment-Records-Student-Page-Spec-v1.0. Enrollment = explicit
(course-page Enroll card) or automatic on first progress event (no orphan progress);
never an access gate. Course completion stamped on the enrollment when all
standard-module lessons complete. Enrolled counts on cards/pages are now real. New
APIs: POST /courses/{slug}/enroll, GET /api/me/enrollments, GET /api/me/activity
(merged enrolled/watched/completed feed + stats). Avatar dropdown gains a lazy-loaded
CONTINUE LEARNING section (top 3 in-progress, mini bars, resume deep links) and a My
Learning link to /me — the student page: stats row (enrolled/completed/lessons/watch
time), full enrollment list with Continue/Review actions, Quiz Results placeholder
(future quiz spec's home), and the activity feed. Course-page right rail replaced by
the session-aware EnrollCard (anon → Join, signed-in → Enroll, enrolled → progress +
Continue, completed → ✓). Verified live: explicit + auto enroll, idempotency,
completion stamping, dropdown, /me rendering all sections.

## 2026-07-21 — In-place editing v1.1: direct manipulation replaces the modal

Spec: FatTail-Labs-InPlace-Admin-Spec-v1.1 (supersedes v1.0's modal form; server
contract unchanged). Coach: the element IS the editor — click a block of text and it
becomes its editor, in its own place. Implemented: edit-mode toggle + floating edit bar
(status select, pending count, Discard/Exit/Save & Publish, dirty-navigation warning);
EditableText/EditableMarkdown/EditableSelect client components rendering display markup
identical to static output (SEO unaffected — zero edit artifacts in prerendered HTML);
lesson rows edit inline (title, video URL/ID, start/end, preview); markdown block editor
with Preview using the same renderer as the public page. Site-wide markdown decision
folded in: react-markdown + rehype-sanitize replaces the minimal renderer (md.tsx
deleted); lesson body_md renders as markdown and is click-to-edit on the lesson page
(body_md added to the admin field allowlist). v1.0 modal (AdminBar.tsx) deleted — no
parallel implementations. Verified live: edit mode affordances, in-place title edit →
Save & Publish → regenerated page, static HTML clean of affordances.

## 2026-07-21 — Ratings & Reviews + Course Discussion (benchmark parity)

Coach reaffirmed: Labs operates with or without WordPress — both features build purely
on the native model. Specs: FatTail-Labs-Reviews-Spec-v1.0 +
FatTail-Labs-Course-Discussion-Spec-v1.0.

Reviews: eligibility = enrolled + ≥1 completed lesson (server-enforced); rating 1–5,
one per identity per course, writing again upserts; aggregate public at ≥3 visible;
admin moderate visible/held (held never renders publicly nor counts). Course Review
block in the About tab: aggregate + stars, list w/ Show more, star-picker write form,
per-review admin Hide/Show. After a write the client revalidates the course page —
/api/revalidate loosened to any authenticated session for /courses/* (idempotent),
keeping the baked hero rating + JSON-LD aggregateRating fresh.

Discussion: course-scoped threads + comments (migration-001 tables). Reading public
(community as sales surface); posting requires any authenticated account (observer+);
bodies render through the sanitizing markdown renderer; Admin badge on staff posts;
admin moderate on threads/comments; Discussion tab now enabled, client-fetched.

Verified live: full reviews matrix (eligible post, ineligible reason, anon 401, bad
rating 422, upsert), full discussion matrix (thread/replies incl. admin badge, anon
401, hide → public count drops, non-admin moderate 403), UI rendering of both blocks.
(Browser-pane screenshots hit a stale-compositor glitch; content verified via DOM.)

## 2026-07-21 — Students tab + course trailers (benchmark parity complete)

Specs: FatTail-Labs-Students-Tab-Spec-v1.0 + FatTail-Labs-Course-Trailer-Spec-v1.0.
Students: roster from enrollments — signed-in accounts see the grid (initials avatar,
name — never email — joined date, Completed ✓, Admin badge); logged-out sees count +
sign-in prompt. Trailers: hero ▶ button when trailer_video_id set; click swaps the hero
for the player in place (no modal), ✕ restores; embed built server-side (public payload
carries embed config, never the raw ID); trailer_video_id joined the admin course
allowlist with URL→ID normalization; edit-mode Trailer chip in the hero for authoring;
seed sets trailers on flagship + butterfly. Verified: anon count-only vs member roster,
no raw-ID leak, admin set-by-URL, play button baked into regenerated static HTML.
With these, all five AI Labs course-page tabs are functional — benchmark course-page
parity is complete.

## 2026-07-21 — Editor complete (v1.3): reorder, media, assignment, course creation

Spec: FatTail-Labs-InPlace-Admin-Spec-v1.3. No authoring task requires SQL anymore.
Reorder: HTML5 drag on module cards + lesson rows (⠿ handles); exact-set validation
server-side (422 on mismatched ids); immediate structure-write semantics. **Media
storage decision: local disk** (server/uploads, git-ignored, content-hash filenames,
served at /api/media; S3-compatible is a future backend swap) — POST /api/admin/media
validates png/jpeg/webp ≤5MB; hero_image_url allowlisted with an edit-mode Hero chip;
hero doubles as the catalog card banner, replacing the gradient placeholder when set.
Assignment in place: Categories checklist in the hero strip (replace-set PUT),
Instructors checklist in the About tab, Attachments manager in the Resources tab
(add/edit/delete; file kind uploads through media). New-course creation: admin-only
"+ New Course" card on the catalog → POST creates a draft (unique slug) → dedicated
draft editing route /admin/courses/{slug} (dynamic, admin-only, robots noindex)
rendering the course-page components from the admin payload with edit mode auto-active;
drafts remain 404 on all public surfaces until published from the edit bar. Verified:
media pipeline (upload/serve/bad-type 422/unauthed 401), module reorder + exact-set
rejection, category/instructor replace-sets, attachment CRUD, course creation with
draft invisibility, draft route rendering with all editors live. Draft "Tail Hedging
Workshop" left in dev DB as a playground.

## 2026-07-21 — Quizzes + Resource Library

Specs: FatTail-Labs-Quizzes-Spec-v1.0 + FatTail-Labs-Resource-Library-Spec-v1.0.

Quizzes: a quiz is a LESSON KIND (no parallel container) — ordered, access-gated,
completion-counted like any lesson (migration 004: quiz_questions, quiz_attempts).
Three question kinds: multiple_choice (options + correct index), binary (True/False),
short_answer (server-graded, trimmed case-insensitive acceptable-answers list).
Grading is server-side only; public payloads never carry correct answers; every
submission is an immutable attempt; first submission completes the lesson (pass
thresholds future). QuizPlayer (forms → score + per-question ✓/✗ + correct answer +
explanation + retake); admin QuizBuilder in place on the quiz lesson page; lesson rows
gained a kind select; /me Quiz Results placeholder now real (attempt history).

Resource Library: /resources aggregates course attachments (no orphan store) with
category/kind filters; header nav gained Resources. Storage tiers: public media
(images) vs NEW private tier (POST /api/admin/media?private=true — pdf/zip/office/
text/images ≤25MB, server/uploads/private, NOT statically mounted, url stored as
private:{name}). Downloads gated at GET /api/attachments/{id}/download: activator+
(member benefit), streams with human filename; observers get the upsell. Course
Resources tab rows now functional; attachments editor uploads target the private tier.

Verified: all three question kinds graded (incl. short-answer normalization), no
correct-answer leak, bad-question 422s, attempt in /me results, quiz completes lesson;
private file 404 at public path, anon 401 / observer 403 / member 200 with
Content-Disposition, library listing + anon 401. Demo quiz "Knowledge Check: The
Anatomy of the Bleed" (free preview) lives on the flagship.

## 2026-07-21 — Live sessions + pathway assessment

Specs: FatTail-Labs-Live-Sessions-Spec-v1.0 + FatTail-Labs-Pathway-Spec-v1.0. The
migration-001 live_sessions and pathways tables are now in service.

Live: /live (header nav gains Live) — public schedule (marketing surface), join URLs
double-gated server-side (role ≥ min_role AND T−15min→+4h window) with machine-readable
lock reasons (sign_in/role/too_early) driving the right prompt; public ICS export
(never carries the join URL); replays link past sessions to their replay course
(recording→lesson pipeline stays manual, honestly specced); in-page admin scheduler
(create/delete). Dashboard gains a Next Live Session card.

Pathway: 4-question intake (experience/account/struggle/time) → deterministic
server-side sequence. **Step 1 is first-stop-the-bleeding for every possible answer
set — proven by exhaustive test over all 108 combinations.** Struggle answer routes
psychology/routine/sizing early; platform primer always last (tool after doctrine).
Progress overlay derived at read time from lesson_progress. /pathway renders the
assessment or the numbered step list ("Start here" on first incomplete, Retake).
**Signup now lands on /pathway** — the benchmark's post-signup assessment pattern
carrying the sell-the-dream/sequence-the-discipline strategy. Dashboard gains a Your
Pathway card.

Verified: join gating matrix (entitled+in-window URL, role lock, sign_in lock, no URL
leak to anonymous), ICS output, session CRUD; pathway routing per struggle answer,
progress overlay against real member data, invalid answers 422, flagship-first
invariant exhaustively. Demo sessions seeded (workshop + trading room).

## 2026-07-21 — Trailer hero sizes to the full video

Refines the Course Trailer spec's playback: the hero is wrapped in TrailerShell — at
rest, normal hero content + centered play button; playing, the entire hero block swaps
to a true 16:9 (aspect-video) player sized by the column, so the video is never cropped
to the text-content height. ✕ restores the hero. Verified visually (full-width playback
with captions).

## 2026-07-21 — Native Stripe billing (third provider; live wiring awaits MiniTwo)

Spec: FatTail-Labs-Native-Billing-Stripe-Spec-v1.0. Stripe rides the existing
provider seams — Prices→plans via provider_plan_map (link_stripe_price.py CLI),
customers via identity_links, lifecycle via upsert_membership. Stripe hosts all
payment surfaces (Checkout + Customer Portal); the server never touches card data.
Endpoints: GET /api/billing/plans (amounts cached from Stripe), POST checkout (hosted
session, identity metadata, customer reuse), POST portal, POST webhook. Webhook
verified with the SDK's signature check but processed as plain JSON (StripeObject
accessor quirks bypassed — SDK is verify-only) and deliberately needs NO Stripe API
calls: payloads carry customer/price/status. Status map: active|trialing→active,
past_due→grace, canceled|unpaid|incomplete*→expired. Config-gated (no key → provider
absent, 503s + graceful UI fallback). /membership pricing page (success/cancel
banners; anonymous → signup first); all upgrade CTAs (gated lesson, resources denial,
dropdown upsell, live role locks) now point to /membership; /me gains Manage billing
(portal). Verified offline with the real signature scheme: disabled mode, customer
linking, active→grace→expired lifecycle, bad-signature 400, unmapped-price graceful
ignore, and role round-trip (observer → activator while Stripe-active → observer
after cancel). PENDING on MiniTwo (Coach): live keys, two Prices, price↔plan mapping
via CLI, webhook endpoint registration, one test-mode checkout.

## 2026-07-21 — Membership tiers, alumni grandfather, 2-step enrollment funnel

Spec: FatTail-Labs-Membership-Tiers-Enrollment-Spec-v1.0 (Coach directive with AI Labs
funnel screens; supersedes parent §3.2 placeholder pricing).

Tiers: Navigator $250/mo·$2,500/yr (featured — the AI Labs price structure);
Activator $100/mo PROMO-ONLY (renders only with ?promo, verified absent without);
Observer Trial $20/wk × 4 weeks with FULL Navigator access. Courses included with
every tier. Discord/app delivered outside Labs.

Role ladder gains **alumni** (observer < alumni < activator < navigator < admin);
lesson content + resource downloads dropped to alumni threshold; livestreams stay
activator+/navigator. **Alumni rule:** churn after ≥28 days tenure (any paid tier, or
the completed 4-week trial) auto-grants courses-alumni for 1 year
(current_period_end); role derivation is now date-expiry aware (expired-by-date
memberships confer nothing — also ends the alumni year). Tenure check wired into
BOTH churn paths (Stripe webhook + WP sync).

Funnel: signup = "Step 1 of 2" (what-happens-next list) → lands on
/membership?welcome=1 = "Step 2 of 2 — Welcome, {name}" with tier cards (display_json
on plans, migration 005 — cards render before billing wiring; checkout buttons attach
when Stripe is live). Exit-intent modal (once/page) pitches the trial + alumni promise
instead of a discount. "Continue with your free account" always visible → /pathway.

Verified: full alumni matrix (courses 200, resources 200, workshop role-locked,
year-expiry → observer), navigator subscribe → role navigator, cancel@5d → observer
(no alumni), cancel@35d → "expired + alumni granted" → role alumni with courses
playing and alumni year ending exactly +1yr, promo gating, step-2 page rendering.

## 2026-07-21 — Course lifecycle: unpublish + title-confirmed delete (admin v1.4)

Spec: FatTail-Labs-InPlace-Admin-Spec-v1.4. Danger zone at the bottom of the course
page (and draft route) in edit mode: Unpublish (published only — status→draft,
republish, redirect to /admin/courses/{slug}; published_at retained so republish keeps
the original date) and Delete course (confirmation requires TYPING the exact title —
stronger than modules/lessons confirm). DELETE /api/admin/courses/{slug} cleans the
non-FK relations explicitly: course attachments incl. their private files on disk, and
course-scoped threads (comments cascade); FKs handle modules/lessons/progress/
questions/attempts/enrollments/reviews/certificates; replay links null. Both actions
refused while the dirty set is non-empty. Verified: full-cascade delete on a
disposable course (zero orphans, private file removed from disk, unauthed 401),
danger-zone rendering with both controls in edit mode.

## 2026-07-21 — Draft visibility: admins auto-route from public URL to the editor

Extends spec v1.4 (§3, same working session): a draft's /courses/{slug} URL keeps its
genuine 404 for everyone (HTTP status + SEO unchanged), but the 404 page carries an
admin-only client check — administrators whose slug resolves in the admin API are
routed straight to /admin/courses/{slug}. Verified: anonymous draft URL stays 404;
admin visiting the same URL lands in the draft editor (DRAFT badge confirmed).

## 2026-07-21 — Resource visibility (free vs members) + library admin controls

Spec: FatTail-Labs-Resource-Library-Spec-v1.1 (extends v1.0; migration 006:
attachments.free_preview). Every resource is free (any signed-in account — mirrors
lesson previews; nothing is anonymous) or members-only (alumni+, the default).
Free/Members badges on the library and course Resources tab. Admin controls: course
attachments editor gains a Free checkbox on create + per-row toggle; the /resources
page itself gains admin create (course selector — resources always belong to a
course, no orphan store — title, URL or private upload, Free checkbox) plus per-row
make-free/members toggle and confirmed delete. Verified: observer free-download 302,
members-only 403, anon 401, live toggle flip, flags in listings.

## 2026-07-21 — Live Sessions v1.1: recurring standing schedule

**Decision:** The real schedule is recurring, not one-off. Added `live_recurrences`
(migration 007) storing America/New_York wall-clock schedules; occurrences
materialize at read time over a 14-day horizon (no cron, no generated rows).
Seeded the standing three: Live Trading Room Mon–Fri 11:00–12:15 ET (navigator+ —
all members except Activators), Friday Pre-Market Briefing Fri 9:30–10:00 ET
(activator+ — the one session Activators get), Sunday Retrospective Sun 21:00 ET
(navigator+). `min_role` widened to public|observer|activator|navigator so a
public YouTube show (e.g. Mon/Wed/Fri 15:00) can be listed; kind gains `show`.
Recurrence ICS is a true repeating VEVENT (RRULE WEEKLY, TZID) — add once, holds
forever. Admin recurrence manager on /live; occurrences are managed through the
recurrence, not individually. Deleted the demo one-off "Live Trading Room" (now
covered by the recurrence).

**Verification:** ET→UTC conversion exact under EDT (11:00→15:00, 9:30→13:30,
Sun 21:00→Mon 01:00). Today's already-ended occurrence correctly absent.
Activator session: trading room + Sunday locked `role`, Friday briefing passes to
`too_early`; navigator passes all role gates. ICS shows
`DTSTART;TZID=America/New_York` + `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`.
Live DOM: 14 Weekly-badged occurrences, recurrence manager lists all three
standing sessions, delete absent on occurrence cards.
Spec: FatTail-Labs-Live-Sessions-Spec-v1.1.md.

## 2026-07-21 — Live Sessions v1.2: month calendar replaces the upcoming list

**Decision:** With a standing recurring schedule, a flat list grows linearly with
occurrences and buries the rhythm — replaced /live's Upcoming list with a
Monday-first month calendar, opening on the current month, with ‹/Today/›
navigation. Chips colored by kind; click → detail card (countdown, ICS, gated
Join, admin delete for one-offs). API gains `?month=YYYY-MM` returning the full
ET month including past occurrences (locked `ended`); the no-param dashboard
shape is unchanged. Past sessions always render "Session ended" client-side —
never a sign-in prompt for something that's over.

**Verification:** July 2026 returns 33 sessions (23 weekday rooms + 5 Friday
briefings + 4 Sunday retros + 1 one-off), 23 distinct days; August returns 30,
first = Sun Aug 2 21:00 ET (2026-08-03T01:00Z); bad month → 422. Browser: grid
renders with today (21st) highlighted, past days dimmed, one-off auto-selected;
past-chip click shows "ended"; › navigation loads August with 30 chips matching
the API. Spec: FatTail-Labs-Live-Sessions-Spec-v1.2.md.

## 2026-07-21 — Live Sessions v1.3: membership-based content categories

**Decision:** Live content is categorized by membership audience, not role
plumbing — `category` (public | members | coaching) replaces `min_role` on both
tables (migration 008 backfills then drops the column; no dual schemas).
public = no gate; members = every membership (Observer, Activator, Navigator);
coaching = Observer & Navigator only. The ladder derivation (members→activator+,
coaching→navigator+) lives in one mapping and works because Observer trials
grant the navigator role; alumni fall below activator so they lose all live
content automatically. Standing schedule revised: 0DTE Live Show (public,
Mon/Wed/Fri 15:00 ET, youtube.com/@0dte/live), Daily Livestream (coaching,
Mon–Fri 11:00–12:30), Friday Morning Coach Call (members, Fri 9:30–10:00),
Sunday Evening Retrospective (coaching, Sun 21:00–22:00). Forward note: agents
producing live content will author the schedule through the same admin API —
category is the agent-facing contract (audience, never internal roles).

**Verification:** Full matrix — anonymous: coaching/members locked sign_in,
public show passes to too_early; activator: coaching locked role, Coach Call
passes; navigator: all pass. Public one-off in-window exposes join_url to
anonymous callers; invalid category → 422. Calendar renders the four-show week
(rose 0DTE chips Mon/Wed/Fri); recurrence manager shows category labels.
Spec: FatTail-Labs-Live-Sessions-Spec-v1.3.md.

## 2026-07-21 — Live Sessions v1.4: Recurring Event Viewer (scope-aware editing)

**Decision:** Two event types made explicit — single (`live_sessions`) and
recurring (`live_recurrences` + new `live_recurrence_overrides`, migration 009).
Editing a recurring occurrence requires a scope choice, iCalendar-style:
(1) this event only → override row (NULL = inherit, cancelled = removed);
(2) this and all future → series split (old bounded by `until_date`, clone with
edits from `start_date`, overrides ≥ split date move to the clone);
(3) all events → series update. Delete honors the same scopes. Occurrence
payloads gain `occurrence_date` + `modified`; the UI shows an amber "edited"
badge and an inline editor on the detail card (scope radio for recurring,
plain edit for single events). Known limits logged in spec §6 (series ICS shows
the base pattern; join_url override can't clear a series URL; no one-click
"restore occurrence to series" yet — re-edit or scope=all covers it).

**Verification:** Disposable series exercised end to end — scope=one changed
exactly one date (title + 13:00 ET → 17:00Z, modified=true); scope=future split
at Aug 10 left Aug 3–7 on the old series (30m) and moved Aug 10+ to the clone
(45m) including a pre-existing Aug 12 override; scope=one delete removed only
Aug 11; Saturday prefill 404; bad scope 422; scope=all cleanup left zero probe
sessions and zero orphan overrides. Browser: viewer opens from the calendar with
the three choices as specified, prefilled 11:00 ET/90m; a scope=one retitle
round-tripped to the chip + "edited" badge with the rest of the week untouched.
Spec: FatTail-Labs-Live-Sessions-Spec-v1.4.md.

## 2026-07-21 — Live Sessions v1.5: recurring series end limit

**Decision:** A recurring series can be bounded at creation — `until_date`
(YYYY-MM-DD, ET) or `until_days` (1–730, converted to a concrete date at save;
a fixed limit, never a rolling window). Both → 422; past date → 422; neither →
unbounded as before. No schema change (until_date existed since 009; the
materializer already honors it). Admin create form gains an Ends selector
(Never / On date / After N days); manager rows show "until {date}". Ending an
existing series = v1.4 scope-future delete.

**Verification:** until_days=7 on Jul 21 → until_date Jul 28; July listing ends
Jul 28, August has zero occurrences; explicit until_date Aug 6 on a Thursday
series kept only Aug 6; both-fields and past-date both 422. UI: Ends selector
renders with the three modes; N-days input appears on switch (default 30).
Probes deleted. Spec: FatTail-Labs-Live-Sessions-Spec-v1.5.md.

## 2026-07-21 — Course Card Editor v1.0: banner color/image + quick-info blurb

**Decision:** Catalog cards become authorable per course (migration 010:
`card_color`, `card_image_url`, `card_blurb_md`). Banner precedence:
card image (object-cover, scales to fill the 16:9 banner) → chosen color
(rendered as the same gradient art style: shade(color,0.3)→color, category
label + title kept) → hero image → category gradient; all-NULL = previous
behavior exactly. The hover panel's blurb (Markdown, sanitized pipeline)
replaces the default subtitle + ✓-outcomes block when set; derived meta
(duration, level, lesson count, badges) stays computed — not editable, so the
card can't lie. Editing happens ON the catalog: admin-only "✎ Card" chip flips
the card face into an inline editor (live preview, palette swatches + custom
picker, upload via existing public media tier or URL, blurb textarea);
save → PUT (allowlist +3 fields) → revalidate /courses + course page → reload.

**Verification:** Browser round trip — purple swatch picked, live preview
showed computed gradient, saved; regenerated catalog renders
linear-gradient(135deg, rgb(50,26,74), rgb(168,85,247)) and the Markdown blurb
appears in the hover panel; API returns the stored fields. Image path: PUT an
uploaded media URL → banner renders the image in prerendered HTML; full revert
confirmed (banner back to category art, blurb gone). Draft editor adapt()
extended for the new CourseDetail fields (build was failing until then).
Spec: FatTail-Labs-Course-Card-Editor-Spec-v1.0.md.

## 2026-07-21 — Card Editor v1.1 + Media Library v1.0: unified banner, popup removed

**Decision:** Same-day revision of Card Editor v1.0 on review. (1) The hover
quick-view popup is removed — cards click straight through; card_blurb_md dies
with it. (2) One banner per course: hero_image_url is shared — sharp
(object-cover) on the catalog card, expanded + Gaussian-blurred (blur-2xl,
scale-110) + shaded (bg-zinc-950/60) behind the course page header (public page
and draft editor both). card_image_url superseded; migration 011 drops both
columns (no dual schema). Precedence: banner image → card_color → category art.
(3) Banner uploads from two places, one store: the course page hero chip
(existing) and the new /admin/media Media Library — grid of public-tier uploads
with copy-URL and delete; delete is referentially safe (409 + who uses it,
checked against courses.hero_image_url and attachments.url). Card editor keeps
color + image (now writing hero_image_url) and links to the library.

**Verification:** Catalog HTML contains no group-hover popup; PUT banner →
card renders the sharp image and the course header renders blur-2xl +
scale-110 + bg-zinc-950/60 in prerendered HTML; screenshot confirms legible
title over the blurred, shaded image. Media API lists the store's 1 file;
deleting the referenced banner → 409 "In use — banner for
['butterfly-foundations']". Probe banner reverted cleanly. /admin/media 200,
admin-gated. Specs: Course-Card-Editor v1.1, Media-Library v1.0.

## 2026-07-21 — In-Place Admin v1.5: image embedding in the lesson markdown editor

**Decision:** The lesson-notes editor embeds images by upload, three ways
(toolbar Insert image…, clipboard paste, drag-drop), GitHub-style: instant
![Uploading…]() placeholder at the cursor → public-tier media upload (same
store as banners; visible in /admin/media) → swapped for ![alt](url) with
alt = filename sans extension; removed + error shown on failure; Save disabled
mid-upload. Site renderer (already img-safe via sanitize schema) gains image
styling (max-w-full, rounded). Logged limits: lesson images are public URLs
(member-only material belongs in private resources); Media Library delete does
not reference-check body_md (banners/attachments only) — accepted debt.

**Verification:** Browser flow on a real lesson — file fed through the Insert
input produced ![embed-test](/api/media/6b7fa434….png) at the cursor; Save
persisted and the page rendered the <img>; original notes restored; the
dereferenced upload then deleted with 200 (guard releases once unused).
Spec: FatTail-Labs-InPlace-Admin-Spec-v1.5.md.

## 2026-07-21 — Resource Library v1.2: in-place editing, descriptions, emoji

**Decision:** Library items become editable on the page (migration 012:
attachments.description_md + emoji ≤16 chars). Each row renders its emoji
(fallback by kind: file 📄, link 🔗), title, visibility badge, 2-line
description, course link; admin Edit swaps the row into an inline editor with
an emoji quick-pick strip + custom field, title input, and description
textarea. Create form gains the same fields. Course-tab surfacing of
emoji/description logged as future scope (payload + draft-adapter ripple).

**Verification:** Browser round trip on "Butterfly Construction Checklist" —
default 📄 shown, picked 📊 + description, saved; list re-rendered with the
new emoji and clamped description; reverted to NULL/NULL cleanly (fallback
returned). Create form shows picker + description field. API payload carries
both fields. Spec: FatTail-Labs-Resource-Library-Spec-v1.2.md.

## 2026-07-21 — Test Suite v1.0: characterization coverage (refactor step 1/4)

**Decision:** Before any structural refactor, the hand-verified behavior from
16 feature commits is codified as 44 pytest characterization tests
(server/tests/, FastAPI TestClient in-process, dev DB; probe rows zztest-*
created and cleaned by fixtures; seeded standing content read-only). Coverage:
auth/role ladder, catalog + draft visibility, lesson gating matrix, the full
live-sessions surface (materialization vs an independent calendar oracle,
category gating matrix, scope edits, bounds, ICS), resource visibility +
metadata, media upload/reference-guard, enrollment/progress clamps +
auto-complete, the alumni tenure rule, and quiz answer-leak prevention.
New rule in CLAUDE.md: server-touching commits must pass the suite; features
ship with their tests.

**Verification:** 44/44 passing in ~2s. One first-run fix: quiz questions live
at the lesson payload's top-level `questions` key, not under `quiz` — the test
was corrected to match reality (characterization, not aspiration).
Spec: FatTail-Labs-Test-Suite-Spec-v1.0.md.

## 2026-07-21 — Refactor step 2/4: shared guards + course lookup

**Decision:** server/guards.py (claims_or_none, require_session, require_role,
require_admin) replaces seven per-module reimplementations of the cookie →
verify → role-gate dance across admin, live, community, member, and quizzes;
resources/pathway/billing now import from guards instead of routes.member.
server/repo.py:course_id_by_slug (published_only flag) replaces eight
slug → id → 404 lookups (six in admin.py, plus community and member enroll).
Semantics preserved: 401 "Sign in required" / verifier reason, 403 "<Role>
role required". Unused imports pruned (quizzes auth/get_config).

**Verification:** Test suite 44/44 before commit (caught a missed quizzes
import mid-refactor — exactly the net it was built to be). Dev API restarted
clean; health + live month smoke pass.

## 2026-07-21 — Refactor step 3/4: web client helpers + useIsAdmin

**Decision:** web/lib/client.ts (getJSON/postJSON/putJSON/del, uploadMedia,
revalidate) and web/lib/useIsAdmin.ts (module-cached /api/auth/me promise +
hook) replace the pasted fetch dances: six components converted from their own
admin-check effect to useIsAdmin (one /me request per page load instead of
3–4); five upload sites and five revalidate sites now use the helpers;
ResourceLibrary's JSON verbs converted; lib/ui.ts FIELD replaces the pasted
form-field class. Deliberately NOT converted: SiteHeader and MembershipPlans
/me fetches (they consume richer identity data), EditContext's save()
revalidate (it checks the response and throws) and uploadHero (structureOp
needs the raw Response), MediaLibrary's list fetch (drives a denied state).
Failure alerts on uploads lost the HTTP status detail (helper returns
url-or-null) — accepted.

**Verification:** Build clean; all routes 200. Browser: catalog shows 10
✎ Card chips + New Course card, /me fired exactly 2× (SiteHeader + shared
cache); /resources shows 4 Edit buttons + admin form. Server suite still 44/44.
