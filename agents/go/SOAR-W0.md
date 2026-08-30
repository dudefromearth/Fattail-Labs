# SOAR-W0 — StudioOne Archive Read API

**ID:** `SOAR-W0`  
**Plan:** [`docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v2.1.md`](../../docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v2.1.md) **v2.1**  
**Law:** Spec **v0.8** + [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8-Amendment-A1.md`](../../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8-Amendment-A1.md)  
**Board:** `agents/p-studioone-archive-read/`

**Status:** **W0-0 stamped 2026-08-27**. **W0-BA GO 2026-08-27.**  
**W0-BA** is BUILD AUTHORITY. Packets: plan v2.0 (W1–W8 seeds) as amended by **v2.1**. Stamp target is **v2.1**.

---

## Required ticks

| # | Question | Juliet rec | Coach |
|---|---------|------------|-------|
| **A1** | Amendment A1 | **Accept** (strike local-date proof; add `AMBIGUOUS INSTANT` + DST cascade) | **Accept** |
| **spec-C** | §4.2/4.3 expiration required vs §2 | **Implement §2**; leftover → Lima W8 | **Accept** — optional assertion, not a required selector |
| **§9b** | Name-sort vs `t`-order | **`t`-order** on store `chain/<SYM>/` (88/127 wrap) | **Accept** — order by reconstructed `t` always. No name-sorted ladder ships |
| **env-A** | Envelope timestamp | **`captured_at` present**; prefer it | **Accept** — prefer `captured_at` over `as_of` |
| **dst-A** | DST two-in-window | **A1-2** cascade | **Accept** — nearest `captured_at` else `as_of` (5 min reject) → neighbour-monotonic → in-window mtime → `AMBIGUOUS INSTANT` |
| **§9.1** | Retention | Keep; revisit 100 GB | **Accept** — keep everything, revisit at 100 GB, log it |
| **§9.2** | `marks/` | Unserved | **Accept** — leave unserved |
| **§9.3** | TAP RESTART | Keep both; flag day | **Accept** — keep both indices, flag the day |
| **§9.4** | Symbols | Honest per symbol-date | **Accept** — honest per symbol-date, grey what has no folder |

`dst-A` is **A1-2**. A1 is law beside v0.8. **No reissue.**

---

## Stamp block

```
W0-0 STAMP
Date: 2026-08-27
A1 + spec-C + §9b + env-A + dst-A + §9.1–4: all Accept
W0-BA: GO 2026-08-27
Plan stamped: v2.1
Law: SO-AR v0.8 + Amendment A1
W5: not without Coach word
W5-G: AT-SOAR-45 cadence evidence, not process liveness
```
