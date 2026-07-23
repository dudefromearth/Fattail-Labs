# FatTail Labs — P1 Foundations Review

**Date:** 2026-07-22  
**Scope:** Original P1 foundation (`agents/p1-foundation`) **and** the system as it
stands on `main` (`22453cf`)  
**Evidence:** Gate 1 report, parent §14, live probes, `pytest` 47/47 green  
**Charter (retroactive):** [`agents/p1-foundation/CHARTER.md`](../agents/p1-foundation/CHARTER.md)  

---

## Executive verdict

| Layer | Verdict |
|--------|---------|
| **P1 Foundation as defined in Gate 1** (spine, public catalog, SSG, seed, no MSC) | **PASS — solid and complete** |
| **Parent P1 “Core spine”** (auth + enroll + progress + player + sellable) | **PASS — exceeded** |
| **Product readiness vs firstmovers-class platform** | **Strong mid-build** — far past foundation; not “done” |
| **Process hygiene (orchestrator / CLAUDE vs code)** | **Needs cleanup** — docs lag the product |

**Bottom line:** The foundation is real and load-bearing. The repo has already run many
post-foundation phases on top of it successfully. The main risks are **process drift**
(stale orchestrator, CLAUDE commerce claim), **external dependencies** (WP SSO still
pluggable/optional), and **ops durability** (dev Next process lifecycle), not a broken
spine.

---

## 1. What “P1 Foundation” actually was

From `agents/p1-foundation/ORCHESTRATOR.md` and Gate 1:

| Step | Intent | Status |
|------|--------|--------|
| F0 | Repo scaffold | Done |
| F1 | Dev DB + migrate spine | PASS |
| F2 | Next.js scaffold | PASS |
| F3 | Public read API + seed | PASS |
| F4 | Catalog + course SSG + JSON-LD | PASS |
| **Gate 1** | Foundation verification | **PASS** (2026-07-21) |

**Explicitly out of original P1 foundation:** full SSO path, member enroll/progress, rich
admin, deploy, real player (stub only).

Gate 1 caveat is honest: same session that built F1–F4 also ran Delta (procedural
independence only). That is acceptable for a young repo; do not treat Gate 1 as an
external audit.

Gate report: `agents/p1-foundation/gate-reports/gate-1.md`.

---

## 2. Foundation quality (still holds)

### Strengths

1. **Locked architecture is respected**  
   Standalone FastAPI + MySQL migrations + Next built output; MSC boundary observed;
   fail-loud config culture.

2. **Public surface is product-grade**  
   Catalog, course detail, free-lesson landings, category hubs, SEO layers
   (sitemap/robots/JSON-LD/AEO), course hub at `/` with CMS FAQ.

3. **Domain model grew cleanly**  
   15 ordered migrations; identity moved from WP-first to Labs-native with providers;
   roles cumulative including alumni.

4. **Verification culture is real**  
   Characterization suite **47 passed** (this review). Live:

   - `GET /api/health` → ok  
   - `GET /api/courses` → 10 courses  
   - `GET /api/hub` → titled hub + 4 FAQs  
   - `GET /` → 200  

5. **Spec density is exceptional**  
   ~38 specs under `Specs/` — unusual and good for long-term coherence.

### Gate 1 lessons still relevant

- **Restart proof:** kill-by-PID / `lsof` (stale Next process was a real failure mode
  then and again in agent sessions).
- **Mobile overflow:** still a standing Echo check for any new grids.

---

## 3. Parent P1 “Core spine” vs shipped reality

Parent Course-Hosting spec §14 P1: *auth, WC entitlements, course model, public
catalog/detail, player, progress, enroll → sellable product.*

| Capability | Foundation era | Now on `main` |
|------------|----------------|---------------|
| Course/module/lesson model | Yes | Yes (+ quizzes, trailers, cards) |
| Public catalog + detail | Yes | Yes + hub, SEO, category hubs |
| Auth | WP-first intent → evolved | Labs-native + WP providers + Stripe |
| Enroll / progress / player | Out of foundation | **Shipped** (player, progress, lesson nav rail) |
| Admin authoring | Stub | **In-place admin v1.0–1.5** (substantial) |
| Commerce | Woo webhooks | **Woo *and* native Stripe** (CLAUDE still says Woo-only — **doc bug**) |
| Live / pathway / community / resources | Later phases | **Shipped** in various depths |
| Deploy MiniTwo | Playbook only | Playbook exists; production go-live not validated here |

**Assessment:** You are well past “foundation.” The P1 foundation *project folder* is
historical; the *product* is a broad v1 platform.

---

## 4. Architecture review (current system)

### What works well

- **Public vs member split:** SSG for acquisition pages; dynamic lesson pages with
  cookie-forwarded access.
- **Progress model:** server-side completion + client rail updates (`labs:progress`)
  match the Progress + Lesson Course Nav specs.
- **In-place admin:** production page as editor reduces dual UIs (cost: complex client
  state on course pages).
- **Hub CMS (migration 015):** right pattern for marketing/FAQ copy without redeploy.
- **Tests:** characterization suite is the right kind of safety net for a moving product.

### Gaps / risks (ordered)

| Severity | Issue | Notes |
|----------|--------|------|
| **High (process)** | `ORCHESTRATOR.md` still says “NEXT = approve P1c” and “player is stub” | Misleads any new agent session. Archive or rewrite to “P1 foundation complete; product is multi-phase.” |
| **High (docs)** | `CLAUDE.md` still: *WooCommerce is the ONLY entry point for selling* | Contradicts Stripe billing. Fix immediately for agents. |
| **Medium (product)** | Category taxonomy still seed/SQL-only | Hub depends on category copy; no admin CRUD yet (discussed, not built). |
| **Medium (product)** | WP SSO live path still external | Native login works; dual-issuer production depends on WP endpoints. |
| **Medium (ops)** | Dev Next often run under agent tasks that get killed | Use durable local process / launchd for validation. |
| **Medium (quality)** | Gate independence for later mega-phases unclear | Many features landed after Gate 1 without a single “Gate 2” board in-repo. |
| **Low** | `/admin` page is still a stub | Real admin is in-place on surfaces; stub is fine if intentional. |
| **Low** | Test suite warnings (Starlette cookies deprecation) | Noise today; schedule cleanup. |
| **Low** | Suite size vs feature surface | 47 tests is good but won’t cover all ~38 specs exhaustively. |

### Security posture (foundation-relevant)

- Role checks server-side; video URLs via server embed builder.
- Admin gated; media upload type/size limited.
- Bootstrap admins via migration 014 — good for ops; ensure production passwords/SSO
  links are intentional.
- No secrets in git (`.env*` ignored).

No foundation-breaking security smell from this review; full pen-test of webhooks/SSO is
separate work.

---

## 5. Live snapshot (this review)

```
API  :4000  health ok, 10 courses, hub OK
Web  :3000  / → 200
pytest      47 passed
main        22453cf (clean working tree at review time)
```

---

## 6. Recommendations

### Do soon (hygiene)

1. **Rewrite or archive** `agents/p1-foundation/ORCHESTRATOR.md` — mark foundation
   **closed**; point to current product phases.
2. **Fix `CLAUDE.md` commerce** to match Identity + Native Billing (Stripe + Woo as
   providers).
3. **Cut a parent Course-Hosting v1.1** (or a short “platform status” ADR) so §4.1 entry
   point (`/` hub) and commerce model match reality.

### Do next (product)

4. **Category admin** — hub and SEO depend on taxonomy quality.
5. **Production path check:** MiniTwo + launchd + canonical-host 301 per
   `infra/deploy.md` (if not already proven end-to-end).
6. **WP SSO integration test** on staging once endpoints exist.
7. **Expand tests** around hub CMS, lesson rail, and billing webhooks (highest
   regression cost).

### Keep doing

8. Spec-with-ship (Lesson Course Nav is a good example).
9. Characterization tests before large refactors.
10. Evidence-based gates for any “go-live” milestone.

---

## 7. Scorecard

| Dimension | Score (1–5) | Comment |
|-----------|-------------|---------|
| Spine reliability | **5** | Migrate, health, public API, SSG solid |
| Spec discipline | **5** | Dense, versioned, decision-logged |
| Feature completeness vs P1 parent | **5** | Beyond original P1 |
| Process/docs freshness | **2** | Orchestrator + CLAUDE lag |
| Test coverage vs surface | **3** | Good core; not full matrix |
| Production readiness | **3** | Code mature; ops/SSO/launch still the unknown |

**Overall foundation: strong.**  
**Overall product: advanced mid-cycle, not foundation-limited.**

---

## Related artifacts

| Artifact | Path |
|----------|------|
| Gate 1 report | `agents/p1-foundation/gate-reports/gate-1.md` |
| P1 orchestrator (stale as of this review) | `agents/p1-foundation/ORCHESTRATOR.md` |
| Parent product spec | `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md` |
| Decision log | `Architecture/00-decision-log.md` |
| Deploy playbook | `infra/deploy.md` |
| Operator guide | `docs/ADMIN-GUIDE.md` |
