# AC0-3 — Tango Member Trust & Copy Review

**Project:** p-access-control  
**Agent:** Tango  
**Date:** 2026-08-02  
**Spec:** v0.4 §§3, 4.2.2, 7, 11  
**Seed:** `seeds/AC0-3-tango-copy.md`

---

## Verdict: **APPROVED**

Copy **templates** land in AC3-4 / AC5-4; principles in Spec are sufficient for build.

---

## Checklist

| # | Topic | Finding |
|---|--------|---------|
| 1 | Time-lock ≠ “not a member” | **APPROVED.** §11.3 is the right invariant. Time UI must use calendar language (“Opens …”, “This window closed …”), never membership shame. |
| 2 | Data-bearing soft banner | **APPROVED.** History visible + read_only_floor is respectful: member’s work is still theirs. Banner should say capability is limited for this period/tier, not “you don’t have access to your data.” |
| 3 | Grandfather default for courses | **APPROVED.** Default on protects capacity and trust when tiers change mid-path. deny_plans exception is fair when intentional blocklist. |
| 4 | deny_plans keeps read/export | **APPROVED.** Aligns data-subject rights and “capacity over dependency.” Suspension is the abuse path. |
| 5 | Deny CTA templates | **APPROVED principles.** Allowed: SSO re-link, membership page, “refresh access.” **Forbidden:** profit claims, “you’re missing out on gains,” shaming free observers. Process outcomes only if any social proof. |

---

## Required copy posture (for Charlie/Alpha defaults)

1. **signin_required** — calm invite to sign in; no “locked out of wealth.”  
2. **role/plan deny** — pathway language (what this tier includes), not deficit language.  
3. **time** — schedule only.  
4. **read_only_floor** — “You can still view and export your records; new entries are paused for this access level.”  
5. **Admin expansion helper** — commercial vs alumni (§4.3.2) prevents silent alumni exclusion surprises.

---

## Sign-off

**Tango: APPROVED** for BUILD AUTHORITY.
