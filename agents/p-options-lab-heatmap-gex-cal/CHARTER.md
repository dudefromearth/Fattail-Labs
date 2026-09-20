# Project: Options Lab Heatmap Term Mass (duplicate folder)

**Canonical board:** [`agents/p-options-lab-heatmap-gex-calendar/`](../p-options-lab-heatmap-gex-calendar/) · **DL-747**. Do not grow this folder.

# Project: Options Lab Heatmap GEX Calendar

**Board:** `agents/p-options-lab-heatmap-gex-cal/`  
**Instance:** **GROK BUILD — HEATMAP** (**GBH**) — third build instance  
**Not this instance:** `VPS*` / `VPSB*` (INFRA) · `SADEV*` (APPS) · spec/gate reviews (ADVISOR, via Coach)  
**Orchestrator:** Juliet (after BUILD AUTHORITY only)  
**Authority:** Coach  
**Token:** [`agents/go/GBH-W0.md`](../go/GBH-W0.md) **HOLD** — not GO

## Plans / specs

| Doc | Path |
|-----|------|
| **Spec v0.1 DRAFT** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1.md) · sha1 `36a347185aaece5c4b900bf22e9683ad4ffbaf6f` |
| Parent Heatmap Templates v0.2.4 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) · HM1–HM21 |
| Frozen `gex` law | Parent §5.5 `gex_v1` · `web/lib/options-lab/templates/gex.ts` / `pricing.ts` — **read, do not restyle** |
| LIM (sibling, never fused) | LIM Spec v0.4.7 · board `p-options-lab-heatmap-lim/` |
| ME `calendar` (not this) | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Multi-Expiry-Templates-Spec-v0_1.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Multi-Expiry-Templates-Spec-v0_1.md) |

## Mission

Own the **gex-cal** Heatmap template: spec line, `HM*` / `OD-GC*` tokens, and the `/app/options-lab/heatmap` route tree — strike × listed-expiration matrix of frozen `gex_v1` net GEX, companion profile, NET footer.

**Standing posture:** DRAFT is not build authority. Hold at **flag / fixtures** until Coach stamps **OD-GC1…GC4** on `GBH-W0`. On stamp: India → Echo+Tango → Hotel → Lima DL, then seeds. Reviews and gates route to **GROK ADVISOR via Coach**.

## Owns

| Piece | Notes |
|-------|-------|
| Spec `…-GEX-Calendar-Spec-v0_1.md` | Product law for this template |
| Tokens `GBH-*` / `OD-GC*` / `AT-GC*` / `GC*` | This instance |
| Template compute (when GO) | `web/lib/options-lab/templates/gexCal.ts` (**new**) |
| Route `/app/options-lab/heatmap` | gex-cal track only; do not restyle other templates |
| Frozen `gex_v1` **generations** | Data domain: read dual-side chain books. Formula stays in `pricing.ts` |

## Does not own (never edit)

- `VPS*` / `VPSB*` / `SADEV*` namespaces  
- VP stores, VP surfaces, `/app/options-lab/volume-profile`  
- LIM / Width Fit / Advanced Fly / frozen `gex` chrome  
- Shared Labs components except through Coach (`HeatmapChainPanel`, `OptionsLabChrome`, suite layout)  
- Time Machine scrubber  
- MiniTwo  

## Invariants

- StudioTwo only unless Coach names another  
- Never `git add -A`. Do not stop `:3000` / `:4000`  
- GC13 isolation · GC14 flag until ODs · GC11 no vendor string · GC3 fail loud, never fake columns  
- Cross-instance conflict or missing dependency: **STOP and report to Coach** — do not negotiate instance-to-instance (**DL-720** posture)

## Out of scope until OD stamp

Seeds, production switcher, help file, Arch 29 land, AGENTS.md current-state row, decision-log entry.
