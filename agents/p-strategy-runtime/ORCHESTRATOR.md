# p-strategy-runtime — Orchestrator

**Juliet** maintains the board. **Coach** drives. Specialists execute only via seeds.

**Observed (2026-08-23, not this board’s packet):** 7 tests red in `tests/test_strategy_lab_curate.py` on house box as of 2026-08-23 (`test_curate_create_arm_tick_open`, `test_curate_envelope_blocks_second_open`, `test_curate_manage_take_profit`, `test_curate_unknown_symbol_fails_loud`, `test_curate_positions_report`, `test_deploy_reports_book_shape`, `test_curate_isolation`); observed during Wiki Agent WA-1-G; not caused by wiki program (baseline proof: `agents/p-wiki/gate-reports/WA-1-delta-gate.md` A2 addendum). **Do not fix from wiki.**

| Doc | Path |
|-----|------|
| Charter | [`CHARTER.md`](./CHARTER.md) |
| Scope | [`SCOPE.md`](./SCOPE.md) → docs Implementation Scope |
| Plan | [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) |
| Full bench plan | [`docs/Strategy-Lab-Process-Runtime-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Strategy-Lab-Process-Runtime-Full-Agent-Bench-Plan-v1.0.md) |
| Spec | [`Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md`](../../Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md) |
| Arch | [`Architecture/14-strategy-lab-execution-responsibility.md`](../../Architecture/14-strategy-lab-execution-responsibility.md) · [`Architecture/09-strategy-lab-tradier.md`](../../Architecture/09-strategy-lab-tradier.md) |

---

## External legal flags (Coach only)

| Flag | Value | Notes |
|------|-------|-------|
| **LEGAL-TRACK** | unknown | External counsel track opened? |
| **LEGAL-LIVE** | **NOGO** | Production attestation + live orders |
| **LEGAL-COPY** | **NOGO** | Production arming/ToS copy |

Update this table when Coach informs GO/NOGO. Seeds must read it.

---

## Sequencing law

> **No SR1+ implementation until SR0-G PASS.**  
> **No production live until LEGAL-LIVE = GO.**  
> **No SR10 until Coach M3 GO.**

---

## Status board

**Program status:** **SR0 OPEN** — Scope + bench plan for Coach ACK; Spec v1.1.1 product-ready  

| Phase | Intent | Status |
|-------|--------|--------|
| **SR0** | Spec reviews + Coach program GO | **NEXT** |
| **SR1** | Instance + envelope + decision_log | blocked on SR0-G |
| **SR2** | Arming + attestation | blocked on SR1-G |
| **SR3** | Deployment Pack export | blocked on SR1-G |
| **SR4** | Tradier paper + O-* | blocked on SR1-G |
| **SR5** | Broker exits matrix | blocked on SR4-G |
| **SR6** | Dry-run evaluator | blocked on SR1-G |
| **SR7** | User-local worker | blocked on SR3-G |
| **SR8** | Live path | blocked on SR5-G + LEGAL-LIVE |
| **SR9** | Practice hooks | optional after SR8 |
| **SR10** | M3 + admin | Coach M3 GO only |
| **CLOSE** | As-built + program gate | after vertical slice |

### Critical path

```text
SR0-G → SR1-G → (SR2 ‖ SR3 ‖ SR6) → SR4-G → SR5-G → [LEGAL-LIVE] → SR8-G
                 └→ SR7-G
```

---

## Gate checklist

| Gate | Agent | Status |
|------|-------|--------|
| SR0-0 Coach program GO | Coach | pending |
| SR0-1 India | India | pending |
| SR0-2 Mike | Mike | pending |
| SR0-3 Tango | Tango | pending |
| SR0-4 Hotel | Hotel | pending |
| SR0-5 Echo | Echo | pending |
| **SR0-G** | Delta | pending |
| SR1-G … SR8-G | Delta | pending |
| SR9-G / SR10-G | Delta | optional |
| **CLOSE-G** | Delta | pending |

---

## How to run a seed

1. Read charter + Scope + Spec + seed.  
2. Check LEGAL-* flags for live/attestation seeds.  
3. Declare files + changes.  
4. Execute; evidence only.  
5. Report PASS/FAIL/BLOCKED to Coach/Juliet.  
6. Delta gate at phase end — no waived gates.
