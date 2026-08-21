# Project: Options Lab Heatmap Width Fit

**Board:** `agents/p-options-lab-heatmap-width-fit/`  
**Orchestrator:** Juliet  
**Authority:** Coach  

## Plans

| Program | Path |
|---------|------|
| **Active — Width Fit (plan v1.1)** | [`docs/Options-Lab-Heatmap-Width-Fit-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Options-Lab-Heatmap-Width-Fit-Full-Agent-Bench-Plan-v1.1.md) |

## Specs / Arch

| Doc | Path |
|-----|------|
| Width Fit Spec **v0.1.1 BUILD AUTHORITY** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md) · **DL-525** |
| Heatmap Templates Spec v0.2 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) |
| Advanced Fly Spec v0.2.1 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md) |
| Arch 29 | [`Architecture/29-options-lab-heatmap-templates.md`](../../Architecture/29-options-lab-heatmap-templates.md) |
| OPF Truth · DL-309 | [`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`](../../Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) |

## Mission

Ship a **pure Width Fit value mode** on the existing Advanced Fly / `sym-fly` matrix: member-weighted fit of listed long butterflies to stated criteria, with mandatory neighborhood stability, honest per-width \(n\), and observation-only language.

## Invariants (non-negotiable)

See Width Fit Spec **WF1–WF5**, parent **HM1–HM20**, Advanced Fly geometry, and OPF Truth **DL-309**. Especially:

- One fly switcher entry (`sym-fly`); Width Fit is a **Value mode**
- Dual-side always; side = view filter only
- Pure template — no per-template Massive / no package-quote
- No snap (HM8); fail-loud cells (HM7)
- Neighborhood stability in the final score (WF1)
- Footer \(n\) honest; aggregates on valid cells only (WF2)
- Member weights + documented default; no platform ranking signal (WF3)
- Observation-only vocabulary (WF5)
- Default Advanced Fly mode stays **Debit**
- Delta ternary only; no waive

## Out of scope

- Reopening Advanced Fly Wave‑1 (`p-options-lab-heatmap` AF0–AF-Z)
- Implementing leftover **AF-X** `width_eff` / `stability` as this product
- FatTail Intelligence / StudioOne persistence and calibration (**FI-040**)
- GEX · Analyzer residual · Market Bus Redis posture
- MiniTwo unless Coach asks

## Coordination

| Board | Touch |
|-------|--------|
| `p-options-lab-heatmap` | Consume as-built `sym-fly`; **do not** fire AF-X as Width Fit |
| `p-market-bus` | Same OPF-held dual-side generation |
| `p-options-pricing-foundation` | Consume only |
| `p-hig` | Kit only if needed |

## Status

**WF0-0 GO** · **DL-525**. WF1–WF5 **PASS** · **DL-526**. Spec v0.1.1 **BUILD AUTHORITY**.
