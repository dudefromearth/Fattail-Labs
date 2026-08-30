# TM-W0 — Options Lab Time Machine

**ID:** `TM-W0`  
**Plan:** [`docs/Options-Lab-Time-Machine-Full-Agent-Bench-Plan-v1.2.md`](../../docs/Options-Lab-Time-Machine-Full-Agent-Bench-Plan-v1.2.md) **v1.2**  
**Law:** Spec **v0.7.4 BUILD AUTHORITY** `Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md` · **DL-598**  
**Board:** `agents/p-options-lab-tm/`

**Spec BUILD AUTHORITY:** granted 2026-08-27 (Coach GO). sha1 `c325711e30cf8b2791582e8b4db03a941b70960a`.  
**Plan stamp:** **W0-0 STAMP 2026-08-27.** Plan v1.2 Accept. **DL-599.**

**TMI-79** is two browser slots. HOLD-1 is **closed** — not a tick.

| Slot | Lives | Dies |
|------|-------|------|
| **Today** | Always capturing | Trading-date change only |
| **Archive** | At most one past day | Switch → discard before accept; Reset / return-to-live → drop |

Two blobs, **one** playhead. Today keeps capturing while an archive day is open. A single `heldDay: Date | null` fails W2-G.

§12 is a **record**. Basic, TPO, 1×, Spaces, Factory are **out**. First Analyzer packet is the **layout move**.

Leftover boards **PARKED:** `p-options-lab-tmi` (32 seeds) · `p-az-atm` (15 seeds; W0–W2 already ran).

---

## Stamp block

```
W0-0 STAMP
Date: 2026-08-27
Plan v1.2: Accept
Spec v0.7.4 BUILD AUTHORITY: already granted (DL-598)
W0-G: PASS (agents/p-options-lab-tm/gate-reports/W0-G.md)
W1-G: PASS (layout + §13 + live walk)
W2-G: PASS (two slots; occupancy proofs open until W5)
W3-G: PASS (Surface high-IV field open)
W4-G: PASS (today pre-selected; Reset exits)
Implementation: W5 unblocked
```
