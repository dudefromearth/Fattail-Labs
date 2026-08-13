# Project: Volume Profile Histogram + Market Data Dual Store

**Board:** `agents/p-volume-profile-histogram/`  
**Orchestrator:** Juliet  
**Authority:** Coach  

## Plans

| Program | Path |
|---------|------|
| **Active** | [`docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md) (**revision v1.1.1**) |

## Specs / Arch

| Doc | Path |
|-----|------|
| **VP Histogram Spec v0.4** | [`Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md`](../../Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md) |
| Superseded | v0.3 / v0.3.1, v0.2, v0.1 |

## Mission

**Big Kahuna:** collect full entitled estate (trades + quotes + 1s, all eligible symbols, full depth) on multi-mount storage; measure tick VP from trades; Strategy Lab + chart/agents consume dual SoR. **Production bins wait on §5 geometry freeze (P2-3).**

## Invariants

- VP1–VP21 (Spec v0.4)  
- Dual SoR; trades-first measurement  
- Multi-mount fail loud; telemetry not 50 GB ration  
- VIX/VIX1D quarantined  
- No MSC; TV research only  

## Out of scope

- MSC code / Redis port  
- TV microbin as default SoR  
- VIX/VIX1D via VIXY  
- ES tape without futures entitlement  

## Status

**W0 GO complete (2026-08-12)** — Spec v0.4 + Plan rev v1.1.1.  
**2026-08-13:** campaign on `/Volumes/sabrant2tb`; A/D/E-1 code landed; **bin writes** still require P2-3 + C-0.  
Gates: `gate-reports/W0-0-coach-go.md` · `W0-G.md`.
