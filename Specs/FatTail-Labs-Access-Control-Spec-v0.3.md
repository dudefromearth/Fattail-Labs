# FatTail Labs — Access Control Spec v0.3

**Status:** SUPERSEDED by `FatTail-Labs-Access-Control-Spec-v0.4.md`  
**Supersedes:** `FatTail-Labs-Access-Control-Spec-v0.2.md` (v0.1 remains SUPERSEDED)  
**Product:** FatTail Labs (`labs.fattail.ai`)

**Related:** Identity Access · Membership Tiers · Enrollment Access · Campaign Workflow · SEO Spec v1.3 · Member Data Privacy · Application Framework

**Does not reverse:** Woo commerce; `provider_plan_map`; server-side auth only; public catalog SEO purpose.

---

## 0. Coach intent (preserved)

1. Admin gating by role/plan for **pages (surfaces), apps, and course elements**.
2. Complete control without deploys — **campaigns** (who, when, CTA).
3. Access control **consumes** identity/membership truth; never invents it from URLs.

---

## 0.1 Review resolution log

### v0.1 → v0.2 (first external review)

| # | Class | Resolution |
|---|--------|------------|
| 1 | Blocking SSG | §6.1 revalidation table |
| 2 | Blocking SEO | §6.2 sitemap from access |
| 3 | Blocking any_plans traps Navigator | OR semantics + cumulative tiers |
| 4 | Blocking close_behavior | Model + algorithm |
| 5 | Blocking decision oracle | Admin-only decision API |
| 6 | Blocking gate remedies | Ungateable targets + CTA validation |
| 7–11 | Should-fix | Grandfather courses, alumni ladder, evaluate_many, preview write suppress, DYNAMIC rows, audit P0 |

### v0.2 → v0.3 (second external review)

| # | Class | Resolution in v0.3 |
|---|--------|-------------------|
| **1** | Blocking — cumulative only in UI; bulk bypasses | **Server-side** plan expansion on every write (UI + bulk + future agents); `exact_plans_only` (default **false**) on policy |
| **2** | Blocking — app lockout of member data | **Data-bearing apps** immutable floor: cannot strip read/export; max restrictiveness `soft` with read retained |
| **3** | Blocking — sitemap rule ambiguous | **One rule:** include URL iff anonymous request returns **HTTP 200** |
| 4 | Should-fix — SSG personalization | Explicit: SSG = anonymous decision; client hydrates personalized lock/open |
| 5 | Should-fix — member UI decision source | Decisions ride on **resource responses** (`locked`, `access`); no public decision endpoint |
| 6 | Should-fix — grandfather under preview-as | `PreviewAs.enrolled_course_ids` default **[]** |
| 7 | Should-fix — hide vs soft robots | **hide = 404 + omit**; soft message is **soft** mode only |
| 8 | Should-fix — denylist as code | **Code constant** + characterization tests (422 each) |
| Minor | Double `require_signed_in` | Single check in algorithm |
| Minor | deny_plans vs grandfather | Explicit: **deny_plans wins** (no grandfather) |

**Format:** Review resolution logs stay in this document at each revision (keep §0.1 pattern).

---

## 1. Problem

Fragmented gates (feature_gates, free_preview, code ladders, apps.status) block campaign design. Need one admin-controlled policy engine for surfaces, apps, and course elements.

---

## 2. Goals & non-goals

### 2.1 Goals

| ID | Goal |
|----|------|
| G1 | Single engine; server-side evaluate for every protected target |
| G2 | Admin UI + bulk API without deploy |
| G3 | Pages, apps, course elements |
| G4 | Campaigns: time, modes, CTAs, bulk |
| G5 | Preview-as (admin); no progress pollution |
| G6 | Migrate free_preview + feature_gates without SEO regression |
| G7 | Policy writes revalidate SSG/ISR routes |
| G8 | Sitemap membership = anonymous **200** |
| G9 | Safety rules hold for **UI and bulk** (server-side) |
| G10 | Member-authored app data never fully locked out |

### 2.2 Non-goals

Client-trusted role params; replacing Woo/`provider_plan_map`; per-identity ACL; full A/B platform.

### 2.3 Success metrics

| Metric | Evidence |
|--------|----------|
| Bulk publish `any_plans: [observer-trial]` without exact flag expands tiers | Server unit test on write expansion |
| Navigator not denied when Observer selected without exact_plans_only | Engine test |
| Admin cannot set trade-log to hard deny Activator read | 422 on write |
| Sitemap omits hide/redirect; includes hard-lock 200 pages | Integration |
| Preview-as Observer empty enrollments | No false grandfather |
| Public decision HTTP endpoint absent | Route test |

---

## 3. Principles

1. Server is source of truth; UI renders decision payload on resources.
2. Identity first (live memberships / `feature_role`).
3. Admin allowed unless preview-as for evaluation UX.
4. Hard mode: no content leak.
5. Fail closed for `campaign:*` without policy; type defaults elsewhere.
6. No profit-claim CTAs.
7. SEO: never sitemap a non-200 anonymous URL by policy.
8. Remedy surfaces ungateable (code constant + tests).
9. **Safety in the write path and engine, not only the admin SPA.**
10. **Member-authored data floor** on data-bearing apps.
11. Documentation parity.

---

## 4. Domain model

### 4.1 Viewer context

```text
ViewerContext {
  identity_id: int | null
  signed_in: bool
  is_admin: bool
  session_role: str
  access_role: str
  plan_slugs: string[]
  enrolled_course_ids: int[]     # real viewer only
  campaign_tags: string[]
  now: datetime (UTC)
  preview_as: PreviewAs | null
}
```

```text
PreviewAs {
  mode: "anonymous" | "signed_in"
  access_role?: str
  plan_slugs?: string[]
  enrolled_course_ids?: int[]    # default [] — never inherit admin enrollments
}
```

When `preview_as` is set:

- Evaluation uses preview fields (enrollments default empty).
- **Suppress** progress / practice / trade-log **writes** that would attach to the real admin identity (§4.1.1).

### 4.1.1 Preview write suppression

While `ft_access_preview` present: no `POST /api/progress`, lesson complete, journal/trade creates for “simulated” member activity. Admin CRUD allowed.

### 4.2 Access target

| Kind | Key pattern |
|------|-------------|
| Surface | `surface:{name}` |
| App | `app:{slug}` |
| Course | `course:{courseSlug}` |
| Module | `course:{courseSlug}:module:{moduleSlug}` |
| Lesson | `course:{courseSlug}:lesson:{moduleSlug}/{lessonSlug}` |
| Resource | `course:{courseSlug}:resource:{resourceId}` |
| Campaign | `campaign:{campaignSlug}:{part}` |

### 4.2.1 Ungateable targets (code constant + tests)

**Code constant** (not a config table), e.g. `ACCESS_UNGATEABLE_TARGETS` / prefixes:

```text
surface:login
surface:signup
surface:logout
surface:membership
surface:forgot-password
surface:reset-password
surface:me          # profile / session prefs if keyed
# recovery surfaces added later MUST extend the constant + test
```

Characterization test: `PUT` each → **422**.

Rename/new recovery surface without constant update fails CI when someone adds a route tagged `recovery` (optional lint) or when integration test suite lists recovery routes and asserts denylist coverage.

### 4.2.2 Data-bearing apps (Blocking #2 — member-authored data)

Apps that store **member-owned** product data:

| App slug | Data |
|----------|------|
| `trade-log` | Trades, accounts, imports |
| `journal` | Journal sessions / notes |
| `playbook` | When shipped |
| (future) | Any Family B member store |

**Flag:** `apps.data_bearing` boolean (migration) **or** code constant `DATA_BEARING_APPS` (v0.3 allows either; **P0 uses code constant** + test for parity with denylist).

**Floor (policy cannot remove):**

| Capability | Floor |
|------------|--------|
| Read own data | Always allowed if signed-in owner |
| Export own data | Always allowed (Member Practice Export) |
| Create/update/delete | May be restricted by policy |
| Full app UX (new entry, coaching tools) | May be soft-locked |

**Write validation:**

- Reject `mode: hide` or `mode: hard` on data-bearing apps if the effect would block **read of existing rows** for signed-in members who fail the plan/role gate.
- Allowed: `mode: soft` with UI “upgrade to continue logging” while **history + export** remain available via API routes tagged `member_data_read`.

**Evaluation for data-bearing apps:**

```
if target is data-bearing app and ctx.signed_in:
  if member_ok: ALLOW full
  else: ALLOW_SOFT_READ  # code=plan/role but allow=true with capability=read_export
                         # or allow=false for write endpoints only
```

API split (P0):

- `GET` list/detail/export: floor allow when signed-in owner  
- `POST`/`PATCH`/`DELETE`: full policy  

UI: soft banner + history visible; primary create CTA locked.

### 4.3 Access policy

```text
AccessPolicy {
  target_key: string
  enabled: bool
  mode: hard | soft | hide | redirect

  min_role: null | observer | alumni | activator | navigator | administrator
  any_plans: string[] | null      # stored AFTER server expansion unless exact_plans_only
  all_plans: string[] | null
  deny_plans: string[] | null
  exact_plans_only: bool          # default false — escape hatch for trial-only experiments
  plan_role_combine: "or" | "and" # default "or"
  require_signed_in: bool

  opens_at, closes_at: datetime | null
  close_behavior: "default" | "deny"

  deny_ui, time_ui
  campaign_id, label, notes
  grandfather_enrollments: bool   # default true; course family only

  version, updated_at, updated_by
}
```

**Role ladder (as-built):**  
`observer < alumni < activator < navigator < administrator`  
Plan `courses-alumni` → role `alumni`.

### 4.3.1 Server-side cumulative plan expansion (Blocking #1)

**On every write** (`PUT`, `bulk`, agent, seed) when `exact_plans_only` is false and `any_plans` is non-empty:

```
expand_plans(selected: set) -> set:
  # Commercial tier cumulative (product order)
  if intersects(selected, OBSERVER_SLUGS): add ACTIVATOR_SLUGS, NAVIGATOR_SLUGS, COACHING_SLUGS
  if intersects(selected, ACTIVATOR_SLUGS): add NAVIGATOR_SLUGS, COACHING_SLUGS
  if intersects(selected, NAVIGATOR_SLUGS): add COACHING_SLUGS
  return selected ∪ additions
```

| Bucket | Slugs |
|--------|--------|
| Observer | `observer-trial` |
| Activator | `activator`, `labs-membership` |
| Navigator | `navigator` |
| Coaching | `coaching` |

**Stored** `any_plans_json` is the **expanded** set (audit before_json shows request; after_json shows expanded).  
Admin UI may show expansion preview; **bulk/campaign does not skip expansion**.

When `exact_plans_only=true`: store exactly what was sent (true trial-only).

### 4.4 Access decision

```text
AccessDecision {
  allow: bool
  code: "ok" | "signin_required" | "role" | "plan" | "time" | "denied" | "hidden"
        | "grandfather" | "read_only_floor"
  mode: hard | soft | hide | redirect
  target_key: string
  capabilities: string[]   # e.g. ["read","export","write"] for apps
  ui: object | null
  evaluated_as: { access_role, plan_slugs, enrolled_course_ids }
  grandfathered: bool
}
```

### 4.5 Modes (no contradiction)

| Mode | HTTP (typical) | Listing | Content |
|------|----------------|---------|---------|
| `hard` | **200** lock card **or** 403 API for media | Show locked card | No leak of media/body |
| `soft` | **200** teaser | Show soft badge | Teaser only; no media |
| `hide` | **404** | **Omit** from lists/sitemap | No soft message page |
| `redirect` | **302** | Omit from sitemap | N/A |

**Robots:** `hide`/`redirect` → not in sitemap; if a shell must exist, it is not `hide`.  
**Soft message** is never `hide`.

---

## 5. Evaluation algorithm

```
evaluate(target_key, viewer) -> AccessDecision:

  if viewer.is_admin and not viewer.preview_as:
    return ALLOW full capabilities

  ctx = apply_preview_as(viewer)
  # preview enrolled_course_ids default []

  policy = load_policy(target_key)
  if policy is null or not policy.enabled:
    return default_for_target_type(target_key, ctx)

  # Time
  if policy.opens_at and ctx.now < policy.opens_at:
    return time lock (time_ui)
  if policy.closes_at and ctx.now >= policy.closes_at:
    if policy.close_behavior == "deny":
      return DENY (time/denied)
    return default_for_target_type(target_key, ctx)

  # Signed-in — single check
  if policy.require_signed_in and not ctx.signed_in:
    return DENY signin_required

  # Blocklist — no grandfather
  if policy.deny_plans and intersection(ctx.plan_slugs, deny_plans):
    return DENY plan   # explicit: deny_plans wins over grandfather

  plans_ok, role_ok, member_ok = evaluate_membership_layers(policy, ctx)
  # plan_role_combine or/and as v0.2; any_plans already expanded at write

  if not member_ok:
    if policy.deny_plans:  # already handled
      pass
    if (policy.grandfather_enrollments
        and is_course_family(target_key)
        and course_id(target_key) in ctx.enrolled_course_ids):
      return ALLOW grandfather
    if is_data_bearing_app(target_key) and ctx.signed_in:
      return ALLOW capabilities=["read","export"] code=read_only_floor mode=soft
    return DENY role_or_plan

  return ALLOW full
```

**Membership layers (OR default):**

```
if any_plans set and min_role set:
  member_ok = (plans_ok OR role_ok) if combine=="or" else (plans_ok AND role_ok)
elif any_plans set: member_ok = plans_ok
elif min_role set: member_ok = role_ok
else: member_ok = True
```

`all_plans` always AND-ed into plans_ok when set.

---

## 6. Type defaults & render modes

### 6.1 Render mode + revalidation

| Target kind | Render | Personalized HTML? | Revalidation on policy write |
|-------------|--------|--------------------|------------------------------|
| `surface:home` | Dynamic | Per request | path `/` |
| `surface:course-catalog` | **SSG/ISR** | **No** — SSG = **anonymous** decision only | `/course` + tag `access:catalog` |
| `course:{slug}` detail | **SSG/ISR** | **No** — anonymous shell; **client hydrates** lock/open for signed-in | `/course/{slug}` + tag |
| `course:…:lesson:…` | Dynamic | Yes | Optional |
| `app:*` | Dynamic | Yes | Usually none |
| `campaign:*` | Dynamic preferred | Yes | Lander path if any SSG |

**SSG doctrine (Should-fix #4, explicit):**  
Statically generated course/catalog HTML reflects the **anonymous** access decision only (public structure, free-preview badges, or generic lock affordance if entire course hidden from anonymous).  
**Per-viewer** lock vs open (Activator vs Navigator) is applied in **client hydration** (or a small authenticated RSC island) using the **resource response** decision payload — **not** by making all course detail fully dynamic under deadline pressure (preserves SEO pillar).

### 6.2 Sitemap rule (Blocking #3 — one sentence)

**Include a URL in `sitemap.xml` if and only if an anonymous HTTP GET to that URL returns status 200.**

Implications:

- `hard` lock card at 200 → **indexable** (OK).
- `hide` 404 → **not** in sitemap.
- `redirect` 302 → **not** in sitemap (or only final 200 target if intentionally public).

Do not implement sitemap from a second copy of engine “prefer” clauses; test against response codes (or shared helper used by both the route and sitemap generator that encodes the same decision → status mapping).

### 6.3 Type defaults

| Target | Default |
|--------|---------|
| Surfaces | open / feature_gate compat |
| Apps | signed-in; soon → soft; data-bearing floor always |
| Course detail | open structure |
| Lesson | free_preview OR member content |
| `campaign:*` | fail closed + admin warning if campaign live without policy |

---

## 7. Admin experience

| Area | Notes |
|------|--------|
| `/admin/access` | Surfaces, Apps, Courses, Campaigns, **Audit (P0)** |
| Plan chips | Preview of **server expansion**; `exact_plans_only` checkbox |
| Bulk/campaign | Same write path as single PUT |
| Campaign live, no policy | Red warning state |
| Deny CTA | Reachability validation for denied class |
| Preview-as | Empty enrollments by default |

---

## 8. API surface

### 8.1 Decisions for members (Should-fix #5)

**No public decision enumeration endpoint.**

Member UI gets access state **on the resource**:

```json
// GET lesson (allowed)
{ "id": …, "video": {…}, "access": { "allow": true, "capabilities": ["read","write"] } }

// GET lesson soft / locked media
{ "id": …, "title": "…", "access": { "allow": false, "code": "plan", "mode": "hard", "ui": {…} } }
// video omitted
```

App shells: `GET /api/apps/{slug}/access` or embed in app bootstrap payload — **not** a free-form target probe API.

### 8.2 Admin

```http
GET/PUT/DELETE /api/admin/access/policies/{target_key}
POST /api/admin/access/policies/bulk
GET  /api/admin/access/decision?target=
POST /api/admin/access/decision/batch   # evaluate_many for admin tools
GET  /api/admin/access/audit
```

Admin only. Write path: denylist → data-bearing floor → expand plans → CTA check → store → audit → revalidate.

### 8.3 Internal

```python
evaluate(target_key, viewer) -> AccessDecision
evaluate_many(target_keys, viewer) -> dict[str, AccessDecision]  # P0
expand_any_plans(plans, exact_plans_only) -> list[str]         # P0 write path
require_access(request, target_key, *, capability="write"|"read")
```

---

## 9. Data storage

Same as v0.2 plus:

- `exact_plans_only TINYINT(1) NOT NULL DEFAULT 0`
- `plan_role_combine`, `close_behavior`, `grandfather_enrollments`
- `ROW_FORMAT=DYNAMIC` on both tables
- Audit **P0**

Optional: `apps.data_bearing` column; P0 may use code constant only.

---

## 10. Campaigns

- Fail closed without policy; **“No access policy”** admin warning when campaign is live.
- Bulk publish uses **same expansion** as UI.
- Prefer requiring policy before “go live.”

---

## 11. Member experience & revocation

### 11.1 Course grandfather

Default `grandfather_enrollments=true` for course-family targets.  
**deny_plans does not grandfather** (stated).

### 11.2 Apps / member data

Data-bearing floor (§4.2.2) — not course grandfather.  
Tier downgrade cannot hide historical Trade Log / Journal from the owner.

### 11.3 Copy

Time lock ≠ “not a member.” Process-only CTAs.

---

## 12. Security

| Risk | Mitigation |
|------|------------|
| Bulk bypasses UI safety | Server expansion + exact_plans_only |
| Decision oracle | Admin-only admin decision APIs |
| App data lockout | Data-bearing floor |
| Preview false grandfather | Empty enrollments in PreviewAs |
| Gating remedies | Code constant denylist + tests |
| SEO 404 spam | Sitemap = anonymous 200 only |

---

## 13. Migration

As v0.2 dual-write free_preview / feature_gates / apps.status → defaults then policies.

---

## 14. Phases

### P0

- Tables + evaluate + **evaluate_many** + **expand_any_plans on write**
- Admin CRUD + bulk + **audit UI**
- Preview-as + write suppress + empty enrollments
- Lesson dual-write free_preview
- Data-bearing app constant + read/export floor
- Ungateable constant + tests
- revalidate_for_targets
- Resource `access` field on lesson/app responses

### P1

- Course bulk, catalog evaluate_many, sitemap 200-rule, SSG + hydrate doc in admin help

### P2

- Feature gates merge, campaigns, live category map

### P3

- Templates, scheduling

---

## 15. Acceptance criteria (P0)

1. Free denied gated lesson; Observer membership allowed (live membership).
2. **Write path:** `PUT` or **bulk** with `any_plans: ["observer-trial"]`, `exact_plans_only: false` stores expanded set including navigator + coaching; Navigator **ALLOW**.
3. `exact_plans_only: true` + only observer-trial → Navigator **DENY** (escape hatch works).
4. `PUT` `app:trade-log` mode hard for activator-only fail → **422** or coerced soft + read floor.
5. `PUT` `surface:login` → **422**.
6. No public decision probe route.
7. Preview-as does not write progress; grandfather uses preview enrollments not admin’s.
8. Audit row on every write.
9. No policy → as-built defaults.

---

## 16. Open questions (Coach optional)

| # | Question | v0.3 default |
|---|----------|--------------|
| Q1 | `/admin/access` vs gates expand | `/admin/access` |
| Q3 | Catalog locked card vs hide | Locked card for courses |
| Q4 | Free preview play requires sign-in | Yes (Enrollment Access) |
| Q7 | data_bearing as DB column vs constant | **Constant P0**; column P1 if product wants admin flag |

---

## 17. Document control

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-08-02 | Initial DRAFT |
| v0.2 | 2026-08-02 | First review (SSG, SEO, OR, close_behavior, admin decision, denylist, …) |
| v0.3 | 2026-08-02 | Second review: server-side expansion, data-bearing apps, sitemap=200, SSG hydrate doctrine, resource-embedded decisions, preview enrollments, hide purity, code denylist, algorithm cleanups |

**Next:** India on §4.2.2 / §5 / §6; Mike on §8/§12; Tango on §11; Coach build authority.

---

*End of Access Control Spec v0.3*
