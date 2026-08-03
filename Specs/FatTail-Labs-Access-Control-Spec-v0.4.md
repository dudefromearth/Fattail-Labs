# FatTail Labs — Access Control Spec v0.4

**Status:** **BUILD AUTHORITY** (Coach 2026-08-02; W0-G PASS)  
**Supersedes:** `FatTail-Labs-Access-Control-Spec-v0.3.md`  
**Product:** FatTail Labs (`labs.fattail.ai`)  
**Build authority:** **STAMPED 2026-08-02.** Self-contained for implementation (DDL §9). W0 reviews: India · Mike · Tango · Echo · Sierra APPROVED (`agents/p-access-control/gate-reports/AC0-*`). Ship target: MVP after AC5-G.

**Related:** Identity Access · Membership Tiers · Enrollment Access · Campaign Workflow · SEO Spec v1.3 · Member Data Privacy · Application Framework

**Does not reverse:** Woo commerce; `provider_plan_map`; server-side auth only.

---

## 0. Coach intent (preserved)

1. Admin gating by role/plan for **pages, apps, and course elements**.  
2. Campaign control without deploys.  
3. Access **consumes** identity/membership truth; never invents it from URLs.

---

## 0.1 Review resolution log (cumulative)

### v0.1 → v0.2

SSG/revalidation; SEO; plan OR role; close_behavior; admin-only decision API; ungateable remedies; grandfather courses; alumni ladder note; evaluate_many; preview write suppress; DYNAMIC rows; audit P0.

### v0.2 → v0.3

Server-side expansion (write-time); data-bearing app floor; sitemap = anonymous 200; SSG + hydrate; resource-embedded decisions; PreviewAs empty enrollments; hide purity; code denylist; algorithm cleanups.

### v0.3 → v0.4 (this review)

| # | Class | Resolution |
|---|--------|------------|
| **1** | Blocking — write-time expansion freezes slug vocabulary | **Store intent; expand at evaluate** (§4.3.1, §5). `selected_plans` + `exact_plans_only` persisted; `expand_plans()` runs every evaluation. No re-expansion migration hook required. |
| **2** | Blocking / gap — alumni vs expansion | **Alumni is non-commercial**: outside cumulative plan expansion; admitted via `min_role` ladder only. Admin UI labels commercial vs alumni (§4.3.2). |
| 3 | Should-fix — AC#4 dual behavior | **422 only** on illegal data-bearing writes; no silent coerce |
| 4 | Should-fix — deny_plans vs data floor | **Explicit:** deny_plans **does not** strip data-bearing read/export floor (§4.2.2, §5) |
| 5 | Should-fix — hydration flash | SSG access-dependent region is **neutral/skeleton**, not lock card (§6.1) |
| 6 | Minor — dead branch | Removed from §5 |
| 7 | Minor — incomplete DDL | Full DDL in §9 of this document |

**Kept:** review resolution log format; bulk/UI same write path for policy fields; data-bearing floor shape; sitemap one-liner; admin-only decision APIs.

---

## 1. Problem

Fragmented gates block campaign design. Need one admin-controlled policy engine for surfaces, apps, and course elements.

---

## 2. Goals & non-goals

### 2.1 Goals

| ID | Goal |
|----|------|
| G1 | Single engine; server-side evaluate |
| G2 | Admin UI + bulk without deploy |
| G3 | Pages, apps, course elements |
| G4 | Campaigns: time, modes, CTAs, bulk |
| G5 | Preview-as; no progress pollution |
| G6 | Migrate free_preview + feature_gates without SEO regression |
| G7 | Policy writes revalidate SSG/ISR routes |
| G8 | Sitemap = anonymous HTTP 200 only |
| G9 | Safety holds for UI, bulk, agents (server) |
| G10 | Member-authored app data floor |
| G11 | Plan vocabulary can change without re-writing every policy |

### 2.2 Non-goals

Client-trusted role params; replacing Woo/`provider_plan_map`; per-identity ACL; full A/B platform.

### 2.3 Success metrics

| Metric | Evidence |
|--------|----------|
| New slug added to map; old Observer-selected policy admits holders of new higher-tier slug via expand-at-eval | Engine test with mutated map mock |
| `selected_plans: [observer-trial]` + exact false → Navigator ALLOW at evaluate | Engine test |
| `exact_plans_only: true` → Navigator DENY | Engine test |
| Alumni: min_role observer ALLOW; plans-only Observer selection without min_role does **not** auto-add alumni | Engine + UI copy test |
| Illegal hard lock on trade-log → **422** only | Admin API test |
| deny_plans + data-bearing still allows GET export | API test |
| SSG shell has no lock card flash for paying member | Manual / e2e |

---

## 3. Principles

1. Server is source of truth; UI renders decision on **resource responses**.  
2. Identity first (live memberships / `feature_role`).  
3. Admin allowed unless preview-as for evaluation UX.  
4. Hard mode: no content leak.  
5. Fail closed for `campaign:*` without policy; type defaults elsewhere.  
6. No profit-claim CTAs.  
7. SEO: sitemap only anonymous **200**.  
8. Remedy surfaces ungateable (code constant + tests).  
9. Safety in **write validation and evaluate**, not only the admin SPA.  
10. Member-authored data floor on data-bearing apps.  
11. **Plan expansion is evaluation-time** so vocabulary drift cannot freeze campaigns.  
12. Documentation parity.

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
  enrolled_course_ids: int[]
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

**Preview write suppression:** while `ft_access_preview` set — no progress/practice/trade creates against real admin identity. Admin policy CRUD allowed.

### 4.2 Access target

| Kind | Key pattern |
|------|-------------|
| Surface | `surface:{name}` |
| App | `app:{slug}` |
| Course / module / lesson / resource | `course:…` hierarchy |
| Campaign | `campaign:{slug}:{part}` |

### 4.2.1 Ungateable targets (code constant + tests)

Constant `ACCESS_UNGATEABLE_TARGETS` (not a config table), e.g.:

```text
surface:login, surface:signup, surface:logout, surface:membership,
surface:forgot-password, surface:reset-password, surface:me
```

Characterization: `PUT` each → **422**. New recovery routes must extend constant + test.

### 4.2.2 Data-bearing apps (member-authored data)

**Code constant** P0: `DATA_BEARING_APPS = {trade-log, journal, playbook…}`.

| Capability | Floor (signed-in owner) |
|------------|-------------------------|
| Read own data | Always |
| Export own data | Always (Member Practice Export) |
| Create / update / delete | Policy may restrict |

**Write validation (admin):**  
Attempt to set `mode: hide` or `mode: hard` on a data-bearing app such that read of existing rows would be denied → **422** with message naming the floor (e.g. “Data-bearing apps cannot hard-lock member read/export. Use soft + write lock.”).  
**No silent coerce to soft.**

**Evaluate:** if plan/role fail but signed-in owner of data-bearing app → `allow=true`, `capabilities=["read","export"]`, `code=read_only_floor`, `mode=soft` for UX banner; write endpoints still DENY.

**deny_plans vs data floor (explicit):**  
`deny_plans` **does not** remove the read/export floor. Blocklisted members still **read/export** own Trade Log / Journal; **writes** remain denied. Rationale: data-subject access to own records outweighs tier blocklist for reads; abuse cases use account suspension (identity/admin), not access policy hide.

### 4.3 Access policy

```text
AccessPolicy {
  target_key: string
  enabled: bool
  mode: hard | soft | hide | redirect

  min_role: null | observer | alumni | activator | navigator | administrator

  # INTENT — what admin selected (not frozen expansion)
  selected_plans: string[] | null   # stored as selected_plans_json
  exact_plans_only: bool            # default false
  all_plans: string[] | null        # rare AND list; also intent; not auto-expanded
  deny_plans: string[] | null

  plan_role_combine: "or" | "and"   # default "or"
  require_signed_in: bool

  opens_at, closes_at: datetime | null
  close_behavior: "default" | "deny"

  deny_ui, time_ui
  campaign_id, label, notes
  grandfather_enrollments: bool     # default true; course family only

  version, updated_at, updated_by
}
```

**Do not store expanded slug lists as the source of truth.** Optional cache column is forbidden in v0.4 to avoid drift; expand every evaluate.

**Role ladder (as-built):**  
`observer < alumni < activator < navigator < administrator`  
Plan `courses-alumni` → grants_role `alumni`.

### 4.3.1 Plan expansion — **at evaluate time** (Blocking #1)

```
effective_plans(policy) -> set:
  if policy.selected_plans is empty or null:
    return empty
  if policy.exact_plans_only:
    return set(policy.selected_plans)
  return expand_plans(set(policy.selected_plans))
```

```
expand_plans(selected: set) -> set:
  # Commercial cumulative chain only — NOT alumni
  if intersects(selected, OBSERVER_SLUGS):
    selected |= ACTIVATOR_SLUGS | NAVIGATOR_SLUGS | COACHING_SLUGS
  if intersects(selected, ACTIVATOR_SLUGS):
    selected |= NAVIGATOR_SLUGS | COACHING_SLUGS
  if intersects(selected, NAVIGATOR_SLUGS):
    selected |= COACHING_SLUGS
  return selected
```

| Bucket | Slugs |
|--------|--------|
| Observer | `observer-trial` |
| Activator | `activator`, `labs-membership` |
| Navigator | `navigator` |
| Coaching | `coaching` |

**Write path** persists `selected_plans` exactly as submitted (after allowlist validation of known slugs). UI may show “also admits Activator, Navigator, Coaching” as a **live preview** of evaluate-time expansion — display only.

**Why not write-time expand:** `provider_plan_map` and commercial slugs change; frozen `any_plans_json` would silently deny new higher-tier slugs. Evaluate-time expansion always uses current vocabulary.

**Cost:** set ops per evaluate; `evaluate_many` amortizes across catalog.

### 4.3.2 Alumni and the commercial chain (Blocking #2 this review)

| Path | Alumni included? |
|------|------------------|
| `min_role: observer` (or alumni/activator/…) | Yes via role ladder |
| `selected_plans` with expansion | **No** — alumni is **non-commercial** |
| Auto-add of `courses-alumni` | **Never** |

**Admin UI (required copy at plan multi-select):**

> Commercial plans expand to higher paid tiers at access time.  
> **Course Alumni** is separate — use Min role ≥ alumni (or include plan `courses-alumni` explicitly with exact plans / all_plans). Expansion never adds Alumni.

### 4.4 Modes

| Mode | HTTP | Listing | Content |
|------|------|---------|---------|
| `hard` | 200 lock card **or** 403 for media APIs | Locked card | No leak |
| `soft` | 200 teaser | Soft badge | Teaser; no media |
| `hide` | **404** | **Omit** | No soft message page |
| `redirect` | **302** | Omit from sitemap | N/A |

### 4.5 Access decision

```text
AccessDecision {
  allow: bool
  code: "ok" | "signin_required" | "role" | "plan" | "time" | "denied" | "hidden"
        | "grandfather" | "read_only_floor"
  mode: hard | soft | hide | redirect
  target_key: string
  capabilities: string[]    # ["read","export","write"]
  ui: object | null
  evaluated_as: { access_role, plan_slugs, enrolled_course_ids, effective_plans }
  grandfathered: bool
}
```

Member UI: decision embedded on **resource responses** only — no public target-probe API.

---

## 5. Evaluation algorithm

```
evaluate(target_key, viewer) -> AccessDecision:

  if viewer.is_admin and not viewer.preview_as:
    return ALLOW full

  ctx = apply_preview_as(viewer)   # enrollments default []

  policy = load_policy(target_key)
  if policy is null or not policy.enabled:
    return default_for_target_type(target_key, ctx)

  if policy.opens_at and ctx.now < policy.opens_at:
    return LOCKED_TIME
  if policy.closes_at and ctx.now >= policy.closes_at:
    if policy.close_behavior == "deny":
      return DENY time
    return default_for_target_type(target_key, ctx)

  if policy.require_signed_in and not ctx.signed_in:
    return DENY signin_required

  # Blocklist: no grandfather; data floor still applies below
  blocklisted = policy.deny_plans and intersection(ctx.plan_slugs, deny_plans)

  effective = effective_plans(policy)   # expand at evaluate
  plans_constrained = effective non-empty
  role_constrained = policy.min_role is set

  plans_ok = (not plans_constrained) or bool(intersection(ctx.plan_slugs, effective))
  if policy.all_plans non-empty:
    plans_ok = plans_ok and all(p in ctx.plan_slugs for p in all_plans)

  role_ok = (not role_constrained) or role_at_least(ctx.access_role, policy.min_role)

  if plans_constrained and role_constrained:
    member_ok = (plans_ok or role_ok) if combine == "or" else (plans_ok and role_ok)
  elif plans_constrained:
    member_ok = plans_ok
  elif role_constrained:
    member_ok = role_ok
  else:
    member_ok = True

  if blocklisted:
    member_ok = False
    # do NOT grandfather
    if is_data_bearing_app(target_key) and ctx.signed_in:
      return ALLOW capabilities=["read","export"] code=read_only_floor mode=soft
    return DENY plan

  if not member_ok:
    if (policy.grandfather_enrollments
        and is_course_family(target_key)
        and course_id(target_key) in ctx.enrolled_course_ids):
      return ALLOW grandfather
    if is_data_bearing_app(target_key) and ctx.signed_in:
      return ALLOW capabilities=["read","export"] code=read_only_floor mode=soft
    return DENY role_or_plan

  return ALLOW full
```

No second `require_signed_in` check. No dead `if deny_plans: pass` branch.

---

## 6. Type defaults & render modes

### 6.1 SSG / dynamic / revalidation

| Target kind | Render | Shell content | Revalidation on policy write |
|-------------|--------|---------------|------------------------------|
| Catalog / course detail | SSG/ISR | **Anonymous** decision only; access-dependent regions are **neutral skeleton** (not lock card, not open player) | paths + tags |
| Lesson | Dynamic | Full evaluate | optional |
| Apps | Dynamic | Full evaluate | usually none |
| Campaign landers | Dynamic preferred | Full evaluate | lander path |

**Hydration (no paywall flash):**  
SSG must **not** render a member lock card or a full unlocked module list for personalization. Render a **skeleton / placeholder** for access-dependent UI; client (or auth RSC island) resolves once to lock **or** open. Prefer one-way resolve (skeleton → final), never lock → open.

Policy write → `revalidate_for_targets` (existing pipeline).

### 6.2 Sitemap (one rule)

**Include a URL in `sitemap.xml` if and only if an anonymous HTTP GET to that URL returns status 200.**

Test against status codes (or the shared helper that maps decision → status for anonymous).

### 6.3 Type defaults

Surfaces open / feature_gate compat; apps signed-in + soon soft + data floor; course open; lesson free_preview OR member content; campaign fail-closed + admin “no policy” warning.

---

## 7. Admin experience

- `/admin/access`: Surfaces, Apps, Courses, Campaigns, **Audit (P0)**  
- Plan multi-select stores **intent**; UI shows evaluate-time expansion preview  
- `exact_plans_only` checkbox with warning  
- Alumni: separate control / min_role, copy per §4.3.2  
- Data-bearing: 422 message if illegal mode  
- Preview-as: empty enrollments  
- Deny CTA reachability validation  
- Campaign live without policy: red warning  

---

## 8. API surface

### 8.1 Member

No public decision probe. Resource embeds:

```json
"access": { "allow": true, "capabilities": ["read","write"], "code": "ok" }
```

or locked payload without media + `access.ui`.

### 8.2 Admin

```http
PUT/GET/DELETE /api/admin/access/policies/{target_key}
POST /api/admin/access/policies/bulk
GET  /api/admin/access/decision?target=
POST /api/admin/access/decision/batch
GET  /api/admin/access/audit
```

Write: denylist → data-bearing 422 rules → validate slugs → store **selected_plans** (intent) → audit → revalidate.  
**Do not** expand on write.

### 8.3 Internal

```python
evaluate / evaluate_many
effective_plans(policy)   # expand at eval
expand_plans(selected)
require_access(request, target_key, *, capability="read"|"write")
```

---

## 9. Complete DDL (build authority self-contained)

```sql
CREATE TABLE access_policies (
  target_key              VARCHAR(512) NOT NULL,
  enabled                 TINYINT(1) NOT NULL DEFAULT 1,
  mode                    VARCHAR(16) NOT NULL DEFAULT 'hard',
  min_role                VARCHAR(32) NULL,
  selected_plans_json     JSON NULL,
  exact_plans_only        TINYINT(1) NOT NULL DEFAULT 0,
  all_plans_json          JSON NULL,
  deny_plans_json         JSON NULL,
  plan_role_combine       VARCHAR(8) NOT NULL DEFAULT 'or',
  require_signed_in       TINYINT(1) NOT NULL DEFAULT 1,
  opens_at                DATETIME NULL,
  closes_at               DATETIME NULL,
  close_behavior          VARCHAR(16) NOT NULL DEFAULT 'default',
  deny_ui_json            JSON NULL,
  time_ui_json            JSON NULL,
  campaign_id             BIGINT UNSIGNED NULL,
  grandfather_enrollments TINYINT(1) NOT NULL DEFAULT 1,
  label                   VARCHAR(255) NOT NULL DEFAULT '',
  notes                   TEXT NULL,
  version                 INT NOT NULL DEFAULT 1,
  updated_by              BIGINT UNSIGNED NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (target_key),
  KEY ix_access_campaign (campaign_id),
  KEY ix_access_opens (opens_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=DYNAMIC;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=DYNAMIC;
```

**Dual-write:** `lessons.free_preview` during transition; policy preferred when present.

**Plan slug chips:** Observer / Activator / Navigator / Coaching as commercial; Alumni only via min_role or explicit all_plans/selected with exact.

---

## 10. Campaigns

Fail closed without policy; admin warning if live with no policy. Bulk uses same intent storage; expansion at evaluate.

---

## 11. Member experience & revocation

### 11.1 Course grandfather

Default on for course family; **not** applied when deny_plans matched (deny_plans already handled with data floor for apps only).

### 11.2 Data-bearing apps

Read/export floor always for signed-in owner; see §4.2.2. deny_plans does not remove floor.

### 11.3 Copy

Time lock ≠ “not a member.”

---

## 12. Security

| Risk | Mitigation |
|------|------------|
| Frozen plan vocabulary | Expand at evaluate |
| Bulk/UI split | Same write; same evaluate |
| Decision oracle | Admin-only decision routes |
| App data lockout | Floor + 422 on illegal write |
| Preview false grandfather | Empty enrollments |
| SEO | Sitemap = anonymous 200 |

---

## 13. Migration from as-built

free_preview dual-write; feature_gates → surface policies; apps.status → defaults; `can_access_member_content` as lesson default.

---

## 14. Phases

**P0:** DDL · evaluate · evaluate_many · expand at eval · write validation · admin CRUD/bulk · audit UI · preview-as · dual-write free_preview · data-bearing floor · ungateable tests · revalidate · resource `access` field · skeleton SSG regions  

**P1:** Course bulk · catalog batch · sitemap 200-rule · hydrate polish  

**P2:** Feature gates merge · campaigns  

**P3:** Templates · scheduling  

---

## 15. Acceptance criteria (P0)

1. Free denied gated lesson; Observer membership allowed (live membership).  
2. Policy stores `selected_plans: ["observer-trial"]`, `exact_plans_only: false`; at evaluate, Navigator with plan `navigator` **ALLOW** (expansion not frozen at write).  
3. Same with `exact_plans_only: true` → Navigator **DENY**.  
4. After adding a new commercial slug to the expansion table, old Observer-selected policies admit holders of that slug without rewriting rows (mock expansion table / config).  
5. `PUT app:trade-log` mode hard → **422** with floor message (not coerce).  
6. deny_plans member can still GET trade-log list/export; POST denied.  
7. `PUT surface:login` → 422.  
8. No public decision probe.  
9. Preview-as empty enrollments; no progress write.  
10. Audit on every write.  
11. No policy → as-built defaults.

---

## 16. Open questions (optional Coach)

| # | Default |
|---|---------|
| Q1 `/admin/access` | Yes |
| Q3 Catalog locked card | Yes for courses |
| Q4 Free preview requires sign-in | Yes |
| Q7 data_bearing DB column | Constant P0 |

---

## 17. Document control

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-08-02 | Initial |
| v0.2 | 2026-08-02 | First review |
| v0.3 | 2026-08-02 | Second review (write-time expand, data floor, sitemap 200) |
| v0.4 | 2026-08-02 | Third review: **expand at evaluate**; alumni non-commercial; 422-only floor; deny_plans vs floor; skeleton hydrate; complete DDL |

**W0 complete:** India · Mike · Tango · Echo · Sierra APPROVED; Delta AC0-G **PASS**; Coach **BUILD AUTHORITY** 2026-08-02.  
**Next:** AC1 engine (`agents/p-access-control/seeds/AC1-1-india-alpha-model.md`).

---

*End of Access Control Spec v0.4*
