# AC0-2 — Mike Security & Authz Review

**Project:** p-access-control  
**Agent:** Mike  
**Date:** 2026-08-02  
**Spec:** v0.4 §§3, 4.1–4.2, 8, 12  
**Seed:** `seeds/AC0-2-mike-security.md`

---

## Verdict: **APPROVED**

---

## Checklist

| # | Topic | Finding |
|---|--------|---------|
| 1 | Admin-only decision APIs; no public probe | **APPROVED.** Resource-embedded `access` only for members. Characterization: no `/api/access/decision` public. Admin GET/POST decision under administrator role. |
| 2 | Ungateable constant + CTA reachability | **APPROVED.** Code constant + 422 tests for login/signup/membership/recovery/`me`. New recovery routes must extend constant. Deny CTA host allowlist required on write (AC2). |
| 3 | Preview cookie | **APPROVED design.** Requirements for AC5-3: `ft_access_preview` **HttpOnly**, short TTL, SameSite=lax, Secure in prod; enrollments **default []**; write suppress progress/practice/trade creates; policy CRUD still allowed; real admin identity not used for member mutations while preview set. |
| 4 | Data-bearing floor vs deny_plans | **APPROVED.** Read/export floor survives deny_plans; writes denied. Illegal hard/hide → **422 only** (no silent coerce) — correct for bulk/agent safety. |
| 5 | Revalidation as non-security boundary | **APPROVED.** Cache refresh is availability/SEO, not authz. Server evaluate remains truth. |
| 6 | Open redirect / href allowlist | **APPROVED with AC2 requirement.** `mode: redirect` and deny CTAs must use host allowlist (Labs + known WP membership hosts). Fail closed on unknown hosts. |
| 7 | Expand-at-eval / bulk parity | **APPROVED.** Same write path single+bulk; expansion only in evaluate — closes bulk under-admit attack class from frozen lists. |
| 8 | Preview false grandfather | **APPROVED.** Empty enrollments closes “admin previews as free but still grandfathered via own enrollments.” |

---

## Residual (implementation, not Spec RETURN)

- Rate-limit admin decision/batch if expensive (evaluate_many on large catalogs) — ops, not architecture.  
- Audit actor_id must be real admin identity even under preview-as.  
- Soft mode must not leak media URLs in resource payloads (hard already forbids).

---

## Sign-off

**Mike: APPROVED** for BUILD AUTHORITY.
