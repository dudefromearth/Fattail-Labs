# LG3-G — Delta

**Project:** p-links-growth
**Agent:** Delta
**Phase:** LG3-G
**Date:** 2026-10-10
**Law:** `Specs/Links-Growth-Acquisition-Spec-v0_1.md` §8 (D17), ruled by `Specs/Links-Growth-Acquisition-Spec-v0_2.md` §2 (Q10: manual reporting only, no partner portal)
**Depends:** LG2-G PASS, LG3-1 (Charlie)

---

## Verdict: **PASS**

Closes 4b's build (code). Does not clear PM-L5 — no partner may be paid or comp'd for real until legal input is obtained, regardless of this gate.

---

## Evidence

**Type check.** `cd web && npx tsc --noEmit -p .` — zero errors referencing `PartnersPanel`, `partners/page.tsx`, or `admin/page.tsx`. (Pre-existing, unrelated errors in `limQuadrant.test.ts`/`saChartStyle.test.ts` present before this packet — same baseline noted in DL-824.)

**Live functional check** (StudioTwo dev stack, `:3000` + `:4000`, auto-reloaded on the backend file changes):

```text
curl -s -X POST http://127.0.0.1:4000/api/admin/partners \
  -H "Origin: http://localhost:3000" -d '{"name":"ZZ Live Check Partner", ...}'
→ 200, partner id 31, status "pending", identity_id null

curl -s -X PATCH http://127.0.0.1:4000/api/admin/partners/31 -d '{"status":"approved"}'
→ 200, identity_id 16079, approved_at set, approved_by "0"

curl -s http://127.0.0.1:3000/admin/partners  → 200
curl -s http://127.0.0.1:3000/admin           → 200 (new "Partners" card present)
```

Probe row and provisioned identity cleaned up after the check.

| Completion criterion (seed LG3-1) | Evidence |
|---|---|
| Panel renders against the real LG2 API | Live curl sequence above — create → list → approve round-trip, not just a type-check |
| Admin hub card present and links correctly | `web/app/admin/page.tsx` — new card inserted after Affiliates, `/admin` returns 200 with it present |
| HIG via existing tokens only | `PartnersPanel.tsx` reuses `Button`, `SegmentedControl`, and `tokens.css` variables exclusively — same primitives as `AffiliatesPanel.tsx`, no new ones introduced |
| No partner-facing surface (Q10) | Only `web/app/admin/partners/page.tsx` exists; no route outside `/admin/*` |

---

## Residual

4b's code is complete (LG2 + LG3). **Deploy pending** (production `web` rebuild — Next.js runs built output only in production, per the standing "no dev server in staging/production" invariant). PM-L5 remains the standing go-live precondition, independent of deploy status.
