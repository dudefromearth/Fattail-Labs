# AC0-0 — Coach GO framing

**Project:** p-access-control  
**Agent:** Coach  
**Date:** 2026-08-02  
**Seed:** `seeds/AC0-0-coach-go.md`

---

## Verdict

| Question | Answer |
|----------|--------|
| **Proceed with W0 reviews?** | **YES** |
| Product overrides | None. Spec §16 defaults stand: `/admin/access` yes; catalog locked card yes for courses; free preview requires sign-in yes; data_bearing as **code constant** P0 (not DB column). Grandfather default **true** for course family. DATA_BEARING_APPS = trade-log, journal, playbook (+ any Family B member-authored apps already in Application Framework). |
| First production ship target | **After AC5-G (MVP)** — lesson + app gating via admin API/UI. AC6 SEO/sitemap may follow in same release train if cheap; not a ship blocker for MVP. |

## Intent confirmed

1. Admin gating for pages, apps, course elements without deploys.  
2. Access **consumes** identity/membership (SSO, `provider_plan_map`, live memberships) — never invents from URLs.  
3. Expand commercial plans at **evaluate**; alumni non-commercial.  
4. Data-bearing floor + ungateable remedies + no public decision oracle.

## Unblocks

AC0-1 … AC0-5 parallel specialist reviews → AC0-G → BUILD AUTHORITY → AC1+.

## Out of scope this ack

Code, migrations, UI.
