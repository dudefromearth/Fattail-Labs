# Project: Options Lab Heatmap Templates

**Board:** `agents/p-options-lab-heatmap/`  
**Orchestrator:** Juliet  
**Authority:** Coach  

## Plans

| Program | Path |
|---------|------|
| **Active — Advanced Fly (plan v1.1.1)** | [`docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md) |
| Parent (dual-side · framework · first matrices) | [`docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md) |

## Specs / Arch

| Doc | Path |
|-----|------|
| Advanced Fly Spec **v0.2.1 DRAFT** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md) |
| Heatmap Templates Spec v0.2 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) |
| Arch 29 | [`Architecture/29-options-lab-heatmap-templates.md`](../../Architecture/29-options-lab-heatmap-templates.md) |
| OPF Truth · DL-309 | [`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.0.md`](../../Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.0.md) |

## Mission

Ship **switchable Heatmap templates** over a **single dual-side live options chain model** (generation plane OPF holds), with pure client compute for:

- **Advanced Fly** (replaces Symmetric Fly): same \(K×w\) geometry + Debit/Credit/%/R:R **plus** Wave‑1 surface-derivative Value modes, client generation history, AF10/AF17 time honesty  
- Chain GEX estimate (`gex_v1`)  
- Ladder · vertical · broken-wing (phased / optional)

## Invariants (non-negotiable)

See Advanced Fly Spec **AF1–AF17**, parent **HM1–HM20**, and OPF Truth **DL-309**. Especially:

- Dual-side always; side = view filter only  
- One chain plane for all templates  
- Pure templates — no per-template Massive / no package-quote in heatmap  
- Advanced Fly = expand/replace fly surface — not a second data path  
- History honesty (seam · non-monotonic · max-gap · single clock basis)  
- Credit magnitude+chip; curvature uniform triple; edge slope never zero  
- Structural math lawful; **no profit claims**  
- Delta ternary only; no waive  

## Out of scope

- Market Bus Redis posture re-litigation  
- Volume Profile trade backfill  
- Analyzer package-quote residual  
- SRS as member trading “signal” (Coach-gated research only)  

## Coordination

| Board | Touch |
|-------|--------|
| `p-market-bus` | Stream / dual-side generation · session posture |
| `p-options-chain-picker` | OC6a · ladder fields |
| `p-options-pricing-foundation` | OPF-held chain truth (consume only) |
| `p-options-lab-analyzer` | ToS handoff · session SoR alignment for AF10 |
| `p-hig` | Kit only if needed |

## Status

**Wave‑1 COMPLETE** (2026-08-12) — AF0→AF-Z under **DL-311**.  
Spec v0.2.1 · Plan v1.1.1 · Advanced flies (id `sym-fly`) shipped.  
Optional residual: AF-X Wave‑2 / AF-X2 SRS (descoped).
