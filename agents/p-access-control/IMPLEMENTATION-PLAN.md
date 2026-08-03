# Implementation Plan — p-access-control

**Canonical full agent bench plan:**  
[`docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md`](../../docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md)

**Spec:** [`Specs/FatTail-Labs-Access-Control-Spec-v0.4.md`](../../Specs/FatTail-Labs-Access-Control-Spec-v0.4.md)

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

---

## Phases

| Phase | Deliverable | Primary agents |
|-------|-------------|----------------|
| W0 | Spec lock | Coach · India · Mike · Tango · Echo · Sierra · Delta |
| AC1 | DDL + evaluate + expand-at-eval | Alpha · India · Kilo |
| AC2 | Admin API + audit + revalidate | Alpha · Mike · Kilo |
| AC3 | Lessons dual-write + access payload | Alpha · Charlie · Tango · Kilo |
| AC4 | Data-bearing app floor | Mike · Alpha · Charlie · Kilo |
| AC5 | `/admin/access` + preview-as | Charlie · Echo · Mike · Kilo |
| AC6 | Catalog batch + sitemap 200 + skeleton | Charlie · Alpha · Sierra · Kilo |
| AC7 | Campaign bulk + gates merge | Alpha · Charlie · Foxtrot |
| AC8 | As-built + program PASS | Lima · India · Delta |

Every seed, gate, verification: **canonical plan**.
