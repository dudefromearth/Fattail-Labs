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
