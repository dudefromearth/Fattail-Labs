# FatTail Labs — Access Control Spec v0.1

**Status:** SUPERSEDED by `FatTail-Labs-Access-Control-Spec-v0.2.md`  
**Product:** FatTail Labs (`labs.fattail.ai`)  
**Author lane:** Coach intent → architecture proposal → this document  
**Related:**

| Spec / system | Relationship |
|---------------|--------------|
| `FatTail-Labs-Identity-Access-Spec-v1.0.md` | **Identity, plans, roles, SSO** — who the viewer is |
| `FatTail-Labs-Enrollment-Access-Spec-v1.0.md` | Lesson matrix as-built (free_preview / member) — **superseded for gating** by this spec once built |
| `FatTail-Labs-Membership-Tiers-Enrollment-Spec-v1.0.md` | Product tiers: Observer / Activator / Navigator (+ Coaching) |
| `FatTail-Labs-Campaign-Workflow-Spec-v1.0.md` | Campaigns attach access policies to landers / previews / offers |
| Feature gates (`/admin/gates`, `feature_gates`) | **Absorbed** as surface-level policy kind (countdown, waitlist, CTAs) |
| Live sessions categories | **Default rules** may remain domain-specific; optional map into policies later |
| In-place admin specs | Course/app editors host policy controls; cockpit is also centralized |

**Does not reverse:** WooCommerce as commerce entry; Labs `provider_plan_map` as entitlement translation; no client-supplied role/plan in URLs.

---

## 0. Coach intent (preserved)

1. Admin-accessible **gating by role** for:
   - **Pages / surfaces** (home, hub, catalog shells, campaign landers, …)
   - **Apps** (Journey, Trade Log, Toughness, Wiki, …)
   - **Course elements** (course, module, lesson, course-linked resource)
2. **Complete control** without deploys — design **future campaigns** (who sees what, when, with what CTA).
3. Membership recognition (Observer / Activator / Navigator / Coaching) is already an identity concern; access control must **consume** that truth, not reinvent it.

---

## 1. Problem

Access rules are **fragmented**:

| Mechanism | What it controls | Gap |
|-----------|------------------|-----|
| Feature gates | Whole surfaces + countdown/waitlist | Not lesson/app granular |
| `lessons.free_preview` | Binary free vs member | No plan-specific or timed campaign rules |
| `can_access_member_content` / role ladder | Code path for “any live membership” | Not admin-editable per resource |
| Live session `category` | public / members / coaching | Parallel vocabulary |
| Apps `status` (live/soon) | Soft product state | Not role-aware |

**Result:** Campaign design requires code changes or one-off hacks; Observer/member edge cases leak into UI copy and scattered checks.

---

## 2. Goals & non-goals

### 2.1 Goals

| ID | Goal |
|----|------|
| G1 | Single **Access Policy Engine** evaluates every protected target server-side |
| G2 | Admin UI for **create/edit/preview/disable** policies without deploy |
| G3 | Gate **pages, apps, and course elements** with the same model |
| G4 | Support **campaigns**: time windows, soft/hard lock, CTA recipes, bulk apply |
| G5 | **Preview as role/plan** (admin-only) to design before publish |
| G6 | Migrate existing free_preview + feature_gates into policies without breaking SEO/public catalog |

### 2.2 Non-goals (v0.1)

- Client-trusted role/plan query params as authorization
- Replacing WooCommerce billing or `provider_plan_map`
- Per-user ACL lists (individual identity allowlists) — deferred unless Coach requires
- A/B experimentation platform (CTA variants OK as static policy fields; stats later)

### 2.3 Success metrics

| Metric | Evidence |
|--------|----------|
| Admin can set lesson L to Observer+ without code | Admin walkthrough + API get |
| Free account still blocked from gated lesson | Characterization test |
| Paid Observer with JWT role still `observer` can play gated lesson | Test: live membership elevates |
| Campaign: open free_preview until `closes_at`, then member-only | Time window test |
| Preview-as-Free shows lock UI admin would see | Admin browser check |

---

## 3. Principles (invariants)

1. **Server is source of truth.** UI never invents allow/deny; it renders `AccessDecision`.
2. **Identity first.** Viewer plans/roles come from session + live memberships (`feature_role` / `derive_role` / `provider_plan_map`). URLs may set **landing path** (`next=`) only.
3. **Admin always allowed** (real admin identity). Optional **preview-as** may simulate non-admin for UX design.
4. **Hard mode does not leak content** (no video URL, no gated body_md, no join_url).
5. **Fail closed** for unknown custom targets registered as protected; **default open rules** for known target types when no policy row exists (see §6).
6. **No profit-claim CTAs** in deny UI (Tango / positioning).
7. **Documentation parity:** ship with this spec version, decision-log entry, and admin guide section.

---

## 4. Domain model

### 4.1 Viewer context

Computed once per request (and optionally cached for the request lifetime):

```text
ViewerContext {
  identity_id: int | null
  signed_in: bool
  is_admin: bool
  session_role: str          # JWT snapshot
  access_role: str           # feature_role (live elevation)
  plan_slugs: string[]       # active/grace, unexpired membership plan slugs
  campaign_tags: string[]    # optional, v1.1+
  now: datetime (UTC)
  preview_as: PreviewAs | null   # admin-only simulation
}
```

`PreviewAs` (admin only):

```text
PreviewAs {
  mode: "anonymous" | "signed_in"
  access_role?: str
  plan_slugs?: string[]
}
```

When `preview_as` is set, evaluation uses the simulated context for **allow/deny/UI**, never for writes (progress, enroll, admin mutations stay real admin).

### 4.2 Access target

Stable key, hierarchical, URL-safe:

| Kind | Key pattern | Examples |
|------|-------------|---------|
| Surface | `surface:{name}` | `surface:home`, `surface:hub`, `surface:course-catalog`, `surface:live`, `surface:app-grid` |
| App | `app:{slug}` | `app:journey`, `app:trade-log`, `app:toughness` |
| Course | `course:{courseSlug}` | `course:start-here` |
| Module | `course:{courseSlug}:module:{moduleSlug}` | |
| Lesson | `course:{courseSlug}:lesson:{moduleSlug}/{lessonSlug}` | |
| Course resource | `course:{courseSlug}:resource:{resourceId}` | |
| Campaign surface | `campaign:{campaignSlug}:{part}` | `campaign:aug-nav:landing` |

**Registry:** Admin pickers load targets from live data (published courses, `apps` table, known surfaces). Free-form keys allowed only for `campaign:*` and future extensions with validation.

### 4.3 Access policy

One **current** policy per `target_key` (unique). Optional history in audit table.

```text
AccessPolicy {
  target_key: string           # unique
  enabled: bool                # false → fall through to type default (§6)
  mode: hard | soft | hide | redirect

  # Who may pass (OR of layers — see evaluation §5)
  min_role: null | observer | alumni | activator | navigator | administrator
  any_plans: string[] | null   # allow if viewer has any of these plan slugs
  all_plans: string[] | null   # allow only if viewer has all (rare)
  deny_plans: string[] | null  # deny if viewer has any (blocklist)

  require_signed_in: bool      # default true for most protected targets

  # Time
  opens_at: datetime | null
  closes_at: datetime | null

  # Deny / lock UI recipe
  deny_ui: DenyUiJson
  time_ui: TimeUiJson | null

  # Campaign linkage
  campaign_id: int | null
  label: string                # admin-only name
  notes: string | null

  version: int
  updated_at, updated_by
}
```

**DenyUiJson** (illustrative):

```json
{
  "kind": "upsell" | "signin" | "message" | "redirect",
  "headline": "string",
  "body_md": "string",
  "cta_primary": { "label": "string", "href": "string" },
  "cta_secondary": { "label": "string", "href": "string" } | null
}
```

**TimeUiJson:** countdown / “opens at” copy / reveal_path (compatible with current feature_gates fields).

**Mode semantics:**

| Mode | API | Catalog / nav | Content |
|------|-----|---------------|---------|
| `hard` | 403 + decision | Show locked or hide per catalog flag | No leak |
| `soft` | 200 with `locked: true`, teaser only | Show with lock badge | No media/body |
| `hide` | 404 or omit from lists | Omit | N/A |
| `redirect` | 302 to deny_ui href | Optional omit | N/A |

### 4.4 Access decision

```text
AccessDecision {
  allow: bool
  code: "ok" | "signin_required" | "role" | "plan" | "time" | "denied" | "hidden"
  mode: hard | soft | hide | redirect
  target_key: string
  ui: DenyUiJson | TimeUiJson | null
  evaluated_as: { access_role, plan_slugs }   # for admin debug / preview
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

  if policy.opens_at and ctx.now < policy.opens_at:
    return LOCKED_TIME (time_ui)
  if policy.closes_at and ctx.now >= policy.closes_at:
    # After close: either deny or fall through — policy.field close_behavior
    # v0.1 default: treat as policy disabled → type default
    return default_for_target_type(target_key, ctx)

  if policy.require_signed_in and not ctx.signed_in:
    return DENY signin_required (deny_ui or default signin)

  if policy.deny_plans and intersection(ctx.plan_slugs, deny_plans):
    return DENY plan

  if policy.any_plans is non-empty:
    if intersection(ctx.plan_slugs, any_plans):
      return ALLOW
    # any_plans set but no match → fail this layer (do not skip to min_role alone)
    return DENY plan

  if policy.all_plans is non-empty:
    if not all(p in ctx.plan_slugs for p in all_plans):
      return DENY plan

  if policy.min_role is set:
    if role_at_least(ctx.access_role, policy.min_role):
      return ALLOW
    return DENY role

  # Policy enabled but no positive constraint → allow signed-in (or allow all if !require_signed_in)
  if policy.require_signed_in:
    return ALLOW if ctx.signed_in else DENY signin_required
  return ALLOW
```

**Interaction of `any_plans` and `min_role`:**  
v0.1: if `any_plans` is non-empty, it is the **sole** membership gate (min_role ignored).  
If `any_plans` is null/empty, `min_role` applies.  
(Coach may later request OR semantics; document as change control.)

**Live membership elevation:**  
`access_role` MUST use live memberships (as-built `feature_role` / `derive_role`), not JWT alone, so Observer plan holders are not treated as free on content gates.

---

## 6. Type defaults (no policy row)

| Target kind | Default |
|-------------|---------|
| `surface:home` | Feature gate table if present (compat); else open |
| Other `surface:*` | Open (public SEO/shell) |
| `app:*` | Signed-in required; `apps.status=soon` → soft lock “coming soon” |
| `course:{slug}` detail | Open (SEO structure) |
| `course:…:lesson:…` | Allow if `free_preview` OR `can_access_member_content` (as-built) |
| `course:…:resource:…` | Same as lesson free_preview / member content |
| `campaign:*` | Deny/hide unless policy exists (fail closed for campaigns) |

When a policy exists and `enabled=true`, it **replaces** the type default for that target.

---

## 7. Admin experience

### 7.1 Cockpit — `/admin/access`

| Tab | Function |
|-----|----------|
| **Surfaces** | List known surfaces + feature_gate migration status |
| **Apps** | One row per app; min_role / plans / soon / time |
| **Courses** | Browse course → modules → lessons; bulk edit |
| **Campaigns** | Policy sets tied to campaign_id |
| **Audit** | Recent policy changes (v1.1 if not P0) |

### 7.2 In-place course controls

On lesson list / lesson editor (in-place admin):

- Toggle **Free preview** (writes policy + keeps `lessons.free_preview` in sync during dual-write period)
- **Min role** dropdown
- **Required plans** multi-select (Observer / Activator / Navigator / Coaching → plan slugs)
- **Opens / closes** datetimes
- **Deny CTA** template picker (Member upsell / SSO refresh / Custom)

### 7.3 Preview as

Admin chrome control:

- Off | Anonymous | Free (signed-in observer no plans) | Observer | Activator | Navigator | Coaching  

Sets admin-only cookie `ft_access_preview` (HttpOnly, short TTL, host-only).  
Cleared on logout.

### 7.4 Feature gates merge

`/admin/gates` remains until P2, then becomes a **view** of `surface:*` policies with countdown/waitlist fields mapped into `time_ui` + waitlist tables (waitlist collection stays as today).

---

## 8. API surface

### 8.1 Evaluation (internal + optional public debug)

```http
GET /api/access/decision?target=course:start-here:lesson:getting-started/watch-this-first
Cookie: ft_session
→ AccessDecision
```

Admin with preview cookie evaluates as preview.

### 8.2 Admin CRUD

```http
GET    /api/admin/access/targets?kind=lesson&course=start-here
GET    /api/admin/access/policies
GET    /api/admin/access/policies/{target_key}
PUT    /api/admin/access/policies/{target_key}   # upsert body
DELETE /api/admin/access/policies/{target_key}   # revert to type default
POST   /api/admin/access/policies/bulk          # list of upserts (campaign publish)
```

All require administrator.

### 8.3 Enforcement helpers (server)

```python
require_access(request, target_key) -> AccessDecision
# raises HTTPException 401/403/404 or returns decision for soft mode
```

Call sites (non-exhaustive): lesson detail, resource download, app shell loaders, live join (optional later), catalog listing filters.

---

## 9. Data storage

### 9.1 Tables

```sql
CREATE TABLE access_policies (
  target_key       VARCHAR(512) NOT NULL,
  enabled          TINYINT(1) NOT NULL DEFAULT 1,
  mode             VARCHAR(16) NOT NULL DEFAULT 'hard',
  min_role         VARCHAR(32) NULL,
  any_plans_json   JSON NULL,
  all_plans_json   JSON NULL,
  deny_plans_json  JSON NULL,
  require_signed_in TINYINT(1) NOT NULL DEFAULT 1,
  opens_at         DATETIME NULL,
  closes_at        DATETIME NULL,
  close_behavior   VARCHAR(16) NOT NULL DEFAULT 'default', -- default | deny
  deny_ui_json     JSON NULL,
  time_ui_json     JSON NULL,
  campaign_id      BIGINT UNSIGNED NULL,
  label            VARCHAR(255) NOT NULL DEFAULT '',
  notes            TEXT NULL,
  version          INT NOT NULL DEFAULT 1,
  updated_by       BIGINT UNSIGNED NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (target_key),
  KEY ix_access_campaign (campaign_id),
  KEY ix_access_opens (opens_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 9.2 Dual-write period (lessons)

Until free_preview is fully derived from policies:

| Write | Behavior |
|-------|----------|
| Admin sets free_preview true | Update `lessons.free_preview` **and** upsert policy allow signed-in / soft public per product choice |
| Admin sets plan gate | Upsert policy; `free_preview=false` |

**Read path during dual-write:**  
`evaluate` prefers policy if present; else type default (which still reads free_preview).

### 9.3 Plan slug vocabulary (admin multi-select)

| Label | Plan slug(s) |
|-------|----------------|
| Observer | `observer-trial` |
| Activator | `activator`, `labs-membership` |
| Navigator | `navigator` |
| Coaching | `coaching` |
| Alumni | `courses-alumni` |

Align with Membership Tiers + `provider_plan_map` (Identity Access).

---

## 10. Campaign integration

From Campaign Workflow:

1. Campaign defines lander + free_preview_path + CTA.
2. On **publish campaign access**:
   - Upsert `campaign:{slug}:landing` policy (public or signed-in + time)
   - Upsert lesson policies for free_preview paths
   - Optional: lock other flagship lessons to `any_plans: [navigator, coaching, observer-trial]` during window
3. On **end campaign**: bulk disable campaign policies or set `closes_at` so defaults return.

Campaign policy sets = `POST /api/admin/access/policies/bulk` with shared `campaign_id`.

---

## 11. Member experience (Tango constraints)

| Situation | Member sees |
|-----------|-------------|
| Allowed | Normal page / player |
| Soft lock | Title + short body_md teaser + CTA; no video |
| Hard lock | Lock card + deny_ui CTAs |
| Time lock | Countdown / “Opens …” (no false “you’re not a member” if only time) |
| Hide | Not in nav; deep link 404 or soft message |

Copy: process outcomes only; no profit claims. Prefer **SSO refresh** CTA when membership is likely and session is stale.

---

## 12. Security

| Risk | Mitigation |
|------|------------|
| Forged role in query | Never read role from query for auth |
| Preview-as privilege | Admin-only cookie; no write with simulated identity |
| Content leak soft mode | Strip video, body, join_url in API when locked |
| Policy injection | Admin-only API; validate enums and plan slugs against allowlist |
| Open redirect in deny CTA href | Allowlist relative paths + known absolute SSO hosts (`fattail.ai`, `0-dte.com`) |

---

## 13. Migration from as-built

| Source | Destination |
|--------|-------------|
| `lessons.free_preview` | Default rule + dual-write policy |
| `feature_gates` | `surface:{key}` policies + keep waitlist tables |
| `apps.status` | Default app policy soft/hide when `soon` |
| Live categories | Keep until P2 optional map |
| Code `can_access_member_content` | Type default for lessons without policy |

No big-bang cutover: engine ships behind dual-write; defaults match today’s behavior.

---

## 14. Phased delivery

### P0 — Engine + lessons + apps (build first)

- Tables + `evaluate` + `require_access`
- Admin CRUD for lesson + app targets
- Preview-as cookie
- Dual-write free_preview
- Characterization tests (free / Observer membership / Navigator / time)

### P1 — Course bulk + catalog

- Module/course bulk policy apply
- Catalog hide/lock badges
- Resource targets

### P2 — Surfaces + campaigns

- Merge feature_gates into access cockpit
- Campaign bulk publish/end
- Admin audit log

### P3 — Polish

- Policy templates library
- Scheduled enable/disable job
- Analytics: decision codes by target (optional)

---

## 15. Acceptance criteria (P0)

1. Admin can set a gated lesson to require `any_plans: ["observer-trial"]` and a free account gets hard deny; Observer membership allows.
2. Admin can set app `trade-log` to `min_role: navigator` and Activator is denied; Navigator allowed.
3. Preview-as Free shows deny UI while admin session remains admin for Save.
4. No policy row → behavior matches pre-P0 defaults (regression suite green).
5. Decision log + this spec + admin help blurb shipped with P0.

---

## 16. Open questions (Coach)

| # | Question | Default if undecided |
|---|----------|----------------------|
| Q1 | Primary admin route: expand `/admin/gates` or new `/admin/access`? | **`/admin/access`**, gates redirect later |
| Q2 | `any_plans` vs `min_role` when both set? | **any_plans wins** if non-empty (§5) |
| Q3 | Catalog: locked card vs hide for `hard` deny? | **Locked card** for courses; hide for draft/campaign |
| Q4 | Free preview: anonymous soft teaser or sign-in required? | Keep as-built (**sign-in** for playback) |
| Q5 | After `closes_at`, deny or revert to default? | **Revert to default** (`close_behavior=default`) |

---

## 17. Out of scope reminders

- Changing Woo product catalog
- Profit-claim marketing CTAs
- Sharing session cookies with non-Labs hosts beyond existing SSO hop

---

## 18. Document control

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-08-02 | Initial DRAFT from Coach request for admin role gating of pages, apps, course elements, campaigns |

**Next process step (bench):** India architecture review → Echo/Tango UX/copy notes → Mike security pass on evaluation → Coach Phase 5 approval → BUILD AUTHORITY → Juliet execution plan under `agents/`.

---

*End of Access Control Spec v0.1*
