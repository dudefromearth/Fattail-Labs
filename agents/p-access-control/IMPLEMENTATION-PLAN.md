# Implementation Plan — p-access-control

**Canonical full agent bench plan:**  
[`docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md`](../../docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md)

**Spec:** [`Specs/FatTail-Labs-Access-Control-Spec-v0.4.md`](../../Specs/FatTail-Labs-Access-Control-Spec-v0.4.md)  
**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)  
**Seeds:** [`seeds/`](./seeds/)  

**Status:** **PROGRAM PASS** 2026-08-02 (AC8). MVP shipped; residuals in AC8-program-close.

---

## Mission (one screen)

Ship one **Access Policy Engine** so admin can gate surfaces, apps, and course elements by role/plan/time for campaigns — without deploys — while:

- Expanding commercial plans **at evaluate** (not frozen at write)  
- Preserving **data-bearing read/export floor**  
- Keeping **SEO** (sitemap = anonymous 200) and **member data rights**  
- Never inventing identity from URLs; SSO / memberships remain source of truth  

---

## Spec ↔ phase map

| Spec §14 | Plan phases |
|----------|-------------|
| P0 engine + admin + dual-write + floor + audit + preview + revalidate + resource access | **AC1–AC5** (+ skeleton start) |
| P1 catalog batch + sitemap + hydrate | **AC6** |
| P2 feature_gates merge + campaigns | **AC7** |
| Docs / close | **AC8** |
| P3 templates / scheduling | **Out of program** (future charter) |

---

## Sequencing

```text
W0 reviews + Coach BUILD AUTHORITY
  → AC1 engine
  → AC2 admin API
  → AC3 lessons ‖ AC4 apps (after AC2)
  → AC5 admin UI   ← MVP ship candidate
  → AC6 catalog/SEO
  → AC7 campaigns + feature_gates
  → AC8 close
```

**Critical path:** W0 → AC1 → AC2 → AC3 → AC5  
**Parallel after AC2:** AC4  
**MVP definition:** through **AC5-G**

---

## Phases

| Phase | Deliverable | Primary agents | Gate |
|-------|-------------|----------------|------|
| W0 | Spec lock + BUILD AUTHORITY | Coach · India · Mike · Tango · Echo · Sierra · Delta | AC0-G |
| AC1 | DDL + evaluate + expand-at-eval | Alpha · India · Kilo | AC1-G |
| AC2 | Admin API + audit + revalidate | Alpha · Mike · Kilo | AC2-G |
| AC3 | Lessons dual-write + access payload | Alpha · Charlie · Tango · Kilo | AC3-G |
| AC4 | Data-bearing app floor | Mike · Alpha · Charlie · Kilo | AC4-G |
| AC5 | `/admin/access` + preview-as | Charlie · Echo · Mike · Kilo | AC5-G |
| AC6 | Catalog batch + sitemap 200 + skeleton | Charlie · Alpha · Sierra · Kilo | AC6-G |
| AC7 | Campaign bulk + gates merge | Alpha · Charlie · Foxtrot | AC7-G |
| AC8 | As-built + program PASS | Lima · India · Delta | AC8-2 |

Every seed is cold-start under `seeds/`. Full verification matrix: plan §9.

---

## Coach control points

1. **W0** — BUILD AUTHORITY or return Spec v0.5  
2. **After AC5-G** — ship MVP lesson+app gating?  
3. **After AC6-G** — SEO cutover  
4. **After AC7-G** — feature_gates deprecation  
5. **AC8** — program close  

---

## Kill list (Delta watches)

- Public decision enumeration endpoint  
- Client-trusted role/plan query params  
- Write-time frozen expanded plan lists  
- Silent coerce of illegal data-bearing modes  
- Gating `surface:login` / membership remedies  
- Full dynamic course pages for personalization (skeleton hydrate only)
