# ORCHESTRATOR — Volume Profile Histogram Dual Store (v0.4)

**Juliet** owns this board. Specialists fire only from seeds.

**Plan:** [`docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md) **revision v1.1.1**  
**Spec:** [`Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md`](../../Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md)

## Status (2026-08-12)

| Gate | Verdict |
|------|---------|
| **W0-0 Coach GO** | **PASS** — `gate-reports/W0-0-coach-go.md` |
| **W0-1 Lima hash** | **PASS** — `gate-reports/W0-1-lima-hash.md` |
| **W0-2 India** | **PASS** — `gate-reports/W0-2-india-parents.md` |
| **W0-G** | **PASS** — `gate-reports/W0-G.md` |

**Next:** A (multi-mount + schemas) · B // remaining P2 · **C blocked on P2-3**

## DAG

```text
W0 ✓ ──► A ──┬──► B (full-estate campaign)
             │         // parallel with remaining P2
             └──► P2 (remaining) ──► P2-3 FREEZE ──► C ──► D ──► E ──► F ──► Z
                                                        R optional
```

In-flight RAW under Spec §16 is not stopped for W0 paperwork alone.

## Phase board

| Phase | Status | Gate |
|-------|--------|------|
| W0 Coach GO | **DONE** | W0-G **PASS** |
| A Multi-mount + catalog | **next** | A-G |
| B RAW campaign | ready (SPY trades as-built) | B-G |
| P2 Remaining | ready | P2-G |
| **P2-3 condition freeze** | **OPEN — bin gate** | hard |
| C BIN tool | blocked on P2-3 | C-G |
| D APIs | pending | D-G |
| E Chart honesty | pending | E-G |
| F Daily ops | pending | F-G |
| R TV research | deferred | Coach DL |
| Z Close | pending | Z-G |

## Evidence

`docs/evidence/volume-profile/` — as-built SPY trades template open (`p2-asbuilt-spy-trades.md`).
