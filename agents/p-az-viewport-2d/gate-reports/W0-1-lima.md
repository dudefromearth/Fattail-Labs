# W0-1 — Lima hash and parent cites

**Project:** p-az-viewport-2d  
**Agent:** Lima  
**Date:** 2026-08-19  
**Depends:** W0-0 STAMP  
**Verdict:** **PASS**

## Hashes (sha1)

| File | sha1 |
|------|------|
| Analysis `docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md` | `a81befa2dd9b50475d7f645a93a17e8cbf938940` |
| Review plan `docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Full-Agent-Bench-Plan-v1.0.md` | `daf79e36177e4d73b99657e406bcd28f34018e80` |
| Impl plan `docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Implementation-Plan-v1.0.md` | `5deaa2709eccff49847db23336358a9fc96da3c7` |

Computed `shasum -a 1` on disk after W0-0 stamp. Later edits invalidate these hashes; W0-G must re-hash if files move.

## Coach content intact

Analysis still carries Coach symptom (paraphrase of drag/scroll immovable, intermittent). Review plan §0 still quotes Coach verbatim (“The position is immovable.”). Nothing of that text removed.

## Parent table vs plan primary law

| Plan primary law | Cite on disk |
|------------------|--------------|
| Viewport analysis (WHAT) | `docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md` |
| Analyzer §1.14.3 | Spec v0_2: **Viewport context menu** = Right-click chart → Price Alert (not left-click) |
| Surface Autofit AT-AF-7 | `web/lib/risk-graph/surfaceAutofit.ts` `autofitShouldRun` — live-spot / what-if / playhead false |
| OT-EF · DL-309 | Listed grid; Packet B must not invent strikes |
| HI Spec v1.0 | 44pt; no stolen gestures |

## VP-B1 order (quoted, not proven)

From analysis Coordination table:

> Packet A exclusive lock: `web/components/options-lab/risk-graph/PnLChart.tsx` **only**.  
> What-If W2: India W0-2 proves closure from **that board’s artifact**.  
> Packet B after A; own BA; listed-grid.

Lima does **not** assert W2 closed. That is W0-2 India’s artifact check (VPP-B1).

## Out of scope honored

No analysis WHAT rewrite. No product code. No DL (W3).

**Next:** W0-2 India.
