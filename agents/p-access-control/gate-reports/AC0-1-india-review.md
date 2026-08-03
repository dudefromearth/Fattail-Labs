# AC0-1 — India Spec & Architecture Review

**Project:** p-access-control  
**Agent:** India  
**Date:** 2026-08-02  
**Spec:** `Specs/FatTail-Labs-Access-Control-Spec-v0.4.md`  
**Seed:** `seeds/AC0-1-india-spec.md`

---

## Verdict: **APPROVED**

Ready for BUILD AUTHORITY with **binding implementation notes** (not Spec RETURN). AC1-1 must codify notes 1–2 as code constants reviewed by India before AC1-G.

---

## Checklist

| # | Topic | Finding |
|---|--------|---------|
| 1 | Target key grammar + type defaults | **Sound in principle.** Hierarchy is underspecified in prose (`course:…`). **Binding AC1-1:** publish exact patterns e.g. `course:{id}`, `module:{id}`, `lesson:{id}`, `resource:{id}`, `app:{slug}`, `surface:{name}`, `campaign:{slug}:{part}` and map type defaults from as-built (Enrollment Access + free_preview + feature_gates + apps.status). |
| 2 | Expand at evaluate vs write-time | **APPROVED.** Correct fix for frozen vocabulary; aligns with G11. No expanded cache column — good. |
| 3 | `plan_role_combine` OR + commercial expansion | **APPROVED.** Compatible with Identity ladder; OR is right default for campaign “any of these plans or min role.” AND via `all_plans` remains rare intent list (not expanded) — document in admin help. |
| 4 | Alumni non-commercial | **APPROVED.** Matches `ROLE_ORDER` and `courses-alumni` → alumni; expansion buckets exclude alumni. min_role path correct. |
| 5 | Data-bearing floor vs Family B | **APPROVED.** Floor is capability-level (read/export), not a bypass of identity isolation — still owner-scoped. Abuse → account suspension, not hide. Aligns Member Data Privacy / Practice Export. |
| 6 | Dual-write free_preview | **APPROVED with risk note.** Dual-read period: **policy preferred when present** must be absolute; tests must catch free_preview true / policy deny skew. Cutover of column later is fine; dual-write for P0 is correct. |
| 7 | Grandfather + deny_plans | **APPROVED.** Algorithm: blocklist clears grandfather; data floor still applies for apps. Course deny_plans → DENY without grandfather — intentional. |
| 8 | §5 algorithm integrity | **APPROVED.** No dead branch; expand in evaluate; single sign-in check. Admin bypass unless preview_as — correct. |
| 9 | §9 DDL | **APPROVED.** Self-contained; `selected_plans_json` + `exact_plans_only`; no expand cache. `version` for optimistic concurrency optional use. |
| 10 | Product boundary | **APPROVED.** No MSC; identity via existing Labs models. |

---

## Non-blocking follow-ups (AC1 / Lima)

- Codify §6.3 type defaults as a table in as-built or constants comments.  
- Cross-link Enrollment Access Spec when lesson defaults move under engine.  
- Confirm `campaign:*` fail-closed vs course type-default open does not create orphan public landers without policy (admin warning covers ops).

---

## Architecture conflicts with as-built

None blocking. Current `can_access_member_content` + free_preview become **type defaults** until policy rows exist — correct migration posture.

---

## Sign-off

**India: APPROVED** for Coach BUILD AUTHORITY on Spec v0.4.
