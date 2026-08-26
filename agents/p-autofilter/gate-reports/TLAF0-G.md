# TLAF0-G — Delta

**Program:** Trade Log Autofilter only  
**Plan:** `docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1_0.md`  
**Spec:** `Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1.md` — still **DRAFT** (Coach has not stamped GO SPEC)  
**Date:** 2026-08-25  
**Verdict:** **PASS**

TLAF0 is reviews + inventory. No product code. No Trade Log cut. No nav removal.

---

## Evidence

### Four reviews in-tree

| Seed | File |
|------|------|
| TLAF0-1-india | `agents/p-autofilter/reviews/TLAF0-1-india.md` |
| TLAF0-2-echo-tango | `agents/p-autofilter/reviews/TLAF0-2-echo-tango.md` |
| TLAF0-3-hotel | `agents/p-autofilter/reviews/TLAF0-3-hotel.md` |
| TLAF0-4-kilo | `agents/p-autofilter/reviews/TLAF0-4-kilo.md` |

### O1 quoted (India + Kilo)

**Practice nav date/campaign chrome is shared.** It is not Trade Log–only.

- Host: `PracticeSuiteChrome` always mounts `PracticeContextBar` (`PracticeSuiteChrome.tsx:90–93`).
- Controls: `data-testid="practice-granularity"` (date pills) and `data-testid="practice-campaign-select"` in the same group (`PracticeContextBar.tsx:119–170`).
- Consumers include **Journal**, **Reports**, **Retro**, **Playbook**, Campaign, Symbols, and Trade Log (page list in TLAF0-1 and TLAF0-4).

**Omit-on-Trade-Log seam only.** Do not delete chrome from Journal / Reports / Retro / Playbook. Coach stamps O1 / L14; this gate does **not** invent that stamp.

### Zero `web/` product diff **from this packet**

This packet added only:

```
agents/p-autofilter/reviews/TLAF0-1-india.md
agents/p-autofilter/reviews/TLAF0-2-echo-tango.md
agents/p-autofilter/reviews/TLAF0-3-hotel.md
agents/p-autofilter/reviews/TLAF0-4-kilo.md
agents/p-autofilter/gate-reports/TLAF0-G.md
```

No `web/` path in the TLAF0 seat. Workspace may hold **unrelated** dirty `web/` from other programs; that is not this packet and was not edited here.

---

## Not this gate

- GO SPEC · O1–O4 stamps · GO TLAF1  
- TLAF1+ seeds  
- Extract / Trade Log cut / nav removal  
- Answers invented for O1–O4

---

## Stop

**TLAF0-G PASS.** Bench stops. Coach stamps GO SPEC / O1–O4 / GO TLAF1. **Do not fire TLAF1 from chat.**
