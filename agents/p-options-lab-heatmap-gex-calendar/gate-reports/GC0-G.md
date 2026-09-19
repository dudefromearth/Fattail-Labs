# GC0-G — Term Mass spec GO

**Delta** · 2026-09-18 · ternary **PASS** (evidence below). Reviews to GROK ADVISOR via Coach.

## Pre-flight (before forks)

| Check | Result |
|-------|--------|
| `ls Specs/ \| grep -i GEX-Calendar` | `…-v0_1.md` only (then fork added v0_1_1) |
| `ls docs/ \| grep -i Term-Mass` | `…-v1.0.md` |
| sha1 spec v0_1 | `382a74acdf88d2e4f698203af864e8421df5b0cc` **MATCH** |
| grep -c OD-GC4 / Term Mass / GC16 | 8 / 13 / 2 — none zero |

## GC0 packet

| Item | Evidence |
|------|----------|
| Spec v0_1_1 | `Specs/FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1_1.md` sha1 `37c4427c2ffc3071dc27a8592c16cf6307acd289` |
| v0_1 baseline | still on disk |
| Plan v1.1 | `docs/Options-Lab-Heatmap-Term-Mass-Full-Agent-Bench-Plan-v1.1.md` |
| India GC0-1 | `gate-reports/GC0-1-india.md` — HM21 = inspector live; N-interest on socket; Heatmap asked for one; ValueModeId quoted |
| Hotel GC0-2 | `gate-reports/GC0-2-hotel-goldens.md` — six hand goldens; **no** `gexCal.ts` |
| Seeds GC0-3…9 | `seeds/GC0-3-echo-ia.md` … `GC0-9-lima-dl.md` |
| DL-763 | `Architecture/00-decision-log.md` |
| AGENTS.md | Term Mass / GBH current-state row (JR8 a) |
| Token | `agents/go/GC0-W0.md` **STAMPED** with Coach GO verbatim + fresh sha1 |

## STOP checks

- Bus N-interest: **present** (Map + `chain_subs`). Not a STOP.  
- HM21 third thing: **no** — live inspector vs DRAFT collision; DL-763.  
- Frozen files: not edited.

**Verdict: PASS.** GC1 may fire. Flag on. No production switcher until GC4-G.
