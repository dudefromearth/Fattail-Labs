# Project: Practice Position Lifecycle (B0)

**Board:** `agents/p-practice-position-lifecycle/`  
**Orchestrator:** Juliet  
**Authority:** Coach  

## Plans

| Program | Path |
|---------|------|
| **Candidate — Practice Position Lifecycle (plan v1.1)** | [`docs/Practice-Position-Lifecycle-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Practice-Position-Lifecycle-Full-Agent-Bench-Plan-v1.1.md) |

## Specs / Arch

| Doc | Path |
|-----|------|
| Practice Position Lifecycle Spec **v0.1 DRAFT** | [`Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md`](../../Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md) |
| B0 focused audit v1.1 | [`docs/Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md`](../../docs/Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md) |
| Source audit | [`docs/Practice-Position-Lifecycle-Source-Audit-2026-09-13.md`](../../docs/Practice-Position-Lifecycle-Source-Audit-2026-09-13.md) |
| Trade Log Spec v1.1 | [`Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`](../../Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md) · §16 |
| Arch 15 | [`Architecture/15-trade-log-manual-management.md`](../../Architecture/15-trade-log-manual-management.md) |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) · §6.3 |

## Mission

Make Practice close / delete / import end-state **honest**. Matcher frozen. Read models consume the match slot. Integrity gates move to the API. Isolation from LIM / QFRIC / XS / AnalyzerPositionsList.

## Invariants (non-negotiable)

- **PPL-1:** matcher FIFO frozen; named test stays green
- **PPL-2:** qty/pairing/delete-guard SoR is the slot
- **PPL-11:** no LIM, QFRIC, XS, `AnalyzerPositionsList.tsx`, OPF, Market Bus, IKI
- Family B. No stored position/status
- Delta ternary only; no waive
- Packets that depend on an OPEN OD cannot start
- StudioTwo only. Do not stop `:3000` / `:4000`. No MiniTwo

## Out of scope

- Matcher rewrite
- IB adapter, Stamp S-3
- Import Manager restyle
- Soft-trash blotter rows unless OD-19 Override
- Show Doctrine / 0DTE Live campaign naming
