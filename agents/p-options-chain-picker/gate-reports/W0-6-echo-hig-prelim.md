# W0-6 — Echo HIG prelim design pack

**Status:** PASS  
**Date:** 2026-08-10  
**Authority:** Human Interface Spec v1.0 · Apple HIG for Labs web

## Layout (member dialect)

```
Canvas
  └─ Header: back link · title · meta (symbol · DTE · σ)
  └─ Control card (grouped)
       Symbol | Contract (next 3) | Side | Sigma
  └─ Scroll region (primary content)
       Vertical strike table (sticky header + sticky strike col)
  └─ Quiet footer help (11px tertiary)
```

## Controls (kit)

| Control | HIG rule |
|---------|----------|
| All `<select>` / number inputs | Use existing border/canvas tokens; min height **44px** (`min-h-11` / py sufficient) |
| Labels | Visible text labels above control (not placeholder-only) |
| Focus | Browser/kit focus ring visible |
| Tab order | Symbol → Contract → Side → Sigma → table |
| Flash on patch | Soft amber, 600ms; respect reduced motion (skip flash if `prefers-reduced-motion`) |

## Clarity / deference

- One primary region: ladder.  
- No emoji chrome.  
- No suite pill. Parent: **Market** `/app/market/*`.  
- Errors: red text alert role; not modal traps.

## Bans observed

No prompt/alert · no invent tokens · no P&L valence colors · no MSC skin.

## Handoff

U1-0 implements this pack; U1-3 re-reviews production.
