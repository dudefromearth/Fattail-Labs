# LIM7-G — surface fit and legibility

**Gate:** LIM7-G  
**Date:** 2026-09-02  
**Spec:** v0.4.4 BUILD AUTHORITY sha1 `b061e7d7de55b546749467f8efd9ffba263de0d4`  
**Commit:** `0c389e4`  
**Delta · Echo · Tango**

## Verdict: **PASS**

Coach direction from the live surface, nine items, spec first then build.

## Spec

v0.4.4 lands **with** this packet. v0.4.3 SUPERSEDED. Compute geometry unchanged. Law that changed: LIM24, LIM27, LIM31, LIM36, §7.6. E18–E24. **OD-LIM7 CLOSED** on `OLLIM-W0.md` — book-terms, not MSC outcome names.

## Evidence

| Check | Result |
|-------|--------|
| LIM pack (`lim`, `limQuadrant`, `lim.vocab`, `lim.c2`, `lim.zeroFetch`, `limTrail`, `gex.limLink`) | green |
| Frozen GEX vs e1c1ef1 | empty (`panelBlock 8476169f…` unchanged) |
| Advanced Fly structure | ok |
| Playwright `e2e/lim7-surface.spec.ts` | 1 passed |
| Screenshots | `agents/p-options-lab-heatmap-lim/evidence/lim7/lim7-{1280,1440,1920}.png` |

### AT rewrites (Kilo)

| AT | Change |
|----|--------|
| **AT-LIM21** | Opacity 1; ring gone; proximity does not move the dot |
| **AT-LIM22** | Line 3 visible without interaction; 1/2/4 reachable via `lim-chrome-info`; Appendix B verbatim |
| **AT-LIM23** | v0.4.3 word list **kept** (11); MSC outcome **phrases** added (5). No words dropped |
| **AT-LIM24** | `limSurfaceFlags(widthPx)` — chip at 419, trail at 1280; no SegmentedControl; chip in render; no ring |

### Screenshots (S3)

All three: no ring, no density toggle, four outlined cells, book-term labels, axis copy at edges, ticks in gutters, proximity chip, numeric header, line 3 visible, companion GEX in the same panel, header pattern kept.

## Echo

**PASS.** Structure taken from MSC Fly-on-the-Wall LIM: outlined cells, large centred labels, axis meaning at the edges, compact numeric header, disc legible on a dark cell. Disc **9pt**. Crosshairs raised. Tick labels outside the plot. Cell names are book-terms, not outcome names.

**OPINION:** cell-label opacity is receding so the disc stays the object. Louder labels are a retune, not a block.

## Tango

**PASS.** Appendix B strings unchanged. Line 3 (OI as-of) visible without a click — the 0DTE landmine stays in view. Lines 1, 2, 4 behind the **i** beside the title, one interaction. Numeric header carries magF. No Comfort/Compact choice. Labels describe the book, not what price will do.

## Delta

**PASS.** Spec before code. Tests name the new clauses. Frozen GEX extract SHA1 empty vs e1c1ef1. No MiniTwo.

## Does not

NX14 · volume · MSC import · move x/y with proximity · rewrite `gex_v1`.
