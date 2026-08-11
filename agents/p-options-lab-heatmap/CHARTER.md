# Project: Options Lab Heatmap Templates

**Board:** `agents/p-options-lab-heatmap/`  
**Orchestrator:** Juliet  
**Authority:** Coach  
**Plan:** [`docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md)  
**Spec:** [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md)  
**Architecture:** [`Architecture/29-options-lab-heatmap-templates.md`](../../Architecture/29-options-lab-heatmap-templates.md)

## Mission

Ship **switchable Heatmap templates** over a **single dual-side live options chain model** (calls + puts), updated by **server push / diff**, with pure client compute for:

- Symmetric fly debit matrix (`sym-fly`)
- Value modes (debit, pct_change, optional R2R)
- Chain GEX estimate (`gex_v1`)
- Vertical + broken-wing (phased)

## Invariants (non-negotiable)

See Spec **HM1–HM20** and bench plan §5. Especially:

- Dual-side always; side = view filter only  
- No `next_url` partial models  
- Standard contracts only; modal step; no snap  
- Push steady state; hydrate-if-empty special  
- No MSC code; no steady UI poll  
- Delta ternary gates only; no waive  

## Out of scope

- Market Bus Redis posture re-litigation  
- Volume Profile trade backfill  
- Analyzer full risk-graph product  
- OD-nav catalog campaign (unless Coach opens OD6)

## Coordination

| Board | Touch |
|-------|--------|
| `p-market-bus` | Stream / generation dual-side |
| `p-options-chain-picker` | OC6a · ladder fields |
| `p-hig` | Kit only if needed |

## Status

**OPEN** — awaiting W0 Coach GO after specialist seeds.
