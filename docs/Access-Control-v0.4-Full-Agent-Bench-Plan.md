# Access Control Spec v0.4 — Full Multi-Agent Bench Plan

**Project callsign:** `p-access-control`  
**Board:** [`agents/p-access-control/ORCHESTRATOR.md`](../agents/p-access-control/ORCHESTRATOR.md)  
**Spec (canonical):** [`Specs/FatTail-Labs-Access-Control-Spec-v0.4.md`](../Specs/FatTail-Labs-Access-Control-Spec-v0.4.md)  
**Status:** **Plan for review** — Spec is DRAFT; **no P0 code until** Coach stamps **BUILD AUTHORITY** after W0 gate.  
**Governance:** `agents/bench/doctrine.md` · `first-principles-doctrine.md` · Delta ternary gates only  

---

## 1. Purpose

Ship the **Access Policy Engine** so Coach can gate **surfaces, apps, and course elements** by role/plan/time for campaigns — without deploys — while preserving SEO, member data rights, and identity/SSO truth.

This plan is the **Juliet decomposition** of Spec v0.4 into reviewable phases, agent pairings, seeds, and gates.

---

## 2. Preconditions

| Gate | Requirement |
|------|-------------|
| Spec | v0.4 DRAFT complete (expand-at-eval, data-bearing floor, sitemap=200, etc.) |
| W0 | India · Mike · Tango · Echo reviews; Lima as-built notes; Coach **BUILD AUTHORITY** |
| Identity | As-built SSO + `provider_plan_map` + `can_access_member_content` (lesson fix landed) |
| Revalidation | Existing `/api/revalidate` / Next tags pipeline operational |

**Do not start AC1 code seeds before W0-G PASS + Coach GO.**

---

## 3. Keep / kill / non-goals (from Spec)

### Keep

- Type defaults = today's behavior until a policy exists  
- Live membership elevation in evaluate  
- Server-side safety (expansion at **evaluate**, denylist, data floor)  
- Resource-embedded `access` for member UI  
- Dual-write free_preview during P0  

### Kill / ban

- Public decision enumeration endpoint  
- Client-trusted role/plan query params  
- Write-time frozen expanded plan lists  
- Silent coerce of illegal data-bearing modes  
- Gating `surface:login` / membership remedies  

### Non-goals (this program)

- Per-identity ACL  
- Full feature_gates merge (P2)  
- Live category map (P2)  
- A/B experiment platform  

---

## 4. Program phases (map to Spec §14)

```text
W0  Spec lock + Coach BUILD AUTHORITY
  ↓
AC1 Engine core (DDL, evaluate, evaluate_many, expand, require_access)
  ↓
AC2 Admin API + write validation + audit + revalidate
  ↓
AC3 Lesson dual-write + resource access payload + tests
  ↓
AC4 Apps data-bearing floor + app policies
  ↓
AC5 Admin UI cockpit + preview-as
  ↓
AC6 Catalog evaluate_many + SSG skeleton + sitemap 200-rule   [P1 start]
  ↓
AC7 Campaign bulk + feature_gates merge                        [P2]
  ↓
AC8 Program close (Lima as-built, Delta PASS)
```

**Critical path:** W0 → AC1 → AC2 → AC3 → AC5 (minimum viable campaign lesson gating).  
AC4 parallelizable after AC2. AC6–AC7 after AC5.

---

## 5. Agent roster & ownership

| Agent | Owns |
|-------|------|
| **Coach** | BUILD AUTHORITY, product defaults on open Qs, ship/no-ship |
| **Juliet** | Board, seeds, sequencing; never implements |
| **India** | Domain model integrity, target keys, evaluate algorithm, defaults |
| **Mike** | Authz, denylist, preview cookie, no enumeration, Family B isolation |
| **Alpha** | Schema, domain module, APIs, dual-write, evaluate |
| **Charlie** | Admin UI, course in-place controls, member lock UI, skeleton hydrate |
| **Echo** | Admin/member visual hierarchy for lock/soft/skeleton |
| **Tango** | Deny/time copy, no false “not a member”, data-rights language |
| **Kilo** | Characterization matrix (free / Observer / Navigator / bulk / floor / preview) |
| **Delta** | Phase gates; evidence only |
| **Lima** | Decision log, spec as-built, admin help |
| **Foxtrot** | Deploy notes if MiniTwo cutover; revalidate env |
| **Sierra** | SEO/sitemap/JSON-LD alignment (AC6) |

---

## 6. Phase detail

### W0 — Spec lock (reviews only)

| Seed | Agent | Deliverable |
|------|-------|-------------|
| AC0-0 | Coach | Intent ack; stamp or return v0.4 |
| AC0-1 | India | Architecture APPROVED/RETURNED on §§4–6, 9, 14 |
| AC0-2 | Mike | Security APPROVED/RETURNED on §§4.2, 8, 12 |
| AC0-3 | Tango | Member copy + data-floor language APPROVED/RETURNED |
| AC0-4 | Echo | Admin/member lock UI notes (skeleton, soft, hard) |
| AC0-5 | Sierra | SEO/sitemap 200-rule feasibility |
| AC0-G | Delta | Spec lock PASS only if all required reviews filed + Coach GO |

**Exit:** Spec header → **BUILD AUTHORITY** (or v0.5 if returns force edits).

---

### AC1 — Engine core

| Seed | Agent | Scope |
|------|-------|-------|
| AC1-1 | India + Alpha | Target key grammar, type defaults table as code constants |
| AC1-2 | Alpha | Migration: `access_policies`, `access_policy_audit` (full DDL Spec §9) |
| AC1-3 | Alpha | `server/access_control/` — `evaluate`, `evaluate_many`, `effective_plans`, `expand_plans` |
| AC1-4 | Kilo | Pure unit tests: expansion, OR combine, exact, deny_plans+floor, grandfather, time, ungateable N/A |

**Invariants:** expand at **evaluate** only; store `selected_plans` intent; alumni not in commercial expand.

**Gate AC1-G (Delta):** unit suite green; no HTTP yet required.

---

### AC2 — Admin API + write path

| Seed | Agent | Scope |
|------|-------|-------|
| AC2-1 | Mike + Alpha | `ACCESS_UNGATEABLE_TARGETS`, `DATA_BEARING_APPS` constants + 422 rules |
| AC2-2 | Alpha | Admin CRUD + bulk; CTA host allowlist; write → audit → revalidate_for_targets |
| AC2-3 | Alpha | Admin decision + batch (admin-only); **no** public decision route |
| AC2-4 | Kilo | API tests: 422 login gate, 422 hard trade-log, bulk expansion at eval, audit rows |

**Gate AC2-G:** Delta with curl evidence.

---

### AC3 — Lessons dual-write + member payload

| Seed | Agent | Scope |
|------|-------|-------|
| AC3-1 | Alpha | Wire `require_access` into lesson detail; embed `access` on response |
| AC3-2 | Alpha | Dual-write free_preview ↔ policy; read prefers policy |
| AC3-3 | Charlie | 401/403/soft UI from `access` payload (no invent rules) |
| AC3-4 | Tango | Deny/time copy review |
| AC3-5 | Kilo | Free / Observer membership / Navigator / exact_plans / time window |

**Gate AC3-G:** gated lesson matrix + Observer live membership test.

---

### AC4 — Apps

| Seed | Agent | Scope |
|------|-------|-------|
| AC4-1 | Mike + Alpha | Data-bearing GET export floor; write endpoints respect capability |
| AC4-2 | Alpha | App bootstrap `access` field; policy defaults for `soon` |
| AC4-3 | Charlie | Soft banner + history visible when read_only_floor |
| AC4-4 | Kilo | Activator denied write, allowed read/export on trade-log under Navigator min_role policy |

**Gate AC4-G:** Delta evidence on trade-log floor.

---

### AC5 — Admin UI + preview-as

| Seed | Agent | Scope |
|------|-------|-------|
| AC5-1 | Charlie + Echo | `/admin/access` cockpit (policies list, course drill-down, audit tab) |
| AC5-2 | Charlie | In-place lesson access controls (dual-write free_preview) |
| AC5-3 | Mike + Charlie | Preview-as cookie; empty enrollments; write suppress |
| AC5-4 | Tango + Echo | Admin UX copy; expansion preview display (not stored) |
| AC5-5 | Kilo | Admin E2E smoke: save policy, revalidate, preview-as |

**Gate AC5-G:** Coach walkthrough optional; Delta checklist PASS.

**MVP campaign-ready** after AC5-G: lesson policies via admin + bulk API.

---

### AC6 — Catalog, SSG, SEO (Spec P1)

| Seed | Agent | Scope |
|------|-------|-------|
| AC6-1 | Charlie + Alpha | Catalog `evaluate_many`; skeleton access regions on SSG course/catalog |
| AC6-2 | Sierra + Charlie | Sitemap generator: include iff anonymous 200 |
| AC6-3 | Alpha | revalidate_for_targets maps course/catalog surfaces |
| AC6-4 | Kilo | Sitemap + hydrate no lock→open flash (e2e or documented manual) |

**Gate AC6-G.**

---

### AC7 — Campaigns + feature_gates merge (Spec P2)

| Seed | Agent | Scope |
|------|-------|-------|
| AC7-1 | Alpha | Campaign bulk publish/end; fail-closed + “no policy” API flag |
| AC7-2 | Charlie | Campaign warning UI |
| AC7-3 | Alpha + Charlie | Migrate feature_gates → surface policies dual-read then cutover |
| AC7-4 | Foxtrot | Deploy notes MiniTwo |

**Gate AC7-G.**

---

### AC8 — Program close

| Seed | Agent | Scope |
|------|-------|-------|
| AC8-1 | Lima + India | Spec as-built; Enrollment Access cross-links; decision log |
| AC8-2 | Delta | Program PASS — full matrix + no public decision route + denylist tests |

---

## 7. Dependency graph

```text
W0-G
  └─→ AC1-G ─→ AC2-G ─┬─→ AC3-G ─→ AC5-G ─→ AC6-G ─→ AC7-G ─→ AC8-G
                      └─→ AC4-G ────┘
```

AC4 may start after AC2-G in parallel with AC3.

---

## 8. Seed inventory (pasteable packets)

Located under `agents/p-access-control/seeds/`.

| Seed file | Agent | Phase |
|-----------|-------|-------|
| `AC0-0-coach-go.md` | Coach | W0 |
| `AC0-1-india-spec.md` | India | W0 |
| `AC0-2-mike-security.md` | Mike | W0 |
| `AC0-3-tango-copy.md` | Tango | W0 |
| `AC0-4-echo-ui.md` | Echo | W0 |
| `AC0-5-sierra-seo.md` | Sierra | W0 |
| `AC0-G-delta-spec-lock.md` | Delta | W0 |
| `AC1-1-india-alpha-model.md` | India·Alpha | AC1 |
| `AC1-2-alpha-schema.md` | Alpha | AC1 |
| `AC1-3-alpha-engine.md` | Alpha | AC1 |
| `AC1-4-kilo-unit-tests.md` | Kilo | AC1 |
| `AC1-G-delta.md` | Delta | AC1 |
| `AC2-1-mike-alpha-constants.md` | Mike·Alpha | AC2 |
| `AC2-2-alpha-admin-api.md` | Alpha | AC2 |
| `AC2-3-alpha-admin-decision.md` | Alpha | AC2 |
| `AC2-4-kilo-api-tests.md` | Kilo | AC2 |
| `AC2-G-delta.md` | Delta | AC2 |
| `AC3-1-alpha-lessons.md` | Alpha | AC3 |
| `AC3-2-alpha-dual-write.md` | Alpha | AC3 |
| `AC3-3-charlie-lesson-ui.md` | Charlie | AC3 |
| `AC3-4-tango-copy.md` | Tango | AC3 |
| `AC3-5-kilo-lesson-matrix.md` | Kilo | AC3 |
| `AC3-G-delta.md` | Delta | AC3 |
| `AC4-1-mike-alpha-data-floor.md` | Mike·Alpha | AC4 |
| `AC4-2-alpha-app-access.md` | Alpha | AC4 |
| `AC4-3-charlie-app-soft.md` | Charlie | AC4 |
| `AC4-4-kilo-app-floor.md` | Kilo | AC4 |
| `AC4-G-delta.md` | Delta | AC4 |
| `AC5-1-charlie-echo-cockpit.md` | Charlie·Echo | AC5 |
| `AC5-2-charlie-inplace-lesson.md` | Charlie | AC5 |
| `AC5-3-mike-charlie-preview.md` | Mike·Charlie | AC5 |
| `AC5-4-tango-echo-copy.md` | Tango·Echo | AC5 |
| `AC5-5-kilo-admin-smoke.md` | Kilo | AC5 |
| `AC5-G-delta.md` | Delta | AC5 |
| `AC6-*.md` | … | AC6 (after AC5) |
| `AC7-*.md` | … | AC7 |
| `AC8-*.md` | Lima·India·Delta | Close |

Cold-start rule: each seed lists **read first**, **files in scope**, **out of scope**, **completion checkboxes**, **feeds gate**.

---

## 9. Test matrix (Kilo owns)

| Case | Expect |
|------|--------|
| Anon gated lesson | 401 |
| Free observer gated | 403 |
| Observer membership + JWT role observer | 200 |
| selected Observer plans, exact false, Navigator plan | ALLOW |
| exact true, Observer only, Navigator | DENY |
| deny_plans + trade-log GET | 200 read; POST 403 |
| PUT hard trade-log | 422 |
| PUT surface:login | 422 |
| No public `/api/access/decision` | 404 |
| Preview-as no progress row | assert |
| Bulk selected observer-trial expands at eval | Navigator ALLOW |
| Grandfather course enrollment | ALLOW when enabled |
| deny_plans enrolled | DENY (no grandfather) |
| Sitemap hide course | not listed |
| evaluate_many 40 keys | one call path |

---

## 10. Risk register

| Risk | Mitigation |
|------|------------|
| Spec still DRAFT | W0 blocks code |
| SSG deadline pressure → full dynamic course | Spec §6.1 forbids; Delta checks skeleton |
| Bulk without expansion | Fixed by evaluate-time expand |
| Admin locks trade-log hard | 422 + constant |
| SEO 404 from hide | Sitemap 200 rule + AC6 tests |
| Scope creep to live/campaign early | Board: AC7 after AC5 |

---

## 11. Coach control points

1. **W0:** BUILD AUTHORITY or return for v0.5  
2. **After AC5-G:** ship MVP lesson+app gating to production?  
3. **After AC6-G:** SEO cutover  
4. **After AC7-G:** feature_gates deprecation  
5. **AC8:** program close  

---

## 12. Definition of done (program)

- Spec as-built updated (Lima)  
- Decision log complete  
- Delta program PASS with evidence pack  
- Admin help: how to set lesson gate + campaign bulk  
- No public decision oracle  
- Characterization suite green in CI  

---

*Juliet decomposition for review — not an execution order until Coach W0 GO.*
