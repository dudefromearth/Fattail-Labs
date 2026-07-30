# Implementation Plan — p-journal-session-v05

**Canonical long form (for Coach review):**  
[`docs/Journal-Session-v0.5-Implementation-Plan.md`](../../docs/Journal-Session-v0.5-Implementation-Plan.md)

**Spec:** [`Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md`](../../Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md)  
**(includes Tag Manager compliance §5)**  

**Prerequisite:** Tag Manager v0.3 as-built (DL-159 · **COMPLETE**).

---

## Sequencing

```
Tag Manager COMPLETE ──► J0 GO ──► J1 ──► J2 ──► J7 ──► J8
                           │         ├── J4 TagPicker
                           │         ├── J6 media
                           │         └── J9 portability
                           └── J2 ──► J3 prompt · J5 interview
```

---

## Phases (summary)

| Phase | Deliverable | Primary |
|-------|-------------|---------|
| **J0** | Spec GO + §17 locks | Coach · India · bench |
| **J1** | Composer-first surface + schema | Charlie · Echo · Alpha |
| **J2** | Agent + guardrails + tag labels as context | Alpha · Mike · Hotel |
| **J3** | Admin prompt versions | Alpha · Charlie |
| **J4** | System TagPicker only | Charlie · Alpha |
| **J5** | Interview on request → bar | Charlie · Echo |
| **J6** | Private media paste | Mike · Charlie |
| **J7** | Retro **action** (not a tag) | Alpha · Charlie · Tango |
| **J8** | Scope-true closure | Alpha · India |
| **J9** | Portability + program close | Alpha · Delta · Lima |

**Critical path:** J0 → J1 → J2 → J8  

Full seeds, verification, keep/kill, risks: see docs plan.
