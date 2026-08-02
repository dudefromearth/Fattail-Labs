# FatTail Labs — Access Control Spec v0.2

**Status:** DRAFT (revised after external review 2026-08-02; not yet build authority)  
**Supersedes:** `FatTail-Labs-Access-Control-Spec-v0.1.md`  
**Product:** FatTail Labs (`labs.fattail.ai`)  

**Related:**

| Spec / system | Relationship |
|---------------|--------------|
| `FatTail-Labs-Identity-Access-Spec-v1.0.md` | Identity, plans, roles, SSO — who the viewer is |
| `FatTail-Labs-Membership-Tiers-Enrollment-Spec-v1.0.md` | Observer / Activator / Navigator (+ Coaching); **alumni** as role + plan (as-built) |
| `FatTail-Labs-Enrollment-Access-Spec-v1.0.md` | Lesson matrix as-built — type defaults until policies override |
| `FatTail-Labs-Campaign-Workflow-Spec-v1.0.md` | Campaigns attach policy sets |
| `FatTail-Labs-SEO-Spec-v1.3.md` | Sitemap / JSON-LD must respect anonymous access decision |
| Feature gates, free_preview, apps.status | Migrated into policies; dual-write then absorb |

**Does not reverse:** Woo commerce; `provider_plan_map`; server-side auth only; public catalog SEO purpose (policies must not create silent SEO damage).

---

## 0. Coach intent (preserved)

1. Admin-accessible **gating by role/plan** for **pages (surfaces), apps, and course elements**.
2. **Complete control** without deploys — design **campaigns** (who, when, CTA).
3. Access control **consumes** identity/membership truth; does not invent it from URLs.

---

## 0.1 Review resolution log (v0.1 → v0.2)

External evaluation of v0.1. **Blocking** items are fixed in this version. **Should-fix** items are specified. **Opinion** items recorded as defaults Coach may discard.

| # | Class | Resolution in v0.2 |
|---|--------|-------------------|
| 1 | Blocking — SSG vs engine | §6.1 render-mode table; policy writes **must** revalidate affected routes |
| 2 | Blocking — hide vs SEO | §6.2 sitemap/JSON-LD/meta derived from **anonymous** decision; hide never silently orphans sitemap |
| 3 | Blocking — any_plans traps Navigator | §5 **OR semantics**: pass if `any_plans` match **OR** `min_role` satisfied; admin UI auto-fills cumulative plans |
| 4 | Blocking — close_behavior | On `AccessPolicy` + algorithm; `default` \| `deny` |
| 5 | Blocking — decision oracle | `GET /api/access/decision` **admin-only**; no public target enumeration |
| 6 | Blocking — gate sign-in/remedy | **Immutable target denylist** for policy writes; deny CTA href must be reachable by denied viewer class |
| 7 | Should-fix — mid-course revoke | §11.1 doctrine: **grandfather active enrollments** on tighten (default); admin may force revoke with note |
| 8 | Should-fix — alumni | **As-built ladder** is `observer < alumni < activator < navigator < administrator` (`auth.ROLE_ORDER`); plan slug `courses-alumni` grants role `alumni`. Access control uses that ladder — not a second invention. Identity doc lag noted for Lima. |
| 9 | Should-fix — N+1 catalog | P0 API includes `evaluate_many` |
| 10 | Should-fix — preview pollutes | Progress / practice **writes suppressed** while preview cookie set |
| 11 | Should-fix — PK size | Tables specify `ROW_FORMAT=DYNAMIC` |
| Opinion — campaign fail-closed | **Keep fail-closed**; admin **“campaign has no policy”** warning state (§10) |
| Opinion — audit P0 | **Audit table + admin Audit tab are P0** (not deferred UI) |

**Preserved praise (v0.1 strengths):** § type defaults enable no-op ship; dual-write honesty; live-membership elevation; time-lock copy never mislabeled as “not a member.”

---

## 1. Problem

Access rules are fragmented (feature gates, free_preview, code ladders, live categories, apps.status). Campaign design needs **one admin-controlled policy system** for surfaces, apps, and course elements without deploys.

---

## 2. Goals & non-goals

### 2.1 Goals

| ID | Goal |
|----|------|
| G1 | Single **Access Policy Engine** evaluates every protected target server-side |
| G2 | Admin UI create/edit/preview/disable without deploy |
| G3 | Gate **pages, apps, course elements** with one model |
| G4 | **Campaigns**: time windows, soft/hard/hide/redirect, CTA recipes, bulk apply |
| G5 | **Preview as role/plan** (admin-only) |
| G6 | Migrate free_preview + feature_gates without SEO/catalog regression |
| G7 | Policy writes always trigger **correct revalidation** for SSG/ISR targets |
| G8 | Sitemap/JSON-LD stay consistent with **anonymous** access decisions |

### 2.2 Non-goals (v0.2)

- Client-trusted role/plan query params
- Replacing WooCommerce or `provider_plan_map`
- Per-identity ACL lists (deferred)
- Full A/B experiment platform

### 2.3 Success metrics

| Metric | Evidence |
|--------|----------|
| Lesson policy Observer+ allows Observer membership, free denied | pytest + admin walkthrough |
| Navigator not locked out by Observer-only plan list when min_role set | OR semantics test |
| Admin sets `hide` on course → removed from sitemap on next regen | revalidate + sitemap fetch |
| Catalog 40 courses one request batch evaluate | `evaluate_many` test / timing |
| Preview-as Observer does not write progress to admin identity | pytest |
| Policy on `surface:login` rejected | admin API 422 |

---

## 3. Principles (invariants)

1. **Server is source of truth.** UI only renders `AccessDecision`.
2. **Identity first.** Plans/roles from session + live memberships; URLs may set landing path only.
3. **Admin always allowed** unless preview-as is active for evaluation UX only.
4. **Hard mode does not leak content.**
5. **Fail closed** for protected campaign targets without policy; **type defaults** when policy missing/disabled for known product targets.
6. **No profit-claim CTAs** in deny UI.
7. **SEO integrity:** never advertise a URL in sitemap that anonymous evaluation treats as `hide`/404.
8. **Remedy paths ungateable:** sign-in, logout, membership, SSO entry surfaces cannot receive restrictive policies.
9. **Documentation parity** with ship.

---

## 4. Domain model

### 4.1 Viewer context

```text
ViewerContext {
  identity_id: int | null
  signed_in: bool
  is_admin: bool
  session_role: str
  access_role: str           # feature_role / derive_role live elevation
  plan_slugs: string[]       # active/grace unexpired plan slugs
  enrolled_course_ids: int[] # for grandfathering (§11.1)
  campaign_tags: string[]    # optional v1.1
  now: datetime (UTC)
  preview_as: PreviewAs | null
}
```

```text
PreviewAs {
  mode: "anonymous" | "signed_in"
  access_role?: str
  plan_slugs?: string[]
}
```

Writes (progress, enroll, admin mutations, practice) use **real** identity; if `preview_as` set, **suppress** member progress/practice writes that would pollute the admin’s book (§4.1.1).

### 4.1.1 Preview-as write suppression

While `ft_access_preview` cookie is present:

| Allowed | Suppressed |
|---------|------------|
| Admin API policy CRUD | `POST /api/progress`, lesson complete |
| Read APIs with simulated decision | Trade log / journal creates |
| Navigation | Enrollment changes as “preview identity” |

Real admin may still use admin tools; member product surfaces do not record activity under preview.

### 4.2 Access target

| Kind | Key pattern | Examples |
|------|-------------|---------|
| Surface | `surface:{name}` | `surface:home`, `surface:hub`, `surface:course-catalog`, `surface:live`, `surface:app-grid` |
| App | `app:{slug}` | `app:journey`, `app:trade-log` |
| Course | `course:{courseSlug}` | `course:start-here` |
| Module | `course:{courseSlug}:module:{moduleSlug}` | |
| Lesson | `course:{courseSlug}:lesson:{moduleSlug}/{lessonSlug}` | |
| Course resource | `course:{courseSlug}:resource:{resourceId}` | |
| Campaign | `campaign:{campaignSlug}:{part}` | `campaign:aug-nav:landing` |

### 4.2.1 Immutable / ungateable targets (policy write **rejected**)

Admin `PUT` returns **422** if `target_key` is in this set (or prefix match where noted):

| Target | Reason |
|--------|--------|
| `surface:login` | Sign-in remedy |
| `surface:signup` | Registration remedy |
| `surface:logout` | Session clear |
| `surface:membership` | Commerce / upgrade path |
| `surface:forgot-password` / `surface:reset-password` | Account recovery |
| `app:account` / `surface:me` (if used) | Profile / session settings |
| Any target whose only deny CTA would recurse to a gated remedy | Validated at write time |

SSO **entry** on fattail.ai is external; Labs deny CTAs may link to fotw-sso URLs (allowlisted hosts) without gating that host.

### 4.3 Access policy

```text
AccessPolicy {
  target_key: string
  enabled: bool
  mode: hard | soft | hide | redirect

  min_role: null | observer | alumni | activator | navigator | administrator
  any_plans: string[] | null
  all_plans: string[] | null
  deny_plans: string[] | null
  require_signed_in: bool

  # Membership OR (default — fixes Navigator trapped by Observer-only lists)
  # pass if (any_plans match) OR (min_role satisfied), when both set.
  # If only one set, that one applies. all_plans is AND and is additional.
  plan_role_combine: "or" | "and"   # default "or"; "and" = both must pass if both set

  opens_at: datetime | null
  closes_at: datetime | null
  close_behavior: "default" | "deny"   # REQUIRED field — see §5

  deny_ui: DenyUiJson
  time_ui: TimeUiJson | null

  campaign_id: int | null
  label: string
  notes: string | null

  # Mid-course tighten (§11.1)
  grandfather_enrollments: bool   # default true

  version: int
  updated_at, updated_by
}
```

**Role ladder (as-built Labs, not optional):**

```text
observer < alumni < activator < navigator < administrator
```

Plan slug `courses-alumni` → grants_role `alumni`. Access control **must not** invent a second ladder.

**DenyUiJson / TimeUiJson:** as v0.1 (headline, body_md, CTAs; countdown / reveal_path).

**Mode semantics:** hard / soft / hide / redirect — as v0.1.

### 4.4 Access decision

```text
AccessDecision {
  allow: bool
  code: "ok" | "signin_required" | "role" | "plan" | "time" | "denied" | "hidden" | "grandfather"
  mode: hard | soft | hide | redirect
  target_key: string
  ui: object | null
  evaluated_as: { access_role, plan_slugs }
  grandfathered: bool   # true if allowed only via enrollment grandfather
}
```

---

## 5. Evaluation algorithm

```
evaluate(target_key, viewer) -> AccessDecision:

  if viewer.is_admin and not viewer.preview_as:
    return ALLOW

  ctx = apply_preview_as(viewer)

  policy = load_policy(target_key)
  if policy is null or not policy.enabled:
    return default_for_target_type(target_key, ctx)

  # --- Time window ---
  if policy.opens_at and ctx.now < policy.opens_at:
    return LOCKED_TIME (code=time, time_ui)
  if policy.closes_at and ctx.now >= policy.closes_at:
    if policy.close_behavior == "deny":
      return DENY (code=time or denied, deny_ui)
    # close_behavior == "default"
    return default_for_target_type(target_key, ctx)

  if policy.require_signed_in and not ctx.signed_in:
    return DENY signin_required

  if policy.deny_plans and intersection(ctx.plan_slugs, deny_plans):
    return DENY plan

  plans_ok = True
  role_ok = True
  plans_constrained = policy.any_plans is non-empty
  role_constrained = policy.min_role is set

  if plans_constrained:
    plans_ok = bool(intersection(ctx.plan_slugs, policy.any_plans))
  if policy.all_plans is non-empty:
    plans_ok = plans_ok and all(p in ctx.plan_slugs for p in policy.all_plans)

  if role_constrained:
    role_ok = role_at_least(ctx.access_role, policy.min_role)

  if plans_constrained and role_constrained:
    if policy.plan_role_combine == "and":
      member_ok = plans_ok and role_ok
    else:  # default "or"
      member_ok = plans_ok or role_ok
  elif plans_constrained:
    member_ok = plans_ok
  elif role_constrained:
    member_ok = role_ok
  else:
    member_ok = True  # no positive membership constraint

  if not member_ok:
    # Grandfather: enrolled in course for lesson/module/course targets
    if policy.grandfather_enrollments and is_course_family(target_key):
      if course_id_of(target_key) in ctx.enrolled_course_ids:
        return ALLOW (code=grandfather, grandfathered=true)
    return DENY role_or_plan

  if policy.require_signed_in and not ctx.signed_in:
    return DENY signin_required
  return ALLOW
```

**Admin UI rule (mandatory for OR safety):**  
When admin picks plan chips, UI **auto-includes all higher commercial tiers** unless “exact plans only” is checked:

| If selected | Auto-add |
|-------------|----------|
| Observer | Activator, Navigator, Coaching plan slugs |
| Activator | Navigator, Coaching |
| Navigator | Coaching |
| Coaching | (top) |

Exact-only is the escape hatch for rare “trial-only” experiments; default protects highest-paying members.

**Live membership elevation:** `access_role` MUST use live memberships (as-built), not JWT alone.

---

## 6. Type defaults & render modes

### 6.1 Target kind → render mode → revalidation (Blocking #1)

P1 statically generates **public catalog** and **course detail**. Policies that change **anonymous** visibility of those routes **must** revalidate them.

| Target kind | Typical render | Policy affects HTML? | Revalidation on policy write |
|-------------|----------------|----------------------|------------------------------|
| `surface:home` | Dynamic (feature gate) | Yes | `revalidatePath('/')` + tag `access:surface:home` |
| `surface:hub` | Often SSG/ISR | Yes if hide/lock in shell | `revalidatePath('/hub')`, tag `access:surface:hub` |
| `surface:course-catalog` | **SSG/ISR** | Yes (hide/lock cards) | `revalidatePath('/course')`, tag `access:catalog` |
| `course:{slug}` detail | **SSG/ISR** | Yes (hide/lock/module list) | `revalidatePath('/course/{slug}')`, tag `access:course:{slug}` |
| `course:…:lesson:…` | Dynamic (session) | Per-request evaluate | Optional tag; no full catalog rebuild required |
| `app:*` | Dynamic (auth) | Per-request | Usually none |
| `campaign:*` | Dynamic preferred | Per-request | Path of lander if SSG |

**Implementation requirement:**  
`PUT/DELETE/bulk` policy handlers call a central:

```text
revalidate_for_targets(target_keys: string[])
```

which maps keys → Next revalidate paths/tags (existing revalidation pipeline).  
**Admin UX:** after Save, show “Revalidated: /course, /course/start-here” or error if revalidation fails.

**Lesson player** remains session-dynamic: engine runs every request; no SSG conflict.

### 6.2 SEO surface (Blocking #2)

| Artifact | Rule |
|----------|------|
| `sitemap.xml` | Include URL only if `evaluate(target, anonymous_viewer).allow` **or** mode is not `hide`/`redirect` for anonymous. Prefer: include if anonymous decision `code != hidden` and mode ≠ hide. |
| JSON-LD Course/LearningResource | Emit only when anonymous may discover the page; free-preview markup only if free_preview path allows signed-in free tier per policy/default |
| Meta robots | If hide for anonymous → noindex if page still returns soft message; if 404, remove from sitemap first |

**Order of ops on hide:** (1) update policy (2) revalidate (3) sitemap regen omits URL. Never leave sitemap pointing at intentional 404.

### 6.3 Type defaults (no policy / disabled)

| Target kind | Default |
|-------------|---------|
| `surface:home` | feature_gates compat or open |
| Other surfaces | open |
| `app:*` | signed-in; `soon` → soft coming-soon |
| `course:{slug}` | open (SEO) |
| Lesson | free_preview OR member content (`can_access_member_content`) |
| Resource | same as lesson free_preview rule |
| `campaign:*` | **fail closed** (deny/hide) if no policy — with admin warning if campaign live and no policy |

---

## 7. Admin experience

### 7.1 Cockpit `/admin/access`

| Tab | Function |
|-----|----------|
| Surfaces | Known surfaces + gate migration |
| Apps | min_role / plans / soon / time |
| Courses | Course → modules → lessons; bulk |
| Campaigns | Policy sets; **warn if campaign has no policy** |
| **Audit** | **P0** — list from `access_policy_audit` |

### 7.2 In-place course controls

Free preview dual-write; min_role; plan multi-select with **auto-cumulative tiers**; time window; deny CTA template; grandfather toggle (default on).

### 7.3 Preview as

Admin cookie `ft_access_preview`; §4.1.1 write suppression.

### 7.4 Feature gates

`/admin/gates` until P2 merge into surface policies.

### 7.5 Deny CTA validation (Blocking #6)

On policy save:

1. Resolve `deny_ui.cta_*.href` (relative Labs path or allowlisted absolute SSO URL).
2. If relative Labs path maps to a `target_key`, simulate evaluation for a **representative denied viewer** (e.g. free signed-in, or lowest denied class).
3. If that viewer cannot ALLOW the CTA target → **422** with message “Denied members cannot reach this CTA.”

---

## 8. API surface

### 8.1 Decision endpoints

```http
# Admin only — never unauthenticated (Blocking #5)
GET  /api/admin/access/decision?target={key}
POST /api/admin/access/decision/batch
     { "targets": ["course:…", "app:…"] }
→ { "decisions": { "target": AccessDecision } }

# Internal library only (not public HTTP):
evaluate(target_key, viewer) -> AccessDecision
evaluate_many(target_keys, viewer) -> dict[str, AccessDecision]   # P0 required
```

No public `/api/access/decision` that enumerates hide-mode targets.

### 8.2 Admin CRUD

```http
GET    /api/admin/access/targets?kind=&course=
GET    /api/admin/access/policies
GET    /api/admin/access/policies/{target_key}
PUT    /api/admin/access/policies/{target_key}
DELETE /api/admin/access/policies/{target_key}
POST   /api/admin/access/policies/bulk
GET    /api/admin/access/audit?target=&limit=
```

All administrator. PUT/DELETE/bulk → validate denylist + CTA reachability → write → audit row → `revalidate_for_targets`.

### 8.3 Enforcement

```python
require_access(request, target_key) -> AccessDecision
# 401/403/404 per mode; soft returns decision for UI
```

Catalog: `evaluate_many` for all course cards in one call.

---

## 9. Data storage

```sql
CREATE TABLE access_policies (
  target_key        VARCHAR(512) NOT NULL,
  enabled           TINYINT(1) NOT NULL DEFAULT 1,
  mode              VARCHAR(16) NOT NULL DEFAULT 'hard',
  min_role          VARCHAR(32) NULL,
  any_plans_json    JSON NULL,
  all_plans_json    JSON NULL,
  deny_plans_json   JSON NULL,
  plan_role_combine VARCHAR(8) NOT NULL DEFAULT 'or',
  require_signed_in TINYINT(1) NOT NULL DEFAULT 1,
  opens_at          DATETIME NULL,
  closes_at         DATETIME NULL,
  close_behavior    VARCHAR(16) NOT NULL DEFAULT 'default',
  deny_ui_json      JSON NULL,
  time_ui_json      JSON NULL,
  campaign_id       BIGINT UNSIGNED NULL,
  grandfather_enrollments TINYINT(1) NOT NULL DEFAULT 1,
  label             VARCHAR(255) NOT NULL DEFAULT '',
  notes             TEXT NULL,
  version           INT NOT NULL DEFAULT 1,
  updated_by        BIGINT UNSIGNED NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (target_key),
  KEY ix_access_campaign (campaign_id),
  KEY ix_access_opens (opens_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

CREATE TABLE access_policy_audit (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  target_key   VARCHAR(512) NOT NULL,
  actor_id     BIGINT UNSIGNED NULL,
  action       VARCHAR(32) NOT NULL,
  before_json  JSON NULL,
  after_json   JSON NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_audit_target_time (target_key, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
```

**Dual-write free_preview:** as v0.1 — policy preferred when present; else type default.

**Plan slug vocabulary (admin):** Observer → `observer-trial`; Activator → `activator`, `labs-membership`; Navigator → `navigator`; Coaching → `coaching`; Alumni → `courses-alumni`.

---

## 10. Campaign integration

1. Campaign landers are `campaign:{slug}:…` — **fail closed** without policy.
2. Admin campaign UI shows red **“No access policy”** if status is live/published and no policy rows for that `campaign_id`.
3. Bulk publish/end via `POST .../bulk`.
4. Paid-traffic safety: do not relax fail-closed; fix by requiring policy before “go live” checkbox.

---

## 11. Member experience & revocation

### 11.1 Mid-course policy tighten (Should-fix #7)

**Default doctrine: grandfather active enrollments.**

| Situation | Result |
|-----------|--------|
| Viewer fails plan/role gate | Deny |
| Same, but enrolled in that course and `grandfather_enrollments=true` | **Allow** (`code=grandfather`) |
| Admin unchecks grandfather / sets force | Deny for everyone including enrolled |

Rationale: silent lockout of paying members mid-path is a chargeback/trust risk. Force revoke is explicit and audited.

### 11.2 Copy (Tango)

Time lock ≠ “not a member.” Process-only CTAs. Prefer SSO refresh when membership likely.

---

## 12. Security

| Risk | Mitigation |
|------|------------|
| Forged role in URL | Never authorize from query |
| Decision oracle | Admin-only decision APIs |
| Preview-as | Admin cookie; write suppress; no write as simulated user |
| Content leak | Strip media/body on hard/soft lock |
| Gating remedies | Immutable denylist + CTA reachability check |
| Open redirect | Relative paths + allowlisted SSO hosts |
| SEO 404 spam | Sitemap from anonymous evaluate |

---

## 13. Migration from as-built

| Source | Destination |
|--------|-------------|
| free_preview | Type default + dual-write |
| feature_gates | surface policies + waitlist tables |
| apps.status | App default soft/hide |
| can_access_member_content | Lesson default without policy |

No big-bang; defaults match today until a policy is written.

---

## 14. Phased delivery

### P0 — Engine + lessons + apps + audit

- Tables (`ROW_FORMAT=DYNAMIC`) + evaluate + **evaluate_many**
- Admin CRUD + **Audit tab**
- Preview-as + write suppress
- Dual-write free_preview
- revalidate_for_targets for course/catalog/surfaces touched
- Denylist + CTA validation
- Tests: free/Observer/Navigator OR-semantics/time/grandfather/preview writes

### P1 — Course bulk + catalog + SEO hooks

- Bulk module/course policies
- Catalog uses evaluate_many
- Sitemap/JSON-LD wired to anonymous decisions

### P2 — Surfaces + campaigns

- Merge feature_gates
- Campaign bulk + “no policy” warning
- Live category optional map

### P3 — Templates + scheduling

- Policy templates
- Scheduled enable/disable

---

## 15. Acceptance criteria (P0)

1. Free denied on gated lesson; Observer membership allowed (live membership, stale JWT role observer OK).
2. Policy `any_plans: [observer-trial]` **and** `min_role: navigator` with combine `or` → Navigator allowed.
3. Policy `any_plans: [observer-trial]` only, combine `or`, min_role null → Navigator **denied** only if they lack that plan (expected); with UI auto-cumulative, selecting Observer adds Navigator/Coaching plans so Navigator allowed.
4. `PUT` policy on `surface:login` → 422.
5. Decision endpoints require admin.
6. Preview-as does not create lesson_progress for admin.
7. Policy save revalidates listed paths (mock or integration).
8. Audit row written on every PUT/DELETE/bulk.
9. No policy → pre-P0 behavior (regression).

---

## 16. Open questions (remaining Coach optional)

| # | Question | v0.2 default |
|---|----------|--------------|
| Q1 | `/admin/access` vs expand gates? | **`/admin/access`** |
| Q3 | Catalog locked card vs hide? | **Locked card** for courses; hide for campaign-only |
| Q4 | Free preview anonymous? | **Sign-in required** to play (Enrollment Access) |
| Q6 | Force-revoke UX label? | “Revoke enrolled members (not recommended)” |

Q2 (any_plans vs min_role) and Q5 (close_behavior) **resolved** in §5 / §4.3.

---

## 17. Document control

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-08-02 | Initial DRAFT |
| v0.2 | 2026-08-02 | External review: SSG/revalidate, SEO, OR membership, close_behavior, admin-only decision API, ungateable surfaces, grandfather, alumni ladder, evaluate_many, preview write suppress, DYNAMIC rows, audit P0 |

**Next:** India architecture pass on §5–§6; Mike on §8/§12; Tango on §11; Coach Phase 5 → BUILD AUTHORITY → Juliet P0 plan.

---

*End of Access Control Spec v0.2*
