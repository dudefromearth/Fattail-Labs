# Trader Development Phase 3 — Agent Bench Plan

**Program:** [`agents/p-trader-development/`](../agents/p-trader-development/)  
**Full plan:** [`Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](./Trader-Development-Full-Agent-Bench-Plan-v1.0.md)  
**Spec:** [`Specs/FatTail-Labs-Trader-Development-Phase-3-Deepen-Person-v1.0.md`](../Specs/FatTail-Labs-Trader-Development-Phase-3-Deepen-Person-v1.0.md)  
**Type:** Product enhancement (deepen Own)  
**Gate prefix:** `TD3-*`  
**Prerequisite:** TD1-G; TD2 chart stack for MFE

---

## Mission

Close the **person** loop: **campaign season → Retro**, **Journey process nudges**, risk framing (R/MFE), optional futures **underliers**, mobile daily habit.

**Mode:** Own depth · Match only if futures underlier needed for charts · Refuse edge AI / replay.

---

## Critical path

```text
TD3-1 India → TD3-2 Alpha retro context → TD3-3 Charlie retro/nudges
  → TD3-4 analytics/R/MFE → TD3-5 futures optional → TD3-6 PWA
  → TD3-7 copy → TD3-8 Kilo → TD3-G
```

---

## Seeds

| Seed | Agent | Work | Completion criteria |
|------|-------|------|---------------------|
| **TD3-1** | India | Season retro DTO; nudge rules; R/MFE honesty | Spec amend if needed |
| **TD3-2** | Alpha | Gather campaign/playbook stats into retro | API evidence |
| **TD3-3** | Charlie | Season retro UI path; Journey nudges | Dismissible; process tone |
| **TD3-4** | Alpha+Charlie | Tag v2 cohorts; R and/or MFE widgets | No win-rate hero; MFE caveats |
| **TD3-5** | Alpha | Massive Futures ES/NQ bars if GO | Underlier only; no FO |
| **TD3-6** | Charlie | PWA Journal + check-in + campaign badge | Mobile path |
| **TD3-7** | Tango+Hotel | Copy pass | No optimal-exit greed language |
| **TD3-8** | Kilo | Suite characterization | pytest green |
| **TD3-G** | Delta | Formation loop evidence | Season close demonstrated |

---

## Invariants

- Journey grades remain derived (DS-2); nudges don’t fake meters.  
- Toughness never membership-gated.  
- MFE on multi-leg options: structure-aware copy.  
- No futures options product.  
- No profit theater.

---

## Exit (TD3-G)

1. Campaign season can feed a retrospective.  
2. ≥2 process Journey nudges live.  
3. R and/or MFE available with honest framing (if data present).  
4. Journal/check-in usable on mobile viewport.  
