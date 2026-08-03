# AC0-4 — Echo UI / Visual System Notes

**Project:** p-access-control  
**Agent:** Echo  
**Date:** 2026-08-02  
**Spec:** v0.4 §§4.4, 6.1, 7  
**Seed:** `seeds/AC0-4-echo-ui.md`

---

## Verdict: **APPROVED** (patterns for Charlie)

No Spec RETURN. Constraints below bind AC5 / AC6 UI.

---

## 1. SSG skeleton regions

| Do | Don’t |
|----|--------|
| Neutral pulse/placeholder blocks matching layout density | Lock card in SSG HTML |
| Same shell height as eventual open content where possible | Full unlocked module list “for SEO” |
| One-way hydrate: skeleton → final | Lock → open flash (paywall flicker) |

Access-dependent regions: lesson list gates, CTA strip, “continue” row — not the course title/hero/JSON-LD public shell.

---

## 2. Hard vs soft lock cards

| Mode | Visual |
|------|--------|
| **hard** | Solid card; no teaser body leak; primary remedy CTA only |
| **soft** | Teaser + badge; media still blocked; secondary density |
| **hide** | No card — 404 page chrome only |
| **read_only_floor** | Soft **banner** above live history (not a full-page lock) |

Hard and soft share tokens; distinguish by border/emphasis + presence of teaser. Do not use red “error” chrome for expected access states.

---

## 3. Admin `/admin/access` hierarchy

1. **List** — target key, mode, enabled, label, updated  
2. **Editor** — intent fields first (min_role, selected plans, exact toggle); expansion preview as **read-only chip strip** below  
3. **Alumni callout** — non-commercial note adjacent to plan multi-select  
4. **Audit tab** — table density, filter by target  
5. **Preview-as** — sticky bar when active (distinct color token, not alarm red)

Avoid double chrome: course in-place lesson controls should reuse the same field components as cockpit editor.

---

## 4. Risks

| Risk | Mitigation |
|------|------------|
| Paywall flash | Skeleton only on SSG (§6.1) |
| Double lock UI | Single component reads `access` payload |
| Dense form fatigue | Progressive disclosure: advanced (all_plans, deny_plans, windows) collapsed |
| Expansion confusion | Live preview label: “Also admits at evaluate: …” |

---

## Sign-off

**Echo: APPROVED** patterns for Charlie implementation.
