# ORCHESTRATOR — Volume Profile Histogram Dual Store (v0.4)

**Juliet** owns this board. Specialists fire only from seeds.

**Plan:** [`docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md) **revision v1.1.1**  
**Spec:** [`Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md`](../../Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md)

## Status (2026-08-13)

| Gate | Verdict |
|------|---------|
| **W0-0 Coach GO** | **PASS** — `gate-reports/W0-0-coach-go.md` |
| **W0-1 Lima hash** | **PASS** — `gate-reports/W0-1-lima-hash.md` |
| **W0-2 India** | **PASS** — `gate-reports/W0-2-india-parents.md` |
| **W0-G** | **PASS** — `gate-reports/W0-G.md` |

**Live root:** `/Volumes/sabrant2tb/fattail-market-data` (`LABS_MARKET_DATA_MOUNTS=raw-primary:/Volumes/sabrant2tb`). Local staging kept. Pod 1 TCC from agent shell.

**Next:** keep B running · **P2-3 freeze + C-0** before any production bin write · A-G / D-G when Coach seats Delta.

## DAG

```text
W0 ✓ ──► A (code + sabrant2tb) ──┬──► B (full-estate campaign) IN FLIGHT
                                 │         // parallel with remaining P2
                                 └──► P2 (partial) ──► P2-3 FREEZE ──► C ──► D (APIs landed, honest WAITING) ──► E-1 ──► F ──► Z
                                                                            R optional
```

## Phase board

| Phase | Status | Gate |
|-------|--------|------|
| W0 Coach GO | **DONE** | W0-G **PASS** |
| A Multi-mount + catalog | **landed** — mounts env, schemas, fail-loud, catalog tables | A-G (Delta not seated this turn) |
| B RAW campaign | **IN FLIGHT** on sabrant2tb (PIDs 1883/1884/1885) | B-G |
| P2 Remaining | **partial** — P2-6 PASS; P2-3 OPEN (+9.3%); P2-7/8 OPEN | P2-G |
| **P2-3 condition freeze** | **OPEN — bin gate** | hard |
| C BIN tool | blocked on P2-3 | C-G |
| D APIs | **read-only APIs landed** (WAITING / no pull) | D-G |
| E Chart honesty | **E-1 landed** (interim OHLC labeled; no POC chrome) | E-G residual overlay |
| F Daily ops | pending | F-G |
| R TV research | deferred | Coach DL |
| Z Close | pending | Z-G |

## Evidence

`docs/evidence/volume-profile/`
